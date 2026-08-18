---
name: discover-conferences
description: Use when checking the latest available robotics or machine-learning conference cycle for safe control, robot learning, or reinforcement learning papers.
---

# Discover Conference Papers

## Overview

Search only the latest publicly available event cycle and make the event year explicit. Do not silently backfill an unpublished cycle with past proceedings.

## Sources

| Event | Preferred primary source |
|---|---|
| ICRA | Official IEEE/organizer proceedings |
| IROS | Official IEEE/organizer proceedings |
| CoRL | Official proceedings or OpenReview |
| RSS | Robotics: Science and Systems proceedings |
| NeurIPS | Official proceedings or OpenReview |
| ICML | Proceedings of Machine Learning Research or OpenReview |

## Workflow

1. Determine the latest available event year separately for ICRA, IROS, CoRL, RSS, NeurIPS, and ICML.
2. If that event year's proceedings are not public, return an empty group with `not yet public`; do not search an earlier year as a replacement.
3. Filter titles and abstracts for control barrier functions, safe control, safety-critical systems, robot learning, and reinforcement learning.
4. Verify canonical metadata against the official paper page. Use HTTPS URLs and leave unavailable DOI values empty.
5. Convert candidates to the `docs/js/papers.json` schema and deduplicate by normalized ID, DOI, then title.
6. Return source status and a numbered candidate list grouped by conference, always showing the event year.
7. Ask for numbered selections and pass only confirmed records to `add-to-notebook`.

## Common Mistakes

- Calling a calendar year the event year without checking the proceedings.
- Mixing workshop papers into the main conference without labeling them.
- Replacing an unavailable current cycle with older results.
