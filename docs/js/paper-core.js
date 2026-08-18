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
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
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
      ? String(raw.notebooklmUrl || raw.notebooklm_url || '')
      : '',
    notebooklmNotes: String(raw.notebooklmNotes || raw.notebooklm_notes || ''),
  };
}

export function normalizePapers(rawList) {
  return Array.isArray(rawList) ? rawList.map(normalizePaper) : [];
}

export function effectiveDate(paper) {
  return Date.parse(paper.updatedDate || paper.addedDate || `${paper.year}-01-01`) || 0;
}

export function filterPapers(papers, options = {}) {
  const query = String(options.query || '').trim().toLowerCase();
  const readIds = options.readIds || new Set();

  return papers.filter((paper) => {
    const haystack = [
      paper.title,
      paper.authors.join(' '),
      paper.abstract,
      paper.tags.join(' '),
    ].join(' ').toLowerCase();
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
    if (mode === 'rating') {
      return right.rating - left.rating || effectiveDate(right) - effectiveDate(left);
    }
    if (mode === 'oldest') return effectiveDate(left) - effectiveDate(right);
    return effectiveDate(right) - effectiveDate(left);
  });
}

export function selectVisiblePapers(papers, state) {
  const filtered = filterPapers(papers, {
    query: state.query,
    venue: state.venue,
    tag: state.tag,
    readMode: state.readMode,
    deepNotesOnly: state.deepNotesOnly,
    readIds: state.readIds,
  });
  const sorted = sortPapers(filtered, {
    mode: state.sortMode,
    readIds: state.readIds,
  });
  return state.limit > 0 ? sorted.slice(0, state.limit) : sorted;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderInlineMarkdown(value = '') {
  return escapeHtml(value)
    .replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (match, label, url) => (
      isSafeHttpsUrl(url)
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : label
    ))
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

export function renderSafeMarkdown(markdown = '') {
  const output = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${paragraph.map(renderInlineMarkdown).join('<br>')}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    output.push(`<ul>${list.join('')}</ul>`);
    list = [];
  };

  for (const line of String(markdown).replaceAll('\r\n', '\n').split('\n')) {
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    const item = line.match(/^- (?:\[( |x|X)]\s+)?(.+)$/);

    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
    } else if (item) {
      flushParagraph();
      const taskClass = item[1] === undefined ? '' : ` class="task-item${item[1].toLowerCase() === 'x' ? ' done' : ''}"`;
      list.push(`<li${taskClass}>${renderInlineMarkdown(item[2])}</li>`);
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }

  flushParagraph();
  flushList();
  return output.join('');
}
