---
name: link-notebooklm
description: Use when linking reviewed NotebookLM notes to an existing paper by notebook ID, HTTPS URL, or a confirmed notebook-title match.
---

# Link NotebookLM Notes

## Overview

Resolve one notebook, prepare Markdown for review, and update one paper only after user approval.

## Workflow

1. Identify the paper by exact ID in `docs/js/papers.json`.
2. Locate the NotebookLM notebook using a user-provided ID or HTTPS URL. For title search, show candidate titles and require a confirmed title match before opening sources.
3. Generate concise Markdown notes grounded in the notebook sources. Save them to a temporary Markdown file and show the complete text for review.
4. Stop for user approval. Do not call the update script from an initial request alone.
5. If the paper already has `notebooklmUrl` or `notebooklmNotes`, show the existing values and require a separate overwrite confirmation. Only that confirmation authorizes `--force`.
6. After approval, run:

   `python .agents/skills/link_notebooklm/scripts/update_notebooklm.py --papers-json docs/js/papers.json --paper-id <id> --notebooklm-url <https-url> --notebooklm-notes <notes.md> --dry-run`

7. Review the dry-run output. Then run the same command without `--dry-run`; add `--force` only after overwrite confirmation.
8. Run `npm test` and verify the detail page locally. Report the updated paper ID and fields.

## Safety Boundary

Use only HTTPS NotebookLM URLs. Never expose account credentials, cookies, API keys, or private notebook contents. Do not commit or push.

## Common Mistakes

- Accepting a fuzzy title match without confirmation.
- Writing generated notes before the user has reviewed them.
- Treating general user approval as overwrite confirmation for existing data.
