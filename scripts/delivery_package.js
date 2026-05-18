#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const args = { run: null, output: null, name: "deck-editable" };
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--run") {
      args.run = argv[++i];
    } else if (value === "--output") {
      args.output = argv[++i];
    } else if (value === "--name") {
      args.name = argv[++i];
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }
  if (!args.run && !args.output) throw new Error("Missing --run <delivery-run-dir> or --output <output-dir>");
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(args.name)) throw new Error("--name must be a safe filename slug");
  return args;
}

function resolveOutputDir(args) {
  return path.resolve(args.output || path.join(args.run, "output"));
}

function writeReadme(file) {
  fs.writeFileSync(
    file,
    [
      "Lark DeckKit editable delivery",
      "",
      "Files:",
      "- index.html: the deck.",
      "- texts.md: editable copy sidecar.",
      "- apply_deck_texts.js: applies texts.md back into index.html.",
      "",
      "Edit texts.md values only. Keep slide-NN.field ids unchanged.",
      "Then run:",
      "  node apply_deck_texts.js index.html texts.md --no-backup",
      "",
    ].join("\n"),
    "utf8"
  );
}

function packageDelivery({ outputDir, name }) {
  const html = path.join(outputDir, "index.html");
  const texts = path.join(outputDir, "texts.md");
  if (!fs.existsSync(html)) throw new Error(`Missing ${html}`);
  if (!fs.existsSync(texts)) throw new Error(`Missing ${texts}`);

  const stage = fs.mkdtempSync(path.join(os.tmpdir(), "deckkit-package-"));
  try {
    fs.copyFileSync(html, path.join(stage, "index.html"));
    fs.copyFileSync(texts, path.join(stage, "texts.md"));
    fs.copyFileSync(path.join(__dirname, "apply_deck_texts.js"), path.join(stage, "apply_deck_texts.js"));
    writeReadme(path.join(stage, "README.txt"));

    const zipPath = path.join(outputDir, `${name}.zip`);
    if (fs.existsSync(zipPath)) fs.rmSync(zipPath);
    const result = spawnSync("zip", ["-q", "-X", zipPath, "index.html", "texts.md", "apply_deck_texts.js", "README.txt"], {
      cwd: stage,
      encoding: "utf8",
    });
    if (result.status !== 0) throw new Error(result.stderr || "zip failed");
    return { zipPath, files: ["index.html", "texts.md", "apply_deck_texts.js", "README.txt"] };
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const outputDir = resolveOutputDir(args);
    const result = packageDelivery({ outputDir, name: args.name });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { packageDelivery };
