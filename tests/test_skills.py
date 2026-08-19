import re
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
SKILLS = ROOT / ".agents" / "skills"
REMOVED = {
    "all_journals_researcher", "biorxiv_researcher", "cell_genomics_researcher",
    "cell_researcher", "current_biology_researcher", "daily_arxiv_researcher",
    "genome_biology_researcher", "genome_research_researcher", "mbe_researcher",
    "nature_biotechnology_researcher", "nature_genetics_researcher",
    "nature_methods_researcher", "nature_plants_researcher", "nature_researcher",
    "pnas_researcher", "publish_blog", "science_researcher",
}
CREATED = {
    "discover-arxiv", "discover-journals", "discover-conferences",
    "discover-all", "publish-notebook",
}


class SkillContractTests(unittest.TestCase):
    def read_skill(self, folder, name=None):
        name = name or folder
        path = SKILLS / folder / "SKILL.md"
        self.assertTrue(path.exists(), f"missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertRegex(text, rf"(?s)^---\nname: {re.escape(name)}\ndescription: Use when .+?\n---")
        return text

    def test_biology_and_blog_skills_are_removed(self):
        self.assertEqual(sorted(name for name in REMOVED if (SKILLS / name).exists()), [])

    def test_discovery_skills_define_sources_deduplication_and_selection(self):
        for name in CREATED:
            self.read_skill(name)

        arxiv = self.read_skill("discover-arxiv")
        for token in ("cs.RO", "cs.LG", "eess.SY", "seven days", "papers.json", "numbered selections"):
            self.assertIn(token, arxiv)

        journals = self.read_skill("discover-journals")
        for token in ("IEEE TAC", "Automatica", "IEEE RA-L", "IEEE T-RO", "IJRR", "FIRECRAWL_API_KEY"):
            self.assertIn(token, journals)

        conferences = self.read_skill("discover-conferences")
        for token in ("ICRA", "IROS", "CoRL", "RSS", "NeurIPS", "ICML", "event year"):
            self.assertIn(token, conferences)

        combined = self.read_skill("discover-all")
        for token in ("arXiv", "journals", "conferences", "formal publication", "failed group"):
            self.assertIn(token, combined)

    def test_mutation_and_publish_skills_have_confirmation_boundaries(self):
        add = self.read_skill("add_to_notebook", "add-to-notebook")
        for token in ("numbered selection", "--dry-run", "append_papers.py", "local preview", "Do not commit or push"):
            self.assertIn(token, add)

        notebooklm = self.read_skill("link_notebooklm", "link-notebooklm")
        for token in ("user approval", "notebooklm_url", "notebooklm_notes", "--force", "overwrite confirmation"):
            self.assertIn(token, notebooklm)

        publish = self.read_skill("publish-notebook")
        for token in ("npm test", "http.server", "sensitive", "git status --short", "explicit user confirmation", "git commit", "git push"):
            self.assertIn(token, publish)
        self.assertLess(publish.index("explicit user confirmation"), publish.index("git commit"))
        self.assertLess(publish.index("explicit user confirmation"), publish.index("git push"))

    def test_skills_have_no_stale_domain_owner_or_legacy_fields(self):
        stale = re.compile(r"plant genomics|maize|Nature Plants|Jingjing|zhaijj|/Users/|notebooklmUrl|notebooklmNotes|venueType", re.I)
        matches = []
        for path in SKILLS.rglob("*"):
            if path.is_file() and path.suffix in {".md", ".py", ".yaml", ".json"}:
                if path.name == "paper_store.py":
                    continue
                for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                    if stale.search(line):
                        matches.append(f"{path.relative_to(ROOT)}:{number}")
        self.assertEqual(matches, [])


if __name__ == "__main__":
    unittest.main()
