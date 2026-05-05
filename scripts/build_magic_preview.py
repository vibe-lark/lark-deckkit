#!/usr/bin/env python3
"""Build a single-file Magic Pages preview for Lark DeckKit."""

import base64
import io
import json
import mimetypes
import re
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "dist" / "lark-visual-sample.html"
FONTS_CSS = ROOT / "sdk" / "fonts.css"
CSS = ROOT / "sdk" / "lark-slides.css"
RUNTIME = ROOT / "sdk" / "lark-slides.js"
TEMPLATES = ROOT / "sdk" / "templates.js"
ASSET_DIR = ROOT / "dist" / "assets" / "pptx-media"
OUT = ROOT / "dist" / "lark-deckkit-preview.html"


def encode_asset(path):
    if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
      return encode_raw(path)

    try:
        image = Image.open(path)
        image.load()
    except Exception:
        return encode_raw(path)

    if path.stat().st_size <= 140 * 1024:
        return encode_raw(path)

    max_edge = 2200
    if max(image.size) > max_edge:
        image.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)

    if image.mode not in {"RGB", "RGBA"}:
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=82, method=6)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/webp;base64,{encoded}"


def encode_raw(path):
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def main():
    html = HTML.read_text(encoding="utf-8")
    fonts_css = FONTS_CSS.read_text(encoding="utf-8").replace("./fonts/", "../sdk/fonts/")
    css = CSS.read_text(encoding="utf-8")
    runtime = RUNTIME.read_text(encoding="utf-8")
    templates = TEMPLATES.read_text(encoding="utf-8")

    asset_names = sorted(set(re.findall(r'A\("([^"]+)"\)', html)))
    asset_map = {name: encode_asset(ASSET_DIR / name) for name in asset_names}

    html = html.replace(
        '<title>Lark Visual Guidelines HTML Deck</title>',
        '<title>Lark DeckKit Public Preview</title>',
    )
    html = html.replace(
        '<link rel="stylesheet" href="../sdk/fonts.css" />',
        f"<style>\n{fonts_css}\n</style>",
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
        'loading="lazy" decoding="async"',
        'loading="eager" decoding="sync"',
    )
    html = html.replace(
        'const A = (name) => `assets/pptx-media/${name}`;',
        "const ASSET_DATA = "
        + json.dumps(asset_map, ensure_ascii=False, separators=(",", ":"))
        + ";\n      const A = (name) => ASSET_DATA[name] || \"\";",
    )
    for name, data_uri in asset_map.items():
        html = html.replace(f"assets/pptx-media/{name}", data_uri)

    OUT.write_text(html, encoding="utf-8")
    print(f"wrote {OUT}")
    print(f"assets: {len(asset_map)}")
    print(f"size_mb: {OUT.stat().st_size / 1024 / 1024:.2f}")


if __name__ == "__main__":
    main()
