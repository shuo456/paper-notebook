---
name: discover-all
description: Use when searching all configured arXiv, journal, and conference sources for current safe-control, robotics, robot-learning, or reinforcement-learning papers.
---

# Discover Papers Across All Sources

## Overview

Coordinate three independent discovery groups, preserve partial failures, and present one reviewed selection menu without editing the notebook.

## Workflow

1. Run the `arXiv`, `journals`, and `conferences` groups independently by following `discover-arxiv`, `discover-journals`, and `discover-conferences`.
2. Require each group to return a compact result with source status, checked date range or event cycle, and canonical candidates.
3. Continue when one group fails. Include a `failed group` summary before the successful results.
4. Merge candidates and prefer a complete formal publication over its preprint when title or DOI identity matches. Preserve the preprint URL only as supporting metadata when useful.
5. Deduplicate again against `docs/js/papers.json` by normalized ID, DOI, then title.
6. Present one continuous numbered list grouped by source, with source, year, relevance, and publication status.
7. Ask for numbered selections, `all`, or `none`. Pass only confirmed records to `add-to-notebook`.

## Output Contract

Use this order:

1. Collection status for all three groups.
2. Duplicate/replacement summary.
3. Continuous numbered candidates grouped by source.
4. Selection question.

## Common Mistakes

- Treating a failed group as an empty successful result.
- Listing both an arXiv preprint and its formal publication as separate papers.
- Starting an add, commit, or push before the user selects candidates.
