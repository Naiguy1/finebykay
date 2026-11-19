# Security, privacy, legal-template, and accessibility audit

Reviewed November 18, 2026 (America/Denver). Baseline: `c60e52005ad38630bdd8c0d43f5468fc9a8cd667`.
This is a repository hardening review, not legal approval, a penetration-test certification,
or a statement of complete WCAG conformance. The owner must complete the checklist below.

## Scope and applicability

Reviewed all 70 baseline files, including source, authored content, local photos, lockfile,
Docker/Nginx/Compose configuration, workflow, tests, and documentation. Pattern-scanned
62 reachable commit diffs retrieved from GitHub; no credential candidates were found.
CI now fetches full history and scans all unique blobs reachable from fetched refs, including
binary files, rather than relying only on diffs. Unreachable/deleted refs, host files, provider
accounts, real customer conversations, DNS/TLS configuration, and external proxy/CDN settings
are outside this checkout. Pattern scanning cannot prove that no secret has ever existed.

There are **no account/signup forms, API endpoints, database, on-site booking, checkout,
subscriptions, email sender, analytics, cookies, session replay, or user uploads** today.
The studio uses an ordinary Instagram link for inquiries. No new backend or fake deletion
endpoint was introduced. The human deletion/reporting workflow is available on the site.

## Findings and disposition

| ID / priority | Finding | Fix or verified state |
| --- | --- | --- |
| S01 / preventive | No reusable secret/history scan; credential ignore coverage incomplete | Added working-tree/full fetched-history scanner and CI gate; expanded git/Docker exclusions for keys, credentials and databases; added `.env.example` explaining server-only secrets and `VITE_*` exposure. No real credentials found and no rotations identified. |
| S02 / medium | Existing CSP allowed framing, same-origin network connections/forms, and referrer disclosure beyond current needs | Centralized Nginx headers; default/connect/frame/form/base/object/worker denied; only local scripts/fonts/images/media; inline executable attributes blocked. Frame protection DENY; no-referrer; CORP/COOP same-origin. Motion still requires inline styles, explicitly documented. |
| S03 / medium | No HSTS in the supplied static-server configuration | One-year HSTS on HTML/assets/errors; no unreviewed includeSubDomains/preload. Requires real HTTPS at the public proxy and an HTTP-to-HTTPS redirect. |
| S04 / medium | Read-only site accepted unnecessary request methods and lacked explicit private-file denial | Nginx allows GET/HEAD only; other methods 405. Dotfiles/keys/databases/configs/maps/backups denied; unknown APIs remain 404; body/time limits set; directory listing disabled. No permissive CORS headers. |
| S05 / medium | Static container could write its filesystem and had default capabilities | Compose and CI runtime use read-only filesystem, bounded noexec/nosuid tmpfs, dropped capabilities, no-new-privileges, PID and memory limits. Existing unprivileged Nginx, localhost port binding, and digest pins retained. |
| S06 / privacy | Default web access logs could retain visitor IP/referrer/query/agent data | Disabled application Nginx access logs; error logging restricted to critical failures. External proxy/CDN/host logs and retention still require owner review. Critical errors may include IPs. |
| S07 / medium | README's alternative direct static host did not carry the security policy | Added `config/Caddyfile.static` with matching headers, method/private-file restrictions, and a policy parity regression check. Public Caddy/TLS setup remains external. |
| S08 / supply chain | Need current package existence/vulnerability verification | Exact lockfile retained. GitHub's fresh baseline clean install, full npm audit, and production audit passed. Full and production audit gates remain blocking. No dependency versions changed by this pass. New branch validation results are recorded below. |
| S09 / licensing | Browser-bundled MIT/ISC notices were not copied into deployed output; no license-change gate | Build now collects full upstream license/copyright/notice texts for the 10 production lock entries into `/licenses/third-party-software.txt`; missing license text fails the build. License/origin/integrity checks block unreviewed licenses. Font OFL texts remain local. |
| S10 / licensing | Request for permissive packages needs a build-tool exception explained | Runtime entries are MIT, ISC, 0BSD or OFL-1.1. Build-only Lightning CSS uses MPL-2.0 (file copyleft, commercially usable, not permissive); build-only caniuse-lite is CC-BY-4.0 and argparse Python-2.0. Explicit reviewed allowlist entries record these, not a blanket license bypass. No MPL library is shipped to browsers. Reassess obligations if distributing/modifying tooling or Docker build stages. |
| S11 / low | Authored YAML lacked size bounds, realpath checks, and a constrained image-position value | Added text/ID/tag/document/count limits, control-character rejection, symlink containment, percentage-only positioning. Existing YAML safe schema, local media restrictions and HTML escaping preserved. These are build-time controls, not a substitute for future server validation. |
| P01 / verified | Concern about external fonts, scripts, trackers, and third-party cookies | Fonts/scripts/images are local; no tracking/storage SDK or embed exists. Browser tests exercise the carousel/detail view and assert no third-party/unexpected requests, cookies, localStorage or sessionStorage. CSP blocks connections and frames in production. No banner was added to ask for meaningless consent. |
| P02 / preventive | Future tracking could be added without consent checks | Static privacy CI guard fails on browser network/storage APIs, environment access, or obvious external resources; browser network tests catch exercised runtime requests. A future integration must implement and test explicit consent/withdrawal before replacing those guards. This is not a generic vendor-independent consent system. |
| P03 / medium | No visible privacy/deletion/abuse request route | Added `/privacy-requests/`, linked globally. Describes Instagram requests, identity minimization, correction/deletion and copyright/accessibility reports; explicitly flags the missing monitored non-Instagram contact channel and handling deadlines. No automatic database deletion is claimed. |
| P04 / verified | Images could leak GPS/EXIF data | Inspected all 15 baseline photos: no EXIF/GPS tags found; JPEGs retain display/color metadata, holiday PNG has no metadata keys. No original images recompressed/removed. Future uploads require metadata stripping and safe re-encoding before publication. |
| L01 / medium | Privacy, terms and cookie pages absent | Added script-free, accessible `/privacy/`, `/terms/`, `/cookies/` templates, plus accessibility/request pages and footer links on React and no-JavaScript pages. Every page shows a draft warning; business/contact/jurisdiction/retention/provider placeholders remain conspicuous. Draft pages are noindex. |
| L02 / unresolved manual | Business identity, legal jurisdiction, actual hosting/log retention, age/guardian and service terms unknown | Clearly marked in editable `content/legal.json`; owner/counsel approval is mandatory before treating these as adopted policies. Nothing has been invented. |
| L03 / preventive | Future payment/email/upload/age obligations had no release requirements | Added `docs/feature-safety.md`, repository guidance and PR checklist covering ownership/RLS, CSRF, abuse, deletion, consent, precise recurring-price disclosures, unchecked acknowledgment, unsubscribe/address, uploads/copyright/DMCA, age/guardian confirmation, and negative tests. Feature-specific implementation remains mandatory when those features are built. |
| A01 / medium | Image badges used white difference-blend text over arbitrary photos | Switched to opaque ink/cream badges for predictable contrast above 4.5:1; decorative numbers/icons hidden from assistive technology. Added token/badge contrast tests. |
| A02 / medium | Carousel photo focus could disappear over a pale photograph; keyboard zoom region lacked the common focus rule | Added two-tone photo focus indication and visible focus rules for tabindex controls. Existing arrow/button/swipe alternatives, modal focus trap/restore and reduced motion preserved. |
| A03 / medium | Skip link did not explicitly focus main; mobile menu Escape could remove the focused link | Main now focusable by skip navigation; Escape restores menu-toggle focus, link selection focuses its section, outside focus closes the disclosure, resize clears stale menu state, hidden menu remains a valid aria-controls target. Added keyboard regression checks. |
| A04 / readability | Some small supporting text and no-wrap captions hindered reading/reflow | Enlarged key controls/descriptions/footer text to 12px, allowed caption wrapping, added forced-color support. Existing main headings and site composition retained. Legal text is 16px with responsive layout and no-JS/320px tests. Small decorative/eyebrow text remains; font size alone is not a WCAG AA threshold. |
| A05 / preventive | Optional future portfolio video had no required captions/visual alternative | Build requires local VTT captions and `video_description` whenever `video` is supplied; native caption track and description rendered. No current videos. Human accuracy/audio-description review still required. |
| A06 / manual | Automated checks cannot prove complete WCAG 2.1 AA | Added accessible help page; manual screen-reader, high zoom/text-spacing, forced-color, touch and physical-device audit remains required, especially when new interactive features launch. |
| A07 / low | Strawberry and jewel-tone images had generic alternative text | Visually checked a contact sheet of all 15 photos and expanded these two alternatives with the visible colors, patterns and shapes. The other descriptive alternatives were retained. |

## Future launch requirements

[Feature safety requirements](feature-safety.md) define acceptance criteria and negative tests
for booking/accounts, ownership and RLS, validation/rate limits, consent, data deletion,
payments/subscriptions, email, uploads and age confirmation. Current protections deliberately
block capabilities not used by the portfolio. They **cannot automatically secure code or
provider settings that do not exist yet**. Every feature needs the matching server-side
implementation, provider setup, revised notices, and a new review before production.

## Manual checklist — current site

- [ ] Review and adopt `content/legal.json` with qualified counsel: real company identity,
  monitored email, business contact address, jurisdiction/effective date, processors/regions,
  retention/rights/deadlines/appeals and consumer-service terms. Replace every bracketed field;
  remove draft warnings/noindex only after approval. Confirm which laws apply to your audience.
- [ ] Set up a monitored, accessible email/contact alternative to Instagram for privacy,
  deletion, accessibility and copyright/security reports. Assign an owner and approved
  response deadlines. Test the published contact route without requiring Instagram.
- [ ] Confirm all 15 photos/designs may be used commercially, including client likenesses
  and character/brand artwork. Record permission/provenance privately; do not treat absence
  of EXIF as permission. The repository cannot establish ownership by itself.
- [ ] Deploy the reviewed image/dist and configure the real Caddy/host: HTTPS, redirect,
  preserved headers on errors/assets, localhost/container network binding and edge abuse
  controls. Review DNS/TLS, proxy trust and other sites sharing this host. Direct static
  serving should use the supplied Caddy policy rather than a bare file_server snippet.
- [ ] Review host/CDN/proxy access/error logs, cookies, traffic analytics, data regions,
  subprocessors and retention. This patch controls only the supplied application server.
- [ ] Configure GitHub MFA/least privilege, protected main/required checks, Dependabot
  alerts/security updates, private vulnerability reporting and secret scanning/push
  protection where available. Scan unreachable/other refs and external deployment secrets
  if appropriate; rotate any independently discovered exposed credential.
- [ ] Scan the final container images and host/proxy packages for current CVEs in your
  deployment environment; patch and rebuild pinned digests when needed. Set an update owner
  and incident process. No local Docker daemon or external account administration was available.
- [ ] Perform manual WCAG 2.1 AA review using keyboard, NVDA/VoiceOver, 200%/400% zoom,
  320 CSS-pixel reflow, text spacing, contrast over images, forced colors, and real mobile
  Safari/Chrome. Confirm all content remains reachable and document remaining barriers.

## Manual checklist — before future features

- [ ] Accounts/booking: choose auth/database/calendar vendors, configure MFA/session settings,
  real RLS/bucket/ownership policies and least-privilege server keys, test two-user isolation,
  tune trusted-proxy/shared rate limits, establish minimum-data/retention/deletion/backups.
- [ ] Tracking: approve vendors/purposes/DPAs/transfers and configure actual explicit-consent
  gating, rejection and withdrawal; update cookie inventory and test no pre-consent requests.
- [ ] Payments/subscriptions: verify the business/provider account, taxes, recurring terms,
  cancellation/refund policy and webhook secrets; counsel must review current regional laws.
- [ ] Email: set a valid physical mailing address, monitored sender/reply address, verified
  domain/SPF/DKIM/DMARC, provider suppression and end-to-end one-click unsubscribe.
- [ ] Uploads/reviews: obtain permission/license/likeness language and set a monitored
  abuse channel. Counsel should assess DMCA safe-harbor eligibility and register/maintain
  a designated agent if applicable; no registration is implied or needed merely for a portfolio.
- [ ] Signup/minors: counsel must choose the applicable age/guardian and service eligibility
  policy before an unchecked confirmation and server enforcement are added. Avoid collecting
  full birth dates merely to confirm an age threshold.

## Validation record

- Local: Python secret-scanner tests, current working-tree scan, security/license/privacy
  baseline tests and CI diagnostic tests pass. All 62 retrieved baseline commit diffs
  pattern-scanned with no credential candidates. All 15 baseline image metadata inspected.
- Local `npm ci` was blocked by network policy (registry tarballs returned HTTP 403), so
  dependency-backed build/lint/content/browser checks and Docker could not be run here.
  No lockfile bypass, renamed dependency, or weakened audit gate was used.
- GitHub baseline run 44445712849 passed clean install, full dependency audit, lint, build,
  content and production dependency audit for the unchanged lockfile. This does not
  substitute for checks on the hardening branch; see the PR's current checks for that result.
- Hardening run [44448861821](https://github.com/Naiguy1/finebykay/actions/runs/44448861821)
  passed all stages, including 90 browser tests (no skips), both npm audits (zero findings),
  a scan of 265 historical blobs, and real HTTP checks under the restricted container.
  The later production-CSP browser smoke and final revision are validated by the PR's
  latest checks; the earlier run is retained as evidence, not substituted for them.
- CI now also runs full fetched-history secret scanning, explicit license/origin/integrity
  checks, privacy network/storage and no-JS legal-page checks, focus/contrast checks, and
  real HTTP checks and a Chromium smoke test under the hardened production container and its actual CSP.

## Primary guidance

- [OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [W3C contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [ICO cookies guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/)
- [FTC commercial email guidance](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [US Copyright Office DMCA FAQ](https://www.copyright.gov/dmca-directory/faq.html)
- [Nginx header inheritance](https://nginx.org/en/docs/http/ngx_http_headers_module.html)

Applicability and legal obligations depend on the actual business, users and jurisdiction.
The draft templates and engineering requirements are not a substitute for counsel's review.
