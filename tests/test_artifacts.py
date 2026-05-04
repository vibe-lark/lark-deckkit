import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
SDK = ROOT / "sdk"


class GeneratedArtifactsTest(unittest.TestCase):
    def test_converted_deck_manifest_covers_source_pptx(self):
        manifest_path = DIST / "source-deck-manifest.json"
        self.assertTrue(manifest_path.exists(), "missing generated deck manifest")

        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        self.assertEqual(manifest["source"], "16-9 活动 PPT-通用模版.pptx")
        self.assertEqual(manifest["slideCount"], 49)
        self.assertEqual(manifest["canvas"], {"width": 1600, "height": 900})
        self.assertEqual(len(manifest["slides"]), 49)

        for slide in manifest["slides"]:
            self.assertIn("index", slide)
            self.assertIn("layout", slide)
            self.assertIn("elementCount", slide)
            self.assertGreater(slide["elementCount"], 0)

        for asset in manifest["assets"]:
            self.assertTrue((ROOT / asset["path"]).exists(), asset["path"])

    def test_converted_deck_html_contains_49_presentable_slides(self):
        html_path = DIST / "lark-design-guidelines.html"
        self.assertTrue(html_path.exists(), "missing converted HTML deck")
        html = html_path.read_text(encoding="utf-8")

        self.assertIn("data-lark-deck", html)
        self.assertIn("sdk/lark-slides.js", html)
        self.assertEqual(len(re.findall(r'<section class="ls-slide"', html)), 49)
        self.assertNotIn('font-family:"', html)
        self.assertNotIn(".emf", html.lower())
        self.assertIn("Keynote Visual Guidelines", html)
        self.assertIn("功能 ICON 资源库", html)

    def test_sdk_runtime_and_templates_are_present(self):
        runtime = (SDK / "lark-slides.js").read_text(encoding="utf-8")
        css = (SDK / "lark-slides.css").read_text(encoding="utf-8")
        templates = (SDK / "templates.js").read_text(encoding="utf-8")
        example = (SDK / "example.html").read_text(encoding="utf-8")
        readme = (SDK / "README.md").read_text(encoding="utf-8")

        for symbol in [
            "window.LarkSlides",
            "createDeck",
            "createDeckSpec",
            "renderDeck",
            "goTo",
            "next",
            "prev",
            "mountControls",
            "defineTheme",
            "applyTheme",
            "requestAnimationFrame",
            "setSlideActive",
            "preloadNearbySlides",
            "toggleFullscreen",
            "fullscreenchange",
            "markImageLoaded",
        ]:
            self.assertIn(symbol, runtime)

        for template in [
            "cover",
            "section",
            "imageHero",
            "metric",
            "twoColumn",
            "visualCover",
            "visualHero",
            "visualPalette",
            "visualHighlight",
            "visualTypography",
            "visualLogoWall",
            "visualAvatarLibrary",
            "visualIconLibrary",
            "renderList",
            "renderIf",
            "imageTag",
            "defineTemplate",
            "templateNames",
            "components",
            "tokens",
            "asset",
        ]:
            self.assertIn(template, templates)

        self.assertIn(".ls-slide", css)
        self.assertIn(".lvg-gradient-text", css)
        self.assertIn("LarkSlides.createDeck", example)
        self.assertIn("LarkSlides.createDeckSpec", example)
        self.assertIn("HTML PPT 模板 SDK", readme)
        self.assertIn("推荐封装方式", readme)

    def test_design_md_documents_slide_visual_system(self):
        design = (ROOT / "design.md").read_text(encoding="utf-8")

        for section in [
            "Visual Theme & Atmosphere",
            "Color Palette & Roles",
            "Typography Rules",
            "Component Stylings",
            "Layout Principles",
            "Depth & Elevation",
            "Do's and Don'ts",
            "Responsive Behavior",
            "Agent Prompt Guide",
        ]:
            self.assertIn(section, design)

        self.assertIn("1600x900", design)
        self.assertIn("LarkSlides.createDeckSpec", design)
        self.assertIn("LarkSlideTemplates.defineTemplate", design)
        self.assertIn("https://github.com/VoltAgent/awesome-design-md", design)

    def test_readme_is_ready_for_public_github_publish(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")

        self.assertIn("Lark DeckKit", readme)
        self.assertIn("https://vibe-lark.github.io/lark-deckkit/", readme)
        self.assertIn("https://magic.solutionsuite.cn/html-box/viE4zlP5oro", readme)
        self.assertIn("Start Here", readme)
        self.assertIn("第一次接触项目的新手", readme)
        self.assertIn("Download ZIP", readme)
        self.assertIn("sdk/example.html", readme)
        self.assertIn("Magic Pages", readme)
        self.assertIn("妙笔 TOS/CDN", readme)
        self.assertIn("scripts/upload_magic_assets.js", readme)
        self.assertIn("scripts/build_magic_page.py", readme)
        self.assertIn("Source Reference", readme)
        self.assertIn("https://bytedance.larkoffice.com/wiki/PdkgwdJO9iKS49k57pDcEcGxnad", readme)
        self.assertIn("原始 `.ppt/.pptx` 不进仓库", readme)

    def test_public_preview_entrypoints_are_cloud_ready(self):
        index = (ROOT / "index.html").read_text(encoding="utf-8")
        magic = (DIST / "lark-deckkit-magic.html").read_text(encoding="utf-8")
        magic_manifest_path = DIST / "magic-assets-manifest.json"
        self.assertTrue(magic_manifest_path.exists(), "missing Magic CDN asset manifest")
        magic_manifest = json.loads(magic_manifest_path.read_text(encoding="utf-8"))

        self.assertIn("dist/lark-visual-sample.html", index)
        self.assertIn("window.LarkSlides", magic)
        self.assertIn("window.LarkSlideTemplates", magic)
        self.assertIn("MAGIC_ASSET_URLS", magic)
        self.assertIn("https://magic-builder.tos-cn-beijing.volces.com/uploads/", magic)
        self.assertNotIn("https://vibe-lark.github.io/lark-deckkit/dist/assets/pptx-media/", magic)
        self.assertNotIn("<iframe", magic)
        self.assertLess(len(magic), 800_000)
        self.assertEqual(magic_manifest["apiBase"], "https://magic.solutionsuite.cn")
        self.assertEqual(len(magic_manifest["assets"]), 299)


if __name__ == "__main__":
    unittest.main()
