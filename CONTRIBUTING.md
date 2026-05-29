# Contributing

## Rules

- Do not commit secrets.
- Do not commit a real Google Sheet ID.
- Do not commit an Apps Script deployment URL.
- Do not commit submit keys, API keys, emails, or family data.
- Do not submit raw vibe-coded or agent-generated patches.

## AI-generated code policy

This project admits it was created with AI assistance. Future contributions still need human ownership.

Do not submit unreviewed output from:

- Claude Code
- ChatGPT Web
- Codex

Acceptable use:

- using tools for drafts or ideas
- manually reviewing every line
- rewriting unclear/generated code
- testing the result
- explaining the change in the pull request

Required pull request statement:

```text
I have reviewed this change manually. It is not an unreviewed AI/agent dump.
```

## Test checklist

Before merging changes:

1. Search for secrets.
2. Open `index.html` locally.
3. Confirm submit is disabled before receiver setup.
4. Confirm anti-bot gates are active.
5. Confirm Apps Script receiver validates server-side.
6. Confirm no private values are in git.
