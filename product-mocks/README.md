# Lark Product Mocks

`product-mocks` 是 Lark DeckKit 的可选扩展层，用来在 HTML PPT 里快速搭建可编辑的飞书产品原型示意。

它不是飞书线上 CSS 的复制版，也不依赖真实飞书 DOM。目标是把飞书产品的界面气质抽象成适合演示稿使用的 CSS token 和组件类名，让聊天、文档、多维表格、会议、任务、日历等产品画面可以像普通 HTML 一样修改文字、结构和状态。

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
- `products/chat.css`：飞书聊天，覆盖单聊、群聊、消息气泡、会话列表和输入区。
- `products/drive.css`：飞书云盘，覆盖文件侧栏、面包屑、文件列表、文件卡片和操作区。
- `products/doc.css`：飞书文档，覆盖大纲、正文页、段落、表格、评论和 callout。
- `products/bitable.css`：飞书多维表格，覆盖视图 tab、工具栏、表格、状态标签和记录卡片。
- `products/meeting.css`：飞书会议，覆盖宫格、参会人、控制条、转写和纪要侧栏。
- `products/task.css`：飞书任务，覆盖任务列表、优先级、看板列和任务卡片。
- `products/calendar.css`：飞书日历，覆盖周视图、日程块、迷你月历和 agenda。
- `example.html`：可直接打开的产品原型样式样板。

## 字体和字重

产品原型 token 按真实飞书页面抽样收敛。抽样里大部分正文 computed weight 是 `400`，标题、活动项和强调控件会更接近“中黑”观感：

- 普通正文、列表、标签：`--lpm-weight-body: 400`
- 强调字段、文件名、会话标题：`--lpm-weight-strong: 500`
- 页面标题：`--lpm-weight-title: 500`
- 大数字或强视觉标识：`--lpm-weight-display: 700`

这些变量都定义在 `tokens.css`，后续如果真实页面抽样得到更精确的 computed style，只需要改 token，不需要逐个改产品 CSS。

## 使用边界

- 适合：PPT 中的产品功能示意、方案页、流程页、Agent 操作回写页。
- 不适合：真实飞书网页复刻、线上产品前端、直接复制飞书私有 CSS。
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
        <div class="lpm-nav-item is-active"><span class="lpm-nav-icon">#</span>消息</div>
        <div class="lpm-nav-item"><span class="lpm-nav-icon">D</span>文档</div>
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
