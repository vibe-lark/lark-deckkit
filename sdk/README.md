# HTML PPT 模板 SDK

这个 SDK 用来制作 16:9 的 HTML 演示稿。它不依赖打包工具，直接用浏览器打开即可播放，适合把设计规范、产品说明、活动演讲稿做成可复用的网页 PPT。

## 文件

- `lark-slides.css`：基础画布、播放控件、模板样式。
- `lark-slides.js`：演示稿运行时，提供翻页、Hash 定位、全屏、缩放、主题注册和 Deck Spec。
- `templates.js`：模板注册表、组件化 block、设计 tokens、资源路径解析器，以及基础模板和 Lark 暗色视觉模板。
- `example.html`：最小可运行示例。

## 最小用法

```html
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

## 推荐封装方式

做下一套 PPT 时，不要复制 `dist/lark-visual-sample.html` 里的 49 页实现。推荐把内容拆成四层：

- `Deck Spec`：演示稿元信息、主题、页面数组。它不绑定 DOM，可以被发布、预览、导出流程复用。
- `Theme / Tokens`：字体、颜色、渐变、圆角、画布尺寸。运行时用 `LarkSlides.defineTheme` 注册，模板里用 `LarkSlideTemplates.tokens` 读取。
- `Template Registry`：页面级模板，比如封面、金句页、案例页、指标页、Logo 规范页。用 `LarkSlideTemplates.defineTemplate` 注册，用 `LarkSlideTemplates.create` 调用。
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

LarkSlideTemplates.defineTemplate("businessQuote", ({ title, subtitle, bg }) =>
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
  })
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
