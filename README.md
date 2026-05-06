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

如果已经 clone 到本地，就直接读取：
- ./design.md
- ./sdk/README.md

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

### 3. 本地预览

```bash
git clone https://github.com/vibe-lark/lark-deckkit.git
cd lark-deckkit
python3 -m http.server 4173 --bind 127.0.0.1
```

打开：

```text
http://127.0.0.1:4173/dist/lark-visual-sample.html
```

不会用 Git 的话，也可以在 GitHub 页面点 `Code` -> `Download ZIP`，解压后运行上面的本地预览命令。想看最小模板写法，再打开 `http://127.0.0.1:4173/sdk/quickstart.html`。

## 技术解释

### 这套规范拆成了什么

项目里主要有三层：

- `design.md`：写给人和 AI 看的设计规范。包括字体、字号、渐变、留白、卡片形状、页面密度。
- `sdk/`：真正做 HTML PPT 的 SDK。负责播放、缩放、翻页、全屏、模板和基础组件。
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
