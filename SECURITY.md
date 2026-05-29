# Security Policy

## No public secrets

This repository must never contain:

- Google Sheet IDs
- Apps Script deployment URLs
- Google API keys
- OAuth credentials
- submit keys
- personal email addresses
- private phone numbers
- family member private data

Private deployment values belong in:

- Apps Script Script Properties
- browser localStorage after setup
- a password manager

## Threat model

This is a household helpdesk, not an enterprise service.

The anti-bot design is intended to block casual bots and spam scripts:

- honeypots
- proof-of-work
- minimum form age
- math challenge
- submit key
- duplicate cooldown
- visitor cooldown

It does not protect against a targeted attacker with browser access to a configured device.

## Public endpoint reality

If a browser can submit to the Apps Script endpoint, the endpoint URL is not a true secret. The receiver must validate submissions server-side.

## Reporting issues

Open a GitHub issue for code problems. Do not paste secrets into issues.
