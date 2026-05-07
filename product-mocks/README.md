# Lark Product Mocks

`product-mocks` 是 Lark DeckKit 的可选扩展层，用来在 HTML PPT 里快速搭建可编辑的飞书产品原型示意。

它不复制飞书私有 DOM 或私有 CSS，但会以真实飞书页面截图和 computed style 作为校准标准。目标是把首屏结构、字体、间距、图标密度和控件状态沉淀成适合演示稿使用的 CSS token 和组件类名，让聊天、文档、云盘、日历、多维表格、会议、任务等产品画面可以像普通 HTML 一样修改文字、结构和状态。

## 当前状态

这部分还在建设中，不能当成稳定的公开 API。当前版本适合用来做 HTML PPT 里的产品示意和内部原型，但还没有完成所有产品的 1:1 校准，也没有承诺 `.lpm-*` 类名和 DOM 结构长期不变。

使用时建议按这个边界处理：

- 核心 HTMLDeck SDK 不会默认加载这套样式；只有主动引入 `lark-product-mocks.css` 时才会影响页面。
- 新做页面前先打开单产品预览，对照真实飞书页面检查首屏结构、字体、间距和遮挡。
- 真实页面抽取产物只能作为本地校准材料，提交公开仓库前必须清洗内容、图片和内部结构。
- 后续会继续补齐产品模块、抽样规则、组件文档和更稳定的模板片段。

## 引入方式

如果需要所有产品原型样式：

```html
<link rel="stylesheet" href="../sdk/fonts.css" />
<link rel="stylesheet" href="./lark-product-mocks.css" />
```

如果只需要某个产品：

```html
<link rel="stylesheet" href="../sdk/fonts.css" />
<link rel="stylesheet" href="./tokens.css" />
<link rel="stylesheet" href="./products/chat.css" />
```

## 文件

- `tokens.css`：共享字体、颜色、圆角、阴影、间距和基础语义 token。
- `lark-product-mocks.css`：总入口，导入所有产品样式和通用组件。
- `products/chat.css`：飞书聊天，覆盖深色主导航、分组栏、会话列表、消息气泡和输入区。
- `products/drive.css`：飞书云盘，覆盖 Feishu Docs 首页侧栏、快捷操作卡、最近文件表格和操作区。
- `products/doc.css`：飞书文档，覆盖顶部工具栏、大纲、正文页、段落、表格、评论和 callout。
- `products/bitable.css`：飞书多维表格，覆盖文档顶栏、知识库侧栏、视图 tab、工具栏和表格网格。
- `products/meeting.css`：飞书会议，覆盖会议结束页、智能会议纪要卡片和 AI 摘要正文。
- `products/task.css`：飞书任务，覆盖飞书主导航、任务侧栏、列表视图、筛选工具栏和任务表格。
- `products/calendar.css`：飞书日历，覆盖周视图、日程块、迷你月历和 agenda。
- `example.html`：可直接打开的产品原型样式样板。
- `preview.html`：单产品预览入口，使用 `?product=chat` 这类参数从 `example.html` 抽取对应产品。
- `previews/*.html`：每个产品的薄入口页，方便直接分享单产品链接。

## 单产品预览

本地服务启动后可以直接打开：

```text
http://127.0.0.1:4175/product-mocks/preview.html?product=chat
http://127.0.0.1:4175/product-mocks/preview.html?product=doc
http://127.0.0.1:4175/product-mocks/preview.html?product=drive
http://127.0.0.1:4175/product-mocks/preview.html?product=bitable
http://127.0.0.1:4175/product-mocks/preview.html?product=meeting
http://127.0.0.1:4175/product-mocks/preview.html?product=task
http://127.0.0.1:4175/product-mocks/preview.html?product=calendar
```

也可以用更短的薄入口：

```text
http://127.0.0.1:4175/product-mocks/previews/chat.html
http://127.0.0.1:4175/product-mocks/previews/doc.html
http://127.0.0.1:4175/product-mocks/previews/drive.html
http://127.0.0.1:4175/product-mocks/previews/bitable.html
http://127.0.0.1:4175/product-mocks/previews/meeting.html
http://127.0.0.1:4175/product-mocks/previews/task.html
http://127.0.0.1:4175/product-mocks/previews/calendar.html
```

## 字体和字重

产品原型 token 按真实飞书页面抽样收敛。抽样里大部分正文 computed weight 是 `400`，标题、活动项和强调控件会更接近“中黑”观感：

- 普通正文、列表、标签：`--lpm-weight-body: 400`
- 强调字段、文件名、会话标题：`--lpm-weight-strong: 500`
- 页面标题：`--lpm-weight-title: 500`
- 大数字或强视觉标识：`--lpm-weight-display: 700`

这些变量都定义在 `tokens.css`，后续如果真实页面抽样得到更精确的 computed style，只需要改 token，不需要逐个改产品 CSS。

## 图标

`example.html` 使用统一 SVG icon set 承载常用图标，不再用 `⌘`、`▣`、`◉`、emoji 这类字符临时代替图标。写新原型时优先复用：

```html
<svg class="lpm-icon"><use href="#lpm-i-search"></use></svg>
```

## 真实页面样式抽取

如果目标是“尽量像真实飞书页面”，不要继续手写 CSS。用 `real-css-extractor.js` 从你已登录、已打开的飞书页面里抽取目标区域的 computed style，生成本地 HTML 模板：

```js
// 在真实飞书页面 DevTools Console 中执行
// 先粘贴 product-mocks/real-css-extractor.js 的完整内容，再执行：
const result = LarkDeckKitRealCssExtractor.capture({
  root: "body",
  title: "task-real-shell",
  sanitizeText: true,
  allowImages: false
});
copy(LarkDeckKitRealCssExtractor.renderStandalone(result));
```

这个结果可以保存为 `product-mocks/generated/*.html` 本地预览。`generated/` 和 `captures/` 已加入 `.gitignore`，原因是抽取产物可能包含登录态页面的 computed style、结构细节或内部信息，不应该直接进公开仓库。

如果你在 Codex 环境里已经装了 `browser-harness`，可以直接从已打开 tab 生成：

```bash
python3 scripts/extract_real_product_mock.py \
  --url-contains "/next/task/my-tasks" \
  --root body \
  --title task-real-shell \
  --out product-mocks/generated/task-real-shell.html
```

推荐流程：

1. 用真实飞书页面确定原型参考。
2. 运行抽取器生成本地 HTML 壳。
3. 用内容模拟脚本保留真实导航和侧栏，把主内容区换成可读、可改的演示数据。
4. 只把通用抽取器、规范和必要的 sanitized 模板提交到公开仓库；具体业务页面壳放内部仓库或本地。

任务页示例：

```bash
python3 scripts/simulate_real_product_mock.py \
  --input product-mocks/generated/task-real-shell.html \
  --out product-mocks/generated/task-real-simulated.html
```

这样生成的页面会保留抽取页的飞书导航、任务侧栏、图标和 computed CSS；右侧主内容区由脚本注入模拟任务列表，避免页面只剩 `Text 1`、`Text 2` 这类不可读占位内容。

## 使用边界

- 适合：PPT 中需要接近真实飞书首屏的产品功能示意、方案页、流程页、Agent 操作回写页。
- 不适合：线上产品前端、把未清洗的飞书私有 DOM/CSS 直接提交到公开仓库。
- 类名统一使用 `.lpm-*`，避免污染 `LarkSlides` 和 `LarkSlideTemplates`。
- 字体优先使用飞书线上字体栈；没有线上字体时，回退到 `sdk/fonts.css` 里的兰亭黑。

## 示例

```html
<div class="lpm-prototype" style="width: 960px; height: 540px;">
  <div class="lpm-window">
    <aside class="lpm-sidebar">
      <div class="lpm-brand">
        <div class="lpm-brand-mark">飞</div>
        <div>
          <div class="lpm-title">飞书原型</div>
          <div class="lpm-subtitle">Product Mock</div>
        </div>
      </div>
      <nav class="lpm-nav">
        <div class="lpm-nav-item is-active"><svg class="lpm-icon"><use href="#lpm-i-message"></use></svg>消息</div>
        <div class="lpm-nav-item"><svg class="lpm-icon"><use href="#lpm-i-file"></use></svg>文档</div>
      </nav>
    </aside>
    <main class="lpm-main">
      <div class="lpm-topbar">
        <h3 class="lpm-title">项目群</h3>
        <button class="lpm-button is-primary">发送</button>
      </div>
      <section class="lpm-chat-thread">
        <div class="lpm-message">
          <div class="lpm-avatar">明</div>
          <div class="lpm-message-stack">
            <div class="lpm-message-author">明日门店助手</div>
            <div class="lpm-message-bubble">已提取 6 个待办，并同步到任务清单。</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</div>
```
