import { SITE_CONFIG } from './config.js';
import { isSafeHttpsUrl, normalizePapers, renderSafeMarkdown } from './paper-core.js';

const id = new URLSearchParams(window.location.search).get('id');
const readKey = SITE_CONFIG.readStorageKey;

function byId(elementId) {
  return document.getElementById(elementId);
}

function loadReadIds() {
  try {
    const value = JSON.parse(localStorage.getItem(readKey) || '[]');
    return new Set(Array.isArray(value) ? value.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(readIds) {
  localStorage.setItem(readKey, JSON.stringify([...readIds]));
}

function renderStars(rating) {
  const score = Math.max(0, Math.min(5, Number(rating) || 0));
  return `${'★'.repeat(score)}${'☆'.repeat(5 - score)}`;
}

function setExternalLink(elementId, url) {
  const link = byId(elementId);
  if (!link || !url || !isSafeHttpsUrl(url)) return;
  link.href = url;
  link.hidden = false;
}

function setupReadToggle(paperId) {
  const button = byId('btn-read-toggle');
  const refresh = () => {
    const isRead = loadReadIds().has(paperId);
    button.textContent = isRead ? '设为未读' : '标为已读';
    button.classList.toggle('btn-read-active', isRead);
    button.setAttribute('aria-pressed', String(isRead));
  };

  button.addEventListener('click', () => {
    const readIds = loadReadIds();
    if (readIds.has(paperId)) readIds.delete(paperId);
    else readIds.add(paperId);
    saveReadIds(readIds);
    refresh();
  });
  refresh();
}

function renderPaper(paper) {
  document.title = `${paper.title} · ${SITE_CONFIG.owner} 的论文笔记`;
  byId('site-title').textContent = SITE_CONFIG.title;
  byId('site-owner').textContent = SITE_CONFIG.owner;
  byId('github-link').href = `https://github.com/${SITE_CONFIG.githubOwner}/${SITE_CONFIG.repository}`;
  byId('paper-venue').textContent = paper.venue || '未注明出处';
  byId('paper-year').textContent = paper.year || '—';
  byId('paper-stars').textContent = renderStars(paper.rating);
  byId('paper-stars').setAttribute('aria-label', `评分 ${paper.rating || 0} / 5`);
  byId('paper-title').textContent = paper.title;
  byId('paper-authors').textContent = paper.authors.join(', ') || '作者信息待补充';
  byId('paper-abstract').textContent = paper.abstract || '暂无摘要。';
  byId('paper-notes').innerHTML = renderSafeMarkdown(paper.notes || '暂无个人笔记。');

  setExternalLink('btn-source', paper.url);
  setExternalLink('btn-pdf', paper.pdfUrl);
  if (paper.doi) setExternalLink('btn-doi', `https://doi.org/${paper.doi}`);

  byId('info-venue').textContent = paper.venue || '—';
  byId('info-year').textContent = paper.year || '—';
  byId('info-rating').textContent = renderStars(paper.rating);
  byId('info-doi').textContent = paper.doi || '—';
  byId('info-added').textContent = paper.addedDate || '—';
  byId('info-source').textContent = paper.source || '—';

  const tags = byId('paper-tags');
  for (const label of paper.tags) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = label;
    tags.append(tag);
  }

  if (paper.notebooklmNotes || paper.notebooklmUrl) {
    byId('section-nlm').hidden = false;
    byId('paper-nlm-notes').innerHTML = renderSafeMarkdown(paper.notebooklmNotes || 'NotebookLM 笔记待补充。');
    setExternalLink('nlm-open-link', paper.notebooklmUrl);
  }
  setupReadToggle(paper.id);
}

function showError(message) {
  const main = byId('detail-main');
  main.replaceChildren();
  const box = document.createElement('div');
  box.className = 'container load-error';
  const heading = document.createElement('h1');
  heading.textContent = '无法打开论文详情';
  const detail = document.createElement('p');
  detail.textContent = message;
  const back = document.createElement('a');
  back.className = 'btn btn-primary';
  back.href = 'index.html';
  back.textContent = '返回论文库';
  box.append(heading, detail, back);
  main.append(box);
}

async function start() {
  if (!id) {
    showError('链接中缺少论文 ID。');
    return;
  }
  try {
    const response = await fetch(new URL('./papers.json', import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const paper = normalizePapers(await response.json()).find((item) => item.id === id);
    if (!paper) showError(`未找到 ID 为“${id}”的论文。`);
    else renderPaper(paper);
  } catch (error) {
    console.error(error);
    showError('papers.json 加载失败，请检查数据格式。');
  }
}

start();
