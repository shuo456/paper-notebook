#!/usr/bin/env python3
"""Attach canonical NotebookLM notes and URL to one paper record."""

import argparse
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

STORE_SCRIPTS = Path(__file__).parents[2] / "add_to_notebook" / "scripts"
sys.path.insert(0, str(STORE_SCRIPTS))

from paper_store import ValidationError, atomic_write_json, load_json_array, validate_paper


def is_https_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.netloc)


def main() -> int:
    parser = argparse.ArgumentParser(description="为论文关联 NotebookLM 深度笔记")
    parser.add_argument("--papers-json", required=True, type=Path)
    parser.add_argument("--paper-id", required=True)
    parser.add_argument("--notebooklm-url", dest="notebooklmUrl", required=True)
    parser.add_argument("--notebooklm-notes", dest="notebooklmNotes", required=True, type=Path)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true", help="覆盖已有 NotebookLM 数据")
    args = parser.parse_args()

    if not is_https_url(args.notebooklmUrl):
        print("错误：NotebookLM URL 必须是 HTTPS 地址。", file=sys.stderr)
        return 1
    try:
        papers = load_json_array(args.papers_json)
        notes = args.notebooklmNotes.read_text(encoding="utf-8").strip()
    except (OSError, ValueError, ValidationError) as error:
        print(f"错误：{error}", file=sys.stderr)
        return 1
    if not notes:
        print("错误：NotebookLM 笔记文件为空。", file=sys.stderr)
        return 1

    target = next((paper for paper in papers if paper.get("id") == args.paper_id), None)
    if target is None:
        print(f"错误：未找到论文 {args.paper_id}。", file=sys.stderr)
        return 1
    if (target.get("notebooklmUrl") or target.get("notebooklmNotes")) and not args.force:
        print("错误：该论文已有 NotebookLM 数据；如需覆盖，请添加 --force。", file=sys.stderr)
        return 1

    updated = [dict(paper) for paper in papers]
    updated_target = next(paper for paper in updated if paper.get("id") == args.paper_id)
    updated_target["notebooklmUrl"] = args.notebooklmUrl
    updated_target["notebooklmNotes"] = notes
    updated_target["updatedDate"] = date.today().isoformat()
    try:
        for paper in updated:
            validate_paper(paper)
    except ValidationError as error:
        print(f"验证失败：{error}", file=sys.stderr)
        return 1

    print(f"将更新 {args.paper_id}：NotebookLM 笔记 {len(notes)} 个字符。")
    if args.dry_run:
        print("试运行完成，未写入文件。")
        return 0
    try:
        atomic_write_json(args.papers_json, updated)
    except (OSError, ValidationError) as error:
        print(f"写入失败：{error}", file=sys.stderr)
        return 1
    print(f"已更新 {args.papers_json}。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
