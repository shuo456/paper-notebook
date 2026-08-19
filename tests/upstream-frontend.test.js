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

test('paper data has exactly three upstream-compatible records', () => {
  const papers = JSON.parse(read('docs/js/papers.json'));
  assert.equal(papers.length, 3);
  assert.deepEqual(papers.map((paper) => paper.id), [
    'ames2017cbf', 'berkenkamp2017safe', 'haarnoja2018sac',
  ]);
  for (const paper of papers) {
    assert.equal(typeof paper.journal, 'string');
    assert.equal(typeof paper.notebooklm_url, 'string');
    assert.equal(typeof paper.notebooklm_notes, 'string');
    assert.equal('venue' in paper, false);
    assert.equal('notebooklmUrl' in paper, false);
  }
});

test('personal blog starts empty without original account integrations', () => {
  const blog = read('docs/blog.html');
  const posts = JSON.parse(read('docs/js/blogs.json'));
  assert.deepEqual(posts, []);
  assert.match(blog, /No posts yet/);
  assert.doesNotMatch(blog, /Jingjing|zhaijj|buttondown\.com|cloud\.umami\.is/i);
});
