import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "dist" / "lark-visual-sample.html"


class VisualSampleTest(unittest.TestCase):
    def test_visual_sample_is_full_sdk_driven_editable_redesign(self):
        self.assertTrue(HTML.exists(), "missing visual redesign sample")
        html = HTML.read_text(encoding="utf-8")

        self.assertIn("data-visual-sample", html)
        self.assertIn("../sdk/lark-slides.css", html)
        self.assertIn("../sdk/lark-slides.js", html)
        self.assertIn("../sdk/templates.js", html)
        self.assertEqual(len(re.findall(r"sourceSlide:", html)), 49)
        self.assertEqual(len(re.findall(r"LarkSlideTemplates\.visualLayout", html)), 49)

        self.assertNotIn("ls-element", html)
        self.assertNotIn("source-deck-manifest", html)

    def test_visual_sample_uses_ppt_assets_and_runtime(self):
        html = HTML.read_text(encoding="utf-8")
        asset_names = set(re.findall(r'A\("([^"]+)"\)', html))
        self.assertGreaterEqual(len(asset_names), 30)
        for asset in asset_names:
            self.assertTrue((ROOT / "dist" / "assets" / "pptx-media" / asset).exists(), asset)

        runtime = (ROOT / "sdk" / "lark-slides.js").read_text(encoding="utf-8")
        templates = (ROOT / "sdk" / "templates.js").read_text(encoding="utf-8")
        self.assertIn("createDeck", runtime)
        self.assertIn("keydown", runtime)
        self.assertIn("contenteditable", templates)
        for template in [
            "visualLayout",
            "visualCover",
            "visualHero",
            "visualPalette",
            "visualHighlight",
            "visualTypography",
            "visualLogoWall",
            "visualAvatarLibrary",
            "visualIconLibrary",
        ]:
            self.assertIn(f"function {template}", templates)


if __name__ == "__main__":
    unittest.main()
