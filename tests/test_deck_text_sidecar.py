import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


STATIC_DECK = """<!doctype html>
<html lang="zh-CN">
  <head><meta charset="utf-8"><title>Static Deck</title></head>
  <body>
    <div data-lark-deck>
      <div class="ls-stage">
        <section class="ls-slide" data-title="第一页">
          <div class="ls-slide-inner">
            <h1 class="hero-title" contenteditable="true">原始标题</h1>
            <p class="hero-body" contenteditable="true">第一行<br>第二行</p>
          </div>
        </section>
        <section class="ls-slide" data-title="第二页">
          <div class="ls-slide-inner">
            <p class="note" contenteditable="true">结尾文案</p>
          </div>
        </section>
      </div>
    </div>
  </body>
</html>
"""


class DeckTextSidecarTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="deckkit-texts."))

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def run_node(self, *args, check=True):
        return subprocess.run(
            ["node", *args],
            cwd=ROOT,
            check=check,
            text=True,
            capture_output=True,
        )

    def test_extract_annotates_editable_text_and_writes_sidecar(self):
        html_path = self.tmp / "deck.html"
        texts_path = self.tmp / "texts.md"
        annotated_path = self.tmp / "index.html"
        html_path.write_text(STATIC_DECK, encoding="utf-8")

        result = self.run_node(
            "scripts/extract_deck_texts.js",
            str(html_path),
            "--out",
            str(texts_path),
            "--annotate",
            str(annotated_path),
            "--json",
        )

        payload = json.loads(result.stdout)
        self.assertEqual(payload["slides"], 2)
        self.assertEqual(payload["textLeaves"], 3)
        self.assertTrue(payload["annotated"])

        annotated = annotated_path.read_text(encoding="utf-8")
        texts = texts_path.read_text(encoding="utf-8")
        self.assertIn('data-text-id="slide-01.hero-title"', annotated)
        self.assertIn('data-text-id="slide-01.hero-body"', annotated)
        self.assertIn('data-text-id="slide-02.note"', annotated)
        self.assertIn("hero-title: 原始标题", texts)
        self.assertIn("hero-body: 第一行\\n第二行", texts)

    def test_apply_updates_only_text_leaves(self):
        html_path = self.tmp / "index.html"
        texts_path = self.tmp / "texts.md"
        source_path = self.tmp / "source.html"
        source_path.write_text(STATIC_DECK, encoding="utf-8")

        self.run_node(
            "scripts/extract_deck_texts.js",
            str(source_path),
            "--out",
            str(texts_path),
            "--annotate",
            str(html_path),
        )
        texts = texts_path.read_text(encoding="utf-8")
        texts = texts.replace("hero-title: 原始标题", "hero-title: 新标题")
        texts = texts.replace("hero-body: 第一行\\n第二行", "hero-body: A\\nB")
        texts_path.write_text(texts, encoding="utf-8")

        self.run_node(
            "scripts/apply_deck_texts.js",
            str(html_path),
            str(texts_path),
            "--no-backup",
        )

        html = html_path.read_text(encoding="utf-8")
        self.assertIn(">新标题</h1>", html)
        self.assertIn(">A<br>B</p>", html)
        self.assertIn('class="hero-title"', html)
        self.assertIn('data-text-id="slide-01.hero-title"', html)


if __name__ == "__main__":
    unittest.main()
