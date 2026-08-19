import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]


def upstream_text(path):
    return subprocess.run(
        ["git", "show", f"upstream/main:{path}"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    ).stdout


class RepositoryContractTests(unittest.TestCase):
    def test_upstream_blog_surface_is_restored(self):
        required = (
            "docs/blog.html", "docs/css/blog.css", "docs/feed.xml",
            "docs/js/blogs.json", "docs/js/theme.js",
        )
        for relative in required:
            self.assertTrue((ROOT / relative).exists(), relative)
        self.assertFalse((ROOT / "docs/posts").exists())
        self.assertEqual(json.loads((ROOT / "docs/js/blogs.json").read_text(encoding="utf-8")), [])

    def test_blog_does_not_republish_original_author_or_account_integrations(self):
        blog = (ROOT / "docs/blog.html").read_text(encoding="utf-8")
        feed = (ROOT / "docs/feed.xml").read_text(encoding="utf-8")
        combined = blog + feed
        self.assertNotIn("Jingjing", combined)
        self.assertNotIn("zhaijj", combined)
        self.assertNotIn("buttondown.com", combined)
        self.assertNotIn("cloud.umami.is", combined)
        self.assertIn("No posts yet", blog)

    def test_upstream_navigation_and_personal_identity_are_preserved(self):
        index = (ROOT / "docs/index.html").read_text(encoding="utf-8")
        for token in (
            "Paper Notebook", "Blog", "Shuo Xu", "shuo456/paper-notebook",
            "Control Barrier Functions", "Safe Control", "Robot Learning",
            "reinforcement learning",
        ):
            self.assertIn(token, index)
        self.assertNotIn("Nature Plants", index)
        self.assertNotIn("bioRxiv", index)

    def test_papers_use_upstream_frontend_schema(self):
        papers = json.loads((ROOT / "docs/js/papers.json").read_text(encoding="utf-8"))
        self.assertEqual(len(papers), 3)
        for paper in papers:
            self.assertIn("journal", paper)
            self.assertIn("notebooklm_url", paper)
            self.assertIn("notebooklm_notes", paper)
            self.assertNotIn("venue", paper)
            self.assertNotIn("notebooklmUrl", paper)

    def test_long_journal_names_stay_inside_cards(self):
        css = (ROOT / "docs/css/style.css").read_text(encoding="utf-8")
        self.assertRegex(css, r"(?s)\.journal-badge\s*\{[^}]*min-width:\s*0")
        self.assertRegex(css, r"(?s)\.journal-badge\s*\{[^}]*text-overflow:\s*ellipsis")

    def test_readme_documents_local_data_automation_and_publication_workflows(self):
        text = (ROOT / "README.md").read_text(encoding="utf-8")
        required = (
            "https://shuo456.github.io/paper-notebook/", "npm run serve",
            "http://localhost:8000/", "npm test", "papers.json", "ID → DOI → 标题",
            "append_papers.py", "discover-arxiv", "discover-journals",
            "discover-conferences", "discover-all", "add-to-notebook",
            "link-notebooklm", "publish-notebook", "main/docs",
            "FIRECRAWL_API_KEY", "Google", "明确确认",
        )
        for token in required:
            self.assertIn(token, text)

    def test_local_secret_and_runtime_files_are_ignored(self):
        lines = set((ROOT / ".gitignore").read_text(encoding="utf-8").splitlines())
        required = {
            ".env", ".env.*", "!.env.example", ".mcp.json", "mcp_config.json",
            "*.cookies.json", "__pycache__/", "*.pyc", "node_modules/",
        }
        self.assertTrue(required <= lines, sorted(required - lines))


if __name__ == "__main__":
    unittest.main()
