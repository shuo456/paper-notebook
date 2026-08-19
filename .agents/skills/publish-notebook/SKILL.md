---
name: publish-notebook
description: Use when reviewed local paper-notebook changes are ready for final verification and possible publication to the configured GitHub fork.
---

# Publish the Paper Notebook

## Overview

Verify the complete static site, show exactly what would be published, and stop for explicit user confirmation before any repository publication action.

## Preflight

1. Run `npm test` and `python -m json.tool docs/js/papers.json`.
2. Start `python -m http.server 8000 --directory docs` and verify the list page, search/filter controls, one ordinary detail page, and one deep-notes detail page.
3. Check mobile width and browser console errors.
4. Scan tracked changes for sensitive values: API keys, access tokens, cookies, passwords, private URLs, email addresses not intended for publication, and machine-specific absolute paths.
5. Run `git diff --check`, `git diff --stat`, and `git status --short`.
6. Show the proposed branch, remote, files, and commit message. State whether tests, visual checks, and the sensitive-value scan passed.

## Confirmation Gate

Stop and request explicit user confirmation for the displayed commit and push. Prior approval to edit files, add papers, or run this skill is not publication approval. A changed diff, remote, branch, or commit message invalidates earlier confirmation and requires a new confirmation.

## Publish After Confirmation

Only after the confirmation gate succeeds:

1. Stage the reviewed paths and run `git commit -m "<approved message>"`.
2. Show the new commit and confirm the worktree is clean.
3. Run `git push origin <approved branch>`.
4. If GitHub Pages is configured, verify its deployment status and public URL without changing unrelated repository settings.
5. Report the commit hash, pushed branch, Pages URL, and any deployment delay.

## Red Flags — Stop

- Tests or browser checks fail.
- The destination is not `shuo456/paper-notebook`.
- A sensitive value appears in tracked content.
- The diff changed after confirmation.
- The user confirmed testing but not publication.

Do not bypass the gate because changes are small, already committed locally, or previously discussed.
