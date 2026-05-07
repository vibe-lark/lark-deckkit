#!/usr/bin/env python3
"""Extract a local editable HTML mock from an already-open Lark/Feishu page.

This is a thin wrapper around browser-harness. The generated output is meant to
stay local under product-mocks/generated/ unless it has been explicitly reviewed
and sanitized for an internal-only repository.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXTRACTOR = ROOT / "product-mocks" / "real-css-extractor.js"
DEFAULT_OUT = ROOT / "product-mocks" / "generated" / "real-product-mock.html"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract computed styles from an open browser tab.")
    parser.add_argument("--tab-id", help="Exact browser-harness targetId to use.")
    parser.add_argument("--url-contains", help="Pick the first tab whose URL contains this text.")
    parser.add_argument("--title-contains", help="Pick the first tab whose title contains this text.")
    parser.add_argument("--root", default="body", help="CSS selector for the root element to extract.")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output HTML path.")
    parser.add_argument("--title", default="Lark real CSS product mock", help="Title for the generated HTML.")
    parser.add_argument("--max-nodes", type=int, default=900, help="Max visible nodes to clone.")
    parser.add_argument("--preserve-text", action="store_true", help="Keep visible page text. Use only for private/internal output.")
    parser.add_argument("--allow-images", action="store_true", help="Keep image src/currentSrc. Use only for private/internal output.")
    parser.add_argument("--allow-asset-urls", action="store_true", help="Keep CSS url(...) values. Use only for private/internal output.")
    parser.add_argument("--list-tabs", action="store_true", help="Print available browser tabs and exit.")
    return parser.parse_args()


def require_browser_harness() -> None:
    if shutil.which("browser-harness"):
        return
    print("browser-harness is required for this local extraction workflow.", file=sys.stderr)
    print("Open the target page and install/configure browser-harness first.", file=sys.stderr)
    sys.exit(2)


def run_browser_harness(code: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["browser-harness", "-c", code],
        cwd=str(ROOT),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


def list_tabs() -> int:
    result = run_browser_harness("import json\nprint(json.dumps(list_tabs(False), ensure_ascii=False, indent=2))")
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, file=sys.stderr, end="")
    return result.returncode


def build_harness_code(args: argparse.Namespace) -> str:
    options = {
        "root": args.root,
        "title": args.title,
        "maxNodes": args.max_nodes,
        "sanitizeText": not args.preserve_text,
        "allowImages": args.allow_images,
        "allowAssetUrls": args.allow_asset_urls,
    }
    payload = {
        "tab_id": args.tab_id,
        "url_contains": args.url_contains,
        "title_contains": args.title_contains,
        "extractor": str(EXTRACTOR),
        "out": str(Path(args.out).expanduser().resolve()),
        "options": options,
    }
    payload_json = json.dumps(payload, ensure_ascii=False)
    return f"""
import json
from pathlib import Path

payload = json.loads({payload_json!r})
tabs = list_tabs(False)

def pick_tab():
    if payload["tab_id"]:
        for tab in tabs:
            if tab.get("targetId") == payload["tab_id"]:
                return tab
        raise RuntimeError("No open tab matches --tab-id")
    if payload["url_contains"]:
        for tab in tabs:
            if payload["url_contains"] in tab.get("url", ""):
                return tab
        raise RuntimeError("No open tab URL contains: " + payload["url_contains"])
    if payload["title_contains"]:
        for tab in tabs:
            if payload["title_contains"] in tab.get("title", ""):
                return tab
        raise RuntimeError("No open tab title contains: " + payload["title_contains"])
    raise RuntimeError("Pass one of --tab-id, --url-contains, or --title-contains")

target = pick_tab()
switch_tab(target["targetId"])
source = Path(payload["extractor"]).read_text(encoding="utf-8")
js(source)
options = json.dumps(payload["options"], ensure_ascii=False)
html = js("return LarkDeckKitRealCssExtractor.renderStandalone(LarkDeckKitRealCssExtractor.capture(" + options + "));")
out = Path(payload["out"])
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding="utf-8")
print(json.dumps({{"tab": target, "out": str(out), "bytes": len(html)}}, ensure_ascii=False, indent=2))
"""


def main() -> int:
    args = parse_args()
    require_browser_harness()
    if args.list_tabs:
        return list_tabs()
    if not EXTRACTOR.exists():
        print(f"Missing extractor: {EXTRACTOR}", file=sys.stderr)
        return 2
    result = run_browser_harness(build_harness_code(args))
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, file=sys.stderr, end="")
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
