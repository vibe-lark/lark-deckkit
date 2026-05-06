import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
SDK = ROOT / "sdk"
PRODUCT_MOCKS = ROOT / "product-mocks"


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
        loader = (SDK / "lark-deckkit-loader.js").read_text(encoding="utf-8")
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
            "layoutGrid",
            "qualityRules",
            "designGuidance",
            "getDesignGuidance",
            "createDeckFromOutline",
            "validateDeckSpec",
        ]:
            self.assertIn(template, templates)

        self.assertIn(".ls-slide", css)
        self.assertIn(".lvg-gradient-text", css)
        self.assertIn("window.LarkDeckKitReady", loader)
        self.assertIn("fonts.css", loader)
        self.assertIn("templates.js", loader)
        self.assertIn("LarkSlides.createDeck", example)
        self.assertIn("LarkSlides.createDeckSpec", example)
        self.assertIn("HTML PPT 模板 SDK", readme)
        self.assertIn("推荐封装方式", readme)
        self.assertIn("Front-Design 规则", readme)
        self.assertIn("getDesignGuidance", readme)
        self.assertIn("qualityRules.typography", readme)

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
            (SDK / "quickstart.html", './fonts.css', './lark-slides.css'),
            (DIST / "lark-visual-sample.html", '../sdk/fonts.css', '../sdk/lark-slides.css'),
            (DIST / "lark-design-guidelines.html", '../sdk/fonts.css', '../sdk/lark-slides.css'),
            (DIST / "lark-cli-intro.html", '../sdk/fonts.css', '../sdk/lark-slides.css'),
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
        self.assertIn("把飞书 PPT 的标准规范", readme)
        self.assertIn("https://skills.sh/anthropics/skills/frontend-design", readme)
        self.assertIn("https://cdn.jsdelivr.net/gh/vibe-lark/lark-deckkit@main/sdk/lark-deckkit-loader.js", readme)
        self.assertIn("LarkDeckKitReady", readme)
        self.assertIn("https://bytedance.larkoffice.com/wiki/PdkgwdJO9iKS49k57pDcEcGxnad#share-Al9Md6kQmoKIe4xTybRctwsTnad", readme)
        self.assertIn("https://magic.solutionsuite.cn/html-box/viE4zlP5oro", readme)
        self.assertNotIn("https://magic.solutionsuite.cn/html-box/viIxWdFIYeG", readme)
        self.assertIn("用户上手", readme)
        self.assertIn("front-design", readme)
        self.assertIn("LarkSlideTemplates.getDesignGuidance()", readme)
        self.assertIn("LarkSlideTemplates.qualityRules.typography", readme)
        self.assertIn("Download ZIP", readme)
        self.assertIn("sdk/fonts.css", readme)
        self.assertIn("lark-deckkit-loader.js", readme)
        self.assertIn("sdk/quickstart.html", readme)
        self.assertNotIn("lark-cli-intro-magic.html", readme)
        self.assertNotIn("飞书 CLI 介绍稿妙笔直发页", readme)
        self.assertNotIn("妙笔空间发布", readme)
        self.assertNotIn("scripts/upload_magic_assets.js", readme)
        self.assertNotIn("scripts/build_magic_page.py", readme)
        self.assertNotIn("dist/magic-fonts-manifest.json", readme)
        self.assertIn("scripts/validate_deck.js", readme)
        self.assertIn("https://bytedance.larkoffice.com/wiki/PdkgwdJO9iKS49k57pDcEcGxnad", readme)
        self.assertIn("仓库里不需要提交原始 PPTX", readme)

    def test_product_mocks_css_package_covers_lark_product_prototypes(self):
        package_readme = PRODUCT_MOCKS / "README.md"
        tokens = PRODUCT_MOCKS / "tokens.css"
        entry = PRODUCT_MOCKS / "lark-product-mocks.css"
        example = PRODUCT_MOCKS / "example.html"
        product_files = {
            "chat": PRODUCT_MOCKS / "products" / "chat.css",
            "drive": PRODUCT_MOCKS / "products" / "drive.css",
            "doc": PRODUCT_MOCKS / "products" / "doc.css",
            "bitable": PRODUCT_MOCKS / "products" / "bitable.css",
            "meeting": PRODUCT_MOCKS / "products" / "meeting.css",
            "task": PRODUCT_MOCKS / "products" / "task.css",
            "calendar": PRODUCT_MOCKS / "products" / "calendar.css",
        }

        for path in [package_readme, tokens, entry, example, *product_files.values()]:
            self.assertTrue(path.exists(), f"missing {path.relative_to(ROOT)}")

        token_css = tokens.read_text(encoding="utf-8")
        entry_css = entry.read_text(encoding="utf-8")
        readme = package_readme.read_text(encoding="utf-8")
        html = example.read_text(encoding="utf-8")
        root_readme = (ROOT / "README.md").read_text(encoding="utf-8")
        product_css = entry_css + "\n" + "\n".join(path.read_text(encoding="utf-8") for path in product_files.values())

        for token in [
            "--lpm-font",
            "--lpm-blue",
            "--lpm-radius-md",
            "--lpm-shadow-md",
            "--lpm-weight-body",
            "--lpm-weight-title",
            ".lpm-dark",
        ]:
            self.assertIn(token, token_css)

        for product, path in product_files.items():
            self.assertIn(f'@import url("./products/{product}.css")', entry_css)
            self.assertIn(f'data-product="{product}"', html)

        for selector in [
            ".lpm-prototype",
            ".lpm-window",
            ".lpm-chat",
            ".lpm-message-bubble",
            ".lpm-drive-table",
            ".lpm-doc-page",
            ".lpm-bitable-table",
            ".lpm-meeting-tile",
            ".lpm-task-row",
            ".lpm-calendar-event",
        ]:
            self.assertIn(selector, product_css)

        self.assertIn("飞书产品原型", readme)
        self.assertIn("不是飞书线上 CSS 的复制版", readme)
        self.assertIn("中黑", readme)
        self.assertIn("lark-product-mocks.css", root_readme)
        self.assertIn("product-mocks/example.html", root_readme)

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

    def test_lark_cli_intro_deck_uses_deckkit_and_stays_short(self):
        html_path = DIST / "lark-cli-intro.html"
        self.assertTrue(html_path.exists(), "missing Lark CLI intro deck")
        html = html_path.read_text(encoding="utf-8")

        self.assertIn("data-lark-cli-intro", html)
        self.assertIn("LarkSlides.createDeckSpec", html)
        self.assertIn("T.visualLayout", html)
        self.assertIn("飞书 CLI", html)
        self.assertIn("给每个 Agent", html)
        self.assertIn("npx @larksuite/cli@latest install", html)
        self.assertIn("lark-cli auth login", html)
        self.assertIn("lark-cli doctor", html)
        self.assertIn("data-copy-command", html)
        self.assertIn("复制", html)
        self.assertIn("17 个业务域", html)
        self.assertIn("219 个命令接口", html)
        self.assertIn("消息", html)
        self.assertIn("审批", html)
        self.assertIn("...", html)
        self.assertIn("用户目标", html)
        self.assertIn("Agent 规划", html)
        self.assertIn("CLI 执行", html)
        self.assertIn("飞书回写", html)
        self.assertIn("Agent 生成的执行待办", html)
        self.assertIn("task +create", html)
        self.assertIn("读一下这个妙记，把里面的待办提取出来，帮我创建待办后发到群里", html)
        self.assertIn("cli-flow", html)
        self.assertIn("layoutGrid", html)
        self.assertNotIn("你看到的是目标，Agent 看到的是一组可执行、可检查、可恢复的飞书操作。", html)
        self.assertNotIn("关键点：CLI 不替代 Agent 思考，它把 Agent 的计划变成真实飞书操作。", html)
        self.assertNotIn("returns structured JSON", html)
        self.assertNotIn("lark-cli calendar +agenda --as user", html)
        self.assertNotIn("HTML PPT Prototype", html)
        self.assertNotIn("HTML 做 PPT", html)
        self.assertNotIn('title: "Context"', html)
        self.assertNotIn('title: "Action"', html)
        self.assertNotIn('title: "Identity"', html)
        self.assertIn("https://bytedance.larkoffice.com/docx/WnHkdJQM6oGpQFxm9i7ckVdenSh", html)
        self.assertEqual(len(re.findall(r"sourceSlide: \"cli-", html)), 3)
        self.assertLessEqual(len(re.findall(r"sourceSlide: \"cli-", html)), 5)


if __name__ == "__main__":
    unittest.main()
