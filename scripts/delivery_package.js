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
    const files = ["index.html", "texts.md", "apply_deck_texts.js", "README.txt"];
    const result = spawnSync("zip", ["-q", "-X", zipPath, ...files], {
      cwd: stage,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      writeZipStore(zipPath, stage, files);
    }
    return { zipPath, files };
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

function writeZipStore(zipPath, sourceDir, files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file);
    const data = fs.readFileSync(path.join(sourceDir, file));
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  fs.writeFileSync(zipPath, Buffer.concat([...localParts, ...centralParts, end]));
}

const CRC32_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
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
