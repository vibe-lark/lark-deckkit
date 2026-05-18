# Figma Component Spec for Product Mocks

本文件把两个 Figma 组件资源合并到 `product-mocks` 的可维护边界里：不改 `sdk/` PPT 运行时，只补产品原型层的轻量 SDK、样式 token 和组件映射。

## Sources

| 平台 | Figma file | Node | 用途 |
|---|---|---:|---|
| Desktop | `QkRegi9u4LiT3fXZI2xCOI` | `2376:182012` | 桌面端 Header 组件页 |
| Mobile | `5DGQfSYstIuypw5wCjGvQz` | `508:77283` | 移动端组件索引页 |

## SDK Entry

引入顺序：

```html
<link rel="stylesheet" href="../sdk/fonts.css" />
<link rel="stylesheet" href="./lark-product-mocks.css" />
<script src="./lark-product-mocks.js"></script>
```

全局入口：

```js
LarkProductMocks.render("desktopHeader", {
  brandName: "产品名称",
  navLinks: ["页签", "页签", "页签"],
  primaryAction: "Button",
});

LarkProductMocks.render("mobileChatSender", {
  chips: [{ label: "联网搜索", icon: "search" }],
  placeholder: "按住 说话",
});
```

SDK 暴露：

| API | 说明 |
|---|---|
| `LarkProductMocks.render(name, props)` | 返回组件 HTML 字符串，适合放进 HTML PPT 的 product mock 区块。 |
| `LarkProductMocks.mount(target, name, props)` | 在浏览器里把组件挂载到目标 DOM。 |
| `LarkProductMocks.components` | 组件函数集合，便于高级调用方组合。 |
| `LarkProductMocks.componentCatalog` | 从 Figma metadata 收敛的桌面/移动组件清单。 |
| `LarkProductMocks.styleTokens` | Figma token 到 `--lpm-*` 变量的映射摘要。 |
| `LarkProductMocks.figmaSources` | 当前合并所依据的 Figma file/node 记录。 |

## Desktop Header Mapping

Figma `[D] Header` 属性表：

| Figma prop | 类型 | SDK prop | 样式/行为 |
|---|---|---|---|
| `ShowBrand` | Boolean | `showBrand` | 控制 `.lpm-d-header-brand`。 |
| `Logo` | Instance swap | `logo` | 默认用 `.lpm-d-header-logo` 渲染品牌标识，可传 HTML。 |
| `BrandName` | Text | `brandName` | 渲染品牌名称。 |
| `ShowFeatures` | Boolean | `showFeatures` | 控制右侧主按钮、图标组、插槽和头像。 |
| `ShowNavLinks` | Boolean | `showNavLinks` | 控制中间导航页签。 |
| `Search` | Boolean | `search` | 控制搜索框。 |
| `Level` | `1 | 2` | `level` | 写入 `data-level`，用于后续区分一级/二级导航。 |

当前实现类名：

- `.lpm-d-header`
- `.lpm-d-header-brand`
- `.lpm-d-header-nav`
- `.lpm-d-header-search`
- `.lpm-d-header-actions`

## Mobile Component Inventory

Figma 移动端索引页覆盖这些组件族：

| 类别 | Figma 组件 |
|---|---|
| Navigation | `Breadcrumb`, `Menu`, `NavBar`, `TabBar`, `Tabs` |
| Data Entry | `Button`, `Checkbox`, `ColorPicker`, `DatePicker`, `Filter`, `Input`, `Radio`, `Rate`, `Stepper`, `Switch`, `Upload` |
| Data Display | `Avatar`, `Badge`, `Card`, `Collapse`, `Empty`, `List`, `Tag`, `Timeline` |
| Feedback | `ActionPanels`, `Dialog`, `Drawer`, `Loading`, `ModalView`, `Notice`, `Progress`, `Toast` |
| Biz Component | `Mention`, `SharePanel`, `OnboardingPopover`, `Picker`, `Profile` |
| AI Component | `ChatSender`, `ChatReasoning`, `ChatContent` |

Figma preview node map:

| 类别 | 组件 | Preview node |
|---|---|---:|
| Navigation | Breadcrumb | `595:98036` |
| Navigation | Menu | `595:98042` |
| Navigation | NavBar | `595:98048` |
| Navigation | TabBar | `595:98055` |
| Navigation | Tabs | `738:84970` |
| Data Entry | Button | `595:98085` |
| Data Entry | Input | `595:98091` |
| Data Entry | Checkbox | `595:98097` |
| Data Entry | ColorPicker | `595:98106` |
| Data Entry | DatePicker | `595:98112` |
| Data Entry | Radio | `595:98118` |
| Data Entry | Rate | `595:98127` |
| Data Entry | Stepper | `595:98133` |
| Data Entry | Switch | `595:98139` |
| Data Entry | Filter | `595:98151` |
| Data Entry | Upload | `595:98157` |
| Data Display | Avatar | `595:98196` |
| Data Display | List | `595:98202` |
| Data Display | Badge | `595:98208` |
| Data Display | Card | `595:98220` |
| Data Display | Tag | `595:98230` |
| Data Display | Collapse | `595:98241` |
| Data Display | Timeline | `595:98247` |
| Data Display | Empty | `595:98253` |
| Feedback | ActionPanels | `595:98261` |
| Feedback | Notice | `595:98268` |
| Feedback | Dialog | `595:98276` |
| Feedback | Progress | `595:98282` |
| Feedback | Drawer | `595:98289` |
| Feedback | Toast | `595:98295` |
| Feedback | Loading | `595:98302` |
| Feedback | ModalView | `595:98308` |
| Biz Component | Mention | `595:97998` |
| Biz Component | SharePanel | `595:98004` |
| Biz Component | OnboardingPopover | `595:98011` |
| Biz Component | Picker | `595:98017` |
| Biz Component | Profile | `595:98023` |
| AI Component | ChatSender | `35555:71160` |
| AI Component | ChatReasoning | index link only |
| AI Component | ChatContent | index link only |

已落到 SDK 的代表组件：

| Figma component | SDK name | 样式类 |
|---|---|---|
| `[M] Button` | `mobileButton` | `.lpm-m-button` |
| `[M] NavBar` / `[M] NavBar_Secondary` | `mobileNavBar` | `.lpm-m-navbar` |
| `[M] Card` | `mobileCard` | `.lpm-m-card` |
| `[M] Dialog` | `mobileDialog` | `.lpm-m-dialog` |
| `[M] ChatSender` | `mobileChatSender` | `.lpm-m-chat-sender` |

未展开成专用函数的组件先进入 `componentCatalog`。后续新增时按同一规则扩展 SDK，不要把 Figma React/Tailwind 片段直接复制进项目。

## Token Mapping

| Figma token | `product-mocks` token/class | 值 |
|---|---|---|
| `token/primary/fill/default` | `--lpm-blue` | `#1456f0` |
| `token/primary/on-primary-fill` | primary button text | `#ffffff` |
| `token/text/title` | `--lpm-ink` | `#1f2329` |
| `token/text/caption` | `--lpm-secondary` | `#646a73` |
| `token/text/placeholder` | `--lpm-tertiary` | `#8f959e` |
| `token/bg/base` | `--lpm-bg` | `#f2f3f5` |
| `token/bg/body`, `token/bg/float` | `--lpm-surface` | `#ffffff` |
| `token/line/border-card` | `--lpm-border` | `#dee0e3` |
| `token/line/divider-default` | `--lpm-border-soft` | `rgba(31,35,41,0.15)` |
| `[M] shadow/s1/down` | `.lpm-m-card.is-s1` | `0 2px 4px rgba(31,35,41,.06)` |
| `[M] shadow/s2/down` | `.lpm-m-card.is-s2` | `0 2px 6px rgba(31,35,41,.08)` |
| `[M] shadow/s3/down` | `.lpm-m-card.is-s3` | `0 4px 8px rgba(31,35,41,.09)` |

## Implementation Rules

- 所有新增类名继续使用 `.lpm-*`，避免污染 `LarkSlides` 和 `LarkSlideTemplates`。
- 组件 SDK 返回可编辑 HTML 字符串，不绑定 React、Tailwind 或 Universe Design 包。
- 桌面和移动端用 `desktop*` / `mobile*` API 前缀区分，避免调用歧义。
- Figma 中的开发链接和 Code Connect 片段只作为语义参考，不作为运行时依赖。
- 产品原型只服务 HTML PPT 里的可编辑产品示意，不作为线上产品前端组件库。

## Blocked / Notes

- 桌面 `[D] Header` 子节点 `2379:182890` 的 `get_design_context` 提示缺少 Code Connect 映射。本次使用根节点 metadata 中的属性表和 Figma screenshot 完成 SDK 映射，未尝试写入 Figma Code Connect。
- 移动端节点可返回 Code Connect 片段，但当前项目没有 React/Universe Design 依赖；因此只保留语义和 token，落成静态 HTML/CSS SDK。
