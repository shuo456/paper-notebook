#!/usr/bin/env python3
"""Append validated, deduplicated paper records to papers.json."""

import argparse
import sys
from datetime import date
from pathlib import Path

from paper_store import ValidationError, atomic_write_json, load_json_array, merge_papers


def main() -> int:
    parser = argparse.ArgumentParser(description="向 papers.json 安全添加论文")
    parser.add_argument("--papers-json", required=True, type=Path, help="现有 papers.json 路径")
    parser.add_argument("--new-entries", required=True, type=Path, help="包含候选论文数组的 JSON 文件")
    parser.add_argument("--date", default=date.today().isoformat(), help="新增日期，格式 YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true", help="仅显示结果，不写文件")
    args = parser.parse_args()

    try:
        existing = load_json_array(args.papers_json)
        candidates = load_json_array(args.new_entries)
        result = merge_papers(existing, candidates, args.date)
    except (OSError, ValueError, ValidationError) as error:
        print(f"错误：{error}", file=sys.stderr)
        return 1

    for item in result.skipped:
        print(f"跳过 {item.paper_id}：重复 {item.reason}")
    for item in result.added:
        print(f"待添加 {item['id']}：{item['title']}")

    mode = "试运行" if args.dry_run else "执行"
    print(f"{mode}汇总：新增 {len(result.added)} 篇，跳过 {len(result.skipped)} 篇，总计 {len(result.papers)} 篇。")
    if args.dry_run:
        return 0
    if not result.added and result.papers == existing:
        return 0

    try:
        atomic_write_json(args.papers_json, result.papers)
    except (OSError, ValidationError) as error:
        print(f"写入失败：{error}", file=sys.stderr)
        return 1
    print(f"已更新 {args.papers_json}；原文件备份为 {args.papers_json.name}.bak。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
