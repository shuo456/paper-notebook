# Personal Paper Notebook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork `zhaijj/paper-notebook` into a Chinese-first personal paper notebook for Shuo Xu, with a locally runnable static site, tested `papers.json` workflows, research-discovery Skills, and optional Firecrawl/NotebookLM automation.

**Architecture:** Keep the `docs/` GitHub Pages site as plain HTML, CSS, and ES modules. Put all testable normalization, filtering, sorting, and safe-markdown behavior in `docs/js/paper-core.js`; keep list/detail DOM code thin. Use Python standard-library scripts for validated, deduplicated, atomic JSON updates, and keep external MCP services behind documented Skills so the local site remains independent.

**Tech Stack:** HTML5, CSS3, browser ES modules, Node.js built-in test runner, Python 3 standard library, GitHub Pages, optional Firecrawl MCP and NotebookLM MCP.

**Spec:** `docs/superpowers/specs/2026-08-18-personal-paper-notebook-design.md`

## Global Constraints

- GitHub Pages must publish from `main/docs` with no frontend build step.
- Runtime frontend code must have no third-party dependencies.
- Interface copy is Chinese; paper titles, authors, abstracts, and venue names remain in their source language.
- The canonical paper fields are `venue`, `venueType`, `notebooklmUrl`, and `notebooklmNotes`; legacy fields are read-only compatibility inputs.
- Read state remains browser-local and uses one shared `localStorage` key on list and detail pages.
- Repository files must never contain API keys, cookies, OAuth credentials, or machine-specific absolute paths.
- Commit and push occur only after tests pass and the user explicitly confirms publication.
- New behavior follows strict red-green-refactor: write the named failing test, verify its expected failure, implement the minimum, then rerun the focused and full suites.

## File Map

- `package.json`: repeatable local test and preview commands; no runtime packages.
- `docs/js/config.js`: owner, repository, site copy, research interests, and read-state key.
- `docs/js/paper-core.js`: normalized paper model, filtering, sorting, deduplication helpers, URL checks, and safe Markdown rendering.
- `docs/js/app.js`: list-page data loading, state, DOM rendering, and event binding.
- `docs/js/paper.js`: detail-page loading, rendering, read toggle, and error states.
- `docs/index.html`, `docs/paper.html`, `docs/css/style.css`: Chinese static UI and responsive styling.
- `docs/js/papers.json`: exactly three public demonstration records covering plain notes, personal notes, and deep-notes states.
- `tests/paper-core.test.js`: Node tests for browser-independent JavaScript behavior.
- `.agents/skills/add_to_notebook/scripts/paper_store.py`: validation, defaults, deduplication, merge, backup, and atomic write primitives.
- `.agents/skills/add_to_notebook/scripts/append_papers.py`: CLI wrapper for dry-run and append.
- `.agents/skills/link_notebooklm/scripts/update_notebooklm.py`: CLI wrapper for reviewed NotebookLM updates.
- `tests/test_paper_store.py`: Python unit and filesystem tests for safe writes.
- `.agents/skills/discover-*/SKILL.md`: source-specific discovery instructions.
- `.agents/skills/add_to_notebook/SKILL.md`, `.agents/skills/link_notebooklm/SKILL.md`, `.agents/skills/publish_notebook/SKILL.md`: controlled mutation and publication workflows.
- `README.md`: Chinese setup, maintenance, local preview, GitHub Pages, and optional MCP configuration.

---

### Task 1: Establish the Personal Fork and Remote Topology

**Files:**
- No repository files change.

**Interfaces:**
- Consumes: authenticated GitHub account `shuo456` and the existing local clone.
- Produces: `upstream` pointing to `zhaijj/paper-notebook` and `origin` pointing to `shuo456/paper-notebook`.

- [ ] **Step 1: Restore GitHub authentication**

Run interactively:

```powershell
gh auth login --hostname github.com --web
```

Expected: the browser authorization completes for `shuo456`; no token is printed or copied into the repository.

- [ ] **Step 2: Verify the authenticated identity**

Run:

```powershell
gh auth status
gh api user --jq .login
```

Expected: authentication is valid and the second command prints `shuo456`.

- [ ] **Step 3: Create the GitHub fork without cloning again**

Run:

```powershell
gh repo fork zhaijj/paper-notebook --clone=false
```

Expected: GitHub reports `shuo456/paper-notebook`; if it already exists, verify it is a fork of `zhaijj/paper-notebook` before continuing.

- [ ] **Step 4: Correct the local remotes**

Run:

```powershell
git remote rename origin upstream
git remote add origin https://github.com/shuo456/paper-notebook.git
git remote -v
```

Expected: fetch/push URLs for `origin` use `shuo456`, while `upstream` uses `zhaijj`. Do not push in this task.

- [ ] **Step 5: Record the verified baseline**

Run:

```powershell
git status --short
git log -2 --oneline
```

Expected: the working tree is clean and the design commit `8a68774` is above the upstream baseline.

---

### Task 2: Build the Canonical Paper Core with Tests

**Files:**
- Create: `package.json`
- Create: `docs/js/config.js`
- Create: `docs/js/paper-core.js`
- Create: `tests/paper-core.test.js`

**Interfaces:**
- Consumes: raw objects from `papers.json`, read IDs as `Set<string>`, and filter options.
- Produces: `normalizePaper(raw)`, `normalizePapers(rawList)`, `filterPapers(papers, options)`, `sortPapers(papers, options)`, `effectiveDate(paper)`, `normalizeDoi(value)`, `normalizeTitle(value)`, and `isSafeHttpsUrl(value)`.

- [ ] **Step 1: Add the Node test command and the first failing normalization tests**

Create `package.json`:

```json
{
  "name": "shuo-xu-paper-notebook",
  "private": true,
  "type": "module",
  "scripts": {
    "test:js": "node --test tests/paper-core.test.js",
    "test:py": "python -m unittest discover -s tests -p test_*.py -v",
    "test": "npm run test:js && npm run test:py",
    "serve": "python -m http.server 8000 --directory docs"
  }
}
```

Create the start of `tests/paper-core.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePaper,
  normalizeDoi,
  normalizeTitle,
  isSafeHttpsUrl,
} from '../docs/js/paper-core.js';

test('normalizePaper converts legacy repository fields to the canonical model', () => {
  const paper = normalizePaper({
    id: 'ames2024cbf',
    title: 'Safe Control',
    authors: 'Alice Ames, Bob Li',
    journal: 'IEEE TAC',
    year: 2024,
    tags: ['CBF'],
    abstract: 'Abstract',
    addedDate: '2026-08-18',
    source: 'arXiv',
    notebooklm_url: 'https://notebooklm.google.com/notebook/example',
    notebooklm_notes: 'Deep notes',
  });

  assert.deepEqual(paper.authors, ['Alice Ames', 'Bob Li']);
  assert.equal(paper.venue, 'IEEE TAC');
  assert.equal(paper.notebooklmUrl, 'https://notebooklm.google.com/notebook/example');
  assert.equal(paper.notebooklmNotes, 'Deep notes');
});

test('identifier normalizers remove DOI wrappers and title punctuation', () => {
  assert.equal(normalizeDoi('https://doi.org/10.1109/TAC.2024.1'), '10.1109/tac.2024.1');
  assert.equal(normalizeTitle(' Safe-Control: A Survey! '), 'safe control a survey');
});

test('external URL policy accepts only HTTPS URLs', () => {
  assert.equal(isSafeHttpsUrl('https://arxiv.org/abs/2401.00001'), true);
  assert.equal(isSafeHttpsUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpsUrl('http://example.com'), false);
});
```

- [ ] **Step 2: Run the normalization tests and verify the expected failure**

Run:

```powershell
npm run test:js
```

Expected: FAIL because `docs/js/paper-core.js` does not exist.

- [ ] **Step 3: Implement the canonical configuration and normalization functions**

Create `docs/js/config.js`:

```js
export const SITE_CONFIG = Object.freeze({
  owner: 'Shuo Xu',
  githubOwner: 'shuo456',
  repository: 'paper-notebook',
  title: 'Shuo Xu 的论文笔记',
  subtitle: '安全控制 · 机器人学习 · 强化学习',
  researchInterests: [
    '控制障碍函数',
    '安全控制',
    '安全关键系统',
    '机器人学习',
    '强化学习',
  ],
  readStorageKey: 'shuo-xu-paper-notebook-read',
});
```

Create `docs/js/paper-core.js` with these exact exported contracts:

```js
export function normalizeDoi(value = '') {
  return String(value).trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase();
}

export function normalizeTitle(value = '') {
  return String(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function isSafeHttpsUrl(value = '') {
  if (!value) return true;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

export function normalizePaper(raw) {
  const authors = Array.isArray(raw.authors)
    ? raw.authors.map(String)
    : String(raw.authors || '').split(',').map((item) => item.trim()).filter(Boolean);
  return {
    id: String(raw.id || '').trim(),
    title: String(raw.title || '').trim(),
    authors,
    venue: String(raw.venue || raw.journal || '').trim(),
    venueType: String(raw.venueType || 'other'),
    year: Number(raw.year || 0),
    publishedDate: String(raw.publishedDate || ''),
    doi: normalizeDoi(raw.doi),
    url: isSafeHttpsUrl(raw.url) ? String(raw.url || '') : '',
    pdfUrl: isSafeHttpsUrl(raw.pdfUrl) ? String(raw.pdfUrl || '') : '',
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    rating: Number(raw.rating || 0),
    abstract: String(raw.abstract || ''),
    notes: String(raw.notes || ''),
    addedDate: String(raw.addedDate || ''),
    updatedDate: String(raw.updatedDate || ''),
    source: String(raw.source || raw.venue || raw.journal || ''),
    notebooklmUrl: isSafeHttpsUrl(raw.notebooklmUrl || raw.notebooklm_url)
      ? String(raw.notebooklmUrl || raw.notebooklm_url || '') : '',
    notebooklmNotes: String(raw.notebooklmNotes || raw.notebooklm_notes || ''),
  };
}

export function normalizePapers(rawList) {
  return Array.isArray(rawList) ? rawList.map(normalizePaper) : [];
}
```

- [ ] **Step 4: Verify normalization passes**

Run `npm run test:js`.

Expected: all three tests PASS.

- [ ] **Step 5: Add failing combination-filter and sorting tests**

Append to `tests/paper-core.test.js`:

```js
import { filterPapers, sortPapers } from '../docs/js/paper-core.js';

const papers = [
  normalizePaper({ id: 'a', title: 'Control Barrier Functions', authors: ['A'], venue: 'IEEE TAC', year: 2024, tags: ['CBF'], abstract: 'Safe robots', addedDate: '2026-08-10', updatedDate: '', source: 'IEEE', rating: 5 }),
  normalizePaper({ id: 'b', title: 'Robot Reinforcement Learning', authors: ['B'], venue: 'CoRL', year: 2025, tags: ['RL'], abstract: 'Policy learning', addedDate: '2026-08-12', updatedDate: '2026-08-17', source: 'OpenReview', rating: 4, notebooklmUrl: 'https://notebooklm.google.com/notebook/example' }),
  normalizePaper({ id: 'c', title: 'Optimization', authors: ['Carol Chen'], venue: 'Automatica', year: 2023, tags: ['MPC'], abstract: 'Constrained control', addedDate: '2026-08-15', updatedDate: '', source: 'ScienceDirect', rating: 3 }),
];

test('filterPapers combines query venue tag unread and deep-notes constraints', () => {
  const result = filterPapers(papers, {
    query: 'policy', venue: 'CoRL', tag: 'RL', readMode: 'unread', deepNotesOnly: true,
    readIds: new Set(['a']),
  });
  assert.deepEqual(result.map((paper) => paper.id), ['b']);
});

test('filterPapers searches author abstract title and tags case-insensitively', () => {
  assert.deepEqual(filterPapers(papers, { query: 'carol chen' }).map((p) => p.id), ['c']);
  assert.deepEqual(filterPapers(papers, { query: 'safe robots' }).map((p) => p.id), ['a']);
  assert.deepEqual(filterPapers(papers, { query: 'rl' }).map((p) => p.id), ['b']);
});

test('sortPapers keeps unread papers first then applies newest effective date', () => {
  const result = sortPapers(papers, { mode: 'newest', readIds: new Set(['c']) });
  assert.deepEqual(result.map((paper) => paper.id), ['b', 'a', 'c']);
});

test('sortPapers supports oldest and rating modes without mutating input', () => {
  const original = papers.map((paper) => paper.id);
  assert.deepEqual(sortPapers(papers, { mode: 'oldest', readIds: new Set() }).map((p) => p.id), ['a', 'c', 'b']);
  assert.deepEqual(sortPapers(papers, { mode: 'rating', readIds: new Set() }).map((p) => p.id), ['a', 'b', 'c']);
  assert.deepEqual(papers.map((paper) => paper.id), original);
});
```

- [ ] **Step 6: Run the focused tests and verify missing exports fail**

Run `npm run test:js`.

Expected: FAIL because `filterPapers` and `sortPapers` are not exported.

- [ ] **Step 7: Implement filtering and sorting**

Add to `paper-core.js`:

```js
export function effectiveDate(paper) {
  return Date.parse(paper.updatedDate || paper.addedDate || `${paper.year}-01-01`) || 0;
}

export function filterPapers(papers, options = {}) {
  const query = String(options.query || '').trim().toLowerCase();
  const readIds = options.readIds || new Set();
  return papers.filter((paper) => {
    const haystack = [paper.title, paper.authors.join(' '), paper.abstract, paper.tags.join(' ')].join(' ').toLowerCase();
    const isRead = readIds.has(paper.id);
    return (!query || haystack.includes(query))
      && (!options.venue || options.venue === 'all' || paper.venue === options.venue)
      && (!options.tag || paper.tags.includes(options.tag))
      && (!options.deepNotesOnly || Boolean(paper.notebooklmNotes || paper.notebooklmUrl))
      && (options.readMode !== 'read' || isRead)
      && (options.readMode !== 'unread' || !isRead);
  });
}

export function sortPapers(papers, options = {}) {
  const readIds = options.readIds || new Set();
  const mode = options.mode || 'newest';
  return [...papers].sort((left, right) => {
    const readDelta = Number(readIds.has(left.id)) - Number(readIds.has(right.id));
    if (readDelta) return readDelta;
    if (mode === 'rating') return right.rating - left.rating || effectiveDate(right) - effectiveDate(left);
    if (mode === 'oldest') return effectiveDate(left) - effectiveDate(right);
    return effectiveDate(right) - effectiveDate(left);
  });
}
```

- [ ] **Step 8: Run the full JavaScript suite and commit**

Run `npm run test:js`.

Expected: seven tests PASS with no warnings.

Commit:

```powershell
git add package.json docs/js/config.js docs/js/paper-core.js tests/paper-core.test.js
git commit -m "feat: add tested canonical paper model"
```

---

### Task 3: Rebuild the Chinese List Page on the Core API

**Files:**
- Modify: `docs/index.html`
- Modify: `docs/js/app.js`
- Modify: `docs/css/style.css`
- Modify: `tests/paper-core.test.js`
- Modify: `docs/js/paper-core.js`

**Interfaces:**
- Consumes: `SITE_CONFIG`, `normalizePapers`, `filterPapers`, and `sortPapers`.
- Produces: a list page with one `viewState` object `{ query, venue, tag, readMode, deepNotesOnly, sortMode, limit }`, URL-safe paper links, visible active-tag clearing, persistent read state, and Chinese errors.

- [ ] **Step 1: Add a failing list-view pipeline test**

Append to `tests/paper-core.test.js`:

```js
import { selectVisiblePapers } from '../docs/js/paper-core.js';

test('selectVisiblePapers applies filters sorting and display limit in one pipeline', () => {
  const result = selectVisiblePapers(papers, {
    query: '', venue: 'all', tag: null, readMode: 'all', deepNotesOnly: false,
    sortMode: 'newest', limit: 1, readIds: new Set(),
  });
  assert.deepEqual(result.map((paper) => paper.id), ['b']);
});
```

- [ ] **Step 2: Verify the pipeline test fails**

Run `npm run test:js`.

Expected: FAIL because `selectVisiblePapers` is not exported.

- [ ] **Step 3: Implement the list-view pipeline**

Add to `paper-core.js`:

```js
export function selectVisiblePapers(papers, state) {
  const filtered = filterPapers(papers, {
    query: state.query,
    venue: state.venue,
    tag: state.tag,
    readMode: state.readMode,
    deepNotesOnly: state.deepNotesOnly,
    readIds: state.readIds,
  });
  const sorted = sortPapers(filtered, { mode: state.sortMode, readIds: state.readIds });
  return state.limit > 0 ? sorted.slice(0, state.limit) : sorted;
}
```

Run `npm run test:js`; expected: eight tests PASS.

- [ ] **Step 4: Replace the list page with Chinese semantic controls**

Update `docs/index.html` to:

- import `js/app.js` as `<script type="module" src="js/app.js"></script>`;
- show “Shuo Xu 的论文笔记”, “控制障碍函数 · 安全控制 · 安全关键系统 · 机器人学习 · 强化学习”;
- retain element IDs `search-input`, `venue-filters`, `deep-notes-toggle`, `unread-toggle`, `read-only-toggle`, `sort-select`, `limit-select`, `papers-grid`, `stat-count`, `stat-venues`, and `stat-year`;
- add `active-tag` with a `clear-tag` button;
- remove Blog links and all `zhaijj` references;
- include a hidden `load-error` region with `role="alert"` and a retry button.

- [ ] **Step 5: Rewrite `app.js` as a thin ES-module controller**

Use these imports and state shape:

```js
import { SITE_CONFIG } from './config.js';
import { normalizePapers, selectVisiblePapers } from './paper-core.js';

const state = {
  papers: [], query: '', venue: 'all', tag: null, readMode: 'all',
  deepNotesOnly: false, sortMode: 'newest', limit: 50, readIds: new Set(),
};
```

The controller must:

- fetch `./js/papers.json` through `new URL('./papers.json', import.meta.url)`;
- catch HTTP and JSON failures, clear loading content, and show `load-error` with “论文数据加载失败，请检查 papers.json 后重试。”;
- render venue chips from normalized data and use `venue` rather than `journal`;
- render all user data with `textContent` and build external links only after checking normalized safe URLs;
- call `selectVisiblePapers(state.papers, state)` on every state change;
- make read-only and unread-only mutually exclusive through `state.readMode`;
- persist `[...state.readIds]` under `SITE_CONFIG.readStorageKey`;
- show the active tag and clear button whenever `state.tag` is not null;
- use `paper.html?id=${encodeURIComponent(paper.id)}` for detail links;
- display “没有符合当前条件的论文” when the visible set is empty.

- [ ] **Step 6: Adapt the stylesheet without changing the visual identity unnecessarily**

In `docs/css/style.css`:

- rename journal-specific selectors to venue-neutral selectors where they are used by the new markup;
- add visible focus styles for controls and links;
- add styles for `.active-tag`, `.load-error`, `.paper-card--read`, and responsive filter wrapping;
- preserve the existing light/dark variables and card layout;
- ensure controls remain usable at 360 px viewport width.

- [ ] **Step 7: Run automated tests and a local browser check**

Run:

```powershell
npm run test:js
npm run serve
```

Open `http://localhost:8000/` and verify search, venue, tag, read/unread, deep notes, sorting, limit, theme, empty result, and refresh persistence. Expected: all eight tests PASS and the browser console has no errors.

- [ ] **Step 8: Commit the list page**

```powershell
git add docs/index.html docs/js/app.js docs/js/paper-core.js docs/css/style.css tests/paper-core.test.js
git commit -m "feat: rebuild Chinese paper list and filters"
```

---

### Task 4: Rebuild the Detail Page and Safe Markdown Rendering

**Files:**
- Modify: `docs/paper.html`
- Modify: `docs/js/paper.js`
- Modify: `docs/css/style.css`
- Modify: `docs/js/paper-core.js`
- Modify: `tests/paper-core.test.js`

**Interfaces:**
- Consumes: normalized `Paper`, `SITE_CONFIG.readStorageKey`, and query parameter `id`.
- Produces: `renderSafeMarkdown(markdown): string`, a Chinese detail page, shared read status, safe external links, and explicit missing/loading errors.

- [ ] **Step 1: Add failing safe-Markdown tests**

Append:

```js
import { renderSafeMarkdown } from '../docs/js/paper-core.js';

test('renderSafeMarkdown supports headings emphasis lists and HTTPS links', () => {
  const html = renderSafeMarkdown('## 结论\n\n- **安全** 控制\n- [论文](https://example.org/paper)');
  assert.match(html, /<h2>结论<\/h2>/);
  assert.match(html, /<strong>安全<\/strong>/);
  assert.match(html, /href="https:\/\/example\.org\/paper"/);
});

test('renderSafeMarkdown escapes HTML and drops dangerous link schemes', () => {
  const html = renderSafeMarkdown('<img src=x onerror=alert(1)> [bad](javascript:alert(1))');
  assert.doesNotMatch(html, /<img|href="javascript:/i);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});
```

- [ ] **Step 2: Verify safe-Markdown tests fail**

Run `npm run test:js`.

Expected: FAIL because `renderSafeMarkdown` is not exported.

- [ ] **Step 3: Implement the controlled Markdown subset**

In `paper-core.js`, implement `escapeHtml`, safe inline formatting for `**strong**`, `*emphasis*`, and `[label](https://...)`, plus line-level `##`, `###`, unordered lists, and paragraphs. `renderSafeMarkdown` must escape the entire source before applying the controlled transformations and must emit `rel="noopener noreferrer"` on links. Do not support raw HTML.

Run `npm run test:js`; expected: ten tests PASS.

- [ ] **Step 4: Replace detail-page branding and markup**

Update `docs/paper.html` to:

- use Chinese navigation, labels, buttons, and error copy;
- remove Blog and hard-coded Utterances integration;
- retain stable element IDs needed by `paper.js` for title, authors, venue, year, DOI, tags, abstract, notes, deep notes, links, and read toggle;
- load `paper.js` as an ES module;
- hide DOI, PDF, paper URL, and NotebookLM buttons independently when their values are empty.

- [ ] **Step 5: Rewrite `paper.js` using normalized data and safe rendering**

The module must:

- read `id` with `new URLSearchParams(location.search).get('id')`;
- fetch and normalize the same `papers.json` URL as the list page;
- compare IDs exactly after decoding the query parameter;
- populate plain fields with `textContent`;
- populate `notes` and `notebooklmNotes` only with `renderSafeMarkdown` output;
- use safe normalized URLs for external buttons;
- share `SITE_CONFIG.readStorageKey` with the list page;
- display “未指定论文 ID”、“未找到这篇论文” or “论文数据加载失败” as distinct error states;
- update `document.title` to `${paper.title} | ${SITE_CONFIG.title}`.

- [ ] **Step 6: Verify the detail page in the browser**

With `npm run serve` running, open:

```text
http://localhost:8000/paper.html?id=ames2017cbf
http://localhost:8000/paper.html?id=missing
http://localhost:8000/paper.html
```

Expected: the first renders content and shares read state with the list; the second and third show their specific Chinese errors; theme and back link work; console remains clean.

- [ ] **Step 7: Commit the detail page**

```powershell
git add docs/paper.html docs/js/paper.js docs/js/paper-core.js docs/css/style.css tests/paper-core.test.js
git commit -m "feat: add safe Chinese paper detail page"
```

---

### Task 5: Replace the Dataset and Harden JSON Mutation Scripts

**Files:**
- Create: `.agents/skills/add_to_notebook/scripts/paper_store.py`
- Modify: `.agents/skills/add_to_notebook/scripts/append_papers.py`
- Modify: `.agents/skills/link_notebooklm/scripts/update_notebooklm.py`
- Create: `tests/test_paper_store.py`
- Replace: `docs/js/papers.json`

**Interfaces:**
- Consumes: canonical paper arrays and an injectable date string.
- Produces: `validate_paper(paper)`, `paper_identity(paper)`, `merge_papers(existing, candidates, today)`, `load_json_array(path)`, and `atomic_write_json(path, data)`.

- [ ] **Step 1: Write failing Python validation and deduplication tests**

Create `tests/test_paper_store.py`:

```python
import json
import tempfile
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
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "papers.json"
            target.write_text(json.dumps([paper()]), encoding="utf-8")
            atomic_write_json(target, [paper(id="new-id")])
            self.assertEqual(json.loads(target.read_text(encoding="utf-8"))[0]["id"], "new-id")
            self.assertTrue(target.with_suffix(".json.bak").exists())


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Verify the Python tests fail for the missing module**

Run `npm run test:py`.

Expected: FAIL with `ModuleNotFoundError: No module named 'paper_store'`.

- [ ] **Step 3: Implement `paper_store.py`**

Implement:

```python
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
```

`validate_paper` must collect every field error before raising. Required fields are `id`, `title`, `authors`, `venue`, `year`, `tags`, `abstract`, `addedDate`, and `source`. Validate arrays, integer year, integer rating 0–5, ISO dates, and empty-or-HTTPS URL fields. `merge_papers` must validate existing and candidate arrays before merging, normalize DOI and title exactly like `paper-core.js`, and deduplicate in `id`, DOI, title order. `atomic_write_json` must write UTF-8 JSON to a temporary sibling, parse it once, copy the current target to `papers.json.bak`, then replace the target with `Path.replace`.

- [ ] **Step 4: Make the Python tests pass**

Run `npm run test:py`.

Expected: three tests PASS.

- [ ] **Step 5: Rewrite the append CLI around the tested store**

`append_papers.py` must accept the existing arguments plus `--date YYYY-MM-DD`; use today's date only when the flag is omitted; print duplicate reason per skipped item; print the complete dry-run summary without writing; call `atomic_write_json` only when at least one item is added. Remove plant-specific aliases and warning-only validation.

- [ ] **Step 6: Rewrite the NotebookLM update CLI with canonical fields**

`update_notebooklm.py` must use `notebooklmUrl` and `notebooklmNotes`, reject non-HTTPS NotebookLM URLs, support `--dry-run`, and add `--force`. If either canonical field already exists and `--force` is absent, exit nonzero without changing the file. Validate the complete updated array and use `atomic_write_json`.

- [ ] **Step 7: Replace `papers.json` with three validated public examples**

Use these three real, publicly accessible records, verifying the listed metadata against the linked primary publication pages before writing:

1. `ames2017cbf`: Aaron D. Ames, Xiangru Xu, Jessy W. Grizzle, and Paulo Tabuada, “Control Barrier Function Based Quadratic Programs for Safety Critical Systems,” *IEEE Transactions on Automatic Control* 62(8), 2017, DOI `10.1109/TAC.2016.2638961`, URL `https://doi.org/10.1109/TAC.2016.2638961`; leave both note fields empty.
2. `berkenkamp2017safe`: Felix Berkenkamp, Matteo Turchetta, Angela P. Schoellig, and Andreas Krause, “Safe Model-based Reinforcement Learning with Stability Guarantees,” *Advances in Neural Information Processing Systems 30*, 2017, URL `https://proceedings.neurips.cc/paper/2017/hash/766ebcd59621e305170616ba3d3dac32-Abstract.html`; add personal notes beginning with `## 示例笔记` and leave NotebookLM fields empty.
3. `haarnoja2018sac`: Tuomas Haarnoja, Aurick Zhou, Pieter Abbeel, and Sergey Levine, “Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor,” *Proceedings of Machine Learning Research* 80, 2018, URL `https://proceedings.mlr.press/v80/haarnoja18b.html`, PDF `https://proceedings.mlr.press/v80/haarnoja18b/haarnoja18b.pdf`; set `notebooklmUrl` to an empty string and begin `notebooklmNotes` with `## NotebookLM 示例笔记`.

Do not invent a DOI for records 2 or 3; use an empty string. Run the append CLI in dry-run mode against an empty temporary JSON array before replacing `docs/js/papers.json`.

- [ ] **Step 8: Run both suites and exercise dry-run behavior**

Run:

```powershell
npm test
python .agents/skills/add_to_notebook/scripts/append_papers.py --papers-json docs/js/papers.json --new-entries docs/js/papers.json --dry-run --date 2026-08-18
```

Expected: JavaScript and Python tests PASS; dry-run reports all three records as duplicates and leaves the dataset byte-for-byte unchanged.

- [ ] **Step 9: Commit the safe data layer**

```powershell
git add docs/js/papers.json .agents/skills/add_to_notebook/scripts .agents/skills/link_notebooklm/scripts tests/test_paper_store.py
git commit -m "feat: add validated atomic paper data workflow"
```

---

### Task 6: Replace Biology Discovery Skills with Control and Robotics Workflows

**Files:**
- Delete: `.agents/skills/all_journals_researcher/`
- Delete: `.agents/skills/biorxiv_researcher/`
- Delete: `.agents/skills/cell_genomics_researcher/`
- Delete: `.agents/skills/cell_researcher/`
- Delete: `.agents/skills/current_biology_researcher/`
- Delete: `.agents/skills/daily_arxiv_researcher/`
- Delete: `.agents/skills/genome_biology_researcher/`
- Delete: `.agents/skills/genome_research_researcher/`
- Delete: `.agents/skills/mbe_researcher/`
- Delete: `.agents/skills/nature_biotechnology_researcher/`
- Delete: `.agents/skills/nature_genetics_researcher/`
- Delete: `.agents/skills/nature_methods_researcher/`
- Delete: `.agents/skills/nature_plants_researcher/`
- Delete: `.agents/skills/nature_researcher/`
- Delete: `.agents/skills/pnas_researcher/`
- Delete: `.agents/skills/publish_blog/`
- Delete: `.agents/skills/science_researcher/`
- Create: `.agents/skills/discover-arxiv/SKILL.md`
- Create: `.agents/skills/discover-journals/SKILL.md`
- Create: `.agents/skills/discover-conferences/SKILL.md`
- Create: `.agents/skills/discover-all/SKILL.md`
- Modify: `.agents/skills/add_to_notebook/SKILL.md`
- Modify: `.agents/skills/link_notebooklm/SKILL.md`
- Create: `.agents/skills/publish_notebook/SKILL.md`

**Interfaces:**
- Consumes: canonical paper schema, research interests, Firecrawl tools when configured, NotebookLM tools when configured, and user selections.
- Produces: candidate JSON objects compatible with `append_papers.py`, reviewed NotebookLM updates, and a publication checklist that never pushes implicitly.

- [ ] **Step 1: Remove the biology and blog Skills**

Delete only the directories listed in this task. Keep `add_to_notebook` and `link_notebooklm` because their scripts were upgraded in Task 5.

- [ ] **Step 2: Create `discover-arxiv`**

The Skill must:

- inspect `cs.RO`, `cs.LG`, and `eess.SY` for the latest seven days;
- prioritize control barrier functions, safe control, safety-critical systems, robot learning, and reinforcement learning;
- prefer arXiv RSS/API without Firecrawl, using Firecrawl only for missing abstract-page details;
- extract canonical candidate fields including arXiv URL and PDF URL;
- compare normalized IDs, DOI values, and titles with `docs/js/papers.json` before presenting results;
- end by asking the user for numbered selections and handing only selected candidates to `add_to_notebook`.

- [ ] **Step 3: Create `discover-journals`**

Use IEEE TAC, Automatica, IEEE RA-L, IEEE T-RO, and IJRR as exact tracked venues. Prefer official latest-article, early-access, or RSS pages. For each source, record success, empty result, or failure independently; never replace a failed current query with old papers. Firecrawl calls require `FIRECRAWL_API_KEY` but the Skill must accept user-supplied paper URLs when Firecrawl is unavailable.

- [ ] **Step 4: Create `discover-conferences`**

Use official proceedings or OpenReview pages for ICRA, IROS, CoRL, RSS, NeurIPS, and ICML. Restrict results to the latest available event cycle and explicitly state the event year. Return an empty group when proceedings are not yet public rather than searching past years.

- [ ] **Step 5: Create `discover-all`**

Define three independent collection groups: arXiv, journals, conferences. Merge their compact JSON results, prefer complete formal-publication entries over preprints, deduplicate against the local dataset, and present one continuous numbered list grouped by source. A failed group must be reported while successful groups continue.

- [ ] **Step 6: Rewrite controlled mutation Skills**

`add_to_notebook/SKILL.md` must require selection, canonical fields, dry-run, validation, append, local preview, and a result summary; it must not commit or push.

`link_notebooklm/SKILL.md` must locate a notebook by user-provided ID, URL, or confirmed title match; save generated Markdown for review; stop for user approval; and call `update_notebooklm.py` only after approval. Existing notes require a separate overwrite confirmation and `--force`.

`publish_notebook/SKILL.md` must run `npm test`, start the static server, verify list/detail pages, scan for sensitive values, show `git status --short` and the proposed commit message, and stop for explicit user confirmation before commit and push.

- [ ] **Step 7: Audit the new Skills for stale domain and machine references**

Run:

```powershell
rg -n "plant genomics|maize|Nature Plants|Jingjing|zhaijj|/Users/|notebooklm_url|notebooklm_notes|git push" .agents README.md docs
```

Expected at this stage: no stale biology, owner, machine-path, or legacy-field references in `.agents`; `git push` appears only inside the explicitly confirmed branch of `publish_notebook`.

- [ ] **Step 8: Commit the new Skill set**

```powershell
git add -A .agents/skills
git commit -m "feat: add control and robotics research skills"
```

---

### Task 7: Remove the Blog, Document Setup, and Complete Local Verification

**Files:**
- Delete: `docs/blog.html`
- Delete: `docs/css/blog.css`
- Delete: `docs/feed.xml`
- Delete: `docs/js/blogs.json`
- Delete: `docs/posts/`
- Modify: `README.md`
- Modify: `.gitignore`
- Modify: `docs/index.html`
- Modify: `docs/paper.html`

**Interfaces:**
- Consumes: the finished static site, test commands, and local workflows.
- Produces: a repo-neutral Chinese README, secret-safe ignored files, and a clean local release candidate.

- [ ] **Step 1: Delete the approved blog surface**

Remove the five paths listed above. Search `docs/index.html`, `docs/paper.html`, and `docs/css/style.css` for dangling `blog`, `feed.xml`, and `posts/` references and remove them.

- [ ] **Step 2: Write the Chinese README**

Document these exact sections:

1. 项目简介与在线地址 `https://shuo456.github.io/paper-notebook/`;
2. 本地运行: `npm run serve`, then open `http://localhost:8000/`;
3. 测试: `npm test`;
4. `papers.json` canonical field table and three-level deduplication;
5. manual dry-run and append commands;
6. the seven `.agents/skills` and their invocation examples;
7. GitHub Pages from `main/docs`;
8. Firecrawl configuration via `FIRECRAWL_API_KEY` with no literal key value;
9. NotebookLM Google authorization and manual URL/Markdown fallback;
10. publication safety: preview and explicit confirmation before push.

- [ ] **Step 3: Extend ignored local-secret patterns**

Add to `.gitignore`:

```gitignore
# Local secrets and MCP state
.env
.env.*
!.env.example
.mcp.json
mcp_config.json
*.cookies.json

# Python and Node local state
__pycache__/
*.pyc
node_modules/
```

- [ ] **Step 4: Run all automated checks**

Run:

```powershell
npm test
python -m json.tool docs/js/papers.json
git diff --check
```

Expected: all JavaScript and Python tests PASS, JSON parsing succeeds, and Git reports no whitespace errors.

- [ ] **Step 5: Run stale-brand and sensitive-value scans**

Run:

```powershell
rg -n "Jingjing|zhaijj|plant genomics|maize|/Users/|C:\\Users\\|FIRECRAWL_API_KEY\s*=\s*\S+|AIza[0-9A-Za-z_-]{20,}|ghp_[0-9A-Za-z]{20,}" README.md docs .agents
```

Expected: no matches. The README may name `FIRECRAWL_API_KEY` without assigning a value, so its syntax must avoid `=` followed by a token.

- [ ] **Step 6: Perform the final desktop and mobile browser pass**

Run `npm run serve` and verify at 1280 px and 360 px widths:

- three cards render with correct venues, tags, and note badges;
- every filter can combine and clear;
- read state survives refresh and is shared with detail pages;
- all three detail pages work;
- missing ID, unknown ID, empty search, and malformed-data error states are readable;
- external links open only HTTPS targets;
- light/dark theme works;
- browser console has no errors or warnings.

- [ ] **Step 7: Commit the local release candidate**

```powershell
git add -A README.md .gitignore docs
git commit -m "docs: finalize personal paper notebook setup"
```

---

### Task 8: Publish the Verified Fork and Enable GitHub Pages

**Files:**
- No planned repository content changes; only a versioned fix is allowed if deployment verification exposes a reproducible defect, and that fix must start with a failing test.

**Interfaces:**
- Consumes: a clean, fully tested local branch and explicit user publication confirmation.
- Produces: pushed `shuo456/paper-notebook` and an enabled GitHub Pages site.

- [ ] **Step 1: Re-run release verification immediately before publication**

Run:

```powershell
npm test
git status --short
git log --oneline upstream/main..HEAD
```

Expected: all tests PASS, the working tree is clean, and the log shows the design plus implementation commits intended for the fork.

- [ ] **Step 2: Present the publication summary and request explicit confirmation**

Show the user:

- target remote `https://github.com/shuo456/paper-notebook`;
- commits in `upstream/main..HEAD`;
- exact command `git push -u origin main`;
- note that the remote website will become public.

Stop until the user explicitly confirms.

- [ ] **Step 3: Push after confirmation**

Run:

```powershell
git push -u origin main
```

Expected: `origin/main` advances to the verified local `main`.

- [ ] **Step 4: Enable GitHub Pages from `main/docs`**

First inspect current state:

```powershell
gh api repos/shuo456/paper-notebook/pages
```

If Pages is not configured, run:

```powershell
gh api -X POST repos/shuo456/paper-notebook/pages -F "source[branch]=main" -F "source[path]=/docs"
```

If Pages exists with a different source, run:

```powershell
gh api -X PUT repos/shuo456/paper-notebook/pages -F "source[branch]=main" -F "source[path]=/docs"
```

- [ ] **Step 5: Verify the deployed site**

Check:

```text
https://shuo456.github.io/paper-notebook/
https://shuo456.github.io/paper-notebook/paper.html?id=ames2017cbf
```

Expected: both return successfully, assets load under `/paper-notebook/`, list/detail navigation works, and the deployed browser console is clean.

- [ ] **Step 6: Report optional MCP configuration still needed**

Report without requesting secrets in chat:

- Firecrawl automation needs the user's `FIRECRAWL_API_KEY` placed in the local MCP environment.
- NotebookLM automation needs the user's local Google/NotebookLM authorization.
- The site and manual paper workflow are already complete without either service.

Do not configure or test either external account until the user supplies or authorizes it through the supported local setup flow.
