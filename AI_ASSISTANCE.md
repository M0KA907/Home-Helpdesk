# AI Assistance Disclosure

This project was created with AI assistance.

Human direction, project requirements, security constraints, repository decisions, and final acceptance remain the responsibility of the maintainer.

## Assistance used

The initial code and documentation were drafted with help from AI tools, including ChatGPT.

## Contribution rule

Do not submit raw vibe-coded or agent-generated changes from:

- Claude Code
- ChatGPT Web
- Codex

Contributions are acceptable only when the author has manually reviewed, understood, tested, and rewritten the work enough to take responsibility for it.

## Required contributor statement

Any pull request must include this statement:

```text
I have reviewed this change manually. It is not an unreviewed AI/agent dump.
```

## Why this exists

This is a small household-facing tool that writes to a private Google Sheet through an Apps Script receiver. The risk is not algorithmic complexity. The risk is careless glue code leaking private values, weakening bot controls, or making the setup confusing.
