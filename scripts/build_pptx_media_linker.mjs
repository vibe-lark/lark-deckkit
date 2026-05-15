#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = process.cwd();
const MEDIA_DIR = 'dist/assets/pptx-media';
const OUT_DIR = 'dist/pptx-media-linker';
const INVENTORY_PATH = path.join(OUT_DIR, 'media-inventory.json');
const UPLOAD_STATE_PATH = path.join(OUT_DIR, 'upload-results.json');
const ARTIFACT_STATE_PATH = path.join(OUT_DIR, 'artifact-upload-results.json');
const UPLOAD_SCRIPT = process.env.PPTX_MEDIA_UPLOAD_SCRIPT ||
  '/Users/bytedance/.codex/skills/upload-file-to-tos/upload.js';
const TOS_PREFIX = process.env.PPTX_MEDIA_TOS_PREFIX || 'gtm/pptx-media/v1';
const LLMS_PREVIEW_URL = process.env.PPTX_MEDIA_LLMS_PREVIEW_URL || '';

const args = new Set(process.argv.slice(2));
const shouldUpload = args.has('--upload');
const shouldUploadArtifacts = args.has('--upload-artifacts');
const forceUpload = args.has('--force');
const uploadConcurrency = Number(process.env.PPTX_MEDIA_UPLOAD_CONCURRENCY || 4);

const iconLabels = [
  [2, 'lock-security-line', '安全锁'],
  [4, 'office-building-line', '办公楼'],
  [6, 'bar-chart-line', '柱状图'],
  [11, 'org-chart-line', '组织架构'],
  [14, 'sync-refresh-line', '循环刷新'],
  [19, 'plug-connection-line', '连接插头'],
  [20, 'user-profile-line', '用户头像'],
  [21, 'cross-integration-line', '集成交叉'],
  [22, 'data-user-line', '数据与用户'],
  [24, 'hexagon-chart-line', '六边形图表'],
  [25, 'database-line', '数据库'],
  [28, 'target-arrow-line', '目标命中'],
  [31, 'growth-chart-line', '增长图表'],
  [34, 'selection-box-line', '选区框'],
  [35, 'user-silhouette-line', '用户轮廓'],
  [37, 'document-note-solid', '文档笔记'],
  [39, 'team-broadcast-line', '团队广播'],
  [40, 'workflow-nodes-line', '流程节点'],
  [45, 'switch-path-line', '路径切换'],
  [46, 'chat-message-line', '消息气泡'],
  [48, 'hashtag-chat-line', '话题消息'],
  [53, 'team-hierarchy-line', '团队层级'],
  [55, 'route-connector-line', '连接路径'],
  [59, 'shopping-cart-line', '购物车'],
  [60, 'trophy-line', '奖杯'],
  [61, 'search-magnifier-line', '搜索'],
  [63, 'chat-bubbles-line', '双消息气泡'],
  [67, 'cube-box-line', '立方体'],
  [68, 'chain-link-line', '链接'],
  [70, 'analytics-window-line', '分析窗口'],
  [71, 'branch-node-line', '分支节点'],
  [73, 'chain-link-alt-line', '链路'],
  [77, 'database-lock-line', '数据库锁'],
  [83, 'settings-gear-line', '设置齿轮'],
  [84, 'refresh-sync-line', '同步刷新'],
  [85, 'storefront-line', '门店'],
  [86, 'add-focus-line', '添加选区'],
  [88, 'translation-chat-line', '翻译对话'],
  [89, 'alert-siren-line', '告警铃'],
  [90, 'up-arrow-circle-line', '上升箭头'],
  [91, 'grid-layout-line', '宫格布局'],
  [92, 'connector-line', '连接线'],
  [94, 'cloud-check-line', '云端确认'],
  [99, 'bookmark-line', '书签'],
  [101, 'hourglass-line', '沙漏'],
  [109, 'business-user-line', '商务用户'],
  [114, 'document-search-line', '文档搜索'],
  [123, 'clock-line', '时钟'],
  [124, 'feishu-anycross-app-icon', '飞书 AnyCross 图标'],
  [125, 'spreadsheet-app-icon', '表格应用图标'],
  [126, 'line-chart-line', '折线图'],
  [128, 'key-line', '钥匙'],
  [129, 'shield-check-line', '盾牌确认'],
  [131, 'dashboard-gauge-line', '仪表盘'],
  [133, 'exclamation-orange-solid', '橙色感叹号'],
  [139, 'globe-line', '地球'],
  [140, 'graduation-cap-line', '学士帽'],
  [145, 'language-translation-line', '语言翻译'],
  [146, 'bar-chart-alt-line', '柱状统计'],
  [147, 'globe-grid-line', '全球网络'],
  [151, 'headset-line', '客服耳机'],
  [155, 'growth-arrow-line', '上升趋势'],
  [157, 'warning-octagon-line', '八边形警告'],
  [160, 'analytics-card-line', '数据看板'],
  [161, 'broadcast-antenna-line', '广播天线'],
  [163, 'user-outline-line', '用户'],
  [164, 'product-app-color-icon', '彩色产品图标'],
  [166, 'flag-line', '旗帜'],
  [169, 'cube-branch-line', '分支立方体'],
  [170, 'sad-face-line', '难过表情'],
  [172, 'network-cluster-line', '网络集群'],
  [175, 'lock-line', '锁'],
  [179, 'certificate-line', '证书'],
  [181, 'yuan-currency-line', '人民币'],
  [183, 'smile-face-line', '笑脸'],
  [187, 'list-add-line', '列表添加'],
  [188, 'earbud-line', '耳机'],
  [191, 'network-circle-line', '环形网络'],
  [193, 'selection-nodes-line', '节点选区'],
  [194, 'home-line', '主页'],
  [195, 'toggle-target-line', '开关目标'],
  [196, 'check-green-solid', '绿色确认'],
  [197, 'favorite-scan-line', '收藏识别'],
  [200, 'lightning-line', '闪电'],
  [201, 'bookmark-plus-line', '书签添加'],
  [203, 'play-card-line', '播放卡片'],
  [204, 'code-window-line', '代码窗口'],
  [205, 'target-crosshair-line', '准星目标'],
  [211, 'browser-window-line', '浏览器窗口'],
  [212, 'pie-chart-line', '饼图'],
  [219, 'move-arrows-line', '移动箭头'],
  [221, 'hierarchy-line', '层级结构'],
  [222, 'palette-line', '调色盘'],
  [223, 'record-target-line', '录制目标'],
  [224, 'shopping-bag-line', '购物袋'],
  [225, 'medal-number-one-line', '第一名奖牌'],
  [226, 'grid-list-line', '宫格列表'],
  [230, 'chat-bubbles-alt-line', '消息气泡'],
  [232, 'thumbs-up-line', '点赞'],
  [233, 'shapes-line', '形状组合'],
  [235, 'api-debug-line', '接口调试'],
  [236, 'bell-line', '通知铃'],
  [237, 'user-outline-alt-line', '用户轮廓'],
  [240, 'cycle-nodes-line', '循环节点'],
  [242, 'shield-user-line', '用户盾牌'],
  [243, 'checklist-line', '检查清单'],
  [244, 'group-line', '多人协作'],
  [245, 'stack-layers-line', '堆叠图层'],
  [246, 'dot-grid-line', '点阵'],
  [247, 'user-profile-alt-line', '用户头像'],
  [248, 'warning-triangle-line', '三角警告'],
  [260, 'monitor-analytics-line', '监控看板'],
  [261, 'ai-refresh-line', 'AI 刷新'],
  [269, 'ellipsis-circle-line', '更多'],
  [270, 'book-line', '书本'],
  [271, 'ai-window-line', 'AI 窗口'],
  [274, 'menu-collapse-line', '菜单收起'],
  [276, 'heart-line', '爱心'],
  [277, 'shield-plus-line', '盾牌添加'],
  [278, 'robot-line', '机器人'],
  [280, 'x-red-solid', '红色叉号'],
  [281, 'database-coins-line', '数据资产'],
  [282, 'code-brackets-line', '代码括号'],
  [283, 'gauge-line', '仪表盘'],
  [290, 'four-dot-grid-line', '四点宫格'],
  [292, 'handshake-line', '握手'],
  [294, 'search-line', '搜索'],
  [295, 'diamond-check-line', '菱形确认'],
  [297, 'unlock-line', '解锁'],
];

const logoLabels = [
  [16, 'feishu-knowledge-ai-m3-logo', '飞书知识问答 M3'],
  [17, 'feishu-logo-en', 'Feishu'],
  [27, 'feishu-ai-logo-cn', '飞书 AI'],
  [36, 'feishu-logo-cn-dark', '飞书深色字标'],
  [38, 'feishu-knowledge-ai-m3-logo-alt', '飞书知识问答 M3'],
  [43, 'feishu-spark-preview-logo', 'Feishu Spark Preview'],
  [51, 'feishu-people-logo-en', 'Feishu People'],
  [54, 'feishu-logo-cn', '飞书'],
  [57, 'feishu-integration-platform-logo', '飞书集成平台'],
  [58, 'feishu-hire-logo-en', 'Feishu Hire'],
  [62, 'feishu-minutes-logo-cn-dark', '飞书妙记深色字标'],
  [64, 'feishu-minutes-preview-logo-cn', '飞书妙搭预览'],
  [66, 'feishu-apaas-logo-cn', '飞书 aPaaS'],
  [75, 'feishu-base-logo-en', 'Feishu Base'],
  [78, 'feishu-aily-m3-logo-cn', '飞书 aily M3'],
  [82, 'kaojiang-logo', '烤匠麻辣烤鱼'],
  [87, 'feishu-ai-meeting-minutes-m4-logo-cn', '飞书智能会议纪要 M4'],
  [93, 'haidilao-logo', '海底捞'],
  [98, 'feishu-apaas-logo-en', 'Feishu aPaaS'],
  [100, 'feishu-ai-logo-en', 'Feishu AI'],
  [102, 'feishu-office-logo-en', 'Feishu Office'],
  [104, 'feishu-logo-cn-blue', '飞书'],
  [105, 'feishu-ai-meetings-logo-en', 'Feishu AI Meetings'],
  [106, 'feishu-corehr-logo-en', 'Feishu CoreHR'],
  [108, 'feishu-dev-suite-logo-cn', '飞书开发套件'],
  [111, 'feishu-aily-m3-logo-en', 'Feishu aily M3'],
  [121, 'feishu-ai-meeting-logo-cn', '飞书 AI 会议'],
  [132, 'feishu-apaas-logo-cn-small', '飞书 aPaaS'],
  [135, 'feishu-base-logo-cn', '飞书多维表格'],
  [137, 'yueman-dajiang-logo', '月满大江千层肚火锅'],
  [150, 'feishu-anycross-logo-en', 'Feishu AnyCross'],
  [152, 'sangu-maocai-logo', '三顾冒菜'],
  [153, 'feishu-performance-logo-en', 'Feishu Performance'],
  [159, 'landspace-logo-cn', '蓝箭航天'],
  [162, 'feishu-people-logo-cn', '飞书人事'],
  [165, 'feishu-people-logo-en-alt', 'Feishu People'],
  [167, 'feishu-base-logo-cn-alt', '飞书多维表格'],
  [174, 'yitang-logo', '益禾堂'],
  [189, 'pengfei-group-logo', '鹏飞集团'],
  [207, 'feishu-logo-white', '飞书白色字标'],
  [228, 'feishu-logo-cn-color', '飞书'],
  [238, 'feishu-logo-cn-small', '飞书'],
  [239, 'feishu-project-logo-cn', '飞书项目'],
  [249, 'feishu-hire-logo-cn', '飞书招聘'],
  [252, 'feishu-logo-cn-large', '飞书'],
  [253, 'feishu-logo-cn-black', '飞书黑色字标'],
  [258, 'feishu-aily-m3-logo-en-alt', 'Feishu aily M3'],
  [265, 'feishu-meeting-room-logo-cn', '飞书会议室'],
  [273, 'feishu-project-logo-en', 'Feishu Project'],
  [275, 'feishu-knowledge-ai-m5-logo-en', 'Feishu Knowledge AI M5'],
  [284, 'feishu-performance-logo-cn', '飞书绩效'],
  [289, 'feishu-office-logo-en-alt', 'Feishu Office'],
];

const largeIconLabels = [
  [1, 'feishu-hire-app-icon', '飞书招聘应用图标'],
  [3, 'document-cloud-app-icon', '云文档应用图标'],
  [7, 'feishu-anycross-app-icon-large', '飞书 AnyCross 应用图标'],
  [9, 'shield-check-app-icon', '盾牌确认应用图标'],
  [13, 'stack-layers-app-icon', '图层应用图标'],
  [32, 'document-note-app-icon', '文档应用图标'],
  [41, 'check-green-solid-large', '绿色确认大图标'],
  [42, 'checkmark-purple-blue-solid', '蓝紫确认图标'],
  [50, 'orange-wave-app-icon', '橙色波形应用图标'],
  [76, 'mail-envelope-app-icon', '邮件应用图标'],
  [79, 'video-camera-app-icon', '视频应用图标'],
  [80, 'stack-cards-app-icon', '卡片应用图标'],
  [103, 'spreadsheet-app-icon-large', '表格应用图标'],
  [112, 'chat-bubbles-color-icon', '彩色消息气泡'],
  [117, 'feishu-meeting-room-app-icon', '飞书会议室应用图标'],
  [118, 'feishu-anycross-app-icon-square', '飞书 AnyCross 方形图标'],
  [119, 'x-red-solid-large', '红色叉号大图标'],
  [130, 'feishu-people-app-icon', '飞书人事应用图标'],
  [158, 'blue-card-app-icon', '蓝色卡片应用图标'],
  [168, 'feishu-performance-app-icon', '飞书绩效应用图标'],
  [171, 'sliders-color-icon', '彩色滑杆图标'],
  [180, 'chat-bubbles-color-icon-alt', '彩色消息气泡'],
  [184, 'feishu-base-app-icon', '飞书多维表格应用图标'],
  [192, 'calendar-26-app-icon', '日历 26 应用图标'],
  [198, 'document-cloud-app-icon-alt', '云文档应用图标'],
  [202, 'multi-layer-app-icon', '多层应用图标'],
  [209, 'workflow-app-icon', '流程应用图标'],
  [213, 'people-app-icon', '人事应用图标'],
  [227, 'shopping-bag-color-icon', '购物袋图标'],
  [234, 'calendar-26-app-icon-alt', '日历 26 应用图标'],
  [254, 'target-ring-app-icon', '靶心应用图标'],
  [256, 'mail-envelope-color-icon', '邮件图标'],
  [263, 'checkmark-app-icon', '确认应用图标'],
  [266, 'feishu-minutes-app-icon', '飞书妙记应用图标'],
];

const explicitExcludes = [
  [30, 'metric-text', '指标文字，不作为可复用 logo'],
  [143, 'metric-text', '指标文字，不作为可复用 icon'],
  [178, 'blank-or-invisible', '几乎为空的透明资源'],
  [182, 'metric-text', '指标文字，不作为可复用 icon'],
  [199, 'metric-text', '指标文字，不作为可复用 icon'],
  [206, 'metric-text', '指标文字，不作为可复用 logo'],
  [220, 'placeholder-logo', 'Partner logo 占位图，不是正式素材'],
  [264, 'metric-text', '指标文字，不作为可复用 logo'],
  [285, 'metric-text', '指标文字，不作为可复用 icon'],
  [293, 'decorative-line', '装饰曲线，不属于本轮 icon/logo 池'],
];

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function writeLineFile(file, lines) {
  const cleanLines = Array.from(lines);
  while (cleanLines.length && cleanLines[cleanLines.length - 1] === '') cleanLines.pop();
  fs.writeFileSync(file, `${cleanLines.join('\n')}\n`);
}

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str;
}

function buildIndexMap(inventory) {
  const map = new Map();
  for (const item of inventory) map.set(item.idx, item);
  return map;
}

function normalizeTags(slug, extra = []) {
  return Array.from(new Set([...slug.split('-'), ...extra])).filter(Boolean);
}

function addLabels(target, entries, type, extraTags = []) {
  for (const [idx, semanticName, displayName] of entries) {
    target.set(idx, {
      decision: 'include',
      type,
      semanticName,
      displayName,
      tags: normalizeTags(semanticName, extraTags),
    });
  }
}

function addExcludes(target, entries) {
  for (const [idx, exclusionCategory, reason] of entries) {
    target.set(idx, {
      decision: 'exclude',
      type: 'excluded',
      semanticName: exclusionCategory,
      displayName: exclusionCategory,
      exclusionCategory,
      exclusionReason: reason,
      tags: [exclusionCategory],
    });
  }
}

function defaultExclusion(item) {
  if (item.bucket === 'other-candidate') {
    return {
      exclusionCategory: 'other-image',
      exclusionReason: '当前不纳入：更像截图、背景、照片、营销文案或装饰元素，不属于本轮 icon/logo 池。',
    };
  }
  if (item.bucket === 'large-icon-or-logo-candidate') {
    return {
      exclusionCategory: 'large-non-reusable',
      exclusionReason: '当前不纳入：更像人物头像、食物/实物照片或非通用大图。',
    };
  }
  if (item.bucket === 'logo-candidate') {
    return {
      exclusionCategory: 'unapproved-logo',
      exclusionReason: '当前不纳入：疑似指标文字、占位 logo、装饰线或低复用素材。',
    };
  }
  return {
    exclusionCategory: 'unlabeled-icon',
    exclusionReason: '当前不纳入：未完成稳定语义识别，等待下一轮人工复核。',
  };
}

function buildTosKey(item, label) {
  const folder = label.type === 'logo' ? 'logos' : 'icons';
  const ext = item.ext || path.extname(item.file).slice(1).toLowerCase() || 'png';
  return `${TOS_PREFIX}/${folder}/${label.semanticName}-${item.sha16.slice(0, 8)}.${ext}`;
}

function buildManifest(inventory, uploadState) {
  const labels = new Map();
  addLabels(labels, iconLabels, 'icon', ['line']);
  addLabels(labels, logoLabels, 'logo', ['logo']);
  addLabels(labels, largeIconLabels, 'icon', ['app-icon']);
  addExcludes(labels, explicitExcludes);

  const missingIndexes = [];
  const indexMap = buildIndexMap(inventory);
  for (const idx of labels.keys()) {
    if (!indexMap.has(idx)) missingIndexes.push(idx);
  }
  if (missingIndexes.length) {
    throw new Error(`Label indexes not found in inventory: ${missingIndexes.join(', ')}`);
  }

  return inventory.map((item) => {
    const label = labels.get(item.idx);
    if (label?.decision === 'include') {
      const tosKey = buildTosKey(item, label);
      const upload = uploadState.items?.[item.file];
      return {
        ...item,
        decision: 'include',
        type: label.type,
        semanticName: label.semanticName,
        displayName: label.displayName,
        tags: label.tags,
        usageNotes: label.type === 'logo'
          ? '用于 GTM 材料中的产品、客户或伙伴标识引用；不要拉伸变形，优先保留透明背景。'
          : '用于 GTM 材料中的功能点、流程、能力或状态表达；优先搭配短标题使用。',
        tosKey,
        url: upload?.tosKey === tosKey ? upload.url : '',
        uploadedAt: upload?.tosKey === tosKey ? upload.uploadedAt : '',
      };
    }

    const exclusion = label?.decision === 'exclude' ? label : defaultExclusion(item);
    return {
      ...item,
      decision: 'exclude',
      type: 'excluded',
      semanticName: exclusion.semanticName || exclusion.exclusionCategory,
      displayName: exclusion.displayName || exclusion.exclusionCategory,
      tags: exclusion.tags || [exclusion.exclusionCategory],
      usageNotes: '',
      tosKey: '',
      url: '',
      uploadedAt: '',
      exclusionCategory: exclusion.exclusionCategory,
      exclusionReason: exclusion.exclusionReason,
    };
  });
}

function summarize(manifest) {
  const by = (key) => manifest.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  const selected = manifest.filter((item) => item.decision === 'include');
  return {
    total: manifest.length,
    selected: selected.length,
    excluded: manifest.length - selected.length,
    selectedUploaded: selected.filter((item) => item.url).length,
    byType: by('type'),
    byBucket: by('bucket'),
    byDecision: by('decision'),
    generatedAt: new Date().toISOString(),
  };
}

function writeCsv(manifest) {
  const fields = [
    'idx', 'decision', 'type', 'displayName', 'semanticName', 'file', 'url', 'tosKey',
    'width', 'height', 'bytes', 'sha16', 'bucket', 'tags', 'usageNotes',
    'exclusionCategory', 'exclusionReason',
  ];
  const rows = [fields.join(',')];
  for (const item of manifest) {
    rows.push(fields.map((field) => {
      const value = Array.isArray(item[field]) ? item[field].join('|') : item[field];
      return csvEscape(value);
    }).join(','));
  }
  fs.writeFileSync(path.join(OUT_DIR, 'assets-index.csv'), `${rows.join('\n')}\n`);
}

function writeUsage(manifest, summary, artifactState) {
  const lines = [];
  const artifactLinks = artifactState.items || {};
  lines.push('# PPTX Media Linker 使用说明');
  lines.push('');
  lines.push(`生成时间：${summary.generatedAt}`);
  lines.push('');
  lines.push('## 这个东西有什么用');
  lines.push('');
  lines.push('PPTX 导出的 `pptx-media` 图片文件名通常是无意义哈希，团队复用时不知道每张图是什么，也不知道该复制哪个链接。这个索引把图片按内容识别成可复用资产，统一上传到妙笔 TOS，并补上可读名称、资源类型、使用建议和排除原因。');
  lines.push('');
  lines.push('当前只把高复用的 `icon` 和 `logo` 纳入公共池：');
  lines.push('');
  lines.push('- `icon`：功能、流程、状态、能力点图标，适合放在方案页、能力矩阵、流程图里。');
  lines.push('- `logo`：飞书产品 logo、客户/伙伴 logo，适合放在案例页、生态页、客户页里。');
  lines.push('- 其他截图、背景、菜品/实物照片、营销大字、指标文字、装饰线，先保留在排除清单，不进入公共素材池。');
  lines.push('');
  lines.push('## 交付物');
  lines.push('');
  lines.push('| 文件 | 用途 |');
  lines.push('| --- | --- |');
  lines.push('| `assets-index.json` | 完整机器可读索引，适合给脚本或后续工具使用。 |');
  lines.push('| `assets-index.csv` | 表格版索引，适合运营同学筛选、补充说明。 |');
  lines.push('| `llms.txt` | LLM 轻量入口，只放加载策略、规则、统计和高频示例。 |');
  lines.push('| `icons.json` | icon 分片索引，Agent 需要找图标时只加载这个。 |');
  lines.push('| `logos.json` | logo 分片索引，Agent 需要找品牌/产品标识时只加载这个。 |');
  lines.push('| `excluded.json` | 暂不纳入资产的分片索引，用于复核边界。 |');
  lines.push('| `index.html` | 本地可打开的检索页，支持按类型/状态搜索、复制链接。 |');
  lines.push('| `USAGE.md` | 当前这份使用说明。 |');
  lines.push('| `not-needed-now.md` | 当前明确不做的能力和不纳入资产范围。 |');
  lines.push('');
  if (Object.keys(artifactLinks).length) {
    lines.push('## 已上传的索引文件');
    lines.push('');
    if (LLMS_PREVIEW_URL) {
      lines.push(`- llms.txt 妙笔预览页：${LLMS_PREVIEW_URL}`);
    }
    for (const item of Object.values(artifactLinks)) {
      lines.push(`- ${item.name}：${item.url}`);
    }
    lines.push('');
  }
  lines.push('## 当前统计');
  lines.push('');
  lines.push(`- 原始图片：${summary.total} 个`);
  lines.push(`- 纳入公共池：${summary.selected} 个，其中 icon ${summary.byType.icon || 0} 个、logo ${summary.byType.logo || 0} 个`);
  lines.push(`- 已有 TOS 链接：${summary.selectedUploaded} 个`);
  lines.push(`- 暂不纳入：${summary.excluded} 个`);
  lines.push(`- TOS 前缀：\`${TOS_PREFIX}/icons/\` 与 \`${TOS_PREFIX}/logos/\``);
  lines.push('');
  lines.push('## 使用方式');
  lines.push('');
  lines.push('### 人工使用');
  lines.push('');
  lines.push('1. 打开 `index.html`。');
  lines.push('2. 用搜索框输入中文名、英文 slug、原文件名或标签，例如 `飞书 AI`、`lock`、`logo`。');
  lines.push('3. 只看可用公共素材时，筛选 `Included`；需要看被排除内容时，切换到 `Excluded`。');
  lines.push('4. 复制 `URL` 放到文档、PPT、网页或后续脚本里；复制 `Markdown` 可直接嵌入 Markdown；复制 `HTML` 可直接嵌入网页。');
  lines.push('');
  lines.push('### LLM / Agent 使用');
  lines.push('');
  lines.push('1. 先读取 `llms.txt`，不要默认读取 CSV 或完整 JSON。');
  lines.push('2. 需要图标时只读取 `icons.json`；需要 logo 时只读取 `logos.json`。');
  lines.push('3. 只有做全量审计、去重、重新分类时，才读取 `assets-index.json`。');
  lines.push('4. CSV 只作为表格编辑/人工筛选用，不作为 LLM 默认上下文。');
  lines.push('');
  lines.push('## 命名规则');
  lines.push('');
  lines.push('- TOS key 使用 `gtm/pptx-media/v1/{icons|logos}/{semantic-name}-{sha8}.{ext}`。');
  lines.push('- `semantic-name` 来自图片内容识别，尽量表达用途，例如 `lock-security-line`、`feishu-ai-logo-cn`。');
  lines.push('- 末尾保留 `sha8`，避免同名素材覆盖，也方便回查原始文件。');
  lines.push('- 原始哈希文件名不再面向用户展示，只作为溯源字段保留。');
  lines.push('');
  lines.push('## 使用规范');
  lines.push('');
  lines.push('- logo 不要拉伸、裁切或改色；需要深色/浅色版本时优先选已有变体。');
  lines.push('- icon 用于表达概念，不要把指标文字、营销口号当 icon 复用。');
  lines.push('- 公开链接默认可公开访问，不要上传含敏感信息、客户未授权材料或个人头像。');
  lines.push('- 如果某张图片在排除清单里但确实要复用，先补充用途和名称，再进入下一轮上传。');
  lines.push('');
  lines.push('## 后续维护');
  lines.push('');
  lines.push('新增 PPTX 媒体后，先重新生成 `media-inventory.json` 和预览图，再运行：');
  lines.push('');
  lines.push('```bash');
  lines.push('node scripts/build_pptx_media_linker.mjs --upload --upload-artifacts');
  lines.push('```');
  lines.push('');
  lines.push('如果只是更新索引页面，不重新上传素材：');
  lines.push('');
  lines.push('```bash');
  lines.push('node scripts/build_pptx_media_linker.mjs');
  lines.push('```');
  lines.push('');
  writeLineFile(path.join(OUT_DIR, 'USAGE.md'), lines);
}

function writeNotNeeded(summary) {
  const content = `# 当前不需要的能力与资产范围

## 暂不做的能力

- 不做完整 DAM/素材中台：现在只解决 PPTX 导出媒体文件名无意义、复用困难的问题。
- 不做权限/审批流：本轮素材默认可公开访问；含敏感信息的素材不应进入该池。
- 不做 PPTX 解析 UI：当前输入就是已经导出的 \`dist/assets/pptx-media\` 图片目录。
- 不做复杂截图理解：截图、产品界面整屏图、背景图、宣传大字不进入公共资产池。
- 不做 logo 版权治理：这里只做资产归集和可用链接，不替代品牌授权判断。
- 不做版本工作流：通过 TOS key 的 \`v1\` 前缀隔离版本，后续有治理需求再扩展。
- 不做非图片文件：本轮只处理 png/jpg/jpeg/webp/gif 这类图片。

## 暂不纳入的资产

- 营销口号或整页文案图，例如“先进团队 先用飞书”。
- 指标文字，例如“1 亿美元”“10 万行”“100 万行”。
- 截图、后台界面、移动端界面截屏。
- 背景光效、渐变块、装饰线条。
- 人物头像、菜品/产品照片、门店/工厂照片。
- 占位图，例如 \`Partner logo\`。

当前统计：原始 ${summary.total} 个，纳入 ${summary.selected} 个，暂不纳入 ${summary.excluded} 个。
`;
  fs.writeFileSync(path.join(OUT_DIR, 'not-needed-now.md'), content);
}

function publicAsset(item) {
  const base = {
    id: item.semanticName,
    name: item.displayName,
    type: item.type,
    url: item.url,
    tags: item.tags || [],
    usage: item.usageNotes || '',
    sourceFile: item.file,
    tosKey: item.tosKey,
    size: {
      width: item.width,
      height: item.height,
      bytes: item.bytes,
    },
  };
  if (item.decision === 'exclude') {
    base.reason = item.exclusionReason || '';
    base.category = item.exclusionCategory || '';
  }
  return base;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markdownishToHtml(markdown) {
  const lines = String(markdown || '').split(/\r?\n/);
  const html = [];
  let inCode = false;
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  const linkify = (text) => escapeHtml(text).replace(/(https:\/\/[^\s<]+)/g, (url) => {
    const cleanUrl = url.replace(/[),.;]+$/, '');
    const suffix = url.slice(cleanUrl.length);
    if (/\.(?:png|jpe?g|webp|gif)(?:\?.*)?$/i.test(cleanUrl)) {
      return `<span class="asset-link"><a class="asset-thumb-link" href="${cleanUrl}" target="_blank" rel="noopener"><img class="asset-thumb" src="${cleanUrl}" alt="" loading="lazy"></a><a href="${cleanUrl}" target="_blank" rel="noopener">${cleanUrl}</a></span>${suffix}`;
    }
    return `<a href="${cleanUrl}" target="_blank" rel="noopener">${cleanUrl}</a>${suffix}`;
  });

  for (const line of lines) {
    if (line.startsWith('```')) {
      closeList();
      html.push(inCode ? '</code></pre>' : '<pre><code>');
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      html.push(escapeHtml(line));
      continue;
    }
    if (line.startsWith('# ')) {
      closeList();
      html.push(`<h1>${linkify(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2>${linkify(line.slice(3))}</h2>`);
    } else if (line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${linkify(line.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${linkify(line.replace(/^\d+\.\s/, ''))}</li>`);
    } else if (!line.trim()) {
      closeList();
    } else {
      closeList();
      html.push(`<p>${linkify(line)}</p>`);
    }
  }
  closeList();
  if (inCode) html.push('</code></pre>');
  return html.join('\n');
}

function renderAssetGrid(title, assets, startIndex = 1) {
  const cards = assets.map((asset, index) => {
    const number = String(startIndex + index).padStart(3, '0');
    const tags = Array.from(asset.tags || []).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
    return [
      '      <article class="asset-card">',
      `        <a class="asset-preview" href="${escapeHtml(asset.url)}" target="_blank" rel="noopener" aria-label="预览 ${escapeHtml(asset.name)}">`,
      `          <img src="${escapeHtml(asset.url)}" alt="${escapeHtml(asset.name)}" loading="lazy">`,
      '        </a>',
      '        <div class="asset-meta">',
      '          <div class="asset-row">',
      `            <span class="asset-no">#${number}</span>`,
      `            <span class="asset-type">${escapeHtml(asset.type)}</span>`,
      '          </div>',
      `          <h3>${escapeHtml(asset.name)}</h3>`,
      `          <p>${escapeHtml(asset.id)}</p>`,
      `          <p class="asset-file">${escapeHtml(asset.sourceFile)}</p>`,
      `          <div class="asset-tags">${tags}</div>`,
      `          <a class="asset-url" href="${escapeHtml(asset.url)}" target="_blank" rel="noopener">${escapeHtml(asset.url)}</a>`,
      '        </div>',
      '      </article>',
    ].join('\n');
  }).join('\n');

  return [
    `    <section class="asset-section" id="${escapeHtml(title.toLowerCase())}">`,
    '      <div class="section-head">',
    '        <div>',
    `          <p class="eyebrow">All ${escapeHtml(title)}</p>`,
    `          <h2>${escapeHtml(title)} · ${assets.length}</h2>`,
    '        </div>',
    '      </div>',
    '      <div class="asset-grid">',
    cards,
    '      </div>',
    '    </section>',
  ].join('\n');
}

function writeLlmsPreview(llmsText, summary, groups = {}) {
  const icons = Array.from(groups.icons || []);
  const logos = Array.from(groups.logos || []);
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GTM PPTX Media Assets · llms.txt</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --surface: #fff;
      --text: #172033;
      --muted: #667085;
      --line: #d8dee8;
      --accent: #1764e8;
      --code: #101828;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      line-height: 1.6;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 3;
      background: rgba(255,255,255,0.92);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(18px);
    }
    .wrap { max-width: 1280px; margin: 0 auto; padding: 22px 24px; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
    .eyebrow { margin: 0 0 6px; color: var(--muted); font-size: 13px; font-weight: 650; }
    h1 { margin: 0; font-size: 30px; line-height: 1.18; letter-spacing: 0; }
    h2 { margin: 36px 0 12px; padding-top: 4px; font-size: 20px; line-height: 1.25; }
    p { margin: 10px 0; }
    a { color: var(--accent); text-decoration: none; overflow-wrap: anywhere; }
    a:hover { text-decoration: underline; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .button {
      display: inline-flex;
      align-items: center;
      height: 34px;
      padding: 0 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      font-size: 13px;
      font-weight: 650;
      cursor: pointer;
    }
    .button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    .gallery-intro {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin: 16px 0 18px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
      padding: 16px 18px;
    }
    .gallery-intro h2 {
      margin: 0 0 4px;
      padding: 0;
      font-size: 17px;
    }
    .gallery-intro p {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }
    main { max-width: 1280px; margin: 0 auto; padding: 24px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(5, minmax(120px, 1fr));
      gap: 10px;
      margin: 18px 0 8px;
    }
    .stat {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      padding: 12px;
    }
    .stat strong { display: block; font-size: 24px; line-height: 1.05; }
    .stat span { color: var(--muted); font-size: 12px; }
    article {
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
      padding: 12px 28px 28px;
    }
    ul { margin: 8px 0 14px; padding-left: 22px; }
    li { margin: 6px 0; }
    .asset-link {
      display: inline-grid;
      grid-template-columns: 54px minmax(0, 1fr);
      align-items: center;
      gap: 10px;
      max-width: 100%;
      vertical-align: middle;
    }
    .asset-thumb-link {
      display: inline-flex;
      width: 54px;
      height: 54px;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line);
      border-radius: 8px;
      background:
        linear-gradient(45deg, #eef1f5 25%, transparent 25%),
        linear-gradient(-45deg, #eef1f5 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #eef1f5 75%),
        linear-gradient(-45deg, transparent 75%, #eef1f5 75%),
        #fff;
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0;
      overflow: hidden;
    }
    .asset-thumb {
      max-width: 46px;
      max-height: 46px;
      object-fit: contain;
      display: block;
    }
    .asset-thumb-link:hover {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(23,100,232,0.10);
    }
    .asset-section {
      margin-top: 24px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--surface);
      padding: 24px;
    }
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }
    .section-head h2 {
      margin: 0;
      padding: 0;
    }
    .asset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(252px, 1fr));
      gap: 12px;
    }
    .asset-card {
      display: grid;
      grid-template-columns: 84px minmax(0, 1fr);
      gap: 12px;
      min-height: 148px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      padding: 12px;
    }
    .asset-preview {
      display: flex;
      width: 84px;
      height: 84px;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--line);
      border-radius: 8px;
      background:
        linear-gradient(45deg, #eef1f5 25%, transparent 25%),
        linear-gradient(-45deg, #eef1f5 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #eef1f5 75%),
        linear-gradient(-45deg, transparent 75%, #eef1f5 75%),
        #fff;
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0;
      overflow: hidden;
    }
    .asset-preview img {
      max-width: 72px;
      max-height: 72px;
      object-fit: contain;
      display: block;
    }
    .asset-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }
    .asset-no {
      font-variant-numeric: tabular-nums;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }
    .asset-type {
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 1px 5px;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.4;
    }
    .asset-meta h3 {
      margin: 0;
      font-size: 14px;
      line-height: 1.3;
    }
    .asset-meta p {
      margin: 2px 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .asset-file {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    .asset-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 6px 0;
    }
    .asset-tags span {
      border-radius: 4px;
      background: #f0f3f7;
      color: var(--muted);
      padding: 1px 5px;
      font-size: 11px;
    }
    .asset-url {
      display: block;
      max-width: 100%;
      font-size: 11px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    pre {
      overflow: auto;
      padding: 14px;
      border-radius: 8px;
      background: var(--code);
      color: #e6edf7;
      font-size: 12px;
      line-height: 1.5;
    }
    @media (max-width: 760px) {
      .top { display: block; }
      .actions { justify-content: flex-start; margin-top: 14px; }
      .gallery-intro { display: block; }
      .gallery-intro .actions { margin-top: 12px; }
      .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      article { padding: 8px 18px 22px; }
      .asset-grid { grid-template-columns: 1fr; }
      .asset-section { padding: 16px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap top">
      <div>
        <p class="eyebrow">LLM entrypoint for public TOS assets</p>
        <h1>GTM PPTX Media Assets</h1>
      </div>
      <div class="actions">
        <a class="button" href="#icons">Icons</a>
        <a class="button" href="#logos">Logos</a>
        <a class="button primary" href="https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/llms.txt" target="_blank" rel="noopener">Raw llms.txt</a>
        <a class="button" href="https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/index.html" target="_blank" rel="noopener">Search Page</a>
        <button class="button" id="copy">Copy llms.txt URL</button>
      </div>
    </div>
  </header>
  <main>
    <section class="summary" aria-label="统计">
      <div class="stat"><strong>${summary.total}</strong><span>Original images</span></div>
      <div class="stat"><strong>${summary.selected}</strong><span>Included assets</span></div>
      <div class="stat"><strong>${summary.byType.icon || 0}</strong><span>Icons</span></div>
      <div class="stat"><strong>${summary.byType.logo || 0}</strong><span>Logos</span></div>
      <div class="stat"><strong>${summary.excluded}</strong><span>Excluded</span></div>
    </section>
    <section class="gallery-intro" aria-label="图库入口">
      <div>
        <h2>Full Preview Gallery</h2>
        <p>所有已纳入的 icon 和 logo 都在下面按编号排列；每张卡片都可以直接预览并打开 TOS 链接。</p>
      </div>
      <div class="actions">
        <a class="button" href="#icons">Jump to Icons</a>
        <a class="button" href="#logos">Jump to Logos</a>
      </div>
    </section>
    <article>
      ${markdownishToHtml(llmsText)}
    </article>
    ${renderAssetGrid('Icons', icons, 1)}
    ${renderAssetGrid('Logos', logos, icons.length + 1)}
  </main>
  <script>
    document.getElementById("copy").addEventListener("click", async () => {
      await navigator.clipboard.writeText("https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/llms.txt");
      document.getElementById("copy").textContent = "Copied";
      setTimeout(() => { document.getElementById("copy").textContent = "Copy llms.txt URL"; }, 1200);
    });
  </script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT_DIR, 'llms-preview.html'), html);
}

function writeTieredIndexes(manifest, summary, artifactState) {
  const artifactLinks = artifactState.items || {};
  const included = manifest.filter((item) => item.decision === 'include');
  const icons = included.filter((item) => item.type === 'icon').map(publicAsset);
  const logos = included.filter((item) => item.type === 'logo').map(publicAsset);
  const excluded = manifest.filter((item) => item.decision === 'exclude').map(publicAsset);
  const topIcons = icons
    .filter((item) => item.tags.some((tag) => ['lock', 'security', 'data', 'database', 'search', 'user', 'ai', 'workflow', 'chat', 'chart'].includes(tag)))
    .slice(0, 24);
  const topLogos = logos
    .filter((item) => item.tags.includes('feishu') || item.id.includes('feishu'))
    .slice(0, 24);

  const splitSummary = {
    ...summary,
    files: {
      llms: `${TOS_PREFIX}/llms.txt`,
      icons: `${TOS_PREFIX}/icons.json`,
      logos: `${TOS_PREFIX}/logos.json`,
      excluded: `${TOS_PREFIX}/excluded.json`,
      csv: `${TOS_PREFIX}/assets-index.csv`,
      fullJson: `${TOS_PREFIX}/assets-index.json`,
      html: `${TOS_PREFIX}/index.html`,
    },
  };

  writeJson(path.join(OUT_DIR, 'icons.json'), {
    summary: { total: icons.length, generatedAt: summary.generatedAt },
    items: icons,
  });
  writeJson(path.join(OUT_DIR, 'logos.json'), {
    summary: { total: logos.length, generatedAt: summary.generatedAt },
    items: logos,
  });
  writeJson(path.join(OUT_DIR, 'excluded.json'), {
    summary: { total: excluded.length, generatedAt: summary.generatedAt },
    items: excluded,
  });

  const lines = [];
  lines.push('# GTM PPTX Media Assets');
  lines.push('');
  lines.push('Purpose: public TOS asset index for Feishu GTM PPTX media. Use this file as the lightweight entrypoint. Do not load the CSV or full JSON unless needed.');
  lines.push('');
  if (LLMS_PREVIEW_URL) {
    lines.push(`Preview page: ${LLMS_PREVIEW_URL}`);
    lines.push('');
  }
  lines.push('## Load Strategy');
  lines.push('');
  lines.push('1. Read this llms.txt first for scope, rules, and routing.');
  lines.push('2. If you need icons only, fetch icons.json.');
  lines.push('3. If you need logos only, fetch logos.json.');
  lines.push('4. If you need excluded/not-now assets, fetch excluded.json or not-needed-now.md.');
  lines.push('5. Use assets-index.csv only for spreadsheet review. Use assets-index.json only for full automation.');
  lines.push('');
  lines.push('## Public URLs');
  lines.push('');
  const links = [
    ['Search page', artifactLinks['index.html']?.url || `https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/index.html`],
    ['Icons JSON', artifactLinks['icons.json']?.url || `https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/icons.json`],
    ['Logos JSON', artifactLinks['logos.json']?.url || `https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/logos.json`],
    ['Excluded JSON', artifactLinks['excluded.json']?.url || `https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/excluded.json`],
    ['CSV table', artifactLinks['assets-index.csv']?.url || `https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/assets-index.csv`],
    ['Full JSON', artifactLinks['assets-index.json']?.url || `https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/assets-index.json`],
    ['Usage', artifactLinks['USAGE.md']?.url || `https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/USAGE.md`],
    ['Not needed now', artifactLinks['not-needed-now.md']?.url || `https://magic-builder.tos-cn-beijing.volces.com/${TOS_PREFIX}/not-needed-now.md`],
  ];
  for (const [label, url] of links) lines.push(`- ${label}: ${url}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Original images: ${summary.total}`);
  lines.push(`- Included public assets: ${summary.selected}`);
  lines.push(`- Uploaded public TOS links: ${summary.selectedUploaded}`);
  lines.push(`- Icons: ${summary.byType.icon || 0}`);
  lines.push(`- Logos: ${summary.byType.logo || 0}`);
  lines.push(`- Excluded for now: ${summary.excluded}`);
  lines.push('');
  lines.push('## Rules');
  lines.push('');
  lines.push('- Public pool includes only high-reuse icons and logos.');
  lines.push('- Do not treat screenshots, marketing slogans, metrics text, photos, decorative lines, or placeholder logos as reusable assets.');
  lines.push('- Logo assets should not be stretched, cropped, recolored, or used without brand authorization where applicable.');
  lines.push('- Icon assets are for concepts, process nodes, status labels, and capability matrices; pair them with short labels.');
  lines.push('- Every asset URL is public. Do not upload sensitive customer material to this pool.');
  lines.push('');
  lines.push('## High-Frequency Icons');
  lines.push('');
  for (const item of topIcons) {
    lines.push(`- ${item.name} (${item.id}): ${item.url}`);
  }
  lines.push('');
  lines.push('## High-Frequency Logos');
  lines.push('');
  for (const item of topLogos) {
    lines.push(`- ${item.name} (${item.id}): ${item.url}`);
  }
  lines.push('');
  lines.push('## Machine Summary');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(splitSummary, null, 2));
  lines.push('```');
  lines.push('');
  const cleanLines = Array.from(lines);
  while (cleanLines.length && cleanLines[cleanLines.length - 1] === '') cleanLines.pop();
  const llmsText = `${cleanLines.join('\n')}\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'llms.txt'), llmsText);
  writeLlmsPreview(llmsText, summary, { icons, logos });
}

function writeHtml(manifest, summary) {
  const payload = JSON.stringify({ summary, items: manifest });
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PPTX Media Linker</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --surface-alt: #f0f3f7;
      --text: #172033;
      --muted: #667085;
      --line: #d8dee8;
      --accent: #1764e8;
      --ok: #087443;
      --warn: #b54708;
      --danger: #b42318;
      --radius: 8px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
    header {
      border-bottom: 1px solid var(--line);
      background: var(--surface);
    }
    .wrap {
      max-width: 1280px;
      margin: 0 auto;
      padding: 20px;
    }
    .topline {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 24px;
      line-height: 1.2;
      letter-spacing: 0;
    }
    .sub {
      margin: 0;
      color: var(--muted);
      max-width: 760px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 8px;
      margin-top: 16px;
    }
    .stat {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface-alt);
      padding: 10px 12px;
    }
    .stat strong {
      display: block;
      font-size: 20px;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .stat span { color: var(--muted); font-size: 12px; }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 5;
      border-bottom: 1px solid var(--line);
      background: rgba(246, 247, 249, 0.94);
      backdrop-filter: blur(10px);
    }
    .controls {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) auto auto auto;
      gap: 10px;
      align-items: center;
    }
    input, select {
      height: 38px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      color: var(--text);
      padding: 0 10px;
      font: inherit;
      min-width: 0;
    }
    button {
      height: 32px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text);
      padding: 0 9px;
      font: inherit;
      cursor: pointer;
    }
    button:hover { border-color: #aab4c4; }
    button.primary {
      border-color: var(--accent);
      color: var(--accent);
    }
    .resultbar {
      color: var(--muted);
      margin: 14px 0 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
    }
    .asset {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      overflow: hidden;
      min-width: 0;
    }
    .preview {
      height: 148px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid var(--line);
      background-color: #202938;
      background-image:
        linear-gradient(45deg, rgba(255,255,255,.07) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(255,255,255,.07) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(255,255,255,.07) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(255,255,255,.07) 75%);
      background-size: 24px 24px;
      background-position: 0 0, 0 12px, 12px -12px, -12px 0;
    }
    .preview img {
      max-width: 84%;
      max-height: 112px;
      object-fit: contain;
      image-rendering: auto;
    }
    .body { padding: 12px; }
    .meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      min-width: 0;
    }
    .badge {
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 12px;
      line-height: 18px;
      border: 1px solid var(--line);
      color: var(--muted);
      white-space: nowrap;
    }
    .badge.include { color: var(--ok); border-color: #abefc6; background: #ecfdf3; }
    .badge.exclude { color: var(--warn); border-color: #fedf89; background: #fffaeb; }
    .name {
      font-weight: 650;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .slug, .file, .reason {
      color: var(--muted);
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
    .empty {
      border: 1px dashed var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      color: var(--muted);
      padding: 30px;
      text-align: center;
    }
    @media (max-width: 720px) {
      .wrap { padding: 14px; }
      .topline { display: block; }
      .stats { grid-template-columns: repeat(2, 1fr); }
      .controls { grid-template-columns: 1fr; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <div class="topline">
        <div>
          <h1>PPTX Media Linker</h1>
          <p class="sub">把 PPTX 导出的无意义图片名，整理成可搜索、可复制、可追溯的 GTM 公共素材链接。</p>
        </div>
      </div>
      <div class="stats" id="stats"></div>
    </div>
  </header>
  <div class="toolbar">
    <div class="wrap">
      <div class="controls">
        <input id="q" type="search" placeholder="搜索名称、文件名、标签或 TOS key" autocomplete="off">
        <select id="decision" aria-label="筛选状态">
          <option value="include">Included</option>
          <option value="all">All</option>
          <option value="exclude">Excluded</option>
        </select>
        <select id="type" aria-label="筛选类型">
          <option value="all">全部类型</option>
          <option value="icon">Icon</option>
          <option value="logo">Logo</option>
          <option value="excluded">Excluded</option>
        </select>
        <select id="upload" aria-label="筛选上传状态">
          <option value="all">全部链接状态</option>
          <option value="uploaded">已上传</option>
          <option value="missing">未上传</option>
        </select>
      </div>
    </div>
  </div>
  <main class="wrap">
    <div class="resultbar" id="resultbar"></div>
    <div class="grid" id="grid"></div>
  </main>
  <script>
    const DATA = ${payload};
    const els = {
      stats: document.querySelector('#stats'),
      q: document.querySelector('#q'),
      decision: document.querySelector('#decision'),
      type: document.querySelector('#type'),
      upload: document.querySelector('#upload'),
      resultbar: document.querySelector('#resultbar'),
      grid: document.querySelector('#grid'),
    };
    const localSrc = (item) => '../assets/pptx-media/' + item.file;
    const publicSrc = (item) => item.url || localSrc(item);
    const searchable = (item) => [
      item.displayName, item.semanticName, item.file, item.tosKey, item.bucket,
      item.exclusionCategory, item.exclusionReason, ...(item.tags || [])
    ].filter(Boolean).join(' ').toLowerCase();
    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
      }[ch]));
    }
    function copyText(text) {
      navigator.clipboard.writeText(text).catch(() => {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      });
    }
    function renderStats() {
      const cards = [
        ['原始图片', DATA.summary.total],
        ['纳入公共池', DATA.summary.selected],
        ['已上传链接', DATA.summary.selectedUploaded],
        ['暂不纳入', DATA.summary.excluded],
      ];
      els.stats.innerHTML = cards.map(([label, value]) =>
        '<div class="stat"><strong>' + value + '</strong><span>' + label + '</span></div>'
      ).join('');
    }
    function render() {
      const q = els.q.value.trim().toLowerCase();
      const decision = els.decision.value;
      const type = els.type.value;
      const upload = els.upload.value;
      const items = DATA.items.filter((item) => {
        if (decision !== 'all' && item.decision !== decision) return false;
        if (type !== 'all' && item.type !== type) return false;
        if (upload === 'uploaded' && !item.url) return false;
        if (upload === 'missing' && item.decision === 'include' && item.url) return false;
        if (upload === 'missing' && item.decision !== 'include') return false;
        return !q || searchable(item).includes(q);
      });
      els.resultbar.textContent = '显示 ' + items.length + ' / ' + DATA.items.length + ' 个资源';
      if (!items.length) {
        els.grid.innerHTML = '<div class="empty">没有匹配的资源。</div>';
        return;
      }
      els.grid.innerHTML = items.map((item) => {
        const src = publicSrc(item);
        const badgeClass = item.decision === 'include' ? 'include' : 'exclude';
        const url = item.url || '';
        const md = url ? '![' + item.displayName + '](' + url + ')' : '';
        const html = url ? '<img src="' + url + '" alt="' + item.displayName + '">' : '';
        const actions = item.decision === 'include'
          ? '<div class="actions">'
            + '<button class="primary" data-copy="' + escapeHtml(url) + '" ' + (!url ? 'disabled' : '') + '>URL</button>'
            + '<button data-copy="' + escapeHtml(md) + '" ' + (!url ? 'disabled' : '') + '>Markdown</button>'
            + '<button data-copy="' + escapeHtml(html) + '" ' + (!url ? 'disabled' : '') + '>HTML</button>'
            + '</div>'
          : '<div class="reason">' + escapeHtml(item.exclusionReason) + '</div>';
        return '<article class="asset">'
          + '<div class="preview"><img loading="lazy" src="' + escapeHtml(src) + '" alt="' + escapeHtml(item.displayName || item.file) + '"></div>'
          + '<div class="body">'
          + '<div class="meta"><span class="badge ' + badgeClass + '">' + escapeHtml(item.type) + '</span><span class="name" title="' + escapeHtml(item.displayName) + '">' + escapeHtml(item.displayName) + '</span></div>'
          + '<div class="slug">' + escapeHtml(item.semanticName || '') + '</div>'
          + '<div class="file">' + escapeHtml(item.file) + ' · ' + item.width + 'x' + item.height + '</div>'
          + actions
          + '</div></article>';
      }).join('');
      els.grid.querySelectorAll('button[data-copy]').forEach((button) => {
        button.addEventListener('click', () => copyText(button.dataset.copy));
      });
    }
    renderStats();
    [els.q, els.decision, els.type, els.upload].forEach((el) => el.addEventListener('input', render));
    render();
  </script>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
}

function saveOutputs(manifest, artifactState) {
  const summary = summarize(manifest);
  writeJson(path.join(OUT_DIR, 'assets-index.json'), { summary, items: manifest });
  writeCsv(manifest);
  writeTieredIndexes(manifest, summary, artifactState);
  writeUsage(manifest, summary, artifactState);
  writeNotNeeded(summary);
  writeHtml(manifest, summary);
  return summary;
}

function uploadOne(filePath, key) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [UPLOAD_SCRIPT, filePath, '--key', key, '-q'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || `upload exited with ${code}`));
      }
    });
  });
}

async function runPool(items, worker) {
  const queue = [...items];
  const errors = [];
  async function next(workerId) {
    while (queue.length) {
      const item = queue.shift();
      try {
        await worker(item, workerId);
      } catch (error) {
        errors.push({ item, error });
        console.error(`Upload failed for ${item.file || item.name}: ${error.message}`);
      }
    }
  }
  const workers = Array.from({ length: Math.max(1, uploadConcurrency) }, (_, index) => next(index + 1));
  await Promise.all(workers);
  if (errors.length) {
    throw new Error(`${errors.length} upload(s) failed`);
  }
}

async function uploadSelected(manifest, uploadState) {
  const selected = manifest.filter((item) => item.decision === 'include');
  const pending = selected.filter((item) => {
    const existing = uploadState.items?.[item.file];
    return forceUpload || !existing || existing.tosKey !== item.tosKey || !existing.url;
  });
  if (!pending.length) {
    console.log(`No asset uploads needed. ${selected.length}/${selected.length} selected assets already have URLs.`);
    return;
  }
  console.log(`Uploading ${pending.length} selected assets to ${TOS_PREFIX} ...`);
  uploadState.items ||= {};
  let done = 0;
  await runPool(pending, async (item) => {
    const url = await uploadOne(item.path, item.tosKey);
    uploadState.items[item.file] = {
      file: item.file,
      displayName: item.displayName,
      type: item.type,
      tosKey: item.tosKey,
      url,
      uploadedAt: new Date().toISOString(),
    };
    done += 1;
    if (done === 1 || done % 20 === 0 || done === pending.length) {
      console.log(`Uploaded ${done}/${pending.length}`);
    }
    writeJson(UPLOAD_STATE_PATH, uploadState);
  });
}

async function uploadArtifacts(artifactState) {
  const artifacts = [
    ['index.html', 'text/html', `${TOS_PREFIX}/index.html`],
    ['llms.txt', 'text/plain', `${TOS_PREFIX}/llms.txt`],
    ['icons.json', 'application/json', `${TOS_PREFIX}/icons.json`],
    ['logos.json', 'application/json', `${TOS_PREFIX}/logos.json`],
    ['excluded.json', 'application/json', `${TOS_PREFIX}/excluded.json`],
    ['assets-index.json', 'application/json', `${TOS_PREFIX}/assets-index.json`],
    ['assets-index.csv', 'text/csv', `${TOS_PREFIX}/assets-index.csv`],
    ['USAGE.md', 'text/plain', `${TOS_PREFIX}/USAGE.md`],
    ['not-needed-now.md', 'text/plain', `${TOS_PREFIX}/not-needed-now.md`],
  ].map(([name, contentType, tosKey]) => ({
    name,
    contentType,
    tosKey,
    path: path.join(OUT_DIR, name),
  }));
  artifactState.items ||= {};
  const pending = artifacts.filter((item) => forceUpload || !artifactState.items[item.name]?.url);
  if (!pending.length) {
    console.log('No artifact uploads needed.');
    return;
  }
  console.log(`Uploading ${pending.length} generated artifacts ...`);
  await runPool(pending, async (item) => {
    const url = await uploadOne(item.path, item.tosKey);
    artifactState.items[item.name] = {
      name: item.name,
      tosKey: item.tosKey,
      url,
      uploadedAt: new Date().toISOString(),
    };
    writeJson(ARTIFACT_STATE_PATH, artifactState);
  });
}

async function main() {
  if (!fs.existsSync(INVENTORY_PATH)) {
    throw new Error(`Missing inventory: ${INVENTORY_PATH}`);
  }
  if (!fs.existsSync(UPLOAD_SCRIPT)) {
    throw new Error(`Missing upload script: ${UPLOAD_SCRIPT}`);
  }

  const inventory = readJson(INVENTORY_PATH, []);
  const uploadState = readJson(UPLOAD_STATE_PATH, { generatedAt: new Date().toISOString(), items: {} });
  const artifactState = readJson(ARTIFACT_STATE_PATH, { generatedAt: new Date().toISOString(), items: {} });

  let manifest = buildManifest(inventory, uploadState);
  if (shouldUpload) {
    await uploadSelected(manifest, uploadState);
    manifest = buildManifest(inventory, uploadState);
  }
  const summary = saveOutputs(manifest, artifactState);
  if (shouldUploadArtifacts) {
    await uploadArtifacts(artifactState);
    saveOutputs(manifest, artifactState);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
