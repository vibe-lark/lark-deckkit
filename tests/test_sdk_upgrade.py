import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SdkUpgradeTest(unittest.TestCase):
    def run_node(self, script):
        result = subprocess.run(
            ["node", "-e", script],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
        return json.loads(result.stdout)

    def test_runtime_exposes_reusable_deck_spec_and_theme_contract(self):
        output = self.run_node(
            textwrap.dedent(
                """
                const fs = require("fs");
                const vm = require("vm");
                const context = { window: {} };
                vm.runInNewContext(fs.readFileSync("sdk/lark-slides.js", "utf8"), context);
                const LarkSlides = context.window.LarkSlides;
                const spec = LarkSlides.createDeckSpec({
                  title: "复用型演示稿",
                  theme: "larkVisual",
                  slides: [{ title: "第一页", content: "<p>hello</p>" }],
                });
                const theme = LarkSlides.defineTheme("custom", {
                  className: "ls-theme-custom",
                  cssVars: { "--ls-accent": "#3ec3f7" },
                });
                console.log(JSON.stringify({
                  hasSpecApi: typeof LarkSlides.createDeckSpec === "function",
                  hasThemeApi: typeof LarkSlides.defineTheme === "function",
                  specTitle: spec.title,
                  specTheme: spec.theme,
                  slideCount: spec.slides.length,
                  themeName: theme.name,
                  themeAccent: LarkSlides.themes.custom.cssVars["--ls-accent"],
                  canFullscreen: typeof LarkSlides.toggleFullscreen === "function",
                }));
                """
            )
        )

        self.assertEqual(
            output,
            {
                "hasSpecApi": True,
                "hasThemeApi": True,
                "specTitle": "复用型演示稿",
                "specTheme": "larkVisual",
                "slideCount": 1,
                "themeName": "custom",
                "themeAccent": "#3ec3f7",
                "canFullscreen": True,
            },
        )

    def test_templates_expose_registry_components_tokens_and_asset_resolver(self):
        output = self.run_node(
            textwrap.dedent(
                """
                const fs = require("fs");
                const vm = require("vm");
                const context = { window: {} };
                vm.runInNewContext(fs.readFileSync("sdk/templates.js", "utf8"), context);
                const T = context.window.LarkSlideTemplates;
                T.defineTemplate("customMetric", ({ title }) => T.metric({
                  title,
                  metrics: [{ value: "20x", label: "效率提升" }],
                }));
                const asset = T.asset("assets/pptx-media");
                const textBlock = T.components.textBlock({
                  x: 10,
                  y: 20,
                  w: 300,
                  h: 90,
                  text: "先进团队",
                  gradient: "brand",
                });
                const slide = T.create("customMetric", { title: "提效价值" });
                console.log(JSON.stringify({
                  canCreate: slide.title,
                  hasTemplate: T.templateNames().includes("visualLayout"),
                  assetPath: asset("logo.png"),
                  remoteAsset: asset("https://example.com/logo.png"),
                  tokenColor: T.tokens.colors.deepBlue,
                  blockKind: textBlock.kind,
                  blockHasGradient: textBlock.html.includes("lvg-gradient-text"),
                }));
                """
            )
        )

        self.assertEqual(
            output,
            {
                "canCreate": "提效价值",
                "hasTemplate": True,
                "assetPath": "assets/pptx-media/logo.png",
                "remoteAsset": "https://example.com/logo.png",
                "tokenColor": "#1456f0",
                "blockKind": "text",
                "blockHasGradient": True,
            },
        )


if __name__ == "__main__":
    unittest.main()
