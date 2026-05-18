#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const TEXT_ID_RE = /(<(?<tag>[a-zA-Z][a-zA-Z0-9-]*)\b(?<attrs>[^>]*\bdata-text-id=["'](?<id>[^"']+)["'][^>]*)>)(?<inner>[\s\S]*?)(<\/\k<tag>>)/gi;

function parseArgs(argv) {
  const args = { html: null, texts: null, check: false, dryRun: false, noBackup: false };
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--check") {
      args.check = true;
    } else if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--no-backup") {
      args.noBackup = true;
    } else if (!args.html) {
      args.html = value;
    } else if (!args.texts) {
      args.texts = value;
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }
  if (!args.html || !args.texts) {
    throw new Error("Usage: node scripts/apply_deck_texts.js <html-file> <texts.md> [--check] [--dry-run] [--no-backup]");
  }
  return args;
}

function encodeInner(value) {
  return String(value)
    .split("\n")
    .map((part) =>
      part
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    )
    .join("<br>");
}

function decodeInner(value) {
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function parseTextsMarkdown(markdown) {
  const values = {};
  let currentSlide = "";
  let pendingId = "";
  let pendingValue = [];

  const flush = () => {
    if (!pendingId) return;
    values[pendingId] = pendingValue.join("\n").replace(/\\n/g, "\n").trimEnd();
    pendingId = "";
    pendingValue = [];
  };

  for (const rawLine of String(markdown).split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const slideMatch = line.match(/^##\s+(slide-\d+)\b/);
    if (slideMatch) {
      flush();
      currentSlide = slideMatch[1];
      continue;
    }
    if (!line || line.startsWith(">")) {
      flush();
      continue;
    }
    if (line.startsWith("#")) {
      flush();
      continue;
    }
    if (pendingId && /^\s+/.test(rawLine)) {
      pendingValue.push(line.trimStart());
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_.\-\u4e00-\u9fa5]+)\s*:\s*(.*)$/);
    if (kv && currentSlide) {
      flush();
      pendingId = `${currentSlide}.${kv[1]}`;
      pendingValue = [kv[2]];
      continue;
    }
    if (pendingId) pendingValue.push(line);
  }
  flush();
  return values;
}

function applyDeckTexts(html, texts) {
  const seen = new Map();
  const changes = [];
  let duplicate = "";
  let newHtml = "";
  let cursor = 0;

  for (const match of html.matchAll(TEXT_ID_RE)) {
    const id = match.groups.id;
    seen.set(id, (seen.get(id) || 0) + 1);
    if (seen.get(id) > 1 && !duplicate) duplicate = id;
  }
  if (duplicate) {
    throw new Error(`Duplicate data-text-id in HTML: ${duplicate}`);
  }

  for (const match of html.matchAll(TEXT_ID_RE)) {
    const id = match.groups.id;
    const full = match[0];
    const start = match.index;
    const end = start + full.length;
    const open = match[1];
    const close = match[6];
    const oldValue = decodeInner(match.groups.inner);
    const nextValue = Object.prototype.hasOwnProperty.call(texts, id) ? texts[id] : oldValue;

    newHtml += html.slice(cursor, start);
    if (oldValue !== nextValue) {
      changes.push({ id, oldValue, nextValue });
      newHtml += `${open}${encodeInner(nextValue)}${close}`;
    } else {
      newHtml += full;
    }
    cursor = end;
  }
  newHtml += html.slice(cursor);

  const htmlIds = new Set(seen.keys());
  const textIds = new Set(Object.keys(texts));
  const missing = Array.from(htmlIds).filter((id) => !textIds.has(id));
  const extra = Array.from(textIds).filter((id) => !htmlIds.has(id));

  return { html: newHtml, changes, missing, extra, htmlIds: htmlIds.size, textIds: textIds.size };
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const htmlPath = path.resolve(args.html);
    const textsPath = path.resolve(args.texts);
    const html = fs.readFileSync(htmlPath, "utf8");
    const texts = parseTextsMarkdown(fs.readFileSync(textsPath, "utf8"));
    const result = applyDeckTexts(html, texts);

    console.log(`apply_deck_texts: ${result.changes.length} change(s), ${result.htmlIds} html id(s), ${result.textIds} sidecar id(s)`);
    if (result.missing.length) console.log(`missing in texts.md: ${result.missing.slice(0, 8).join(", ")}`);
    if (result.extra.length) console.log(`extra in texts.md: ${result.extra.slice(0, 8).join(", ")}`);

    if (args.check) {
      if (result.changes.length || result.missing.length || result.extra.length) process.exit(1);
      return;
    }
    if (args.dryRun) return;
    if (result.extra.length) {
      throw new Error(`texts.md contains ids not present in HTML: ${result.extra.slice(0, 5).join(", ")}`);
    }
    if (!result.changes.length) return;
    if (!args.noBackup) fs.copyFileSync(htmlPath, `${htmlPath}.bak`);
    fs.writeFileSync(htmlPath, result.html, "utf8");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { parseTextsMarkdown, applyDeckTexts, encodeInner, decodeInner };
