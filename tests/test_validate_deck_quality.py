import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ValidateDeckQualityTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="deckkit-validate."))

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def run_validator(self, html):
        html_path = self.tmp / "deck.html"
        html_path.write_text(html, encoding="utf-8")
        result = subprocess.run(
            ["node", "scripts/validate_deck.js", str(html_path), "--json"],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
        return json.loads(result.stdout)

    def test_warns_when_thin_layout_lines_are_overused(self):
        lines = "\n".join(
            '<div class="lvg-layout-block lvg-layout-shape" '
            'style="position:absolute;left:10px;top:10px;width:500px;height:2px;background:#fff;"></div>'
            for _ in range(7)
        )
        payload = self.run_validator(
            f"""<!doctype html>
<html><body>
  <div data-lark-deck>
    <div class="ls-stage">
      <section class="ls-slide"><div class="ls-slide-inner">{lines}</div></section>
    </div>
  </div>
</body></html>"""
        )

        self.assertTrue(payload["ok"])
        self.assertEqual(payload["lineShapes"], 7)
        self.assertTrue(
            any(issue["code"] == "decorative-lines" for issue in payload["issues"]),
            payload["issues"],
        )


if __name__ == "__main__":
    unittest.main()
