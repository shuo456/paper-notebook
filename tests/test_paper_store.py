import json
import unittest
from pathlib import Path
import sys

SCRIPTS = Path(__file__).parents[1] / ".agents" / "skills" / "add_to_notebook" / "scripts"
sys.path.insert(0, str(SCRIPTS))

from paper_store import ValidationError, atomic_write_json, merge_papers, validate_paper


def paper(**changes):
    value = {
        "id": "ames2024cbf", "title": "Control Barrier Functions",
        "authors": ["A. Ames"], "venue": "IEEE TAC", "venueType": "journal",
        "year": 2024, "publishedDate": "2024-01-01", "doi": "10.1109/tac.2024.1",
        "url": "https://example.org/paper", "pdfUrl": "https://example.org/paper.pdf",
        "tags": ["control barrier functions"], "rating": 5, "abstract": "Abstract",
        "notes": "", "addedDate": "2026-08-18", "updatedDate": "2026-08-18",
        "source": "IEEE", "notebooklmUrl": "", "notebooklmNotes": "",
    }
    value.update(changes)
    return value


class PaperStoreTests(unittest.TestCase):
    def test_validate_paper_rejects_wrong_types_dates_rating_and_non_https_urls(self):
        with self.assertRaises(ValidationError) as error:
            validate_paper(paper(authors="Ames", addedDate="18-08-2026", rating=6, url="http://example.org"))
        message = str(error.exception)
        self.assertIn("authors", message)
        self.assertIn("addedDate", message)
        self.assertIn("rating", message)
        self.assertIn("url", message)

    def test_merge_papers_deduplicates_by_id_doi_and_normalized_title(self):
        existing = [paper()]
        candidates = [
            paper(id="other-id", doi="https://doi.org/10.1109/TAC.2024.1"),
            paper(id="third-id", doi="", title="Control-Barrier Functions!"),
        ]
        result = merge_papers(existing, candidates, "2026-08-18")
        self.assertEqual(result.added, [])
        self.assertEqual([item.reason for item in result.skipped], ["doi", "title"])

    def test_atomic_write_keeps_valid_json_and_creates_a_backup(self):
        directory = Path(__file__).parent / "_paper_store_fixture"
        directory.mkdir(exist_ok=True)
        target = directory / "papers.json"
        backup = target.with_suffix(".json.bak")
        try:
            target.write_text(json.dumps([paper()]), encoding="utf-8")
            atomic_write_json(target, [paper(id="new-id")])
            self.assertEqual(json.loads(target.read_text(encoding="utf-8"))[0]["id"], "new-id")
            self.assertTrue(backup.exists())
        finally:
            target.unlink(missing_ok=True)
            backup.unlink(missing_ok=True)
            directory.rmdir()


if __name__ == "__main__":
    unittest.main()
