import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
SDK = ROOT / "sdk"


def assert_loads_before(testcase, html, first, second):
    first_index = html.find(first)
    second_index = html.find(second)
    testcase.assertGreaterEqual(first_index, 0, f"missing {first}")
    testcase.assertGreaterEqual(second_index, 0, f"missing {second}")
    testcase.assertLess(first_index, second_index, f"{first} must load before {second}")


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

    def test_font_assets_are_bundled_and_reusable(self):
        fonts_css_path = SDK / "fonts.css"
        font_manifest_path = SDK / "font-manifest.json"
        font_standard_path = ROOT / "docs" / "font-standard.md"

        self.assertTrue(fonts_css_path.exists(), "missing SDK font stylesheet")
        self.assertTrue(font_manifest_path.exists(), "missing SDK font manifest")
        self.assertTrue(font_standard_path.exists(), "missing font standard doc")

        fonts_css = fonts_css_path.read_text(encoding="utf-8")
        font_manifest = json.loads(font_manifest_path.read_text(encoding="utf-8"))
        font_standard = font_standard_path.read_text(encoding="utf-8")

        self.assertEqual(font_manifest["primaryFamily"], "FZLanTingHeiPro_GB18030")
        self.assertEqual(font_manifest["css"], "sdk/fonts.css")
        self.assertEqual(len(font_manifest["fonts"]), 9)
        self.assertIn("--ld-font-display", fonts_css)
        self.assertIn("--ld-font-zh", fonts_css)
        self.assertIn("--ld-font-ui", fonts_css)
        self.assertIn("font-display: swap", fonts_css)
        self.assertIn("Magic Pages Rule", font_standard)
        self.assertIn("sdk/fonts.css", font_standard)
        self.assertIn("dist/magic-fonts-manifest.json", font_standard)

        for font in font_manifest["fonts"]:
            font_path = ROOT / font["file"]
            self.assertTrue(font_path.exists(), font["file"])
            self.assertEqual(font_path.suffix, ".woff2")
            self.assertGreater(font_path.stat().st_size, 100_000)
            self.assertIn(font_path.name, fonts_css)

    def test_html_entrypoints_load_fonts_before_slide_css(self):
        entrypoints = [
            (SDK / "example.html", './fonts.css', './lark-slides.css'),
            (DIST / "lark-visual-sample.html", '../sdk/fonts.css', '../sdk/lark-slides.css'),
            (DIST / "lark-design-guidelines.html", '../sdk/fonts.css', '../sdk/lark-slides.css'),
        ]

        for html_path, font_href, slide_href in entrypoints:
            with self.subTest(path=html_path):
                html = html_path.read_text(encoding="utf-8")
                assert_loads_before(self, html, font_href, slide_href)

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
        self.assertIn("sdk/fonts.css", design)
        self.assertIn("FZLanTingHeiPro_GB18030", design)
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
        self.assertIn("sdk/fonts.css", readme)
        self.assertIn("sdk/font-manifest.json", readme)
        self.assertIn("sdk/example.html", readme)
        self.assertIn("Magic Pages", readme)
        self.assertIn("妙笔 TOS/CDN", readme)
        self.assertIn("dist/magic-fonts-manifest.json", readme)
        self.assertIn("scripts/upload_magic_assets.js", readme)
        self.assertIn("scripts/build_magic_page.py", readme)
        self.assertIn("Source Reference", readme)
        self.assertIn("https://bytedance.larkoffice.com/wiki/PdkgwdJO9iKS49k57pDcEcGxnad", readme)
        self.assertIn("原始 `.ppt/.pptx` 不进仓库", readme)

    def test_public_preview_entrypoints_are_cloud_ready(self):
        index = (ROOT / "index.html").read_text(encoding="utf-8")
        magic = (DIST / "lark-deckkit-magic.html").read_text(encoding="utf-8")
        magic_manifest_path = DIST / "magic-assets-manifest.json"
        magic_fonts_manifest_path = DIST / "magic-fonts-manifest.json"
        self.assertTrue(magic_manifest_path.exists(), "missing Magic CDN asset manifest")
        self.assertTrue(magic_fonts_manifest_path.exists(), "missing Magic CDN font manifest")
        magic_manifest = json.loads(magic_manifest_path.read_text(encoding="utf-8"))
        magic_fonts_manifest = json.loads(magic_fonts_manifest_path.read_text(encoding="utf-8"))

        self.assertIn("dist/lark-visual-sample.html", index)
        self.assertIn("window.LarkSlides", magic)
        self.assertIn("window.LarkSlideTemplates", magic)
        self.assertIn("MAGIC_ASSET_URLS", magic)
        self.assertIn("https://magic-builder.tos-cn-beijing.volces.com/uploads/", magic)
        self.assertIn(".woff2", magic)
        self.assertNotIn("./fonts/", magic)
        self.assertNotIn("../sdk/fonts/", magic)
        self.assertNotIn("https://vibe-lark.github.io/lark-deckkit/dist/assets/pptx-media/", magic)
        self.assertNotIn("<iframe", magic)
        self.assertLess(len(magic), 800_000)
        self.assertEqual(magic_manifest["apiBase"], "https://magic.solutionsuite.cn")
        self.assertEqual(len(magic_manifest["assets"]), 299)
        self.assertEqual(magic_fonts_manifest["apiBase"], "https://magic.solutionsuite.cn")
        self.assertEqual(magic_fonts_manifest["assetDir"], "sdk/fonts")
        self.assertEqual(len(magic_fonts_manifest["assets"]), 9)
        for name, url in magic_fonts_manifest["assets"].items():
            self.assertTrue(name.endswith(".woff2"), name)
            self.assertIn("magic-builder.tos-cn-beijing.volces.com", url)


if __name__ == "__main__":
    unittest.main()
