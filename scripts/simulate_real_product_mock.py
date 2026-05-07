#!/usr/bin/env python3
"""Apply editable demo content to a browser-extracted product mock.

The extractor intentionally sanitizes text. This script turns the sanitized
shell into a readable PPT prototype while keeping the original extracted DOM and
computed styles intact.
"""

from __future__ import annotations

import argparse
from html import escape
import json
import re
from pathlib import Path
from typing import Mapping


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_IN = ROOT / "product-mocks" / "generated" / "task-real-shell.html"
DEFAULT_OUT = ROOT / "product-mocks" / "generated" / "task-real-simulated.html"
PLACEHOLDER_RE = re.compile(r"Text\s+(\d+)")


TASK_SIMULATED_TEXT = {
    1: "搜索",
    2: "⌘ K",
    3: "消息",
    4: "99+",
    5: "日历",
    6: "视频",
    7: "云文档",
    8: "通讯录",
    9: "邮箱",
    10: "任务",
    11: "多维表格",
    12: "12",
    13: "工作台",
    14: "下载飞书客户端",
    15: "任务",
    16: "我负责的",
    17: "7",
    18: "我关注的",
    19: "动态",
    20: "来自飞书项目",
    21: "快速访问",
    22: "全部任务",
    23: "我创建的",
    24: "我分配的",
    25: "已完成",
    26: "任务清单",
    27: "AI Solution 周会 TODO",
    28: "新建分组",
    29: "我负责的",
    30: "新建任务",
    31: "全部",
    32: "进行中",
    33: "已完成",
    34: "筛选",
    35: "任务名称",
    36: "负责人",
    37: "截止",
    38: "状态",
    39: "整理 AI 门店运营驾驶舱演示口径",
    40: "许嘉明",
    41: "今天",
    42: "进行中",
    43: "确认一店一群质检方案试点门店",
    44: "2",
    45: "林明伦",
    46: "明天",
    47: "待确认",
    48: "输出经销商培训 SOP 与群发文案",
    49: "陈柳燕",
    50: "周五",
    51: "阻塞",
    52: "同步 8,000 家门店上线节奏",
    53: "王星",
    54: "5月10日",
    55: "进行中",
    56: "复盘巡检工单漏检原因",
    57: "黄鹤",
    58: "5月11日",
    59: "待处理",
    60: "补齐 AI 质检准确率口径",
    61: "李盈乐",
    62: "5月12日",
    63: "整理服务售卖客户问题清单",
    64: "蒋蔡淼",
    65: "5月13日",
    66: "更新项目周报并发到群里",
    67: "张天宏",
    68: "5月14日",
    69: "已显示全部任务",
}

TASK_OVERLAY_CSS = """

      .ldk-real-stage {
        position: relative;
      }

      [data-ldk-node="199"] {
        display: none !important;
      }

      .ldk-sim-task-main {
        position: absolute;
        top: 6px;
        left: 397px;
        width: 797px;
        height: 834px;
        overflow: hidden;
        background: #fff;
        color: #1f2329;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
      }

      .ldk-sim-task-main,
      .ldk-sim-task-main * {
        box-sizing: border-box;
      }

      .ldk-sim-task-head {
        position: relative;
        display: flex;
        align-items: flex-start;
        height: 90px;
        padding: 18px 20px 0;
      }

      .ldk-sim-task-title {
        margin: 0;
        color: #2b2f36;
        font-size: 16px;
        font-weight: 500;
        line-height: 24px;
      }

      .ldk-sim-task-create {
        position: absolute;
        top: 16px;
        right: 45px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 28px;
        border: 0;
        border-radius: 6px;
        background: #1456f0;
        color: #fff;
        font-size: 12px;
        line-height: 20px;
      }

      .ldk-sim-task-view-tabs {
        position: absolute;
        bottom: 0;
        left: 10px;
        display: flex;
        align-items: stretch;
        height: 40px;
      }

      .ldk-sim-task-view-tab {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 40px;
        padding: 0 10px;
        color: #1f2329;
        font-size: 12px;
        gap: 4px;
      }

      .ldk-sim-task-view-tab.is-active {
        color: #1456f0;
        font-weight: 500;
      }

      .ldk-sim-task-view-tab.is-active::after {
        position: absolute;
        right: 10px;
        bottom: 0;
        left: 10px;
        height: 2px;
        border-radius: 2px;
        background: #1456f0;
        content: "";
      }

      .ldk-sim-task-view-icon {
        font-size: 12px;
        line-height: 1;
      }

      .ldk-sim-task-toolbar {
        display: flex;
        align-items: flex-start;
        height: 58px;
        padding: 20px 20px 0;
      }

      .ldk-sim-task-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 78px;
        height: 28px;
        padding: 0 12px;
        border: 1px solid #dee0e3;
        border-radius: 6px;
        background: #fff;
        color: #1f2329;
        font-size: 12px;
        line-height: 20px;
      }

      .ldk-sim-task-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 28px;
        margin-left: 24px;
      }

      .ldk-sim-task-tool {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        color: #646a73;
        font-size: 14px;
      }

      .ldk-sim-task-tool.is-active {
        background: #eef3ff;
        color: #1456f0;
      }

      .ldk-sim-task-table {
        width: 884px;
        color: #2b2f36;
      }

      .ldk-sim-task-row {
        display: grid;
        grid-template-columns: 464px 120px 120px 180px;
        align-items: center;
        height: 46px;
        border-bottom: 1px solid #eff0f1;
      }

      .ldk-sim-task-row.is-head {
        height: 28px;
        color: #646a73;
        font-size: 12px;
      }

      .ldk-sim-task-title-cell,
      .ldk-sim-task-title-head {
        display: flex;
        align-items: center;
        min-width: 0;
        height: 100%;
      }

      .ldk-sim-task-title-cell {
        gap: 8px;
        padding-left: 44px;
      }

      .ldk-sim-task-title-head {
        padding-left: 62px;
      }

      .ldk-sim-task-check {
        flex: 0 0 auto;
        width: 16px;
        height: 16px;
        border: 1.5px solid #c9cdd4;
        border-radius: 50%;
      }

      .ldk-sim-task-name {
        min-width: 0;
        overflow: hidden;
        color: #1f2329;
        font-weight: 400;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ldk-sim-task-owner {
        display: flex;
        align-items: center;
        min-width: 0;
        overflow: hidden;
        color: #1f2329;
        white-space: nowrap;
      }

      .ldk-sim-task-date,
      .ldk-sim-task-score {
        color: #1f2329;
        white-space: nowrap;
      }

      .ldk-sim-task-add {
        padding-left: 20px;
        color: #8f959e;
      }
"""

TASK_OVERLAY_HTML = """
<section class="ldk-sim-task-main" aria-label="模拟任务列表">
  <header class="ldk-sim-task-head">
    <h1 class="ldk-sim-task-title">我负责的</h1>
    <button class="ldk-sim-task-create">新建⌄</button>
    <div class="ldk-sim-task-view-tabs" aria-label="视图切换">
      <div class="ldk-sim-task-view-tab is-active"><span class="ldk-sim-task-view-icon">▦</span>列表</div>
      <div class="ldk-sim-task-view-tab"><span class="ldk-sim-task-view-icon">▱</span>看板</div>
      <div class="ldk-sim-task-view-tab"><span class="ldk-sim-task-view-icon">◷</span>仪表盘</div>
    </div>
  </header>
  <div class="ldk-sim-task-toolbar">
    <button class="ldk-sim-task-button">新建任务</button>
    <div class="ldk-sim-task-tools" aria-hidden="true">
      <div class="ldk-sim-task-tool">⌘</div>
      <div class="ldk-sim-task-tool is-active">⏷</div>
      <div class="ldk-sim-task-tool">⇅</div>
      <div class="ldk-sim-task-tool">▣</div>
      <div class="ldk-sim-task-tool">☷</div>
    </div>
  </div>
  <div class="ldk-sim-task-table">
    <div class="ldk-sim-task-row is-head">
      <div class="ldk-sim-task-title-head">任务标题</div>
      <div>负责人</div>
      <div>估分</div>
      <div>截止时间</div>
    </div>
    <div class="ldk-sim-task-row">
      <div class="ldk-sim-task-title-cell"><div class="ldk-sim-task-check"></div><div class="ldk-sim-task-name">整理 AI 门店运营驾驶舱演示口径</div></div>
      <div class="ldk-sim-task-owner">许嘉明</div>
      <div class="ldk-sim-task-score">-</div>
      <div class="ldk-sim-task-date">今天</div>
    </div>
    <div class="ldk-sim-task-row">
      <div class="ldk-sim-task-title-cell"><div class="ldk-sim-task-check"></div><div class="ldk-sim-task-name">确认一店一群质检方案试点门店</div></div>
      <div class="ldk-sim-task-owner">林明伦</div>
      <div class="ldk-sim-task-score">2</div>
      <div class="ldk-sim-task-date">明天</div>
    </div>
    <div class="ldk-sim-task-row">
      <div class="ldk-sim-task-title-cell"><div class="ldk-sim-task-check"></div><div class="ldk-sim-task-name">输出经销商培训 SOP 与群发文案</div></div>
      <div class="ldk-sim-task-owner">陈柳燕</div>
      <div class="ldk-sim-task-score">-</div>
      <div class="ldk-sim-task-date">周五</div>
    </div>
    <div class="ldk-sim-task-row">
      <div class="ldk-sim-task-title-cell"><div class="ldk-sim-task-check"></div><div class="ldk-sim-task-name">同步 8,000 家门店上线节奏</div></div>
      <div class="ldk-sim-task-owner">王星</div>
      <div class="ldk-sim-task-score">-</div>
      <div class="ldk-sim-task-date">5月10日</div>
    </div>
    <div class="ldk-sim-task-row">
      <div class="ldk-sim-task-title-cell"><div class="ldk-sim-task-check"></div><div class="ldk-sim-task-name">复盘巡检工单漏检原因</div></div>
      <div class="ldk-sim-task-owner">黄鹤</div>
      <div class="ldk-sim-task-score">-</div>
      <div class="ldk-sim-task-date">5月11日</div>
    </div>
    <div class="ldk-sim-task-row">
      <div class="ldk-sim-task-title-cell"><div class="ldk-sim-task-check"></div><div class="ldk-sim-task-name">补齐 AI 质检准确率口径</div></div>
      <div class="ldk-sim-task-owner">李盈乐</div>
      <div class="ldk-sim-task-score">-</div>
      <div class="ldk-sim-task-date">5月12日</div>
    </div>
    <div class="ldk-sim-task-row">
      <div class="ldk-sim-task-title-cell"><div class="ldk-sim-task-check"></div><div class="ldk-sim-task-name">整理服务售卖客户问题清单</div></div>
      <div class="ldk-sim-task-owner">蒋蔡淼</div>
      <div class="ldk-sim-task-score">-</div>
      <div class="ldk-sim-task-date">5月13日</div>
    </div>
    <div class="ldk-sim-task-row">
      <div class="ldk-sim-task-add">新建任务</div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
</section>
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Replace sanitized placeholders with realistic demo content.")
    parser.add_argument("--input", default=str(DEFAULT_IN), help="Browser-extracted HTML shell.")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output HTML path.")
    parser.add_argument("--product", default="task", choices=["task"], help="Built-in content preset.")
    parser.add_argument("--mapping", help="Optional JSON file with placeholder number to replacement text.")
    return parser.parse_args()


def load_mapping(args: argparse.Namespace) -> dict[int, str]:
    mapping: dict[int, str] = dict(TASK_SIMULATED_TEXT)
    if args.mapping:
        custom = json.loads(Path(args.mapping).read_text(encoding="utf-8"))
        mapping.update({int(key): str(value) for key, value in custom.items()})
    return mapping


def replace_placeholders(source: str, mapping: Mapping[int, str]) -> tuple[str, int]:
    replaced = 0
    def replace(match: re.Match[str]) -> str:
        nonlocal replaced
        value = mapping.get(int(match.group(1)))
        if value is None:
            return match.group(0)
        replaced += 1
        return escape(value)
    return PLACEHOLDER_RE.sub(replace, source), replaced


def mark_document(source: str, product: str) -> str:
    source = re.sub(r"<title>.*?</title>", f"<title>{escape(product)}-real-simulated</title>", source, count=1, flags=re.DOTALL)
    return re.sub(r"<body([^>]*)>", rf'<body\1 data-ldk-simulated-product="{escape(product)}">', source, count=1)


def append_css(source: str, css: str) -> str:
    if "</style>" not in source:
        return source
    return source.replace("</style>", f"{css}\n    </style>", 1)


def append_task_overlay(source: str) -> str:
    source = append_css(source, TASK_OVERLAY_CSS)
    stage_close = "\n    </div>\n  </body>"
    if stage_close in source:
        return source.replace(stage_close, f"\n{TASK_OVERLAY_HTML}\n{stage_close}", 1)
    return source.replace("</body>", f"\n{TASK_OVERLAY_HTML}\n</body>", 1)


def main() -> int:
    args = parse_args()
    source = Path(args.input).expanduser().resolve()
    out = Path(args.out).expanduser().resolve()
    rendered = source.read_text(encoding="utf-8")
    mapping = load_mapping(args)
    rendered, replaced = replace_placeholders(rendered, mapping)
    rendered = mark_document(rendered, args.product)
    if args.product == "task":
        rendered = append_task_overlay(rendered)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(rendered, encoding="utf-8")
    print(json.dumps({"input": str(source), "out": str(out), "replaced": replaced}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
