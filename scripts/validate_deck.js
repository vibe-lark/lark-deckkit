#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = { json: false, expectSlides: null, file: null };
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--json") {
      args.json = true;
    } else if (value === "--expect-slides") {
      args.expectSlides = Number(argv[++i]);
    } else if (!args.file) {
      args.file = value;
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }
  if (!args.file) throw new Error("Usage: node scripts/validate_deck.js <html-file> [--expect-slides N] [--json]");
  return args;
}

function stripScriptsAndStyles(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
}

function countSlides(html) {
  const sectionCount = (html.match(/<section\s+class=["'][^"']*\bls-slide\b/gi) || []).length;
  if (sectionCount) return sectionCount;
  const outlineTypeCount = (html.match(/\btype:\s*["'](?:statement|title|todo|todoList|caseFlow|flow)["']/g) || []).length;
  if (outlineTypeCount) return outlineTypeCount;
  const templateCreateCount = (html.match(/LarkSlideTemplates\.create\(/g) || []).length;
  if (templateCreateCount) return templateCreateCount;
  const sourceSlideCount =
    (html.match(/sourceSlide:\s*["']?\\?["']?[^"',}]+/g) || []).length ||
    (html.match(/sourceSlide:\\?["'][^"',}]+/g) || []).length;
  return sourceSlideCount;
}

function countExternalAssets(html) {
  const links = Array.from(html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)).map((match) => match[1]);
  const scripts = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)).map((match) => match[1]);
  const images = Array.from(html.matchAll(/(?:src|data-src)=["']([^"']+)["']/gi)).map((match) => match[1]);
  const isExternal = (value) => /^https?:\/\//.test(value);
  return {
    stylesheets: links.filter(isExternal).length,
    scripts: scripts.filter(isExternal).length,
    images: images.filter(isExternal).length,
  };
}

function findDenseTextLiterals(html) {
  const dense = [];
  const patterns = [
    /text:\s*["'`]([^"'`]{150,})["'`]/g,
    /value:\s*["'`]([^"'`]{150,})["'`]/g,
    /subtitle:\s*["'`]([^"'`]{130,})["'`]/g,
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      dense.push(match[1].slice(0, 90));
    }
  }
  return dense.slice(0, 8);
}

function validate(html, options = {}) {
  const issues = [];
  const add = (level, code, message, details = {}) => issues.push({ level, code, message, ...details });
  const visibleHtml = stripScriptsAndStyles(html);
  const slideCount = countSlides(html);

  if (!/data-lark-deck/.test(html) && !/\bls-stage\b/.test(html)) {
    add("error", "deck-container", "Missing DeckKit mount marker: data-lark-deck or ls-stage.");
  }
  if (!/LarkSlides\.createDeck/.test(html) && !/<section\s+class=["'][^"']*\bls-slide\b/gi.test(html)) {
    add("error", "runtime-entry", "Missing LarkSlides.createDeck call or static ls-slide sections.");
  }
  if (!/(?:LarkSlides\.createDeckSpec|LarkSlideTemplates\.createDeckFromOutline)/.test(html) && !/<section\s+class=["'][^"']*\bls-slide\b/gi.test(html)) {
    add("warning", "deck-spec", "Deck does not appear to use createDeckSpec; reusable generation may be harder.");
  }
  if (options.expectSlides != null && slideCount !== options.expectSlides) {
    add("error", "slide-count", `Expected ${options.expectSlides} slides, found ${slideCount}.`, { slideCount });
  }
  if (!slideCount) add("warning", "slide-count-unknown", "Could not infer slide count from HTML.");

  const denseText = findDenseTextLiterals(html);
  if (denseText.length) {
    add("warning", "text-density", "Some text literals are long; consider splitting slides or using visualTodoList/caseFlow.", { samples: denseText });
  }

  const externalAssets = countExternalAssets(html);
  if (externalAssets.scripts > 0) {
    add("warning", "external-scripts", "External scripts detected. This can be fine, but verify availability for the target host.", externalAssets);
  }

  return {
    ok: !issues.some((issue) => issue.level === "error"),
    slideCount,
    visibleTextChars: visibleHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length,
    externalAssets,
    issues,
  };
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const file = path.resolve(args.file);
    const html = fs.readFileSync(file, "utf8");
    const result = validate(html, { expectSlides: args.expectSlides });
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`${result.ok ? "PASS" : "FAIL"} ${path.relative(process.cwd(), file)}`);
      console.log(`slides: ${result.slideCount}`);
      for (const issue of result.issues) {
        console.log(`${issue.level.toUpperCase()} ${issue.code}: ${issue.message}`);
      }
    }
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}

if (require.main === module) main();

module.exports = { validate };
