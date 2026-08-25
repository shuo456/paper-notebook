import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('upstream home controls remain wired', () => {
  const html = read('docs/index.html');
  const script = read('docs/js/app.js');
  for (const id of [
    'search-input', 'journal-filters', 'deep-notes-toggle', 'unread-toggle',
    'read-only-toggle', 'sort-select', 'limit-select', 'papers-grid',
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  for (const name of [
    'renderJournalFilters', 'setupSearch', 'setupDeepNotesToggle',
    'setupUnreadToggle', 'setupReadToggle', 'setupSortSelect',
    'setupDisplayLimit', 'filterPapers', 'renderCards',
  ]) {
    assert.match(script, new RegExp(`function\\s+${name}\\s*\\(`));
  }
});

test('paper data has eighteen upstream-compatible records with detailed notes for new papers', () => {
  const papers = JSON.parse(read('docs/js/papers.json'));
  assert.equal(papers.length, 18);
  const expectedNewIds = new Set([
    'arxiv2608.19366', 'arxiv2608.19537', 'arxiv2608.19729',
    'arxiv2608.19836', 'arxiv2608.20275', 'arxiv2608.20467',
    'arxiv2608.20556', 'arxiv2608.20906', 'arxiv2608.21175',
    'arxiv2608.21204',
  ]);
  for (const paper of papers) {
    assert.equal(typeof paper.journal, 'string');
    assert.equal(typeof paper.notebooklm_url, 'string');
    assert.equal(typeof paper.notebooklm_notes, 'string');
    assert.equal('venue' in paper, false);
    assert.equal('notebooklmUrl' in paper, false);
    if (expectedNewIds.has(paper.id)) {
      for (const heading of ['核心问题', '核心方法', '主要结果', '局限性', '阅读建议']) {
        assert.match(paper.notes, new RegExp(heading), `${paper.id}: ${heading}`);
      }
      expectedNewIds.delete(paper.id);
    }
  }
  assert.deepEqual([...expectedNewIds], []);
});

test('personal blog starts empty without original account integrations', () => {
  const blog = read('docs/blog.html');
  const posts = JSON.parse(read('docs/js/blogs.json'));
  assert.deepEqual(posts, []);
  assert.match(blog, /No posts yet/);
  assert.doesNotMatch(blog, /Jingjing|zhaijj|buttondown\.com|cloud\.umami\.is/i);
});
