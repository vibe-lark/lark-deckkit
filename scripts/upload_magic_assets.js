#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_ASSET_DIR = path.join(ROOT, "dist", "assets", "pptx-media");
const DEFAULT_MANIFEST = path.join(ROOT, "dist", "magic-assets-manifest.json");
const DEFAULT_API_BASE = "https://magic.solutionsuite.cn";
const CHUNK_SIZE = 10 * 1024 * 1024;
const TOKEN_FILES = [
  path.join(os.homedir(), ".magic-token"),
  path.join(ROOT, ".magic-token"),
  path.join(os.homedir(), ".codex", "skills", "publish-to-magic-pages", ".magic-token"),
];

function parseArgs(argv) {
  const options = {
    assetDir: DEFAULT_ASSET_DIR,
    manifest: DEFAULT_MANIFEST,
    apiBase: process.env.MAGIC_TOS_API_BASE || DEFAULT_API_BASE,
    force: false,
    limit: 0,
    verify: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--asset-dir") options.assetDir = path.resolve(argv[++i]);
    else if (arg === "--manifest") options.manifest = path.resolve(argv[++i]);
    else if (arg === "--api-base") options.apiBase = argv[++i].replace(/\/+$/, "");
    else if (arg === "--force") options.force = true;
    else if (arg === "--verify") options.verify = true;
    else if (arg === "--limit") options.limit = Number(argv[++i]) || 0;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/upload_magic_assets.js [options]

Uploads static files to Magic TOS/CDN and writes a URL manifest.

Options:
  --asset-dir <dir>    Asset directory. Default: dist/assets/pptx-media
  --manifest <file>    Output manifest. Default: dist/magic-assets-manifest.json
  --api-base <url>     Magic API base. Default: https://magic.solutionsuite.cn
  --force              Re-upload files already present in the manifest
  --verify             HEAD-check existing manifest URLs before skipping
  --limit <n>          Upload at most n files, useful for smoke tests
`);
}

function readToken() {
  if (process.env.MAGIC_TOKEN) return process.env.MAGIC_TOKEN.trim();

  for (const file of TOKEN_FILES) {
    if (!fs.existsSync(file)) continue;
    const token = fs.readFileSync(file, "utf8").trim();
    if (token) return token;
  }

  throw new Error("Magic token not found. Set MAGIC_TOKEN or save ~/.magic-token.");
}

function loadManifest(file) {
  if (!fs.existsSync(file)) {
    return {
      version: 1,
      apiBase: DEFAULT_API_BASE,
      generatedAt: null,
      assetDir: path.relative(ROOT, DEFAULT_ASSET_DIR),
      assets: {},
    };
  }

  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    version: 1,
    apiBase: manifest.apiBase || DEFAULT_API_BASE,
    generatedAt: manifest.generatedAt || null,
    assetDir: manifest.assetDir || path.relative(ROOT, DEFAULT_ASSET_DIR),
    assets: manifest.assets || {},
  };
}

function saveManifest(file, manifest, assetDir, apiBase) {
  const next = {
    ...manifest,
    apiBase,
    generatedAt: new Date().toISOString(),
    assetDir: path.relative(ROOT, assetDir),
    assets: sortObject(manifest.assets),
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
}

function sortObject(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}

function listAssets(assetDir) {
  return fs
    .readdirSync(assetDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.(png|jpe?g|webp|gif|svg|woff2?|otf|ttf)$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
}

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  const types = {
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".otf": "font/otf",
    ".ttf": "font/ttf",
  };
  return types[ext] || "application/octet-stream";
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON from ${url}: HTTP ${response.status} ${text.slice(0, 200)}`);
  }

  if (!response.ok || json.code !== 0) {
    throw new Error(`Magic API failed: HTTP ${response.status} ${json.msg || text.slice(0, 200)}`);
  }

  return json.data || {};
}

async function urlLooksReachable(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function uploadFile(filePath, name, options, token) {
  const contentType = contentTypeFor(filePath);
  const stats = fs.statSync(filePath);
  const init = await requestJson(`${options.apiBase}/api/tos/multipart/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename: name, contentType }),
  });

  const { uploadId, key } = init;
  if (!uploadId || !key) throw new Error(`Upload init missing uploadId/key for ${name}`);

  const parts = [];
  let partNumber = 1;
  const handle = fs.openSync(filePath, "r");

  try {
    for (let offset = 0; offset < stats.size; offset += CHUNK_SIZE) {
      const size = Math.min(CHUNK_SIZE, stats.size - offset);
      const buffer = Buffer.allocUnsafe(size);
      fs.readSync(handle, buffer, 0, size, offset);

      const form = new FormData();
      form.append("file", new Blob([buffer], { type: contentType }), name);
      form.append("uploadId", uploadId);
      form.append("key", key);
      form.append("partNumber", String(partNumber));

      const part = await requestJson(`${options.apiBase}/api/tos/multipart/part`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!part.etag) throw new Error(`Upload part missing etag for ${name} part ${partNumber}`);
      parts.push({ partNumber, etag: part.etag });
      partNumber += 1;
    }

    const complete = await requestJson(`${options.apiBase}/api/tos/multipart/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uploadId, key, parts }),
    });

    if (!complete.url) throw new Error(`Upload complete missing url for ${name}`);
    return complete.url;
  } catch (error) {
    await abortUpload(options.apiBase, token, uploadId, key).catch(() => {});
    throw error;
  } finally {
    fs.closeSync(handle);
  }
}

async function abortUpload(apiBase, token, uploadId, key) {
  if (!uploadId || !key) return;
  await fetch(`${apiBase}/api/tos/multipart/abort`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ uploadId, key }),
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const token = readToken();
  const manifest = loadManifest(options.manifest);
  const names = listAssets(options.assetDir);
  const selected = options.limit > 0 ? names.slice(0, options.limit) : names;

  console.log(`asset_dir=${path.relative(ROOT, options.assetDir)}`);
  console.log(`manifest=${path.relative(ROOT, options.manifest)}`);
  console.log(`assets=${selected.length}${options.limit > 0 ? ` of ${names.length}` : ""}`);

  let uploaded = 0;
  let skipped = 0;

  for (const name of selected) {
    const existingUrl = manifest.assets[name];
    if (existingUrl && !options.force) {
      if (!options.verify || (await urlLooksReachable(existingUrl))) {
        skipped += 1;
        console.log(`[skip] ${name}`);
        continue;
      }
      console.log(`[stale] ${name}`);
    }

    const filePath = path.join(options.assetDir, name);
    const sizeMb = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
    console.log(`[upload] ${name} ${sizeMb}MB`);
    const url = await uploadFile(filePath, name, options, token);
    manifest.assets[name] = url;
    uploaded += 1;
    saveManifest(options.manifest, manifest, options.assetDir, options.apiBase);
    console.log(`[done] ${name} -> ${url}`);
  }

  saveManifest(options.manifest, manifest, options.assetDir, options.apiBase);
  console.log(`complete uploaded=${uploaded} skipped=${skipped} manifest_assets=${Object.keys(manifest.assets).length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
