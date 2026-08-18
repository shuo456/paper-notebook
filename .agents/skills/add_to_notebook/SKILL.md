---
name: add-to-notebook
description: Use when the user has reviewed paper candidates and wants selected records added safely to this repository's papers.json data layer.
---

# Add Papers to the Notebook

## Overview

Turn an explicit numbered selection into validated canonical records, preview the change locally, and report the result. Do not commit or push.

## Required Input

Require a user-confirmed numbered selection or an explicitly supplied single paper. If selection is missing or ambiguous, show the candidate menu and stop.

Each record must contain the canonical fields used by `docs/js/papers.json`: `id`, `title`, `authors`, `venue`, `venueType`, `year`, `publishedDate`, `doi`, `url`, `pdfUrl`, `tags`, `rating`, `abstract`, `notes`, `addedDate`, `updatedDate`, `source`, `notebooklmUrl`, and `notebooklmNotes`.

## Workflow

1. Verify metadata against the primary paper page. Use empty strings for unavailable DOI or optional URLs; never guess.
2. Write the selected candidates to a temporary JSON array outside the repository or in an ignored temporary location.
3. Run the validator first:

   `python .agents/skills/add_to_notebook/scripts/append_papers.py --papers-json docs/js/papers.json --new-entries <candidate-file> --dry-run --date YYYY-MM-DD`

4. Show duplicate reasons and validation errors. Fix metadata errors; never bypass validation.
5. After a clean dry run, run the same `append_papers.py` command without `--dry-run`.
6. Run `npm test`, then start a local preview with `python -m http.server 8000 --directory docs`.
7. Verify the new card and its detail page in the local preview.
8. Report added, skipped, duplicate, and total counts plus the backup path. Leave the worktree ready for review.

## Safety Boundary

Do not commit or push. Publishing belongs to `publish-notebook` and requires separate explicit user confirmation.

## Common Mistakes

- Treating a discovery result as approval to add it.
- Editing `papers.json` manually instead of using the validated atomic script.
- Skipping the local preview after a successful data write.
