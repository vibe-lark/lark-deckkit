import json
import subprocess
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRODUCT_MOCKS = ROOT / "product-mocks"


class ProductMocksSdkTest(unittest.TestCase):
    def run_node(self, script):
        result = subprocess.run(
            ["node", "-e", script],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
        return json.loads(result.stdout)

    def test_product_mock_sdk_exports_figma_sources_catalog_and_renderers(self):
        output = self.run_node(
            textwrap.dedent(
                """
                const fs = require("fs");
                const vm = require("vm");
                const context = { window: {} };
                vm.runInNewContext(fs.readFileSync("product-mocks/lark-product-mocks.js", "utf8"), context);
                const P = context.window.LarkProductMocks;
                const header = P.render("desktopHeader", {
                  brandName: "产品名称",
                  navLinks: ["概览", "数据"],
                  primaryAction: "创建",
                });
                const sender = P.render("mobileChatSender", {
                  chips: [{ label: "联网搜索", icon: "search" }],
                  placeholder: "按住 说话",
                });
                console.log(JSON.stringify({
                  hasRender: typeof P.render === "function",
                  desktopSource: P.figmaSources.desktop.nodeId,
                  mobileSource: P.figmaSources.mobile.nodeId,
                  desktopCatalog: P.componentCatalog.desktop.includes("Header"),
                  mobileCatalog: P.componentCatalog.mobile.ai.includes("ChatSender"),
                  mobileButton: typeof P.components.mobileButton === "function",
                  headerClass: header.includes("lpm-d-header"),
                  headerBrand: header.includes("产品名称"),
                  senderClass: sender.includes("lpm-m-chat-sender"),
                  senderPlaceholder: sender.includes("按住 说话"),
                }));
                """
            )
        )

        self.assertEqual(
            output,
            {
                "hasRender": True,
                "desktopSource": "2376:182012",
                "mobileSource": "508:77283",
                "desktopCatalog": True,
                "mobileCatalog": True,
                "mobileButton": True,
                "headerClass": True,
                "headerBrand": True,
                "senderClass": True,
                "senderPlaceholder": True,
            },
        )

    def test_product_mock_css_contains_desktop_and_mobile_figma_component_layer(self):
        css = (PRODUCT_MOCKS / "lark-product-mocks.css").read_text(encoding="utf-8")

        for selector in [
            ".lpm-d-header",
            ".lpm-d-header-search",
            ".lpm-m-button",
            ".lpm-m-navbar",
            ".lpm-m-card",
            ".lpm-m-dialog",
            ".lpm-m-chat-sender",
        ]:
            self.assertIn(selector, css)

        self.assertIn("#1456f0", css)
        self.assertIn("rgba(31, 35, 41, 0.06)", css)

    def test_product_mock_docs_describe_sdk_entry_and_figma_component_coverage(self):
        readme = (PRODUCT_MOCKS / "README.md").read_text(encoding="utf-8")
        spec = (PRODUCT_MOCKS / "figma-component-spec.md").read_text(encoding="utf-8")

        self.assertIn("lark-product-mocks.js", readme)
        self.assertIn("LarkProductMocks.render", readme)
        self.assertIn("figma-component-spec.md", readme)

        for text in [
            "QkRegi9u4LiT3fXZI2xCOI",
            "5DGQfSYstIuypw5wCjGvQz",
            "desktopHeader",
            "mobileChatSender",
            "ShowBrand",
            "595:98048",
            "595:98276",
            "ChatSender",
            "componentCatalog",
        ]:
            self.assertIn(text, spec)


if __name__ == "__main__":
    unittest.main()
