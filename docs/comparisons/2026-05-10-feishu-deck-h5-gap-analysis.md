# FuQiang/feishu-deck-h5 Gap Analysis

Date: 2026-05-10

Compared target: `FuQiang/feishu-deck-h5`

Compared commit: `8e702be12b074f0358324392b61a70cea069f6ef`

DeckKit baseline: `vibe-lark/lark-deckkit` local working tree on 2026-05-10.

## 结论

`feishu-deck-h5` 的核心优势不是单页视觉，而是“生产纪律”：每次生成有独立 run、交付件可编辑、validator 规则覆盖具体事故、runtime 面向真实演示场景。DeckKit 保留自己的方向：1600x900、Lark visual sample、可编辑 HTML slide、SDK 模板和 Magic/本地交付链路；只吸收能增强稳定性的机制。

## Checklist

| 维度 | feishu-deck-h5 | DeckKit 现状 | 差距 | 吸收决策 |
|---|---|---|---|---|
| 结构 | `runs/<ts>/{input,output}` 强制；preflight 检查本地挂载 | 已有 `deliveries/<ts>-slug/{input,output}` | DeckKit 没有本地挂载拒绝门槛，但本仓库是本地 SDK，不需要完全照搬 | 保留 `deliveries/`，不引入强制 preflight |
| 样式标准 | 深色飞书风、单 accent、禁装饰线、禁过度阴影、标题页规则细 | DeckKit 已有 `design.md`、`qualityRules`、Front Design 规则 | 线条使用缺少自动提醒 | 已吸收：`design.md` / `sdk/README.md` 明确线条只表达关系；`validate_deck.js` 增加 `decorative-lines` 预算 |
| 文本 sidecar | 每个文本叶子有 `data-text-id`，产出 `texts.md`，可独立改文案 | DeckKit 之前只有 `contenteditable`，没有可复用 sidecar | 文案修改容易误碰 HTML/CSS | 已吸收：`extract_deck_texts.js`、`apply_deck_texts.js`、`delivery_finalize` 自动产出 sidecar |
| 导出交付 | local / remote zip / inline 三模式 | DeckKit 有 linked-local delivery 和 Magic 发布脚本 | 缺远程可编辑 zip | 已吸收：`delivery_package.js` 打包 `index.html`、`texts.md`、apply 脚本、README |
| 运行时交互 | present/scroll、hash、wheel/touch、fullscreen、idle chrome、AbortController 清理 | DeckKit 有缩放、hash、键盘、全屏 | 少 wheel/touch；全局 listener 清理更粗 | 已吸收：`lark-slides.js` 增加 wheel/touch 导航、`AbortController` 清理、自动文本 id |
| Validator | 大量具体事故规则：字号、palette、decor、runtime、perf、text ids | DeckKit validator 偏入口和页数检查 | 程序化门禁不够“事故驱动” | 已吸收第一批：装饰线预算、sidecar 产物测试；不照搬 1920x1080 / 13 layout 限制 |
| 工程流程 | `build.sh`、`finalize.sh`、CI strict validator | DeckKit 用独立脚本 + Python unittest | 缺一条命令覆盖全部远程交付 | 已吸收到 `delivery_finalize` + `delivery_package`，保持 Node 脚本风格 |
| 模板策略 | Claude skill 强约束布局和业务规则 | DeckKit 是公开 SDK + 模板库 | 对方很多规则绑定内部飞书母版资产，不适合公开 SDK | 不吸收强制 13 layout、story id、客户案例业务规则 |
| 移动端 | 同一 HTML 在窄屏浏览模式可滚动 | DeckKit 重点是演示 canvas | 当前需求主要是本地/妙笔桌面演示 | 暂不做移动 browse mode，后续单独设计 |

## 已落地

- 标准：`design.md`、`sdk/README.md`、`LarkSlideTemplates.getDesignGuidance()` 都把线条定位成关系/边界/方向/度量，不再作为默认装饰。
- SDK：`LarkSlides.annotateEditableText()` 给可编辑文本补 `data-text-id`；runtime 增加 wheel/touch 导航和 `AbortController` listener 清理。
- API：新增 `scripts/extract_deck_texts.js`、`scripts/apply_deck_texts.js`、`scripts/delivery_package.js`。
- 交付：`scripts/delivery_finalize.js` 对静态可编辑 HTML 自动生成 `texts.md` 和 sidecar manifest。
- 测试：新增 sidecar、validator line budget、delivery package 测试；扩展 artifact 测试覆盖 runtime 和本对比文档。

## 暂不吸收

- 不改成 `feishu-deck-h5` 的 1920x1080 画布。DeckKit 现有标准是 1600x900，dist 样板和 SDK token 都围绕它建立。
- 不引入强制 preflight。DeckKit 是普通 GitHub SDK，本地目录已经是默认工作方式。
- 不照搬对方 13 个 layout 和客户案例业务规则。那些是 Claude skill 的强约束，不适合 DeckKit 作为通用 SDK 暴露。
- 不引入默认 mobile scroll mode。当前 DeckKit 的核心是 PPT 演示画布；移动浏览需要另开布局标准。

## 后续候选

- 增加 `--strict` 模式，把 line budget、external assets、sidecar drift 等 warning 升级为 error。
- 为动态 `createDeckFromOutline()` 源文件提供静态导出器，让文本 sidecar 可覆盖运行时生成页面。
- 增加可视化截图 gate，把 Front Design Review 从 checklist 进一步半自动化。
