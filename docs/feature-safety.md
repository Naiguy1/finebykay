# Safety requirements for future features

These are release gates, not claims that a future backend is already secure. The current
portfolio is static: it rejects writes, has no private records, blocks network connections
and frames with CSP, and has CI checks for browser storage and unexpected requests.
A new feature must replace the applicable static guard with tested enforcement. Do not
remove a failing guard merely to make a new integration work.

## Required for every feature

- Record the data flow: fields, purpose, necessity, recipients, processors, hosting region,
  lawful basis (review with counsel), retention, deletion, backups, logs, and support access.
- Keep server secrets in the deployment secret manager or a server-only ignored `.env`.
  `.env` is not encryption. Never expose secrets through `VITE_*`, browser bundles, public
  files, logs, source maps, test artifacts, URLs, or customer support messages.
- Make the API deny access by default. Validate authorization on every request. A hidden
  button, unguessable UUID, client-supplied `user_id`, CORS, and a signed-in UI are not
  authorization. Third-party admin/service keys must stay on the server.
- Validate schemas on the server (types, enum values, length, dates/time zones, totals,
  file sizes, unknown fields). Use parameterized queries, contextual output escaping,
  and plain-text rendering. If rich text is necessary, sanitize with a maintained allowlist.
- Set exact allowed origins only when cross-origin access is needed; never combine
  wildcard origins with credentials. Validate Origin/CSRF tokens for cookie-authenticated
  mutations. CORS does not stop direct HTTP clients from abusing a public endpoint.
- Set request/body/time limits and shared, atomic rate limits per verified client and
  account, with stricter login/recovery/booking limits. Return 429 plus Retry-After.
  Choose documented thresholds from expected traffic; test parallel requests, multi-instance
  operation, and an unavailable limiter. Do not trust client-supplied X-Forwarded-For.
- Revise CSP narrowly for the selected provider. Keep executable inline scripts/eval
  blocked; use nonces/hashes if an unavoidable integration needs inline code. Prefer a
  hosted checkout and click-to-load integrations. Restrict Referrer-Policy and permissions.
- Test anonymous users, two different customers, staff, expired/revoked sessions, direct
  API requests, guessed IDs, concurrent requests, malformed input, oversized bodies,
  CSRF, request replay, and failure of dependencies. Audit privileged changes without
  putting secrets or message bodies in logs.
- Keep an accessible keyboard path, labels/errors announced to assistive technology,
  correct focus transitions, text alternatives, contrast, 200% text zoom, 320px reflow,
  reduced motion, and touch alternatives. Test the complete flow in a screen reader.
- Update public policies and the manual checklist with actual providers and approved terms.

## Accounts, signup, and private bookings

- Use a maintained authentication provider/library. Verify the session server-side on
  every protected route/API, including read/export/delete. Use secure, HttpOnly,
  SameSite cookies, short session lifetimes, rotation after login/privilege changes,
  revocation on logout/password reset/deletion, and reauthentication for sensitive changes.
  Avoid storing session tokens in localStorage. Require MFA for staff/admins.
- Prevent account enumeration in login, signup, password reset, and deletion responses.
  Rate-limit email/code sending; use expiring single-use verification/recovery tokens.
- Enforce ownership for every read, insert, update, delete, attachment, search, calendar,
  export, and signed download. Derive owner from the verified session, not request fields.
  Permit staff actions only by explicit least-privilege role.
- With Postgres/Supabase: enable and FORCE row-level security where appropriate; define
  SELECT/INSERT/UPDATE/DELETE policies, using both USING and WITH CHECK. Prevent owner
  reassignment. Test with the actual anonymous/customer/staff DB roles; the service-role
  bypass must never reach a browser. With SQLite/other stores: constrain every query by
  verified owner and test equivalent isolation; do not claim RLS exists.
- Keep public availability separate from private appointment records. Never expose names,
  emails, phone numbers, service notes, or private studio addresses in availability feeds.
- Choose a lawful minimum age/guardian policy with counsel. Require an unchecked age or
  guardian confirmation where appropriate, enforce the result server-side, and test bypasses.
  Avoid collecting a full birth date or identity document just for an age checkbox.
- Use transactions/unique constraints to prevent double bookings. Validate slots/time zones,
  cancellation ownership, idempotency keys, and authorization on calendar/webhook updates.
  Collect only fields necessary for the service; health information needs a separate review.

## Optional analytics, ads, cookies, and embeds

No vendor is authorized by the current empty tracking inventory. A banner alone is not a gate.

- Before any SDK import/initialization, network request, pixel, preconnect, replay capture,
  or storage write, require an affirmative Accept for its specific purpose. Consent starts
  denied; missing, malformed, expired, or unavailable storage remains denied.
- Offer equally accessible Accept/Reject controls, unselected optional categories, an
  understandable vendor/purpose list, and a permanent Cookie preferences link. Declining
  must not block essential portfolio/booking access. Respect applicable GPC/opt-out rules.
- Version and expire consent records. On withdrawal, stop listeners, timers, queued events,
  SDKs, and requests, clear removable first-party identifiers, invoke provider deletion,
  and reload into a denied state if an SDK cannot safely unload. Never replay behavior
  recorded before consent or during denial. Document limitations of third-party cookie deletion.
- Prove with intercepted browser traffic and storage assertions: first load, reject,
  accept per purpose, reload, expiry, unavailable storage, withdrawal during in-flight
  initialization, and no events after withdrawal. Test the real production headers.
- Maintain a service/cookie inventory: owner, purpose, provider, data, keys, cookie attributes,
  domain, retention, transfer safeguards, SDK cleanup, and deletion procedure. Do not
  enable session replay on booking/payment/private-account screens.

## Access, export, and deletion

The current human request workflow is `/privacy-requests/`; no database exists today.

- For accounts, implement an authenticated, CSRF-protected deletion mutation with recent
  reauthentication. Verify session/ownership server-side; never delete by an email/ID
  supplied without proof. Do not perform deletion on GET. Retain a human alternative.
- Show a clear confirmation of consequences. Revoke sessions/tokens immediately; use
  idempotent, retryable jobs to remove profile, bookings, uploads, marketing records,
  processor copies, exports, and search indexes. Do not let retries delete another user.
- Document legal retention exceptions separately from ordinary data; restrict access,
  state the reason and expiry, and notify the requester of the outcome. Make backup
  expiry finite, and reapply deletion tombstones on restore. Test provider outages and
  restore drills. Do not promise instant deletion of legally retained records/backups.
- Keep request tracking in a restricted system, never git. Verify through the original
  contact channel with minimal information; do not routinely collect ID documents.
  Counsel must set jurisdiction-specific deadlines, appeals, identity requirements, and
  requests involving children, guardians, or authorized representatives.

## Payments and subscriptions

- Use a PCI-compliant hosted provider; never handle/store raw card or CVV data. Server
  prices/products/currency/taxes are authoritative. Verify signed webhooks against the
  raw body, validate event age/account, deduplicate IDs, and make changes transactional.
  A success redirect is not proof of payment. Test replay, forged events, and refunds.
- Immediately beside the final purchase/subscribe button show the exact total and, for
  subscriptions, recurring amount/currency, billing interval, trial-to-paid amount/date,
  renewal terms, minimum term, and working cancellation instructions/link. Require a
  separate unchecked acknowledgment; record server-side the agreed terms/version and
  time. Marketing opt-in must be separate and optional. A checkbox does not cure unclear terms.
- Make cancellation at least as easy as required by applicable law and the sales channel;
  enforce it at the provider, send confirmation, and test that billing really stops.
  Counsel must review current regional auto-renewal, refund, tax, and consumer laws.
- Review payment provider account permissions, webhook secrets, business verification,
  incident response, chargeback processes, and any changed CSP/frame/payment permissions.

## Marketing and transactional email

- Before enabling marketing, set [COMPANY NAME], [PHYSICAL MAILING ADDRESS], a monitored
  sender/reply address, verified domain, SPF/DKIM/DMARC, and a valid sending purpose.
  Keep separate, optional opt-in and a minimal suppression list.
- Include a working, no-login, no-fee one-click unsubscribe from all marketing and the
  physical address in every marketing message. Implement the provider's one-click flow
  (including List-Unsubscribe / List-Unsubscribe-Post where applicable). Use opaque
  signed tokens without email addresses in URLs, prevent tampering, rate-limit abuse,
  suppress across all campaigns, and never re-import a suppressed subscriber as opted in.
- Test the actual delivered message/unsubscribe path, mobile/keyboard use, expired or
  replayed tokens, and provider outages. Keep the link active for the legally required
  period and process opt-outs within applicable deadlines. Distinguish essential booking
  confirmations from marketing; do not use transactional classification to insert promotions.

## Uploads, reviews, and other user content

- Require an unchecked representation that the submitter owns or has permission to use
  the content, and obtain the limited publication license and client likeness permission
  approved by counsel. Validate/check authorization on the server, including file replacement.
- Limit size/count/dimensions/decompressed size; inspect file signatures rather than
  trusting extensions or Content-Type. Quarantine and scan files; re-encode images and
  strip GPS/EXIF metadata. Reject executable/HTML/SVG content unless safely sanitized.
  Generate storage names, keep originals private, prevent traversal and zip bombs, serve
  derivatives from an isolated origin with safe MIME/attachment headers, and use short-lived
  authorized signed URLs for private content. Protect storage listings and buckets.
- Publish a monitored copyright/abuse reporting channel and moderation/takedown/appeal
  procedure. With counsel assess DMCA safe-harbor eligibility, agent registration and
  renewal, counter-notices, and repeat-infringer policy. Do not claim registration exists.
- Test malicious/polyglot files, metadata leakage, cross-customer access, stored XSS,
  public bucket access, takedowns/cache purge, and deletion of all derivative copies.
- Existing optional portfolio video now requires local VTT captions and a text visual
  description at build time. Review the accuracy of captions, audio descriptions, and
  any transcript; file presence cannot establish that alternatives are sufficient.

## Deployment and operations

- TLS terminates at the public reverse proxy. Redirect HTTP to HTTPS and preserve the
  security headers on HTML/assets/errors. HSTS max-age is one year, without blanket
  includeSubDomains/preload: assess all subdomains before expanding it.
- Never expose the Vite dev/preview server or container port to the internet. Keep proxy
  IP trust narrowly configured, set edge connection/request limits and DDoS controls,
  rotate secrets, patch host/Docker/proxy, scan pinned base images, and test recovery.
- Review proxy/CDN/vendor logs and retention independently of disabled Nginx access logs.
  Future backends need minimal redacted security audit logs, limited staff access and
  retention; avoid query strings, credentials, full IPs where unnecessary, and form bodies.
- Enable repository MFA, least privilege, branch protection/required checks, Dependabot,
  private vulnerability reports, secret scanning/push protection where available, and
  scheduled image/dependency scans. Rotation is required if a real secret is exposed;
  removing it from the latest source is insufficient. Handle history rewrite separately.

Primary references (reviewed November 18, 2026):
- https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/
- https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- https://www.copyright.gov/dmca-directory/faq.html
- https://www.w3.org/WAI/WCAG21/quickref/
