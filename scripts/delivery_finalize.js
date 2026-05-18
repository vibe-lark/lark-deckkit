#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const args = {
    run: null,
    source: null,
    expectSlides: null,
    name: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--run") {
      args.run = argv[++i];
    } else if (value === "--source") {
      args.source = argv[++i];
    } else if (value === "--expect-slides") {
      args.expectSlides = Number(argv[++i]);
    } else if (value === "--name") {
      args.name = argv[++i];
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }

  if (!args.run) throw new Error("Missing --run <delivery-run-dir>");
  if (!args.source) throw new Error("Missing --source <html-file>");
  if (args.expectSlides != null && (!Number.isInteger(args.expectSlides) || args.expectSlides <= 0)) {
    throw new Error("--expect-slides must be a positive integer");
  }
  if (args.name && !/^lark-[a-z0-9-]+-\d{4}-\d{2}-\d{2}$/.test(args.name)) {
    throw new Error("--name must follow lark-<slug>-YYYY-MM-DD");
  }
  return args;
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function isSkippableReference(value) {
  return /^(?:https?:|data:|blob:|mailto:|tel:|javascript:|\/\/|#)/i.test(value);
}

function rewriteLocalReferences(html, sourceFile, outputFile) {
  const sourceDir = path.dirname(sourceFile);
  const outputDir = path.dirname(outputFile);
  return html.replace(/\b(href|src|data-src)=["']([^"']+)["']/g, (match, attr, value) => {
    if (isSkippableReference(value)) return match;
    const absoluteTarget = path.resolve(sourceDir, value);
    let relative = toPosix(path.relative(outputDir, absoluteTarget));
    if (!relative.startsWith(".")) relative = `./${relative}`;
    return `${attr}="${relative}"`;
  });
}

function runValidation(repoRoot, htmlPath, expectSlides) {
  const args = ["scripts/validate_deck.js", htmlPath, "--json"];
  if (expectSlides != null) args.splice(2, 0, "--expect-slides", String(expectSlides));

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    parsed = {
      ok: false,
      slideCount: 0,
      issues: [{ level: "error", code: "validator-output", message: result.stderr || error.message }],
    };
  }

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    result: parsed,
  };
}

function runTextSidecar(repoRoot, htmlPath) {
  const textsPath = path.join(path.dirname(htmlPath), "texts.md");
  const result = spawnSync(
    process.execPath,
    [
      "scripts/extract_deck_texts.js",
      htmlPath,
      "--out",
      textsPath,
      "--annotate",
      htmlPath,
      "--json",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    }
  );

  let payload = null;
  try {
    payload = JSON.parse(result.stdout);
  } catch (error) {
    return {
      status: "failed",
      textLeaves: 0,
      sidecar: "",
      error: result.stderr || error.message,
    };
  }

  if (result.status !== 0) {
    return {
      status: "failed",
      textLeaves: 0,
      sidecar: "",
      error: result.stderr || result.stdout,
    };
  }

  if (!payload.textLeaves) {
    return {
      status: "skipped",
      textLeaves: 0,
      sidecar: "",
      reason: "No static contenteditable/data-text-id leaves found in the HTML source.",
    };
  }

  return {
    status: "generated",
    textLeaves: payload.textLeaves,
    sidecar: relativeFromRepo(repoRoot, textsPath),
  };
}

function relativeFromRepo(repoRoot, file) {
  const relative = toPosix(path.relative(repoRoot, file));
  return relative.startsWith("..") ? file : relative;
}

function writeChecklist(file, manifest) {
  const named = manifest.deliveryName ? `${manifest.deliveryName}.html` : "";
  const issues = manifest.validation.issues || [];
  const issueLines = issues.length
    ? issues.map((issue) => `  - ${issue.level.toUpperCase()} ${issue.code}: ${issue.message}`).join("\n")
    : "  - none";

  fs.writeFileSync(
    file,
    `# Delivery Checklist\n\n` +
      `## Automated Gates\n\n` +
      `- [x] Source copied to \`output/index.html\`.\n` +
      `- [x] Local SDK/assets links rewritten for linked-local delivery.\n` +
      `${manifest.textSidecar.status === "generated" ? `- [x] Text sidecar written to \`${path.basename(manifest.textSidecar.sidecar)}\`.\n` : ""}` +
      `- [x] \`node scripts/validate_deck.js output/index.html${manifest.expectedSlides ? ` --expect-slides ${manifest.expectedSlides}` : ""}\` completed.\n` +
      `- [x] Delivery manifest written to \`output/delivery-manifest.json\`.\n` +
      `${named ? `- [x] Named delivery copy written to \`output/${named}\`.\n` : ""}` +
      `\n## Manual Gates\n\n` +
      `- [ ] Front Design Review: screenshot the deck and check hierarchy, spacing, clipping, and whether each slide reads as a PPT page.\n` +
      `${manifest.textSidecar.status === "generated" ? `- [ ] Text sidecar review: edit \`texts.md\` only, then run \`node scripts/apply_deck_texts.js output/index.html output/texts.md\` if copy changes.\n` : ""}` +
      `- [ ] Final copy review: confirm titles, audience-specific wording, and external links.\n` +
      `- [ ] Host review: confirm the target host can resolve linked local SDK/assets or run a packaging step.\n\n` +
      `## Validator Issues\n\n${issueLines}\n`,
    "utf8"
  );
}

function writeFeedback(file, manifest) {
  fs.writeFileSync(
    file,
    `# Delivery Feedback\n\n` +
      `## What Was Produced\n\n` +
      `- Source: \`${manifest.source}\`\n` +
      `- Output: \`${manifest.output}\`\n` +
      `- Mode: \`${manifest.mode}\`\n` +
      `- Slides: ${manifest.validation.slideCount}\n\n` +
      `## Text Editing\n\n` +
      `- Sidecar: \`${manifest.textSidecar.status}\`${manifest.textSidecar.sidecar ? ` (${manifest.textSidecar.sidecar})` : ""}\n` +
      `- Text leaves: ${manifest.textSidecar.textLeaves}\n\n` +
      `## Automated Gate Result\n\n` +
      `- Status: \`${manifest.automatedGateStatus}\`\n` +
      `- Validator: \`scripts/validate_deck.js\`\n\n` +
      `## Human Follow-Up\n\n` +
      `- Front Design Review is intentionally left as a manual gate; the script records it instead of pretending a static validator can judge composition quality.\n` +
      `- If this deck leaves the repo, package linked assets or publish through the existing Magic flow.\n`,
    "utf8"
  );
}

function finalizeDelivery({ repoRoot, runDir, sourceFile, expectSlides, name }) {
  const outputDir = path.join(runDir, "output");
  const outputHtml = path.join(outputDir, "index.html");
  fs.mkdirSync(outputDir, { recursive: true });

  const sourceHtml = fs.readFileSync(sourceFile, "utf8");
  const rewrittenHtml = rewriteLocalReferences(sourceHtml, sourceFile, outputHtml);
  fs.writeFileSync(outputHtml, rewrittenHtml, "utf8");

  const textSidecar = runTextSidecar(repoRoot, outputHtml);
  if (textSidecar.status === "failed") {
    throw new Error(`Text sidecar extraction failed:\n${textSidecar.error}`);
  }

  const validation = runValidation(repoRoot, outputHtml, expectSlides);
  const automatedGateStatus = validation.status === 0 && validation.result.ok ? "pass" : "fail";

  let namedOutput = null;
  if (name) {
    namedOutput = path.join(outputDir, `${name}.html`);
    fs.copyFileSync(outputHtml, namedOutput);
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    source: relativeFromRepo(repoRoot, sourceFile),
    output: relativeFromRepo(repoRoot, outputHtml),
    deliveryName: name || "",
    namedOutput: namedOutput ? relativeFromRepo(repoRoot, namedOutput) : "",
    mode: "linked-local",
    textSidecar,
    expectedSlides: expectSlides,
    automatedGateStatus,
    manualGateStatus: "pending",
    validation: validation.result,
  };

  fs.writeFileSync(path.join(outputDir, "delivery-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  writeChecklist(path.join(outputDir, "CHECKLIST.md"), manifest);
  writeFeedback(path.join(outputDir, "FEEDBACK.md"), manifest);

  if (automatedGateStatus !== "pass") {
    const summary = (validation.result.issues || []).map((issue) => `${issue.code}: ${issue.message}`).join("\n");
    throw new Error(`Automated delivery gate failed:\n${summary}`);
  }

  return manifest;
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const repoRoot = process.cwd();
    const runDir = path.resolve(args.run);
    const sourceFile = path.resolve(args.source);
    if (!fs.existsSync(sourceFile)) throw new Error(`Source file not found: ${sourceFile}`);
    const manifest = finalizeDelivery({
      repoRoot,
      runDir,
      sourceFile,
      expectSlides: args.expectSlides,
      name: args.name,
    });
    console.log(JSON.stringify(manifest, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { finalizeDelivery, rewriteLocalReferences, runValidation };
