# Reporting a security issue

Use GitHub's **Security → Report a vulnerability** if private vulnerability reporting is
enabled for Naiguy1/finebykay. Enabling it and assigning a monitored security contact are
owner setup items. Do not put credentials, customer records, or exploitable details in a
public issue. If the private form is unavailable, contact @finebykay on Instagram only
to arrange a private reporting channel; do not send sensitive evidence in that message.

The current supported release is the latest reviewed main branch. The site is a static
portfolio; server-side booking/account/payment controls do not exist yet. See
[the audit](docs/security-privacy-accessibility-audit.md) and
[future feature requirements](docs/feature-safety.md) for scope, release gates, incident
and deletion responsibilities, and outstanding owner actions.

If a credential is exposed: revoke/rotate it at the provider, inspect access and downstream
secrets, remove it from deploys/logs/artifacts, assess notification obligations, and only
then plan history/cache cleanup. Never paste the credential into an issue or CI log.
