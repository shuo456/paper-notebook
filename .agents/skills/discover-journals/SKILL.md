---
name: discover-journals
description: Use when checking current journal articles in safe control, safety-critical systems, robotics, robot learning, or reinforcement learning.
---

# Discover Journal Papers

## Overview

Inspect each tracked journal independently and return current, verifiable candidates without modifying the notebook.

## Tracked Venues

| Display name | Preferred source |
|---|---|
| IEEE TAC | IEEE Transactions on Automatic Control latest/early access |
| Automatica | Official latest articles |
| IEEE RA-L | IEEE Robotics and Automation Letters early access |
| IEEE T-RO | IEEE Transactions on Robotics early access |
| IJRR | The International Journal of Robotics Research latest articles |

## Workflow

1. Open the official latest-article, early-access, or RSS page for every venue. Record `success`, `empty`, or `failure` separately with the checked timestamp.
2. Keep only papers matching control barrier functions, safe control, safety-critical systems, robot learning, or reinforcement learning.
3. Verify title, authors, date, venue, abstract, DOI, and HTTPS publication URL. Never infer missing identifiers.
4. Use Firecrawl for pages that require extraction. Firecrawl requires `FIRECRAWL_API_KEY`; when it is unavailable, accept user-supplied paper URLs and extract from accessible official pages.
5. Convert results to the canonical candidate schema used by `docs/js/papers.json`.
6. Deduplicate by normalized ID, DOI, then title against the local dataset.
7. Present one numbered list grouped by venue and ask the user to select numbers. Hand only selected records to `add-to-notebook`.

## Failure Contract

If a current source fails, report that source as failed and continue with the others. Do not fill the gap with older papers or search results from a past issue. An accessible source with no relevant current papers is `empty`, not `failure`.

## Common Mistakes

- Treating a search-engine result as an official current-issue record.
- Collapsing all venues into one status, hiding partial failures.
- Writing to `papers.json` before a numbered user selection.
