# Lark DeckKit

Lark DeckKit 是一套轻量的 HTML 幻灯片 SDK，用来把 PPT 视觉语言沉淀为可编辑、可复用、可发布的 16:9 网页演示稿。

它不是截图播放壳。页面可以复用 PPT 素材，但文字、图形、连线、标签和视觉组件都由 HTML、CSS 和模板函数生成，后续可以继续编辑和维护。

## 用户上手（Start Here）

这部分给第一次接触项目的新手。你只想快速做一套 HTML PPT 时，看这里就够。

### 1. 先看效果

- GitHub Pages：<https://vibe-lark.github.io/lark-deckkit/>
- Magic Pages：<https://magic.solutionsuite.cn/html-box/viE4zlP5oro>
- 49 页视觉样板：<https://vibe-lark.github.io/lark-deckkit/dist/lark-visual-sample.html>
- 飞书 CLI 介绍稿：<https://magic.solutionsuite.cn/html-box/viIxWdFIYeG>

URL 支持 Hash 跳页：

```text
https://vibe-lark.github.io/lark-deckkit/dist/lark-visual-sample.html#/29
```

### 2. 下载并本地预览

会用 Git 的话：

```bash
git clone https://github.com/vibe-lark/lark-deckkit.git
cd lark-deckkit
python3 -m http.server 4173 --bind 127.0.0.1
```

不会用 Git 也可以在 GitHub 页面点 `Code` -> `Download ZIP`，解压后进入 `lark-deckkit` 目录，再运行上面的 `python3 -m http.server` 命令。

浏览器打开：

```text
http://127.0.0.1:4173/sdk/quickstart.html
http://127.0.0.1:4173/sdk/example.html
http://127.0.0.1:4173/dist/lark-visual-sample.html
```

### 3. 做第一套 PPT

最快方式是复制 `sdk/quickstart.html`，只改 `createDeckFromOutline({ slides: [...] })` 里的结构化内容。

```js
const deck = LarkSlideTemplates.createDeckFromOutline({
  title: "你的演示标题",
  slides: [
    {
      type: "statement",
      kicker: "Lark DeckKit",
      title: "先确定叙事，再选择稳定模板",
      subtitle: "版式、字体、渐变和画布规则由 SDK 接管。",
    },
    {
      type: "todo",
      title: "一页内容先拆成可检查待办",
      items: [
        { label: "目标", title: "读材料", body: "提炼主要叙事。" },
        { label: "生成", title: "套模板", body: "优先使用稳定模板。" },
        { label: "检查", title: "跑验证", body: "检查页数、密度和入口。" },
      ],
    },
  ],
});
```

需要精修某一页时，再用 `visualLayout` 和 block 组件做 1600x900 精确布局。

### 4. 让 AI 生成

可以直接把这段给 AI：

```text
请读取 design.md 和 sdk/README.md。
先按照 front-design 流程压缩叙事：每页一个主观点，少元素、强层级、足够留白。
读取 LarkSlideTemplates.getDesignGuidance() 和 LarkSlideTemplates.qualityRules.typography。
优先使用 LarkSlideTemplates.createDeckFromOutline 生成第一版 16:9 HTML 演示稿。
需要复杂图形或精确复刻时，再使用 visualLayout 和 components。
不要把整页做成截图，文字和图形需要保持可编辑。
不要堆卡片、嵌套卡片、使用网页 Dashboard 式密度。
生成后运行 LarkSlideTemplates.validateDeckSpec(deck)，并执行 node scripts/validate_deck.js <html-file> --expect-slides N。
最后用浏览器截图检查版式。
```

### 5. 检查结果

```bash
node scripts/validate_deck.js sdk/quickstart.html --expect-slides 3
```

这条命令会检查 HTML 入口、页数、文本密度和外部资源。视觉质量还需要用浏览器截图确认：文字是否居中、留白是否均匀、字号是否适合投屏。

## 技术解释

这一部分解释项目为什么这样封装，以及 SDK、字体、发布、测试分别怎么工作。

### 核心能力

- **Editable HTML decks**：用 DOM 元素重建幻灯片，而不是整页截图回放。
- **16:9 presentation runtime**：内置缩放、键盘翻页、Hash 跳页、全屏播放、ESC 退出、进度条和临近图片预加载。
- **Template SDK**：通过 `Deck Spec`、主题、模板注册表和组件化 blocks 复用页面结构。
- **Fast outline generation**：用 `createDeckFromOutline` 把结构化大纲直接生成高质量初稿，并用 `validateDeckSpec` 做内容密度检查。
- **Front-design authoring loop**：先做叙事压缩、信息层级和截图自检，再进入精确布局，避免 AI 生成卡片堆叠式页面。
- **Lark-style visual system**：内置暗色画布、蓝青渐变字、引导线、标签、Logo/资产页等视觉规则。
- **Bundled web fonts**：提交可被新 HTML 直接引用的兰亭黑 WOFF2 字体，并通过 `sdk/fonts.css` 统一字体栈。
- **PPTX conversion helper**：提供脚本把 PPTX 抽取为 HTML、manifest 和素材资源，方便迁移旧演示稿。
- **Agent-ready design spec**：根目录的 `design.md` 按 DESIGN.md 标准描述视觉系统，方便后续让 AI 生成同风格页面。

### SDK Model

推荐把新 PPT 拆成四层：

| Layer | Purpose |
|---|---|
| `Deck Spec` | 演示稿元信息、主题、页面数组。纯数据，可被预览、发布、导出复用。 |
| `Theme / Tokens` | 字体、颜色、渐变、圆角、画布尺寸。 |
| `Template Registry` | 页面级模板，如封面、金句页、案例页、指标页、规范页。 |
| `Components` | 页面内部的 `textBlock`、`imageBlock`、`shapeBlock`、`vectorBlock`，以及用于对齐的 `layoutGrid`。 |

SDK 还提供质量入口：

| API | Purpose |
|---|---|
| `LarkSlideTemplates.getDesignGuidance()` | 返回 front-design 工作流、布局规则、反模式和验证清单。 |
| `LarkSlideTemplates.qualityRules` | 返回 `1600 x 900` 画布、内容密度和 PPT 字号阶梯。 |
| `LarkSlideTemplates.getTemplateContract(name)` | 返回某个模板的用途、槽位、限制和模板级 guidance。 |
| `LarkSlideTemplates.validateDeckSpec(deck)` | 检查页数、标题、内容密度、画布尺寸和 block 密度。 |

最小 SDK 示例：

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

### Front-Design Workflow

做 HTML PPT 时，先用 front-design 的方式判断页面，而不是先写 CSS：

1. **压缩叙事**：先确定听众、目标和每页只讲一个观点。
2. **选择模板**：优先用 `statement`、`todo`、`caseFlow`、`metric` 这类稳定模板。
3. **控制密度**：少元素、少卡片、少正文。演示稿不是后台页面，不能用 Dashboard 的信息密度。
4. **按 PPT 字号**：画布是 `1600 x 900`，标题、副标题、正文都按演示投屏字号。
5. **截图自检**：浏览器截图检查对齐、层级、字号和留白；只对问题页使用 `visualLayout` 精修。

SDK 中对应的入口：

```js
const guidance = LarkSlideTemplates.getDesignGuidance();
console.log(guidance.workflow);
console.log(LarkSlideTemplates.qualityRules.typography);
```

### Font Standard

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

### Project Structure

```text
.
├── index.html                        # GitHub Pages 预览入口
├── design.md                         # AI/设计代理可读的视觉系统说明
├── docs/
│   └── font-standard.md              # 字体提交、引用和妙笔发布规范
├── dist/
│   ├── lark-design-guidelines.html   # PPTX 直接转换结果
│   ├── lark-visual-sample.html       # 基于 SDK 重做的 49 页视觉样板
│   ├── lark-cli-intro.html           # 基于飞书文档生成的 3 页 CLI 介绍稿
│   ├── lark-cli-intro-magic.html     # 飞书 CLI 介绍稿妙笔直发页
│   ├── lark-deckkit-magic.html       # 妙笔空间直发预览页
│   ├── magic-assets-manifest.json     # 妙笔 TOS/CDN 素材 URL 映射
│   ├── magic-fonts-manifest.json      # 妙笔 TOS/CDN 字体 URL 映射
│   └── assets/pptx-media/            # 从 PPTX 抽取的公开素材
├── scripts/
│   ├── convert_pptx_to_html.py       # PPTX -> HTML 转换脚本
│   ├── upload_magic_assets.js        # 上传素材到妙笔 TOS/CDN
│   ├── build_magic_page.py           # 用 CDN URL 生成妙笔直发页
│   ├── build_magic_preview.py        # 本地离线单文件预览生成脚本
│   └── validate_deck.js              # 检查 DeckKit 入口、页数、文本密度和外部资源
├── sdk/
│   ├── fonts.css                     # @font-face 与字体变量
│   ├── font-manifest.json            # 字体资产清单
│   ├── fonts/                        # 已提交的 WOFF2 字体文件
│   ├── lark-slides.css               # 运行时与模板样式
│   ├── lark-slides.js                # 播放运行时
│   ├── templates.js                  # 模板、tokens、组件 helpers
│   ├── example.html                  # SDK 示例
│   ├── quickstart.html               # 从结构化 outline 快速生成 PPT 的示例
│   └── README.md                     # SDK 详细说明
└── tests/
    ├── test_artifacts.py
    ├── test_sdk_upgrade.py
    └── test_visual_sample.py
```

### Commands

| Command | Description |
|---|---|
| `python3 -m http.server 4173 --bind 127.0.0.1` | 启动本地预览服务 |
| `python3 tests/test_artifacts.py` | 检查转换产物、SDK API、README 和 `design.md` |
| `python3 tests/test_visual_sample.py` | 检查 49 页视觉样板是否由 SDK 驱动 |
| `python3 tests/test_sdk_upgrade.py` | 检查 Deck Spec、主题、模板注册、组件 helpers |
| `node --check sdk/lark-slides.js` | 检查运行时 JS 语法 |
| `node --check sdk/templates.js` | 检查模板 JS 语法 |
| `node scripts/validate_deck.js sdk/quickstart.html --expect-slides 3` | 检查单个 HTML deck 的入口、页数、文本密度和外部资源 |
| `node scripts/upload_magic_assets.js` | 上传 `dist/assets/pptx-media/` 到妙笔 TOS/CDN，生成 manifest |
| `node scripts/upload_magic_assets.js --asset-dir sdk/fonts --manifest dist/magic-fonts-manifest.json` | 上传 SDK 字体到妙笔 TOS/CDN，生成字体 manifest |
| `python3 scripts/build_magic_page.py` | 使用 CDN manifest 生成 `dist/lark-deckkit-magic.html` |
| `python3 scripts/build_magic_preview.py` | 生成本地离线单文件预览，产物默认不进 Git |

### Convert PPTX

```bash
python3 scripts/convert_pptx_to_html.py 'your-deck.pptx' --out dist
```

转换器会抽取页面、图片、文本、母版/版式背景和基础形状，并生成 HTML 与 manifest。浏览器不支持的 EMF/WMF 图片会优先抽取内嵌 PDF 并转成 PNG。

### Design System

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

### Publishing

公开预览同时提供 GitHub Pages 与 Magic Pages 两个入口。Magic Pages 是可选发布路径：需要国内访问更稳定时，可以把素材和字体上传到妙笔 TOS/CDN；只想快速制作 HTML PPT 时，直接使用本地/仓库资源即可，不要求强制单文件、云资源或无外链依赖。

GitHub 发布前确认：

- 项目目录名使用 `lark-deckkit`。
- 素材可以进入公开仓库时，保留 `dist/assets/pptx-media/`。
- 原始 `.ppt/.pptx` 不进仓库，README 中保留源文档链接即可。
- 100MB 以上单文件不能直接推送到 GitHub；源 PPTX 默认已通过 `.gitignore` 排除。

妙笔空间发布是可选路径，不是制作 HTML PPT 的必须步骤。当前发布方式是：

1. `node scripts/upload_magic_assets.js`：上传 `dist/assets/pptx-media/` 图片素材，生成 `dist/magic-assets-manifest.json`。
2. `node scripts/upload_magic_assets.js --asset-dir sdk/fonts --manifest dist/magic-fonts-manifest.json`：上传 `sdk/fonts/` 字体，生成 `dist/magic-fonts-manifest.json`。
3. `python3 scripts/build_magic_page.py`：把 SDK CSS/JS 内联进 HTML，把图片和字体都切到妙笔 TOS/CDN URL。
4. `node /Users/bytedance/.codex/skills/publish-to-magic-pages/publish.js publish dist/lark-deckkit-magic.html --title "Lark DeckKit Public Preview"`：更新妙笔页面。

token 不进入仓库。`dist/magic-assets-manifest.json` 和 `dist/magic-fonts-manifest.json` 只保存公开 CDN URL，可以提交。

### Source Reference

当前样板基于一份可公开引用的飞书源文档制作：

```text
https://bytedance.larkoffice.com/wiki/PdkgwdJO9iKS49k57pDcEcGxnad
```

仓库不需要提交原始 PPTX。生成后的 HTML、SDK、测试、`design.md` 和公开素材可以进入 GitHub；原始 `.ppt/.pptx` 不进仓库，默认由 `.gitignore` 排除。

### Status

当前版本包含：

- 49 页 Lark-style 视觉样板。
- 可复用 HTML Slide SDK。
- PPTX 转 HTML 脚本。
- GitHub Pages 与妙笔空间预览入口，其中妙笔版使用妙笔 TOS/CDN 图片资源。
- 可复用字体规范与已提交的 WOFF2 字体资源。
- DESIGN.md 风格规范。

### License

License not specified yet. Add a `LICENSE` file before publishing as an open-source project.
