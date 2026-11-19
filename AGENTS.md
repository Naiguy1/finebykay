# Repository guidance

Read README.md, docs/security-privacy-accessibility-audit.md, and docs/feature-safety.md
before changing behavior. This is currently a static portfolio, without an account,
booking backend, database, checkout, email sender, tracking, or uploads.

- Preserve all carousel photographs, six curated lookbook selections, permanent set IDs,
  and existing headings unless the task asks to change them. Edit portfolio copy in
  content/sets.yaml and policy text in content/legal.json.
- Never add browser-visible secrets, remote fonts/scripts/embeds, tracking/storage, or
  a new data-collection flow without implementing and testing the applicable feature
  safety requirements. Do not remove security tests merely to allow an integration.
- Authentication/ownership/validation/limits belong on the server when a backend is
  introduced. Do not claim client controls protect private data.
- Keep legal placeholders conspicuous until the owner supplies reviewed terms; never
  invent a business identity, legal jurisdiction, email, address, or DMCA registration.
- Run npm run test:security, npm run test:content, npm run lint, npm run build,
  npm run test:e2e, and the production container checks appropriate to the change.
  Report blocked checks accurately. Keep audit failures blocking CI.
