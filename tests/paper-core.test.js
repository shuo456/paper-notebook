import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePaper,
  normalizeDoi,
  normalizeTitle,
  isSafeHttpsUrl,
  filterPapers,
  sortPapers,
  selectVisiblePapers,
  renderSafeMarkdown,
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

const papers = [
  normalizePaper({ id: 'a', title: 'Control Barrier Functions', authors: ['A'], venue: 'IEEE TAC', year: 2024, tags: ['CBF'], abstract: 'Safe robots', addedDate: '2026-08-10', updatedDate: '', source: 'IEEE', rating: 5 }),
  normalizePaper({ id: 'b', title: 'Robot Reinforcement Learning', authors: ['B'], venue: 'CoRL', year: 2025, tags: ['RL'], abstract: 'Policy learning', addedDate: '2026-08-12', updatedDate: '2026-08-17', source: 'OpenReview', rating: 4, notebooklmUrl: 'https://notebooklm.google.com/notebook/example' }),
  normalizePaper({ id: 'c', title: 'Optimization', authors: ['Carol Chen'], venue: 'Automatica', year: 2023, tags: ['MPC'], abstract: 'Constrained control', addedDate: '2026-08-15', updatedDate: '', source: 'ScienceDirect', rating: 3 }),
];

test('filterPapers combines query venue tag unread and deep-notes constraints', () => {
  const result = filterPapers(papers, {
    query: 'policy',
    venue: 'CoRL',
    tag: 'RL',
    readMode: 'unread',
    deepNotesOnly: true,
    readIds: new Set(['a']),
  });
  assert.deepEqual(result.map((paper) => paper.id), ['b']);
});

test('filterPapers searches author abstract title and tags case-insensitively', () => {
  assert.deepEqual(filterPapers(papers, { query: 'carol chen' }).map((paper) => paper.id), ['c']);
  assert.deepEqual(filterPapers(papers, { query: 'safe robots' }).map((paper) => paper.id), ['a']);
  assert.deepEqual(filterPapers(papers, { query: 'rl' }).map((paper) => paper.id), ['b']);
});

test('sortPapers keeps unread papers first then applies newest effective date', () => {
  const result = sortPapers(papers, { mode: 'newest', readIds: new Set(['c']) });
  assert.deepEqual(result.map((paper) => paper.id), ['b', 'a', 'c']);
});

test('sortPapers supports oldest and rating modes without mutating input', () => {
  const original = papers.map((paper) => paper.id);
  assert.deepEqual(sortPapers(papers, { mode: 'oldest', readIds: new Set() }).map((paper) => paper.id), ['a', 'c', 'b']);
  assert.deepEqual(sortPapers(papers, { mode: 'rating', readIds: new Set() }).map((paper) => paper.id), ['a', 'b', 'c']);
  assert.deepEqual(papers.map((paper) => paper.id), original);
});

test('selectVisiblePapers applies filters sorting and display limit in one pipeline', () => {
  const result = selectVisiblePapers(papers, {
    query: '',
    venue: 'all',
    tag: null,
    readMode: 'all',
    deepNotesOnly: false,
    sortMode: 'newest',
    limit: 1,
    readIds: new Set(),
  });
  assert.deepEqual(result.map((paper) => paper.id), ['b']);
});

test('renderSafeMarkdown supports useful note formatting and HTTPS links', () => {
  const html = renderSafeMarkdown('## 结论\n\n**安全性**优先。\n\n- 使用 CBF\n- 验证约束\n\n[论文](https://example.com/paper)');
  assert.match(html, /<h2>结论<\/h2>/);
  assert.match(html, /<strong>安全性<\/strong>/);
  assert.match(html, /<ul><li>使用 CBF<\/li><li>验证约束<\/li><\/ul>/);
  assert.match(html, /href="https:\/\/example\.com\/paper"/);
});

test('renderSafeMarkdown escapes HTML and refuses unsafe link schemes', () => {
  const html = renderSafeMarkdown('<img src=x onerror=alert(1)> [危险](javascript:alert(1))');
  assert.doesNotMatch(html, /<img|href="javascript:/i);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /危险/);
});
