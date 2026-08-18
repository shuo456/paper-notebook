"""Validated, deduplicated, atomic storage helpers for papers.json."""

from __future__ import annotations

import json
import re
import shutil
import tempfile
import unicodedata
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from urllib.parse import urlparse


REQUIRED_FIELDS = ("id", "title", "authors", "venue", "year", "tags", "abstract", "addedDate", "source")
DATE_FIELDS = ("publishedDate", "addedDate", "updatedDate")
URL_FIELDS = ("url", "pdfUrl", "notebooklmUrl")


@dataclass(frozen=True)
class SkippedPaper:
    paper_id: str
    reason: str


@dataclass(frozen=True)
class MergeResult:
    papers: list[dict]
    added: list[dict]
    skipped: list[SkippedPaper]


class ValidationError(ValueError):
    pass


def normalize_doi(value: str = "") -> str:
    return re.sub(r"^https?://(?:dx\.)?doi\.org/", "", str(value).strip(), flags=re.IGNORECASE).lower()


def normalize_title(value: str = "") -> str:
    normalized = unicodedata.normalize("NFKD", str(value)).lower()
    return " ".join("".join(character if character.isalnum() else " " for character in normalized).split())


def _valid_iso_date(value: object, allow_empty: bool) -> bool:
    if value == "" and allow_empty:
        return True
    if not isinstance(value, str):
        return False
    try:
        return date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


def _valid_https_url(value: object) -> bool:
    if value == "":
        return True
    if not isinstance(value, str):
        return False
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.netloc)


def validate_paper(paper: dict) -> None:
    errors: list[str] = []
    if not isinstance(paper, dict):
        raise ValidationError("paper must be an object")

    for field in REQUIRED_FIELDS:
        if field not in paper or paper[field] in (None, ""):
            errors.append(f"{field}: required")

    for field in ("id", "title", "venue", "abstract", "source"):
        if field in paper and (not isinstance(paper[field], str) or not paper[field].strip()):
            errors.append(f"{field}: must be a non-empty string")

    for field in ("authors", "tags"):
        value = paper.get(field)
        if not isinstance(value, list) or not value or not all(isinstance(item, str) and item.strip() for item in value):
            errors.append(f"{field}: must be a non-empty string array")

    year = paper.get("year")
    if isinstance(year, bool) or not isinstance(year, int) or not 1000 <= year <= 9999:
        errors.append("year: must be a four-digit integer")

    rating = paper.get("rating", 0)
    if isinstance(rating, bool) or not isinstance(rating, int) or not 0 <= rating <= 5:
        errors.append("rating: must be an integer from 0 to 5")

    for field in DATE_FIELDS:
        value = paper.get(field, "")
        if not _valid_iso_date(value, allow_empty=field != "addedDate"):
            errors.append(f"{field}: must be an ISO date (YYYY-MM-DD) or empty")

    for field in URL_FIELDS:
        if not _valid_https_url(paper.get(field, "")):
            errors.append(f"{field}: must be empty or an HTTPS URL")

    if errors:
        raise ValidationError("; ".join(dict.fromkeys(errors)))


def paper_identity(paper: dict) -> tuple[str, str, str]:
    return str(paper.get("id", "")).strip(), normalize_doi(paper.get("doi", "")), normalize_title(paper.get("title", ""))


def _canonical_candidate(paper: dict, today: str) -> dict:
    value = dict(paper)
    value.setdefault("venueType", "other")
    value.setdefault("publishedDate", "")
    value["doi"] = normalize_doi(value.get("doi", ""))
    value.setdefault("url", "")
    value.setdefault("pdfUrl", "")
    value.setdefault("rating", 0)
    value.setdefault("notes", "")
    value.setdefault("addedDate", today)
    value.setdefault("updatedDate", "")
    value.setdefault("notebooklmUrl", "")
    value.setdefault("notebooklmNotes", "")
    return value


def merge_papers(existing: list[dict], candidates: list[dict], today: str) -> MergeResult:
    if not _valid_iso_date(today, allow_empty=False):
        raise ValidationError("today: must be an ISO date (YYYY-MM-DD)")
    if not isinstance(existing, list) or not isinstance(candidates, list):
        raise ValidationError("existing and candidates must be arrays")

    current = [dict(item) for item in existing]
    for item in current:
        validate_paper(item)

    ids = set()
    dois = set()
    titles = set()
    for item in current:
        paper_id, doi, title = paper_identity(item)
        ids.add(paper_id)
        if doi:
            dois.add(doi)
        titles.add(title)

    added: list[dict] = []
    skipped: list[SkippedPaper] = []
    for raw in candidates:
        item = _canonical_candidate(raw, today)
        validate_paper(item)
        paper_id, doi, title = paper_identity(item)
        reason = "id" if paper_id in ids else "doi" if doi and doi in dois else "title" if title in titles else ""
        if reason:
            skipped.append(SkippedPaper(paper_id, reason))
            continue
        current.append(item)
        added.append(item)
        ids.add(paper_id)
        if doi:
            dois.add(doi)
        titles.add(title)

    return MergeResult(current, added, skipped)


def load_json_array(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValidationError(f"{path} must contain a JSON array")
    return data


def atomic_write_json(path: Path, data: list[dict]) -> None:
    if not isinstance(data, list):
        raise ValidationError("data must be an array")
    for paper in data:
        validate_paper(paper)

    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, prefix=f".{path.name}.", suffix=".tmp", delete=False) as handle:
            handle.write(serialized)
            temporary_path = Path(handle.name)
        json.loads(temporary_path.read_text(encoding="utf-8"))
        if path.exists():
            shutil.copy2(path, path.with_suffix(path.suffix + ".bak"))
        temporary_path.replace(path)
    finally:
        if temporary_path and temporary_path.exists():
            temporary_path.unlink()
