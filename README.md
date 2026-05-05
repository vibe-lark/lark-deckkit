# Lark DeckKit

Lark DeckKit 是一套轻量的 HTML 幻灯片 SDK，用来把 PPT 视觉语言沉淀为可编辑、可复用、可发布的 16:9 网页演示稿。

它不是截图播放壳。项目里的样板页会复用 PPT 素材，但页面结构由 HTML、CSS 和模板函数生成，文字、图形、连线、标签和视觉组件都可以继续维护。

## Public Preview

- GitHub Pages：<https://vibe-lark.github.io/lark-deckkit/>
- Magic Pages：<https://magic.solutionsuite.cn/html-box/viE4zlP5oro>
- 直接打开视觉样板：<https://vibe-lark.github.io/lark-deckkit/dist/lark-visual-sample.html>
- 飞书 CLI 介绍稿（HTML 动效原型版）：<https://magic.solutionsuite.cn/html-box/viIxWdFIYeG>

公开预览同时提供 GitHub Pages 与 Magic Pages 两个入口。妙笔空间托管的是可直接运行的 deck 页面，PPT 图片素材已上传到妙笔 TOS/CDN，不再依赖 GitHub Pages 拉图；用户打开 URL 即可查看，不需要下载原始 PPT 或本地素材。

URL 支持 Hash 跳页：

```text
https://vibe-lark.github.io/lark-deckkit/dist/lark-visual-sample.html#/29
```

## Highlights

- **Editable HTML decks**：用 DOM 元素重建幻灯片，而不是整页截图回放。
- **16:9 presentation runtime**：内置缩放、键盘翻页、Hash 跳页、全屏播放、ESC 退出、进度条和临近图片预加载。
- **Template SDK**：通过 `Deck Spec`、主题、模板注册表和组件化 blocks 复用页面结构。
- **Lark-style visual system**：内置暗色画布、蓝青渐变字、引导线、标签、Logo/资产页等视觉规则。
- **Bundled web fonts**：提交可被新 HTML 直接引用的兰亭黑 WOFF2 字体，并通过 `sdk/fonts.css` 统一字体栈。
- **PPTX conversion helper**：提供脚本把 PPTX 抽取为 HTML、manifest 和素材资源，方便迁移旧演示稿。
- **Agent-ready design spec**：根目录的 `design.md` 按 DESIGN.md 标准描述视觉系统，方便后续让 AI 生成同风格页面。

## Start Here

这部分给第一次接触项目的新手。先看效果，再改一个最小页面。

1. 先打开公开预览，确认这套视觉风格是不是你要的：

```text
https://vibe-lark.github.io/lark-deckkit/
```

2. 把项目放到本地。会用 Git 的话：

```bash
git clone https://github.com/vibe-lark/lark-deckkit.git
cd lark-deckkit
```

不会用 Git 也可以在 GitHub 页面点 `Code` -> `Download ZIP`，解压后进入 `lark-deckkit` 目录。

3. 启动本地预览服务：

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

4. 在浏览器打开两个入口：

```text
http://127.0.0.1:4173/dist/lark-visual-sample.html
http://127.0.0.1:4173/sdk/example.html
```

第一个是 49 页完整视觉样板，第二个是最小 SDK 示例。

5. 从 `sdk/example.html` 开始改。先只改这几处：

```js
title: "你的演示标题",
subtitle: "一句话说明这场分享的价值",
metrics: [
  { value: "60%", label: "重复工作下降" },
  { value: "90%", label: "AI 质检准确率" },
],
```

6. 想做自己的第一份 PPT，可以复制 `sdk/example.html` 为 `my-deck.html`，继续添加 `LarkSlideTemplates.create(...)`。

## Use With AI

让 AI 基于这套风格做新 PPT 时，把入口说清楚即可：

```text
请读取 design.md 和 sdk/README.md。
使用 LarkSlides.createDeckSpec 和 LarkSlideTemplates.create 生成一份 16:9 HTML 演示稿。
视觉风格必须沿用 Lark DeckKit 的深色画布、蓝青渐变字、矩形标签、细线引导和克制留白。
不要把整页做成截图，文字和图形需要保持可编辑。
```

## SDK Model

推荐把新 PPT 拆成四层：

| Layer | Purpose |
|---|---|
| `Deck Spec` | 演示稿元信息、主题、页面数组。纯数据，可被预览、发布、导出复用。 |
| `Theme / Tokens` | 字体、颜色、渐变、圆角、画布尺寸。 |
| `Template Registry` | 页面级模板，如封面、金句页、案例页、指标页、规范页。 |
| `Components` | 页面内部的 `textBlock`、`imageBlock`、`shapeBlock`、`vectorBlock`，以及用于对齐的 `layoutGrid`。 |

最小示例：

```html
<link rel="stylesheet" href="./sdk/fonts.css" />
<link rel="stylesheet" href="./sdk/lark-slides.css" />
<div id="deck" data-lark-deck></div>

<script src="./sdk/lark-slides.js"></script>
<script src="./sdk/templates.js"></script>
<script>
  const deck = LarkSlides.createDeckSpec({
    title: "业务分享",
    theme: "larkVisual",
    slides: [
      LarkSlideTemplates.create("cover", {
        title: "活动标题",
        subtitle: "一句话说明这场分享的价值",
      }),
      LarkSlideTemplates.create("metric", {
        title: "核心成果",
        metrics: [
          { value: "60%", label: "重复工作下降" },
          { value: "90%", label: "AI 质检准确率" },
        ],
      }),
    ],
  });

  LarkSlides.createDeck({ mount: "#deck", deck });
</script>
```

## Font Standard

新做的 HTML 需要先加载字体，再加载幻灯片样式：

```html
<link rel="stylesheet" href="./sdk/fonts.css" />
<link rel="stylesheet" href="./sdk/lark-slides.css" />
```

`dist/` 目录下的页面使用：

```html
<link rel="stylesheet" href="../sdk/fonts.css" />
<link rel="stylesheet" href="../sdk/lark-slides.css" />
```

仓库提交了 `FZLanTingHeiPro_GB18030` 的 9 个 WOFF2 字重，清单在 `sdk/font-manifest.json`，规则文档在 `docs/font-standard.md`。新模板不要手写散落的字体栈，优先用：

```css
font-family: var(--ld-font-display);
font-family: var(--ld-font-zh);
font-family: var(--ld-font-ui);
```

`TikTok Display` 仍作为可选字体保留在字体栈里；当前仓库不提交它的字体文件。

## Project Structure

```text
.
├── index.html                        # GitHub Pages 预览入口
├── design.md                         # AI/设计代理可读的视觉系统说明
├── docs/
│   └── font-standard.md              # 字体提交、引用和妙笔发布规范
├── dist/
│   ├── lark-design-guidelines.html   # PPTX 直接转换结果
│   ├── lark-visual-sample.html       # 基于 SDK 重做的 49 页视觉样板
│   ├── lark-cli-intro.html           # 基于飞书文档生成的 5 页 CLI 介绍稿
│   ├── lark-cli-intro-magic.html     # 飞书 CLI 介绍稿妙笔直发页
│   ├── lark-deckkit-magic.html       # 妙笔空间直发预览页
│   ├── magic-assets-manifest.json     # 妙笔 TOS/CDN 素材 URL 映射
│   ├── magic-fonts-manifest.json      # 妙笔 TOS/CDN 字体 URL 映射
│   └── assets/pptx-media/            # 从 PPTX 抽取的公开素材
├── scripts/
│   ├── convert_pptx_to_html.py       # PPTX -> HTML 转换脚本
│   ├── upload_magic_assets.js        # 上传素材到妙笔 TOS/CDN
│   ├── build_magic_page.py           # 用 CDN URL 生成妙笔直发页
│   └── build_magic_preview.py        # 本地离线单文件预览生成脚本
├── sdk/
│   ├── fonts.css                     # @font-face 与字体变量
│   ├── font-manifest.json            # 字体资产清单
│   ├── fonts/                        # 已提交的 WOFF2 字体文件
│   ├── lark-slides.css               # 运行时与模板样式
│   ├── lark-slides.js                # 播放运行时
│   ├── templates.js                  # 模板、tokens、组件 helpers
│   ├── example.html                  # SDK 示例
│   └── README.md                     # SDK 详细说明
└── tests/
    ├── test_artifacts.py
    ├── test_sdk_upgrade.py
    └── test_visual_sample.py
```

## Commands

| Command | Description |
|---|---|
| `python3 -m http.server 4173 --bind 127.0.0.1` | 启动本地预览服务 |
| `python3 tests/test_artifacts.py` | 检查转换产物、SDK API、README 和 `design.md` |
| `python3 tests/test_visual_sample.py` | 检查 49 页视觉样板是否由 SDK 驱动 |
| `python3 tests/test_sdk_upgrade.py` | 检查 Deck Spec、主题、模板注册、组件 helpers |
| `node --check sdk/lark-slides.js` | 检查运行时 JS 语法 |
| `node --check sdk/templates.js` | 检查模板 JS 语法 |
| `node scripts/upload_magic_assets.js` | 上传 `dist/assets/pptx-media/` 到妙笔 TOS/CDN，生成 manifest |
| `node scripts/upload_magic_assets.js --asset-dir sdk/fonts --manifest dist/magic-fonts-manifest.json` | 上传 SDK 字体到妙笔 TOS/CDN，生成字体 manifest |
| `python3 scripts/build_magic_page.py` | 使用 CDN manifest 生成 `dist/lark-deckkit-magic.html` |
| `python3 scripts/build_magic_preview.py` | 生成本地离线单文件预览，产物默认不进 Git |

## Convert PPTX

```bash
python3 scripts/convert_pptx_to_html.py 'your-deck.pptx' --out dist
```

转换器会抽取页面、图片、文本、母版/版式背景和基础形状，并生成 HTML 与 manifest。浏览器不支持的 EMF/WMF 图片会优先抽取内嵌 PDF 并转成 PNG。

## Source Reference

当前样板基于一份可公开引用的飞书源文档制作：

```text
https://bytedance.larkoffice.com/wiki/PdkgwdJO9iKS49k57pDcEcGxnad
```

仓库不需要提交原始 PPTX。生成后的 HTML、SDK、测试、`design.md` 和公开素材可以进入 GitHub；原始 `.ppt/.pptx` 不进仓库，默认由 `.gitignore` 排除。

## Design System

`design.md` 使用 DESIGN.md 结构描述本项目的视觉标准：

- Visual Theme & Atmosphere
- Color Palette & Roles
- Typography Rules
- Component Stylings
- Layout Principles
- Depth & Elevation
- Do's and Don'ts
- Responsive Behavior
- Agent Prompt Guide

后续让 AI 生成新页面时，可以直接要求它读取 `design.md` 并使用 `LarkSlides.createDeckSpec`、`LarkSlideTemplates.defineTemplate` 和 `visualLayout`。

字体规范以 `docs/font-standard.md` 为准。新 HTML 需要引用 `sdk/fonts.css`，Magic Pages 发布需要同时使用 `dist/magic-assets-manifest.json` 和 `dist/magic-fonts-manifest.json`。

## GitHub Publishing Notes

公开发布前确认：

- 项目目录名使用 `lark-deckkit`。
- 素材可以进入公开仓库时，保留 `dist/assets/pptx-media/`。
- 原始 `.ppt/.pptx` 不进仓库，README 中保留源文档链接即可。
- 100MB 以上单文件不能直接推送到 GitHub；源 PPTX 默认已通过 `.gitignore` 排除。

## Magic Pages Publishing

妙笔空间的 HTML 内容有大小限制，因此不要把 299 张图片全部内联成 base64。当前发布方式是：

1. `node scripts/upload_magic_assets.js`：上传 `dist/assets/pptx-media/` 图片素材，生成 `dist/magic-assets-manifest.json`。
2. `node scripts/upload_magic_assets.js --asset-dir sdk/fonts --manifest dist/magic-fonts-manifest.json`：上传 `sdk/fonts/` 字体，生成 `dist/magic-fonts-manifest.json`。
3. `python3 scripts/build_magic_page.py`：把 SDK CSS/JS 内联进 HTML，把图片和字体都切到妙笔 TOS/CDN URL。
4. `node /Users/bytedance/.codex/skills/publish-to-magic-pages/publish.js publish dist/lark-deckkit-magic.html --title "Lark DeckKit Public Preview" --open-source`：更新妙笔页面。

token 不进入仓库。`dist/magic-assets-manifest.json` 和 `dist/magic-fonts-manifest.json` 只保存公开 CDN URL，可以提交。

## Status

当前版本包含：

- 49 页 Lark-style 视觉样板。
- 可复用 HTML Slide SDK。
- PPTX 转 HTML 脚本。
- GitHub Pages 与妙笔空间预览入口，其中妙笔版使用妙笔 TOS/CDN 图片资源。
- 可复用字体规范与已提交的 WOFF2 字体资源。
- DESIGN.md 风格规范。

## License

License not specified yet. Add a `LICENSE` file before publishing as an open-source project.
