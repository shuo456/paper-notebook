# Upstream Frontend Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the public site to the exact upstream `zhaijj/paper-notebook` frontend while preserving Shuo Xu's identity, research focus, three sample papers, and customized paper automation.

**Architecture:** Treat `upstream/main` commit `da44aaa07e2d87beade1cb01e39e1fab841be1a8` as the immutable frontend baseline. Restore the complete `docs/` tree, then apply only approved identity/topic/data substitutions and the smallest overflow correction required for long control/robotics venue names. Adapt the validated Python paper store to the upstream JSON field names instead of maintaining a parallel browser compatibility layer.

**Tech Stack:** Static HTML/CSS/JavaScript, JSON, Python 3 `unittest`, Node.js built-in test runner, GitHub Pages.

**Spec:** `project-docs/specs/2026-08-18-upstream-frontend-restoration-design.md`

## Global Constraints

- Frontend baseline is local `upstream/main` commit `da44aaa07e2d87beade1cb01e39e1fab841be1a8`.
- Keep the upstream English UI, layout, colors, cards, search, filters, detail page, blog structure, dark mode, RSS structure, and images.
- Approved substitutions are Shuo Xu, `https://github.com/shuo456/paper-notebook`, the control/robot-learning research focus, and exactly three sample papers.
- Preserve current `.agents/skills`, test infrastructure, atomic writes, and ID → DOI → title deduplication.
- Do not commit secrets, cookies, tokens, private NotebookLM URLs, or local absolute paths.
- Validate only desktop presentation; mobile-specific redesign is out of scope.

---

### Task 1: Lock the upstream frontend contract

**Files:**
- Modify: `tests/test_repository.py`
- Test: `tests/test_repository.py`

**Interfaces:**
- Consumes: Git object `upstream/main:<path>` through `subprocess.run(["git", "show", ...])`.
- Produces: `upstream_text(path: str) -> str` and regression assertions for required upstream files and approved personalization markers.

- [ ] **Step 1: Write the failing repository tests**

Add a helper that reads an upstream file and tests that the working tree restores `docs/blog.html`, `docs/css/blog.css`, `docs/feed.xml`, `docs/js/blogs.json`, `docs/theme.js`, and `docs/posts/`. Add assertions that `docs/index.html` contains `Paper Notebook`, `Blog`, `Shuo Xu`, `shuo456/paper-notebook`, and the control/robot-learning topic copy. Assert `papers.json` contains exactly three records with `journal` and `notebooklm_url` fields.

```python
def upstream_text(path):
    return subprocess.run(
        ["git", "show", f"upstream/main:{path}"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    ).stdout

def test_upstream_blog_structure_is_restored(self):
    for path in ("docs/blog.html", "docs/css/blog.css", "docs/feed.xml", "docs/js/blogs.json"):
        self.assertTrue((ROOT / path).is_file(), path)

def test_papers_use_upstream_frontend_schema(self):
    papers = json.loads((ROOT / "docs/js/papers.json").read_text(encoding="utf-8"))
    self.assertEqual(len(papers), 3)
    self.assertTrue(all("journal" in paper and "notebooklm_url" in paper for paper in papers))
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `python -m unittest tests.test_repository -v`

Expected: FAIL because blog files are absent and the three records still use `venue`/`notebooklmUrl`.

- [ ] **Step 3: Commit only after Tasks 2 and 3 make the contract pass**

The tests intentionally remain red until the restored frontend and data schema are implemented.

---

### Task 2: Restore and personalize the upstream public frontend

**Files:**
- Restore from upstream: `docs/blog.html`, `docs/css/blog.css`, `docs/images/preview.png`, `docs/js/theme.js`
- Create empty personal surfaces: `docs/feed.xml`, `docs/js/blogs.json`
- Replace from upstream then personalize: `docs/index.html`, `docs/paper.html`, `docs/css/style.css`, `docs/js/app.js`, `docs/js/paper.js`
- Remove: `docs/js/config.js`, `docs/js/paper-core.js`
- Test: `tests/test_repository.py`

**Interfaces:**
- Consumes: exact file bytes from `upstream/main` for the `docs/` baseline.
- Produces: upstream-compatible pages that load `docs/js/papers.json` directly and use the original browser field contract.

- [ ] **Step 1: Restore the complete upstream `docs/` tree**

Use `git restore --source=upstream/main --worktree -- docs` so deleted blog assets and posts return and rewritten frontend files match the upstream baseline before personalization.

- [ ] **Step 2: Apply only approved identity and topic substitutions**

In `docs/index.html`, `docs/paper.html`, `docs/blog.html`, feed metadata, and browser scripts where repository paths are embedded:

```text
Jingjing Zhai / Jingjing's / zhaijj
→ Shuo Xu / Shuo Xu's / shuo456

Plant Genomics · DNA Language Models · AI
→ Control Barrier Functions · Safe Control · Robot Learning
```

Keep all non-identity English UI copy unchanged. Ensure `getBasePath()` recognizes `shuo456.github.io` and returns `/paper-notebook`.

- [ ] **Step 3: Empty the blog without copying authorship or account integrations**

Replace the content between `BLOG_POSTS_START` and `BLOG_POSTS_END` with the original card-area structure containing `No posts yet.` Remove the original Umami script and Buttondown form, retain the RSS link, write `docs/js/blogs.json` as `[]`, write a valid item-free RSS channel for Shuo Xu, and ensure `docs/posts/` is absent.

- [ ] **Step 4: Add the minimal long-venue overflow correction**

Append a narrowly scoped rule without changing card dimensions or grid behavior:

```css
.journal-badge {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

Keep `.card-year` and `.read-checkbox` as non-shrinking upstream controls.

- [ ] **Step 5: Run the focused repository tests**

Run: `python -m unittest tests.test_repository -v`

Expected: blog-structure and identity assertions pass; schema assertion remains red until Task 3.

---

### Task 3: Convert the three papers and validated store to the upstream schema

**Files:**
- Modify: `docs/js/papers.json`
- Modify: `.agents/skills/add_to_notebook/scripts/paper_store.py`
- Modify: `.agents/skills/add_to_notebook/scripts/append_papers.py`
- Modify: `.agents/skills/link_notebooklm/scripts/update_notebooklm.py`
- Modify: `.agents/skills/add_to_notebook/SKILL.md`
- Modify: `.agents/skills/link_notebooklm/SKILL.md`
- Modify: `README.md`
- Modify: `tests/test_paper_store.py`
- Modify: `tests/test_repository.py`
- Modify: `tests/test_skills.py`

**Interfaces:**
- Consumes: candidate dictionaries accepted by `normalize_paper(record, date)`.
- Produces: upstream records with `journal: str`, `notebooklm_url: str`, and `notebooklm_notes: str`; preserves stable IDs, DOI normalization, title deduplication, validation, backups, and atomic replacement.

- [ ] **Step 1: Write failing schema normalization tests**

Update fixtures and assertions to require upstream keys and reject parallel camelCase notebook fields:

```python
normalized = normalize_paper({
    "id": "sample",
    "title": "Sample",
    "authors": ["A. Author"],
    "journal": "IEEE Transactions on Automatic Control",
    "year": 2024,
    "tags": ["safe control"],
}, "2026-08-18")
self.assertEqual(normalized["journal"], "IEEE Transactions on Automatic Control")
self.assertEqual(normalized["notebooklm_url"], "")
self.assertNotIn("venue", normalized)
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `python -m unittest tests.test_paper_store tests.test_repository tests.test_skills -v`

Expected: FAIL on the old `venue`, `venueType`, `notebooklmUrl`, and `notebooklmNotes` contract.

- [ ] **Step 3: Implement the minimal schema conversion**

Change canonical field names in the Python store and NotebookLM updater. Accept `venue` as an input alias only, normalize it into `journal`, and never write both forms. Use `notebooklm_url` and `notebooklm_notes` for persisted data.

- [ ] **Step 4: Convert exactly three sample records**

Keep the Ames CBF, Berkenkamp safe model-based RL, and Haarnoja SAC papers. Preserve their titles, authors, abstracts, tags, ratings, URLs, notes, and dates while writing only the upstream-compatible field names.

- [ ] **Step 5: Update workflow documentation**

Document `journal`, `notebooklm_url`, and `notebooklm_notes` in README and skills. Keep Firecrawl/NotebookLM optional and retain confirmation boundaries.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `python -m unittest tests.test_paper_store tests.test_repository tests.test_skills -v`

Expected: PASS.

- [ ] **Step 7: Commit the restored frontend and schema**

```bash
git add docs .agents README.md tests
git commit -m "feat: restore upstream paper notebook frontend"
```

---

### Task 4: Full automated and desktop-browser verification

**Files:**
- Modify only if a failing regression identifies a scoped defect.
- Test: `tests/paper-core.test.js` or replacement browser-independent JS tests
- Test: all Python tests

**Interfaces:**
- Consumes: static site at `http://localhost:8000/`.
- Produces: evidence that automated tests and desktop UI flows pass with no console errors.

- [ ] **Step 1: Reconcile JavaScript tests with restored upstream scripts**

Remove tests that import the deleted `paper-core.js`. Add source-contract tests for search/filter/read behavior only where upstream functions are testable without changing runtime structure.

- [ ] **Step 2: Run the complete automated suite**

Run: `npm test`

Expected: all Node and Python tests PASS with no warnings or errors.

- [ ] **Step 3: Run static integrity checks**

Run: `git diff --check`

Run a JSON parse check for `docs/js/papers.json` and `docs/js/blogs.json`. Confirm exactly three papers and scan tracked changes for secret-like values and local absolute paths.

- [ ] **Step 4: Verify the desktop site**

At a desktop viewport, verify:

1. Home page matches the upstream visual structure.
2. Three cards remain inside their boundaries; long journal text truncates and year/read controls remain visible.
3. Search, journal, tag, deep-note, read/unread, sort, and display-limit controls work.
4. All three paper detail pages load.
5. Empty blog index, empty RSS link, GitHub link, and dark mode work without original-owner analytics or subscription forms.
6. Browser console contains no errors.

- [ ] **Step 5: Review the final diff without publishing**

Run: `git status --short`, `git diff --stat upstream/main...HEAD`, and `git diff --check`.

Report local completion and wait for explicit commit/push or PR-update authorization if any uncommitted verification fixes remain.
