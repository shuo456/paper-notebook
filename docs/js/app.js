import { SITE_CONFIG } from './config.js';
import { normalizePapers, selectVisiblePapers } from './paper-core.js';

const state = {
  papers: [], query: '', venue: 'all', tag: null, readMode: 'all',
  deepNotesOnly: false, sortMode: 'newest', limit: 50, readIds: new Set(),
};
const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  applySiteConfig();
  state.readIds = loadReadIds();
  bindControls();
  loadPapers();
});

function cacheElements() {
  for (const id of ['papers-grid', 'venue-filters', 'search-input', 'deep-notes-toggle', 'unread-toggle', 'read-only-toggle', 'sort-select', 'limit-select', 'active-tag', 'active-tag-name', 'clear-tag', 'load-error', 'retry-load', 'stat-count', 'stat-venues', 'stat-year', 'nav-count']) {
    elements[id] = document.getElementById(id);
  }
}

function applySiteConfig() {
  document.title = SITE_CONFIG.title;
  document.getElementById('site-title').textContent = SITE_CONFIG.title;
  document.getElementById('site-owner').textContent = SITE_CONFIG.owner;
  document.getElementById('site-subtitle').textContent = SITE_CONFIG.subtitle;
  document.getElementById('github-link').href = `https://github.com/${SITE_CONFIG.githubOwner}/${SITE_CONFIG.repository}`;
}

function loadReadIds() {
  try {
    const value = JSON.parse(localStorage.getItem(SITE_CONFIG.readStorageKey) || '[]');
    return new Set(Array.isArray(value) ? value.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds() {
  localStorage.setItem(SITE_CONFIG.readStorageKey, JSON.stringify([...state.readIds]));
}

async function loadPapers() {
  elements['load-error'].hidden = true;
  showLoading();
  try {
    const response = await fetch(new URL('./papers.json', import.meta.url));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const value = await response.json();
    if (!Array.isArray(value)) throw new TypeError('papers.json 顶层必须是数组');
    state.papers = normalizePapers(value);
    renderStats();
    renderVenueFilters();
    render();
  } catch (error) {
    console.error('论文数据加载失败:', error);
    state.papers = [];
    elements['papers-grid'].replaceChildren();
    elements['load-error'].hidden = false;
  }
}

function bindControls() {
  elements['search-input'].addEventListener('input', (event) => { state.query = event.target.value; render(); });
  elements['deep-notes-toggle'].addEventListener('click', () => { state.deepNotesOnly = !state.deepNotesOnly; render(); });
  elements['unread-toggle'].addEventListener('click', () => { state.readMode = state.readMode === 'unread' ? 'all' : 'unread'; render(); });
  elements['read-only-toggle'].addEventListener('click', () => { state.readMode = state.readMode === 'read' ? 'all' : 'read'; render(); });
  elements['sort-select'].addEventListener('change', (event) => { state.sortMode = event.target.value; render(); });
  elements['limit-select'].addEventListener('change', (event) => { state.limit = Number(event.target.value); render(); });
  elements['clear-tag'].addEventListener('click', () => { state.tag = null; render(); });
  elements['retry-load'].addEventListener('click', loadPapers);
}

function renderStats() {
  const years = state.papers.map((paper) => paper.year).filter(Boolean);
  elements['stat-count'].textContent = String(state.papers.length);
  elements['stat-venues'].textContent = String(new Set(state.papers.map((paper) => paper.venue)).size);
  elements['stat-year'].textContent = years.length ? String(Math.max(...years)) : '—';
  elements['nav-count'].textContent = `${state.papers.length} 篇`;
}

function renderVenueFilters() {
  const venues = ['all', ...new Set(state.papers.map((paper) => paper.venue).filter(Boolean))];
  const fragment = document.createDocumentFragment();
  for (const venue of venues) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter-chip${state.venue === venue ? ' active' : ''}`;
    button.textContent = venue === 'all' ? '全部出处' : venue;
    button.addEventListener('click', () => { state.venue = venue; renderVenueFilters(); render(); });
    fragment.append(button);
  }
  elements['venue-filters'].replaceChildren(fragment);
}

function render() {
  updateControlStates();
  const visible = selectVisiblePapers(state.papers, state);
  if (!visible.length) {
    const empty = document.createElement('div');
    empty.className = 'no-results';
    const heading = document.createElement('h3');
    heading.textContent = '没有符合当前条件的论文';
    const copy = document.createElement('p');
    copy.textContent = '请尝试清除标签或调整搜索与筛选条件。';
    empty.append(heading, copy);
    elements['papers-grid'].replaceChildren(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  visible.forEach((paper, index) => fragment.append(buildCard(paper, index)));
  elements['papers-grid'].replaceChildren(fragment);
}

function updateControlStates() {
  setPressed(elements['deep-notes-toggle'], state.deepNotesOnly);
  setPressed(elements['unread-toggle'], state.readMode === 'unread');
  setPressed(elements['read-only-toggle'], state.readMode === 'read');
  elements['active-tag'].hidden = !state.tag;
  elements['active-tag-name'].textContent = state.tag || '';
}

function setPressed(button, pressed) {
  button.setAttribute('aria-pressed', String(pressed));
  button.classList.toggle('active', pressed);
}

function buildCard(paper, index) {
  const card = document.createElement('article');
  card.className = `paper-card${state.readIds.has(paper.id) ? ' paper-card--read' : ''}`;
  card.style.animationDelay = `${Math.min(index, 8) * 35}ms`;
  const header = document.createElement('div');
  header.className = 'card-header';
  const venue = document.createElement('span');
  venue.className = 'venue-badge';
  venue.textContent = paper.venue || '未知出处';
  const year = document.createElement('span');
  year.className = 'card-year';
  year.textContent = paper.year ? String(paper.year) : '—';
  header.append(venue, year);
  const title = document.createElement('a');
  title.className = 'card-title';
  title.href = `paper.html?id=${encodeURIComponent(paper.id)}`;
  title.textContent = paper.title || '未命名论文';
  const authors = document.createElement('p');
  authors.className = 'card-authors';
  authors.textContent = formatAuthors(paper.authors);
  const abstract = document.createElement('p');
  abstract.className = 'card-abstract';
  abstract.textContent = paper.abstract || '暂无摘要。';
  const footer = document.createElement('div');
  footer.className = 'card-footer';
  const tags = document.createElement('div');
  tags.className = 'card-tags';
  paper.tags.slice(0, 4).forEach((tag) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tag';
    button.textContent = tag;
    button.addEventListener('click', () => { state.tag = state.tag === tag ? null : tag; render(); });
    tags.append(button);
  });
  const actions = document.createElement('div');
  actions.className = 'card-footer-right';
  if (paper.notebooklmNotes || paper.notebooklmUrl) {
    const badge = document.createElement('span');
    badge.className = 'nlm-badge';
    badge.textContent = '📓 深度笔记';
    actions.append(badge);
  }
  const stars = document.createElement('span');
  stars.className = 'star-rating';
  stars.textContent = `${'★'.repeat(paper.rating)}${'☆'.repeat(Math.max(0, 5 - paper.rating))}`;
  stars.setAttribute('aria-label', `评分 ${paper.rating} / 5`);
  const readButton = document.createElement('button');
  readButton.type = 'button';
  readButton.className = 'card-read-toggle';
  readButton.textContent = state.readIds.has(paper.id) ? '已读' : '标为已读';
  readButton.addEventListener('click', () => toggleRead(paper.id));
  actions.append(stars, readButton);
  footer.append(tags, actions);
  card.append(header, title, authors, abstract, footer);
  return card;
}

function toggleRead(id) {
  if (state.readIds.has(id)) state.readIds.delete(id);
  else state.readIds.add(id);
  saveReadIds();
  render();
}

function formatAuthors(authors) {
  return authors.length <= 3 ? authors.join(', ') : `${authors.slice(0, 3).join(', ')} 等`;
}

function showLoading() {
  const loading = document.createElement('div');
  loading.className = 'no-results';
  loading.textContent = '正在加载论文…';
  elements['papers-grid'].replaceChildren(loading);
}
