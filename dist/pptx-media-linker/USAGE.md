# PPTX Media Linker 使用说明

生成时间：2026-05-15T18:35:25.802Z

## 这个东西有什么用

PPTX 导出的 `pptx-media` 图片文件名通常是无意义哈希，团队复用时不知道每张图是什么，也不知道该复制哪个链接。这个索引把图片按内容识别成可复用资产，统一上传到妙笔 TOS，并补上可读名称、资源类型、使用建议和排除原因。

当前只把高复用的 `icon` 和 `logo` 纳入公共池：

- `icon`：功能、流程、状态、能力点图标，适合放在方案页、能力矩阵、流程图里。
- `logo`：飞书产品 logo、客户/伙伴 logo，适合放在案例页、生态页、客户页里。
- 其他截图、背景、菜品/实物照片、营销大字、指标文字、装饰线，先保留在排除清单，不进入公共素材池。

## 交付物

| 文件 | 用途 |
| --- | --- |
| `assets-index.json` | 完整机器可读索引，适合给脚本或后续工具使用。 |
| `assets-index.csv` | 表格版索引，适合运营同学筛选、补充说明。 |
| `llms.txt` | LLM 轻量入口，只放加载策略、规则、统计和高频示例。 |
| `icons.json` | icon 分片索引，Agent 需要找图标时只加载这个。 |
| `logos.json` | logo 分片索引，Agent 需要找品牌/产品标识时只加载这个。 |
| `excluded.json` | 暂不纳入资产的分片索引，用于复核边界。 |
| `index.html` | 本地可打开的检索页，支持按类型/状态搜索、复制链接。 |
| `USAGE.md` | 当前这份使用说明。 |
| `not-needed-now.md` | 当前明确不做的能力和不纳入资产范围。 |

## 已上传的索引文件

- llms.txt 妙笔预览页：https://magic.solutionsuite.cn/html-box/vjC9AsKydQw
- USAGE.md：https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/USAGE.md
- assets-index.csv：https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/assets-index.csv
- not-needed-now.md：https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/not-needed-now.md
- assets-index.json：https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/assets-index.json
- index.html：https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/index.html
- logos.json：https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/logos.json
- llms.txt：https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/llms.txt
- icons.json：https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/icons.json
- excluded.json：https://magic-builder.tos-cn-beijing.volces.com/gtm/pptx-media/v1/excluded.json

## 当前统计

- 原始图片：299 个
- 纳入公共池：215 个，其中 icon 163 个、logo 52 个
- 已有 TOS 链接：215 个
- 暂不纳入：84 个
- TOS 前缀：`gtm/pptx-media/v1/icons/` 与 `gtm/pptx-media/v1/logos/`

## 使用方式

### 人工使用

1. 打开 `index.html`。
2. 用搜索框输入中文名、英文 slug、原文件名或标签，例如 `飞书 AI`、`lock`、`logo`。
3. 只看可用公共素材时，筛选 `Included`；需要看被排除内容时，切换到 `Excluded`。
4. 复制 `URL` 放到文档、PPT、网页或后续脚本里；复制 `Markdown` 可直接嵌入 Markdown；复制 `HTML` 可直接嵌入网页。

### LLM / Agent 使用

1. 先读取 `llms.txt`，不要默认读取 CSV 或完整 JSON。
2. 需要图标时只读取 `icons.json`；需要 logo 时只读取 `logos.json`。
3. 只有做全量审计、去重、重新分类时，才读取 `assets-index.json`。
4. CSV 只作为表格编辑/人工筛选用，不作为 LLM 默认上下文。

## 命名规则

- TOS key 使用 `gtm/pptx-media/v1/{icons|logos}/{semantic-name}-{sha8}.{ext}`。
- `semantic-name` 来自图片内容识别，尽量表达用途，例如 `lock-security-line`、`feishu-ai-logo-cn`。
- 末尾保留 `sha8`，避免同名素材覆盖，也方便回查原始文件。
- 原始哈希文件名不再面向用户展示，只作为溯源字段保留。

## 使用规范

- logo 不要拉伸、裁切或改色；需要深色/浅色版本时优先选已有变体。
- icon 用于表达概念，不要把指标文字、营销口号当 icon 复用。
- 公开链接默认可公开访问，不要上传含敏感信息、客户未授权材料或个人头像。
- 如果某张图片在排除清单里但确实要复用，先补充用途和名称，再进入下一轮上传。

## 后续维护

新增 PPTX 媒体后，先重新生成 `media-inventory.json` 和预览图，再运行：

```bash
node scripts/build_pptx_media_linker.mjs --upload --upload-artifacts
```

如果只是更新索引页面，不重新上传素材：

```bash
node scripts/build_pptx_media_linker.mjs
```
