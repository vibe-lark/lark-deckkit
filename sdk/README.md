# HTML PPT 模板 SDK

这个 SDK 用来制作 16:9 的 HTML 演示稿。它不依赖打包工具，直接用浏览器打开即可播放，适合把设计规范、产品说明、活动演讲稿做成可复用的网页 PPT。

## 文件

- `fonts.css`：字体资产入口，包含 `@font-face` 和统一字体变量。
- `font-manifest.json`：已提交字体文件、字重和可选字体说明。
- `fonts/`：浏览器可直接加载的 WOFF2 字体资源。
- `lark-slides.css`：基础画布、播放控件、模板样式。
- `lark-slides.js`：演示稿运行时，提供翻页、Hash 定位、全屏、缩放、主题注册和 Deck Spec。
- `templates.js`：模板注册表、组件化 block、设计 tokens、资源路径解析器、front-design guidance，以及基础模板和 Lark 暗色视觉模板。
- `example.html`：最小可运行示例。

## 最小用法

```html
<link rel="stylesheet" href="./fonts.css" />
<link rel="stylesheet" href="./lark-slides.css" />
<div id="deck" data-lark-deck></div>
<script src="./lark-slides.js"></script>
<script src="./templates.js"></script>
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
          { value: "60%", label: "重复工作量下降" },
          { value: "90%", label: "AI 质检准确率" },
        ],
      }),
    ],
  });

  LarkSlides.createDeck({ mount: "#deck", deck });
</script>
```

`fonts.css` 必须先于 `lark-slides.css` 加载。这样新 HTML 可以直接复用 `--ld-font-display`、`--ld-font-zh`、`--ld-font-ui`，并让模板样式拿到同一套兰亭黑字体。

如果 HTML 放在仓库根目录，使用：

```html
<link rel="stylesheet" href="./sdk/fonts.css" />
<link rel="stylesheet" href="./sdk/lark-slides.css" />
```

如果 HTML 放在 `dist/`，使用：

```html
<link rel="stylesheet" href="../sdk/fonts.css" />
<link rel="stylesheet" href="../sdk/lark-slides.css" />
```

## 最快成稿：Outline -> Deck

做新 PPT 时，优先让 AI 生成结构化 outline，不要从空白 HTML/CSS 写起。`createDeckFromOutline` 会把常见页面映射到稳定模板：`statement` 适合金句/观点页，`todo` 适合步骤/计划页，`caseFlow` 适合案例链路页。

生成前先读取 SDK 里的设计约束：

```js
const guidance = LarkSlideTemplates.getDesignGuidance();
const typography = LarkSlideTemplates.qualityRules.typography;
const todoContract = LarkSlideTemplates.getTemplateContract("visualTodoList");

console.log(guidance.workflow);
console.log(typography.subtitle); // 28-40px on a 1600x900 slide canvas
console.log(todoContract.guidance);
```

这一步的作用是让 AI 先做 front-design 判断：压缩叙事、减少元素、确定层级、按 PPT 字号排版，再交给模板生成页面。

```js
const deck = LarkSlideTemplates.createDeckFromOutline({
  title: "飞书 CLI 介绍",
  slides: [
    {
      type: "statement",
      kicker: "Lark CLI",
      title: "给 Agent 一套可执行的飞书工具",
      subtitle: "自然语言负责表达目标，CLI 负责把计划落到真实飞书操作。",
    },
    {
      type: "todo",
      title: "用户目标会被拆成可检查待办",
      items: [
        { label: "目标", title: "读材料", body: "读取文档或妙记，提炼任务。" },
        { label: "执行", title: "调用 CLI", body: "创建待办、发送群消息、回写结果。", chips: ["task", "im"] },
      ],
    },
    {
      type: "caseFlow",
      title: "一句话到真实协作",
      prompt: "读一下这个妙记，把里面的待办提取出来，帮我创建待办后发到群里",
      steps: [
        { title: "读取", body: "拿到妙记内容。" },
        { title: "提取", body: "生成待办清单。" },
        { title: "回写", body: "创建任务并发到群里。" },
      ],
    },
  ],
});

const result = LarkSlideTemplates.validateDeckSpec(deck);
if (!result.ok) console.warn(result.issues);
LarkSlides.createDeck({ mount: "#deck", deck });
```

本仓库提供了可直接复制的入口：`sdk/quickstart.html`。生成后用脚本检查页数和基础质量：

```bash
node scripts/validate_deck.js sdk/quickstart.html --expect-slides 3
```

## Front-Design 规则

Lark DeckKit 的默认产物是演示稿，不是网页 Dashboard。使用 SDK 时遵守这些规则，产物会稳定很多：

- 一页只承载一个主观点，优先把长段落压缩成标题、短副标题和 3-4 个步骤。
- `statement` 用来讲观点，`todo` 用来讲过程，`caseFlow` 用来讲“用户目标 -> Agent 计划 -> CLI 执行 -> 飞书回写”这类链路。
- 少用卡片，多用留白、居中标题、细线和明确对齐。不要把 3 个大框、5 个小框和长条混在一页里。
- 字号按 1600x900 PPT 画布：Hero `76-92px`，Section `58-68px`，Subtitle `28-40px`，Body `20-28px`。
- 只有关键标题、指标、标签可以用渐变。正文说明用白色或灰色，避免全页都抢焦点。
- 截图检查比肉眼看代码更可靠。生成后至少看桌面截图，检查文字是否居中、留白是否均匀、内容是否像在演示而不是在填表。

可复制给 AI 的提示词：

```text
请先读取 LarkSlideTemplates.getDesignGuidance()、LarkSlideTemplates.qualityRules 和 sdk/README.md。
按照 front-design 流程压缩叙事：每页一个主观点，少元素、强层级、足够留白。
优先用 createDeckFromOutline 生成 statement、todo、caseFlow 页面。
不要堆卡片，不要嵌套卡片，不要用网页 Dashboard 式密度。
复杂页才使用 visualLayout，并保持文字、图形、标签可编辑。
生成后运行 validateDeckSpec 和 scripts/validate_deck.js，再用浏览器截图检查版式。
```

## 推荐封装方式

做下一套 PPT 时，不要复制 `dist/lark-visual-sample.html` 里的 49 页实现。推荐把内容拆成四层：

- `Deck Spec`：演示稿元信息、主题、页面数组。它不绑定 DOM，可以被发布、预览、导出流程复用。
- `Theme / Tokens`：字体、颜色、渐变、圆角、画布尺寸。运行时用 `LarkSlides.defineTheme` 注册，模板里用 `LarkSlideTemplates.tokens` 读取；字体不要散落硬编码，优先使用 `fonts.css` 里的 CSS 变量。
- `Template Registry`：页面级模板，比如封面、金句页、案例页、指标页、Logo 规范页。用 `LarkSlideTemplates.defineTemplate` 注册，用 `LarkSlideTemplates.create` 调用，并通过 contract 说明模板用途、槽位、限制和 guidance。
- `Components`：页面内部的 text/image/shape/vector block。用 `LarkSlideTemplates.components` 拼页面，不直接散落大量 HTML 字符串。

示例：

```js
const A = LarkSlideTemplates.asset("assets/pptx-media");

LarkSlides.defineTheme("customerStory", {
  className: "ls-theme-customer-story",
  cssVars: {
    "--ls-app-bg": "#111217",
    "--ls-accent": "#3ec3f7",
  },
});

LarkSlideTemplates.defineTemplate(
  "businessQuote",
  ({ title, subtitle, bg }) =>
    LarkSlideTemplates.visualLayout({
      title,
      blocks: [
        LarkSlideTemplates.components.imageBlock({ src: A(bg) }),
        LarkSlideTemplates.components.textBlock({
          x: 0,
          y: 360,
          w: 1600,
          h: 120,
          text: title,
          align: "center",
          size: 76,
          gradient: "brand",
        }),
        LarkSlideTemplates.components.textBlock({
          x: 0,
          y: 500,
          w: 1600,
          h: 64,
          text: subtitle,
          align: "center",
          size: 32,
          color: "#b5bac4",
          weight: 500,
        }),
      ],
    }),
  {
    intent: "Centered business quote slide.",
    slots: { title: "required", subtitle: "optional", bg: "optional image asset" },
    limits: { maxTitleChars: 28, maxBodyChars: 120 },
    guidance: ["Use one centered claim.", "Keep subtitle at 28px or larger.", "Do not add supporting cards."],
  }
);

const deck = LarkSlides.createDeckSpec({
  title: "客户案例分享",
  theme: "customerStory",
  slides: [
    LarkSlideTemplates.create("businessQuote", {
      title: "先进团队 先用飞书",
      subtitle: "把这套视觉语言迁移到新的业务叙事里",
      bg: "e2cc3c0d5dc3155d.png",
    }),
  ],
});
```

## 字体规范

当前 SDK 提交 `FZLanTingHeiPro_GB18030` 的 9 个 WOFF2 字重，覆盖 `200/300/400/500/600/650/700/800/900`。清单见 `font-manifest.json`，完整规则见 `../docs/font-standard.md`。

模板里使用这些字体入口：

```css
font-family: var(--ld-font-display); /* 英文标题、金句、强视觉标题 */
font-family: var(--ld-font-zh);      /* 中文标题、标签、指标说明 */
font-family: var(--ld-font-ui);      /* 播放壳与轻量模板 */
```

如果选择妙笔空间发布，并且希望线上页面不依赖本地 `fonts/` 目录，可以先上传字体，再生成妙笔 HTML。这个流程是发布选项，不是 SDK 制作 HTML PPT 的硬约束：

```bash
node scripts/upload_magic_assets.js --asset-dir sdk/fonts --manifest dist/magic-fonts-manifest.json
python3 scripts/build_magic_page.py
```

## Lark 视觉模板

`templates.js` 额外提供一组适合这套 PPT 视觉语言的暗色模板。模板返回标准 slide 对象，可直接传给 `LarkSlides.createDeck`：

```js
LarkSlides.createDeck({
  mount: "#deck",
  slides: [
    LarkSlideTemplates.visualCover({
      sourceSlide: 37,
      title: "设计视觉元素/资产",
      subtitle: "更多可编辑版本请查看 figma",
    }),
    LarkSlideTemplates.visualTypography({ sourceSlide: 38 }),
    LarkSlideTemplates.visualPalette({ sourceSlide: 39 }),
    LarkSlideTemplates.visualLogoWall({
      sourceSlide: 36,
      bg: "assets/pptx-media/fe0be4b4d6325923.png",
      logos: ["assets/pptx-media/5cfa40729e3c636e.png"],
    }),
  ],
});
```

常用视觉模板：

- `visualCover`：黑底大字封面/章节页。
- `visualHero`：暗色渐变背景 + 大标题金句。
- `visualPalette`、`visualHighlight`、`visualTypography`：设计规范页。
- `visualLogoWall`、`visualLogoSpec`：Logo 资产与组合规范。
- `visualAvatarLibrary`、`visualIconLibrary`、`visualProductIcons`：资产库页。
- `visualProductShot`、`visualPhotoStory`、`visualMetricChart`、`visualCards`：业务演示页。

## 自定义页面

如果要从 PPT 素材精确复刻某一页，优先使用 `visualLayout`。它保留固定 1600x900 画布，用 `blocks` 描述图片、文本、形状和 SVG 原始片段；文本块默认可编辑，适合把 PPT 页面拆成可维护元素，而不是整页截图回放。

```js
LarkSlideTemplates.visualLayout({
  sourceSlide: 1,
  title: "Keynote Visual Guidelines",
  blocks: [
    { kind: "image", src: "assets/pptx-media/bg.png", style: "left:0;top:0;width:1600px;height:900px;" },
    {
      kind: "text",
      style: "left:240px;top:350px;width:1120px;height:120px;background:transparent;text-align:center;",
      html: "<p><span style=\"font-size:92px;color:#fff;\">Keynote Visual Guidelines</span></p>",
    },
  ],
});
```

现在也可以用组件 helper 生成 blocks，减少硬编码：

```js
const { imageBlock, textBlock, shapeBlock } = LarkSlideTemplates.components;

LarkSlideTemplates.visualLayout({
  title: "指标页",
  blocks: [
    imageBlock({ src: "assets/pptx-media/bg.png" }),
    shapeBlock({ x: 280, y: 310, w: 480, h: 240, fill: "rgba(255,255,255,0.08)", radius: "8px" }),
    textBlock({ x: 0, y: 360, w: 1600, h: 100, text: "提效价值", align: "center", gradient: "brand" }),
  ],
});
```

模板返回的是普通 slide 对象，也可以直接传入自定义 HTML：

```js
LarkSlides.createDeck({
  mount: "#deck",
  slides: [
    {
      title: "自定义页面",
      content: `
        <div class="ls-template-slide">
          <h1 class="ls-template-title">自定义页面</h1>
          <p class="ls-template-subtitle">这里可以放任何 HTML、图片、图表或产品截图。</p>
        </div>
      `,
    },
  ],
});
```

## 播放控制

- 方向键、空格、PageUp/PageDown 翻页。
- URL Hash 使用 `#/页码`，例如 `#/12` 可直接打开第 12 页。
- 右下控制条提供上一页、下一页和全屏播放。
- 全屏播放是正式播放态：控制条和进度条会隐藏，16:9 画布按 PPT 方式充满屏幕可用区域；按 `ESC` 退出播放态。
- 图片由运行时预加载当前页前后两页，并在加载完成后短淡入，避免翻页时突然闪出。

## 从 PPTX 转换

本仓库的 `scripts/convert_pptx_to_html.py` 会读取 PPTX，抽取页面、图片、文本、母版/版式背景和基础形状，生成 `dist/lark-design-guidelines.html`。生成出的 HTML 复用同一套 SDK，因此后续新 PPT 可以直接复用这些模板和播放能力。
