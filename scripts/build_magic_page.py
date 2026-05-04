#!/usr/bin/env python3
"""Build the Magic Pages deck with inline SDK code and Magic CDN asset URLs."""

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "dist" / "lark-visual-sample.html"
CSS = ROOT / "sdk" / "lark-slides.css"
RUNTIME = ROOT / "sdk" / "lark-slides.js"
TEMPLATES = ROOT / "sdk" / "templates.js"
MANIFEST = ROOT / "dist" / "magic-assets-manifest.json"
OUT = ROOT / "dist" / "lark-deckkit-magic.html"


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--html", type=Path, default=HTML)
    parser.add_argument("--css", type=Path, default=CSS)
    parser.add_argument("--runtime", type=Path, default=RUNTIME)
    parser.add_argument("--templates", type=Path, default=TEMPLATES)
    parser.add_argument("--manifest", type=Path, default=MANIFEST)
    parser.add_argument("--out", type=Path, default=OUT)
    return parser.parse_args()


def load_manifest(path):
    manifest = json.loads(path.read_text(encoding="utf-8"))
    assets = manifest.get("assets") or {}
    if not assets:
        raise SystemExit(f"manifest has no assets: {path}")
    return assets


def replace_literal_asset_paths(html, assets):
    for name, url in assets.items():
        html = html.replace(f"assets/pptx-media/{name}", url)
    return html


def main():
    args = parse_args()
    html = args.html.read_text(encoding="utf-8")
    css = args.css.read_text(encoding="utf-8")
    runtime = args.runtime.read_text(encoding="utf-8")
    templates = args.templates.read_text(encoding="utf-8")
    assets = load_manifest(args.manifest)

    used_names = sorted(set(re.findall(r'A\("([^"]+)"\)', html)))
    missing = [name for name in used_names if name not in assets]
    if missing:
        sample = ", ".join(missing[:8])
        raise SystemExit(f"manifest missing {len(missing)} assets: {sample}")

    html = html.replace(
        "<title>Lark Visual Guidelines HTML Deck</title>",
        "<title>Lark DeckKit Public Preview</title>",
    )
    html = html.replace(
        '<link rel="stylesheet" href="../sdk/lark-slides.css" />',
        f"<style>\n{css}\n</style>",
    )
    html = html.replace(
        '<script src="../sdk/lark-slides.js"></script>',
        f"<script>\n{runtime}\n</script>",
    )
    html = html.replace(
        '<script src="../sdk/templates.js"></script>',
        f"<script>\n{templates}\n</script>",
    )
    html = html.replace(
        "const A = (name) => `assets/pptx-media/${name}`;",
        "const MAGIC_ASSET_URLS = "
        + json.dumps(assets, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        + ';\n      const A = (name) => MAGIC_ASSET_URLS[name] || "";',
    )
    html = replace_literal_asset_paths(html, assets)

    args.out.write_text(html, encoding="utf-8")
    print(f"wrote {args.out}")
    print(f"asset_urls: {len(assets)}")
    print(f"size_kb: {args.out.stat().st_size / 1024:.1f}")


if __name__ == "__main__":
    main()
