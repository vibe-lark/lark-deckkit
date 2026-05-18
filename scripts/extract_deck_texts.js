#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const SLIDE_RE = /<section\b(?=[^>]*\bclass=["'][^"']*\bls-slide\b)[^>]*>[\s\S]*?<\/section>/gi;
const TEXT_LEAF_RE = /<(?<tag>[a-zA-Z][a-zA-Z0-9-]*)\b(?<attrs>[^>]*(?:contenteditable=["']true["']|data-text-id=["'][^"']+["'])[^>]*)>(?<inner>[\s\S]*?)<\/\k<tag>>/gi;

function parseArgs(argv) {
  const args = { file: null, out: null, annotate: null, json: false };
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--out") {
      args.out = argv[++i];
    } else if (value === "--annotate") {
      args.annotate = argv[++i];
    } else if (value === "--json") {
      args.json = true;
    } else if (!args.file) {
      args.file = value;
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }
  if (!args.file) {
    throw new Error("Usage: node scripts/extract_deck_texts.js <html-file> [--out texts.md] [--annotate out.html] [--json]");
  }
  return args;
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function decodeHtml(value) {
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

function isTextLeaf(inner) {
  const withoutBreaks = String(inner).replace(/<br\s*\/?>/gi, "");
  return !/<[a-zA-Z][^>]*>/.test(withoutBreaks);
}

function attrValue(attrs, name) {
  const pattern = new RegExp(`\\b${name}=["']([^"']+)["']`, "i");
  const match = String(attrs).match(pattern);
  return match ? match[1] : "";
}

function hasContenteditable(attrs) {
  return /\bcontenteditable=["']true["']/i.test(attrs);
}

function safeFieldName(tag, attrs, fallbackIndex) {
  const classes = attrValue(attrs, "class").split(/\s+/).filter(Boolean);
  const base = classes.find((name) => !/^ls-/.test(name) && !/^lvg-layout-block$/.test(name)) || classes[0] || tag || `text-${fallbackIndex}`;
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || `text-${fallbackIndex}`;
}

function uniqueField(base, counters, used) {
  counters[base] = (counters[base] || 0) + 1;
  let field = counters[base] === 1 ? base : `${base}-${String(counters[base]).padStart(2, "0")}`;
  while (used.has(field)) {
    counters[base] += 1;
    field = `${base}-${String(counters[base]).padStart(2, "0")}`;
  }
  used.add(field);
  return field;
}

function annotateSlide(slideHtml, slideIndex) {
  const slideId = `slide-${String(slideIndex + 1).padStart(2, "0")}`;
  const fields = [];
  const counters = {};
  const usedFields = new Set();
  let changed = false;

  const annotatedHtml = slideHtml.replace(TEXT_LEAF_RE, (full, _tag, _attrs, _inner, offset, input, groups) => {
    const { tag, attrs, inner } = groups;
    if (!isTextLeaf(inner)) return full;

    let textId = attrValue(attrs, "data-text-id");
    if (!textId && !hasContenteditable(attrs)) return full;

    if (!textId) {
      const base = safeFieldName(tag, attrs, fields.length + 1);
      const field = uniqueField(base, counters, usedFields);
      textId = `${slideId}.${field}`;
      changed = true;
      const openEnd = full.indexOf(">");
      const open = full.slice(0, openEnd);
      const rest = full.slice(openEnd);
      fields.push({ id: textId, field, value: decodeHtml(inner) });
      return `${open} data-text-id="${escapeAttr(textId)}"${rest}`;
    }

    const field = textId.startsWith(`${slideId}.`) ? textId.slice(slideId.length + 1) : textId;
    usedFields.add(field);
    fields.push({ id: textId, field, value: decodeHtml(inner) });
    return full;
  });

  return { slideId, fields, html: annotatedHtml, changed };
}

function extractDeckTexts(html) {
  const slides = [];
  let changed = false;
  let slideIndex = 0;
  const annotatedHtml = html.replace(SLIDE_RE, (slideHtml) => {
    const result = annotateSlide(slideHtml, slideIndex);
    slideIndex += 1;
    slides.push({ id: result.slideId, fields: result.fields });
    changed = changed || result.changed;
    return result.html;
  });

  return {
    slides,
    annotatedHtml,
    changed,
    textLeaves: slides.reduce((sum, slide) => sum + slide.fields.length, 0),
  };
}

function formatTextsMarkdown(result, sourceName = "deck") {
  const lines = [
    `# ${sourceName} Texts`,
    "",
    "> Edit values only. Keep slide-NN.field ids unchanged, then run:",
    ">   node scripts/apply_deck_texts.js index.html texts.md",
    "> Use literal \\n for line breaks.",
    "",
  ];

  for (const slide of result.slides) {
    if (!slide.fields.length) continue;
    lines.push(`## ${slide.id}`);
    for (const field of slide.fields) {
      lines.push(`${field.field}: ${field.value.replace(/\n/g, "\\n")}`);
    }
    lines.push("");
  }

  return lines.join("\n").replace(/\n+$/, "\n");
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const htmlPath = path.resolve(args.file);
    const html = fs.readFileSync(htmlPath, "utf8");
    const result = extractDeckTexts(html);
    const outPath = args.out ? path.resolve(args.out) : htmlPath.replace(/\.html?$/i, ".texts.md");
    const annotatePath = args.annotate ? path.resolve(args.annotate) : "";

    if (result.textLeaves > 0) {
      fs.writeFileSync(outPath, formatTextsMarkdown(result, path.basename(htmlPath, path.extname(htmlPath))), "utf8");
      if (annotatePath) fs.writeFileSync(annotatePath, result.annotatedHtml, "utf8");
    }

    const payload = {
      ok: true,
      slides: result.slides.length,
      textLeaves: result.textLeaves,
      sidecar: result.textLeaves > 0 ? outPath : "",
      annotated: Boolean(annotatePath && result.textLeaves > 0),
      annotate: annotatePath && result.textLeaves > 0 ? annotatePath : "",
    };

    if (args.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else if (result.textLeaves > 0) {
      console.log(`extract_deck_texts: ${result.textLeaves} text leaves -> ${outPath}`);
      if (annotatePath) console.log(`annotated: ${annotatePath}`);
    } else {
      console.log("extract_deck_texts: no static editable text leaves found");
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { extractDeckTexts, formatTextsMarkdown, decodeHtml, isTextLeaf };
