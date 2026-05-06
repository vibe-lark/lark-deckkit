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
                const grid = T.components.layoutGrid({ x: 120, w: 1360, columns: 3, gap: 40 });
                const secondCol = grid.col(1);
                const slide = T.create("customMetric", { title: "提效价值" });
                console.log(JSON.stringify({
                  canCreate: slide.title,
                  hasTemplate: T.templateNames().includes("visualLayout"),
                  assetPath: asset("logo.png"),
                  remoteAsset: asset("https://example.com/logo.png"),
                  tokenColor: T.tokens.colors.deepBlue,
                  blockKind: textBlock.kind,
                  blockHasGradient: textBlock.html.includes("lvg-gradient-text"),
                  gridColWidth: grid.colW,
                  secondColX: secondCol.x,
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
                "gridColWidth": 426.6666666666667,
                "secondColX": 586.6666666666667,
            },
        )

    def test_templates_expose_contracts_outline_generation_and_quality_validation(self):
        output = self.run_node(
            textwrap.dedent(
                """
                const fs = require("fs");
                const vm = require("vm");
                const context = { window: {} };
                vm.runInNewContext(fs.readFileSync("sdk/lark-slides.js", "utf8"), context);
                vm.runInNewContext(fs.readFileSync("sdk/templates.js", "utf8"), context);
                const T = context.window.LarkSlideTemplates;
                const deck = T.createDeckFromOutline({
                  title: "快速生成高质量 HTML PPT",
                  slides: [
                    { type: "statement", title: "把内容变成可讲的页面", subtitle: "先选稳定模板，再填结构化内容。" },
                    {
                      type: "todo",
                      title: "Agent 执行待办",
                      subtitle: "把目标拆成可检查的步骤。",
                      items: [
                        { label: "目标", title: "收到需求", body: "根据文档做一套介绍页。" },
                        { label: "规划", title: "拆成页面", body: "封面、流程、案例三页。" },
                        { label: "执行", title: "生成页面", body: "使用 DeckKit 稳定模板。", chips: ["deck", "todo"] },
                      ],
                    },
                    {
                      type: "caseFlow",
                      title: "案例链路",
                      prompt: "读文档，提炼重点，生成演示稿",
                      steps: [
                        { title: "读取", body: "拿到材料。" },
                        { title: "提炼", body: "抽取主线。" },
                        { title: "生成", body: "写成页面。" },
                      ],
                    },
                  ],
                });
                const validation = T.validateDeckSpec(deck);
                const todoContract = T.getTemplateContract("visualTodoList");
                const layoutContract = T.getTemplateContract("visual-layout");
                const guidance = T.getDesignGuidance();
                console.log(JSON.stringify({
                  slideCount: deck.slides.length,
                  firstTemplate: deck.slides[0].template,
                  hasTodoTemplate: deck.slides[1].content.includes("Agent 执行待办"),
                  validationOk: validation.ok,
                  validationWarnings: validation.warnings,
                  contractIntent: todoContract.intent,
                  layoutIntent: layoutContract.intent,
                  contractMaxItems: todoContract.limits.maxItems,
                  contractGuidance: todoContract.guidance[0],
                  guidanceName: guidance.name,
                  guidanceWorkflow: guidance.workflow[0],
                  subtitleMin: T.qualityRules.typography.subtitle.min,
                  bodyMin: T.qualityRules.typography.body.min,
                  hasCreateDeckFromOutline: typeof T.createDeckFromOutline === "function",
                  hasGetDesignGuidance: typeof T.getDesignGuidance === "function",
                }));
                """
            )
        )

        self.assertEqual(
            output,
            {
                "slideCount": 3,
                "firstTemplate": "visual-layout",
                "hasTodoTemplate": True,
                "validationOk": True,
                "validationWarnings": 0,
                "contractIntent": "Stable checklist/process slide for Agent plans.",
                "layoutIntent": "Precision 1600x900 editable block layout.",
                "contractMaxItems": 5,
                "contractGuidance": "Use only when each column is a real step.",
                "guidanceName": "front-design keynote loop",
                "guidanceWorkflow": "Compress the narrative before choosing a template.",
                "subtitleMin": 28,
                "bodyMin": 20,
                "hasCreateDeckFromOutline": True,
                "hasGetDesignGuidance": True,
            },
        )

    def test_validate_deck_script_checks_slide_count_and_quality_markers(self):
        result = subprocess.run(
            ["node", "scripts/validate_deck.js", "dist/lark-cli-intro.html", "--expect-slides", "3", "--json"],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
        output = json.loads(result.stdout)

        self.assertTrue(output["ok"])
        self.assertEqual(output["slideCount"], 3)
        self.assertIn("externalAssets", output)

    def test_quickstart_outline_example_is_validatable(self):
        result = subprocess.run(
            ["node", "scripts/validate_deck.js", "sdk/quickstart.html", "--expect-slides", "3", "--json"],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
        output = json.loads(result.stdout)

        self.assertTrue(output["ok"])
        self.assertEqual(output["slideCount"], 3)
        self.assertEqual(output["externalAssets"], {"stylesheets": 0, "scripts": 0, "images": 0})


if __name__ == "__main__":
    unittest.main()
