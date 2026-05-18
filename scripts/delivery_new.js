#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {
    root: "deliveries",
    slug: "deck",
    timestamp: formatTimestamp(new Date()),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--root") {
      args.root = argv[++i];
    } else if (value === "--slug") {
      args.slug = argv[++i];
    } else if (value === "--timestamp") {
      args.timestamp = argv[++i];
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }

  if (!/^\d{8}-\d{6}$/.test(args.timestamp)) {
    throw new Error("--timestamp must use YYYYMMDD-HHMMSS");
  }
  return args;
}

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("") + "-" + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("");
}

function slugify(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "deck";
}

function writeIfMissing(file, body) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, body, "utf8");
}

function createDeliveryRun({ root, slug, timestamp }) {
  const safeSlug = slugify(slug);
  const runDir = path.resolve(root, `${timestamp}-${safeSlug}`);
  const inputDir = path.join(runDir, "input");
  const outputDir = path.join(runDir, "output");

  if (fs.existsSync(runDir)) {
    throw new Error(`Delivery run already exists: ${runDir}`);
  }

  fs.mkdirSync(inputDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  writeIfMissing(
    path.join(inputDir, "brief.md"),
    `# Delivery Brief\n\n- 主题：\n- 目标听众：\n- 预计页数：\n- 素材：\n- 每页要点：\n\n`
  );

  writeIfMissing(
    path.join(runDir, "DELIVERY.md"),
    `# Lark DeckKit Delivery Run\n\n` +
      `- Run: \`${path.basename(runDir)}\`\n` +
      `- Input: \`input/\`\n` +
      `- Output: \`output/\`\n\n` +
      `## Contract\n\n` +
      `1. Put source material in \`input/\`.\n` +
      `2. Generate or copy the deck to \`output/index.html\`.\n` +
      `3. Run \`node scripts/delivery_finalize.js --run ${path.relative(process.cwd(), runDir)} --source <html> --expect-slides <N>\`.\n` +
      `4. Treat \`CHECKLIST.md\`, \`FEEDBACK.md\`, and \`delivery-manifest.json\` as the delivery record.\n\n` +
      `## Gates\n\n` +
      `- Automated: DeckKit structure validation via \`scripts/validate_deck.js\`.\n` +
      `- Manual: Front Design Review for hierarchy, spacing, clipping, and screenshot inspection.\n`
  );

  return { runDir, inputDir, outputDir };
}

function main() {
  try {
    const result = createDeliveryRun(parseArgs(process.argv));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { createDeliveryRun, slugify, formatTimestamp };
