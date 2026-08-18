---
name: discover-arxiv
description: Use when looking for recent arXiv papers on control barrier functions, safe control, safety-critical systems, robot learning, or reinforcement learning.
---

# Discover arXiv Papers

## Overview

Collect current candidates without changing the notebook. Prefer structured arXiv data, verify dates, and hand only user-selected records to `add-to-notebook`.

## Workflow

1. Query `cs.RO`, `cs.LG`, and `eess.SY` through the arXiv API or RSS feed for the latest seven days. Record the query timestamp and category status.
2. Rank exact research matches first: control barrier functions, safe control, safety-critical systems, robot learning, and reinforcement learning.
3. Use Firecrawl only when the arXiv record lacks details. If Firecrawl is not configured, continue with complete arXiv records.
4. Produce canonical candidates with `id`, `title`, `authors`, `venue`, `venueType`, `year`, `publishedDate`, `doi`, `url`, `pdfUrl`, `tags`, `rating`, `abstract`, `notes`, `addedDate`, `updatedDate`, `source`, `notebooklmUrl`, and `notebooklmNotes`.
5. Set `venue` to `arXiv`, use the HTTPS abstract and PDF URLs, and never invent a DOI.
6. Compare normalized ID, DOI, and title against `docs/js/papers.json`. Omit duplicates and report each duplicate reason.
7. Present a compact numbered list with title, authors, categories, date, and one-line relevance. Ask for numbered selections, `all`, or `none`.
8. Pass only confirmed selections to `add-to-notebook`. Do not edit JSON, commit, or push from this skill.

## Output Contract

Return source status first, then candidates. A failed category remains a failed category; do not substitute older results. When no current matches exist, return an empty list with the checked date range.

## Common Mistakes

- Treating the newest search result as recent without checking `published` or `updated`.
- Returning an HTTP URL or a guessed DOI.
- Adding every result before the user makes numbered selections.
