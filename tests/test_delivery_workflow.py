import json
import shutil
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DeliveryWorkflowTest(unittest.TestCase):
    def setUp(self):
        self.delivery_root = ROOT / "deliveries" / ".tmp-test"
        if self.delivery_root.exists():
            shutil.rmtree(self.delivery_root)

    def tearDown(self):
        if self.delivery_root.exists():
            shutil.rmtree(self.delivery_root)

    def run_node(self, *args):
        return subprocess.run(
            ["node", *args],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )

    def test_delivery_new_creates_run_contract(self):
        self.run_node(
            "scripts/delivery_new.js",
            "--root",
            str(self.delivery_root),
            "--timestamp",
            "20260509-120000",
            "--slug",
            "quickstart demo",
        )

        run_dir = self.delivery_root / "20260509-120000-quickstart-demo"
        self.assertTrue((run_dir / "input").is_dir())
        self.assertTrue((run_dir / "output").is_dir())
        self.assertTrue((run_dir / "input" / "brief.md").exists())
        self.assertTrue((run_dir / "DELIVERY.md").exists())

        delivery_doc = (run_dir / "DELIVERY.md").read_text(encoding="utf-8")
        self.assertIn("Front Design Review", delivery_doc)
        self.assertIn("output/index.html", delivery_doc)

    def test_finalize_copies_validated_deck_and_writes_delivery_artifacts(self):
        self.run_node(
            "scripts/delivery_new.js",
            "--root",
            str(self.delivery_root),
            "--timestamp",
            "20260509-120000",
            "--slug",
            "quickstart",
        )
        run_dir = self.delivery_root / "20260509-120000-quickstart"

        self.run_node(
            "scripts/delivery_finalize.js",
            "--run",
            str(run_dir),
            "--source",
            "sdk/quickstart.html",
            "--expect-slides",
            "3",
            "--name",
            "lark-demo-2026-05-09",
        )

        output = run_dir / "output"
        index_html = output / "index.html"
        named_html = output / "lark-demo-2026-05-09.html"
        manifest_path = output / "delivery-manifest.json"
        checklist_path = output / "CHECKLIST.md"
        feedback_path = output / "FEEDBACK.md"

        for path in [index_html, named_html, manifest_path, checklist_path, feedback_path]:
            self.assertTrue(path.exists(), f"missing {path}")

        html = index_html.read_text(encoding="utf-8")
        self.assertIn("../../../sdk/fonts.css", html)
        self.assertIn("../../../sdk/lark-slides.js", html)
        self.assertNotIn('href="./fonts.css"', html)
        self.assertNotIn('src="./lark-slides.js"', html)

        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        self.assertEqual(manifest["source"], "sdk/quickstart.html")
        self.assertEqual(manifest["deliveryName"], "lark-demo-2026-05-09")
        self.assertEqual(manifest["mode"], "linked-local")
        self.assertEqual(manifest["automatedGateStatus"], "pass")
        self.assertTrue(manifest["validation"]["ok"])
        self.assertEqual(manifest["validation"]["slideCount"], 3)
        self.assertEqual(manifest["manualGateStatus"], "pending")

        checklist = checklist_path.read_text(encoding="utf-8")
        self.assertIn("Front Design Review", checklist)
        self.assertIn("node scripts/validate_deck.js", checklist)
        self.assertIn("lark-demo-2026-05-09.html", checklist)

    def test_finalize_generates_text_sidecar_for_static_editable_decks(self):
        self.run_node(
            "scripts/delivery_new.js",
            "--root",
            str(self.delivery_root),
            "--timestamp",
            "20260509-121500",
            "--slug",
            "editable",
        )
        run_dir = self.delivery_root / "20260509-121500-editable"
        source = run_dir / "input" / "static.html"
        source.write_text(
            """<!doctype html>
<html lang="zh-CN"><body>
  <div data-lark-deck>
    <div class="ls-stage">
      <section class="ls-slide"><div class="ls-slide-inner">
        <h1 class="hero-title" contenteditable="true">可编辑标题</h1>
      </div></section>
    </div>
  </div>
</body></html>
""",
            encoding="utf-8",
        )

        self.run_node(
            "scripts/delivery_finalize.js",
            "--run",
            str(run_dir),
            "--source",
            str(source),
            "--expect-slides",
            "1",
        )

        output = run_dir / "output"
        html = (output / "index.html").read_text(encoding="utf-8")
        texts = (output / "texts.md").read_text(encoding="utf-8")
        manifest = json.loads((output / "delivery-manifest.json").read_text(encoding="utf-8"))

        self.assertIn('data-text-id="slide-01.hero-title"', html)
        self.assertIn("hero-title: 可编辑标题", texts)
        self.assertEqual(manifest["textSidecar"]["status"], "generated")
        self.assertEqual(manifest["textSidecar"]["textLeaves"], 1)

    def test_delivery_package_bundles_editable_html_and_text_sidecar(self):
        self.run_node(
            "scripts/delivery_new.js",
            "--root",
            str(self.delivery_root),
            "--timestamp",
            "20260509-123000",
            "--slug",
            "package",
        )
        run_dir = self.delivery_root / "20260509-123000-package"
        output = run_dir / "output"
        (output / "index.html").write_text(
            '<!doctype html><html><body><div data-lark-deck><div class="ls-stage">'
            '<section class="ls-slide"><div class="ls-slide-inner">'
            '<h1 data-text-id="slide-01.title">Title</h1>'
            "</div></section></div></div></body></html>",
            encoding="utf-8",
        )
        (output / "texts.md").write_text("# Deck Texts\n\n## slide-01\n"
                                          "title: Title\n", encoding="utf-8")

        self.run_node(
            "scripts/delivery_package.js",
            "--run",
            str(run_dir),
            "--name",
            "lark-package-2026-05-09",
        )

        zip_path = output / "lark-package-2026-05-09.zip"
        self.assertTrue(zip_path.exists(), "missing delivery zip")
        listing = subprocess.run(
            ["zipinfo", "-1", str(zip_path)],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        ).stdout
        self.assertIn("index.html", listing)
        self.assertIn("texts.md", listing)
        self.assertIn("apply_deck_texts.js", listing)
        self.assertIn("README.txt", listing)


if __name__ == "__main__":
    unittest.main()
