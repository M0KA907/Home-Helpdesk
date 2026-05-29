# Home Helpdesk

A free, open-source, static GitHub Pages household helpdesk. It lets non-technical family members submit tech issues into a private Google Sheet through a small Apps Script receiver.

The public site contains **no Sheet ID, no Apps Script URL, no email, no API token, and no private submit key**.

## Architecture

```text
GitHub Pages static form
  -> browser localStorage endpoint + submit key
  -> Google Apps Script doPost receiver
  -> private Google Sheet
```

## What is public

Public repo:

- `index.html`
- `assets/styles.css`
- `assets/app.js`
- documentation
- receiver source template

Not public:

- Google Sheet ID
- Apps Script deployment URL
- submit key
- owner notification email

## Anti-bot layers

Static hosting cannot provide perfect anti-bot protection by itself. This project uses layered friction:

### Browser-side

- honeypot fields
- minimum form age
- expiry window
- arithmetic human challenge
- proof-of-work hash
- localStorage-only submit key
- localStorage-only Apps Script endpoint

### Apps Script receiver

- validates submit key
- rejects honeypots
- validates minimum/maximum form age
- recomputes proof-of-work
- duplicate issue cooldown
- visitor cooldown
- truncates input lengths
- writes only known fields

## Setup

### 1. Create or use a Google Sheet

You can use the Sheet already created earlier:

```text
Home Tech Helpdesk Tickets
```

Or create a new Sheet.

### 2. Add Apps Script receiver

In the Sheet:

```text
Extensions -> Apps Script
```

Add:

```text
receiver/Code.gs
receiver/appsscript.json
```

### 3. Add Script Properties

Apps Script:

```text
Project Settings -> Script Properties -> Add script property
```

Required:

| Key | Value |
|---|---|
| `SHEET_ID` | Your Google Sheet ID |
| `SUBMIT_KEY` | Long random private string |

Optional:

| Key | Value |
|---|---|
| `OWNER_EMAIL` | Email notification recipient |
| `POW_PREFIX` | Default `000` |
| `SHEET_NAME` | Default `Tickets` |
| `MIN_FORM_AGE_MS` | Default `5000` |
| `MAX_FORM_AGE_MS` | Default `2700000` |

Generate a submit key:

```bash
python - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
```

### 4. Run setup

In Apps Script, run:

```js
setup()
```

Approve permissions.

### 5. Deploy Apps Script

```text
Deploy -> New deployment -> Web app
Execute as: Me
Who has access: Anyone with link
```

Copy the deployment URL.

### 6. Deploy GitHub Pages

```bash
gh repo create M0KA907/Home-Helpdesk --public --source=. --remote=origin --push
gh api repos/M0KA907/Home-Helpdesk/pages \
  -X POST \
  -f source.branch=main \
  -f source.path=/
```

The page should become available at:

```text
https://m0ka907.github.io/Home-Helpdesk/
```

### 7. Configure the page once per device

Open the deployed page.

Click:

```text
RECEIVER SETUP
```

Paste:

- Apps Script web app URL
- private submit key

Click save.

Those values are stored in that browser only.

## Security notes

The submit key is not committed to the repo. It is still present in the configured browser after setup. Treat it as household anti-spam, not military-grade auth.

Do not ask users to submit:

- passwords
- recovery codes
- bank numbers
- full SSNs
- private medical records

## Local testing

Open `index.html` directly in a browser. The page will load, but submissions require receiver setup.

## Files

```text
index.html
assets/app.js
assets/styles.css
receiver/Code.gs
receiver/appsscript.json
README.md
SECURITY.md
LICENSE
CLAUDE.md
.github/workflows/static.yml
```

## License

MIT.
