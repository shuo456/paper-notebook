import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]


class RepositoryContractTests(unittest.TestCase):
    def test_removed_blog_surface_is_absent(self):
        for relative in ("docs/blog.html", "docs/css/blog.css", "docs/feed.xml", "docs/js/blogs.json", "docs/posts"):
            self.assertFalse((ROOT / relative).exists(), relative)

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
