# CLAUDE.md

## Task context

Build `Home Helpdesk`, a free and open-source GitHub Pages household ticket intake portal.

User wants:

- GitHub Pages deployment
- cyberpunk menu-style aesthetics
- household tech issue ticket form
- strong anti-bot support
- Google Sheets backend
- no secrets exposed publicly
- complete documentation

## Hard security requirement

Never commit secrets.

Public repo must not contain:

- Sheet ID
- Apps Script deployment URL
- email
- submit key
- API token
- OAuth credential

Private values belong in:

- Apps Script Script Properties
- browser localStorage after device setup

## AI assistance policy

This project was created with AI assistance.

Do not submit raw vibe-coded or unreviewed agent output from:

- Claude Code
- ChatGPT Web
- Codex

Any future AI-assisted work must be manually reviewed, understood, tested, and rewritten enough that the human maintainer owns it.

## Architecture

```text
GitHub Pages static site
  index.html
  assets/app.js
  assets/styles.css

Browser localStorage
  endpoint URL
  submit key

Apps Script receiver
  receiver/Code.gs
  Script Properties:
    SHEET_ID
    SUBMIT_KEY
    OWNER_EMAIL optional

Google Sheet
  Tickets tab
```

## Anti-bot design

Client:

- hidden honeypot fields
- minimum form age
- maximum form age
- math challenge
- proof-of-work SHA-256 prefix
- localStorage-only submit key

Server:

- validates submit key
- rejects honeypots
- validates form age
- recomputes proof-of-work
- duplicate cooldown
- visitor cooldown
- truncates input
- appends only known fields

## Limitations

Static GitHub Pages cannot do server-side validation. The Apps Script receiver is the real security gate.

The submit key is anti-spam, not high-security authentication. A person with browser access to a configured device can read localStorage.

## Tests

Manual tests:

1. Open `index.html`.
2. Confirm submit is disabled before setup.
3. Open receiver setup and save endpoint/key.
4. Confirm submit remains disabled until:
   - proof-of-work is ready
   - five seconds pass
   - human challenge is answered
   - issue text has at least five characters
5. Submit normal issue.
6. Confirm Sheet row appears.
7. Submit immediately again.
8. Confirm receiver rate-limits.
9. Fill honeypot through devtools.
10. Confirm receiver rejects.

## Rollback

Disable Pages, archive/delete repo, or rotate the Apps Script `SUBMIT_KEY`.
