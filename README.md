# Lark DeckKit

Lark DeckKit 做的事情很简单：把飞书 PPT 的标准规范，整理成一套可以直接写 HTML 幻灯片的规范和 SDK。

你可以把它理解成一份 "飞书风格 HTML PPT 模板"。它不是截图播放器，也不是把 PPT 原样塞进网页里。文字、图形、标签、连线、图片和页面结构都可以继续编辑。

## 用户上手

### 1. 先看效果

- 原版 PPT：<https://bytedance.larkoffice.com/wiki/PdkgwdJO9iKS49k57pDcEcGxnad#share-Al9Md6kQmoKIe4xTybRctwsTnad>
- HTML 版本：<https://magic.solutionsuite.cn/html-box/viE4zlP5oro>

### 2. Use With AI

最推荐的用法是直接把这段给 AI：

```text
请用 Lark DeckKit 做一套 16:9 HTML PPT。

项目地址：
https://github.com/vibe-lark/lark-deckkit

先获取项目：
git clone https://github.com/vibe-lark/lark-deckkit.git
cd lark-deckkit

开始前先读取这两个文件：
- design.md：https://github.com/vibe-lark/lark-deckkit/blob/main/design.md
- sdk/README.md：https://github.com/vibe-lark/lark-deckkit/blob/main/sdk/README.md
- 如果要做飞书产品原型示意，再读取 product-mocks/README.md：https://github.com/vibe-lark/lark-deckkit/blob/main/product-mocks/README.md

如果已经 clone 到本地，就直接读取：
- ./design.md
- ./sdk/README.md
- ./product-mocks/README.md

如果只做单页 HTML，也可以用 CDN 一键引入：
<script src="https://cdn.jsdelivr.net/gh/vibe-lark/lark-deckkit@main/sdk/lark-deckkit-loader.js"></script>

这个项目的目标是：把飞书 PPT 的标准规范转成 HTML 幻灯片规范。

为了效果更稳定，也建议参考：
https://skills.sh/anthropics/skills/frontend-design

生成要求：
- 先做一遍 front-design 检查
- 优先用 LarkSlideTemplates.createDeckFromOutline
- 复杂页面再用 visualLayout 和 components
- 页面要像 PPT，不要像后台页面
- 文字和图形保持可编辑，不要做成整页截图

完成后检查：
node scripts/validate_deck.js <html-file> --expect-slides N
再用浏览器截图看一遍版式。
```

## 技术解释

### 这套规范拆成了什么

项目里主要有三层：

- `design.md`：写给人和 AI 看的设计规范。包括字体、字号、渐变、留白、卡片形状、页面密度。
- `sdk/`：真正做 HTML PPT 的 SDK。负责播放、缩放、翻页、全屏、模板和基础组件。
- `product-mocks/`：飞书产品原型 CSS 扩展。适合在 PPT 里画可编辑的聊天、文档、多维表格、会议、任务、日历界面示意。
- `dist/lark-visual-sample.html`：按这套规范复刻出来的完整样板。

做新 PPT 时，不建议从空白 HTML 写起。先让 AI 生成结构化内容，再交给模板排版。这样稳定很多。

### 最小写法

```html
<link rel="stylesheet" href="./sdk/fonts.css" />
<link rel="stylesheet" href="./sdk/lark-slides.css" />
<div id="deck" data-lark-deck></div>

<script src="./sdk/lark-slides.js"></script>
<script src="./sdk/templates.js"></script>
<script>
  const deck = LarkSlideTemplates.createDeckFromOutline({
    title: "业务分享",
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

  LarkSlides.createDeck({ mount: "#deck", deck });
</script>
```

### CDN 引入

可以。最省事的方式是用 jsDelivr 引入 GitHub 上的 SDK。

```html
<script src="https://cdn.jsdelivr.net/gh/vibe-lark/lark-deckkit@main/sdk/lark-deckkit-loader.js"></script>
```

然后等 SDK 加载完成：

```html
<div id="deck" data-lark-deck></div>

<script src="https://cdn.jsdelivr.net/gh/vibe-lark/lark-deckkit@main/sdk/lark-deckkit-loader.js"></script>
<script>
  window.LarkDeckKitReady.then(() => {
    const deck = LarkSlideTemplates.createDeckFromOutline({
      title: "业务分享",
      slides: [
        {
          type: "statement",
          title: "把飞书 PPT 规范写成 HTML",
          subtitle: "从结构化内容开始，模板负责版式。",
        },
      ],
    });

    LarkSlides.createDeck({ mount: "#deck", deck });
  });
</script>
```

正式项目建议把 `@main` 换成固定版本或 commit hash，避免线上页面跟着主分支变化。

### 飞书产品原型 CSS

如果 PPT 里需要展示飞书产品功能，不建议放整页截图。可以引入 `product-mocks`，用普通 HTML 画可编辑的产品界面。产品原型 token 按真实飞书页面抽样收敛：正文 400，标题和强调使用中黑观感，具体在 `product-mocks/tokens.css`。

这部分还没有做完，当前更准确地说是“可用的实验扩展”，不是稳定的 SDK API。它不会被 `sdk/lark-deckkit-loader.js` 默认加载，也不会影响已有 HTMLDeck 页面；只有页面主动引入 `product-mocks/lark-product-mocks.css` 时才会生效。

现阶段建议这样使用：

- 用在演示稿里的飞书产品示意、方案原型和 Agent 操作流程页。
- 每次使用前打开对应预览页截图检查，不要默认认为已经 1:1 还原真实飞书页面。
- 可以改文字、列表、状态和局部结构，但 `.lpm-*` 类名、组件结构和部分产品样式后续还可能调整。
- 不要把从真实飞书页面抽取、未清洗的 DOM/CSS 直接提交到公开仓库。

```html
<link rel="stylesheet" href="./sdk/fonts.css" />
<link rel="stylesheet" href="./product-mocks/lark-product-mocks.css" />
```

然后使用 `.lpm-*` 类名：

```html
<div class="lpm-prototype" style="width: 960px; height: 540px;">
  <div class="lpm-window">
    <main class="lpm-chat">
      <aside class="lpm-chat-list">
        <div class="lpm-chat-item is-active">
          <div class="lpm-avatar">项</div>
          <div>
            <div class="lpm-chat-item-title">项目推进群</div>
            <div class="lpm-chat-item-preview">AI 已生成本周待办清单</div>
          </div>
          <div class="lpm-chat-time">09:42</div>
        </div>
      </aside>
      <section class="lpm-chat-main">
        <div class="lpm-topbar"><h3 class="lpm-title">项目推进群</h3></div>
        <div class="lpm-chat-thread">
          <div class="lpm-message">
            <div class="lpm-avatar">明</div>
            <div class="lpm-message-stack">
              <div class="lpm-message-author">明日门店助手</div>
              <div class="lpm-message-bubble">已提取 6 个待办。</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</div>
```

目前覆盖：飞书聊天、飞书云盘、飞书文档、飞书多维表格、飞书会议、飞书任务、飞书日历。样例见 `product-mocks/example.html`。

### SDK 里有哪些入口

| API | 用途 |
|---|---|
| `LarkSlideTemplates.createDeckFromOutline()` | 从结构化内容生成第一版 PPT。 |
| `LarkSlideTemplates.visualLayout()` | 做 1600x900 精确布局，适合复杂页面。 |
| `LarkSlideTemplates.components` | 生成文本、图片、矩形、线条和 SVG block。 |
| `LarkSlideTemplates.getDesignGuidance()` | 读取这套模板内置的设计约束。 |
| `LarkSlideTemplates.qualityRules.typography` | 读取字号规则，比如标题、副标题、正文在 1600x900 画布里的推荐范围。 |
| `LarkSlideTemplates.validateDeckSpec()` | 检查页面数量、标题、文本密度和 block 密度。 |

### 字体

新 HTML 需要先加载字体，再加载幻灯片样式。

```html
<link rel="stylesheet" href="./sdk/fonts.css" />
<link rel="stylesheet" href="./sdk/lark-slides.css" />
```

仓库里提交了 `FZLanTingHeiPro_GB18030` 的 WOFF2 字体。模板里不要到处手写字体名，优先用这些变量：

```css
font-family: var(--ld-font-display);
font-family: var(--ld-font-zh);
font-family: var(--ld-font-ui);
```

### 验证

常用命令：

```bash
node --check sdk/lark-slides.js
node --check sdk/templates.js
node --check scripts/validate_deck.js
python3 tests/test_artifacts.py
python3 tests/test_sdk_upgrade.py
python3 tests/test_visual_sample.py
node scripts/validate_deck.js sdk/quickstart.html --expect-slides 3
```

`validate_deck.js` 只能检查结构问题。页面好不好看，还是要打开浏览器看截图。

### 本地预览

需要在本地看样板或调试 SDK 时，再运行：

```bash
git clone https://github.com/vibe-lark/lark-deckkit.git
cd lark-deckkit
python3 -m http.server 4173 --bind 127.0.0.1
```

不会用 Git 的话，也可以在 GitHub 页面点 `Code` -> `Download ZIP`，解压后再运行本地预览命令。

样板页：

```text
http://127.0.0.1:4173/dist/lark-visual-sample.html
```

最小模板页：

```text
http://127.0.0.1:4173/sdk/quickstart.html
```

## 目录

```text
.
├── design.md
├── dist/
│   ├── lark-design-guidelines.html
│   ├── lark-visual-sample.html
│   └── assets/pptx-media/
├── sdk/
│   ├── fonts.css
│   ├── lark-deckkit-loader.js
│   ├── lark-slides.css
│   ├── lark-slides.js
│   ├── templates.js
│   ├── quickstart.html
│   └── README.md
├── product-mocks/
│   ├── tokens.css
│   ├── lark-product-mocks.css
│   ├── example.html
│   └── products/
├── scripts/
│   ├── convert_pptx_to_html.py
│   └── validate_deck.js
└── tests/
    ├── test_artifacts.py
    ├── test_sdk_upgrade.py
    └── test_visual_sample.py
```

## 源文档

这套样板基于这份飞书文档制作：

```text
https://bytedance.larkoffice.com/wiki/PdkgwdJO9iKS49k57pDcEcGxnad
```

仓库里不需要提交原始 PPTX。保留 HTML、SDK、测试、`design.md` 和公开素材就够了。

## License

License not specified yet. Add a `LICENSE` file before publishing as an open-source project.
