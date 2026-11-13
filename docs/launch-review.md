# Launch review — November 13, 2026

Two independent reviewers assessed security and design/accessibility while the desktop hero carousel was implemented. Findings below reflect source/configuration review and automated CI checks, not a certification of the live server.

## Implemented

| Area | Finding / change |
| --- | --- |
| Desktop carousel | Wheel input cycles a continuous ring of cards in both directions. The handler is scoped to the hero region, with keyboard/buttons, a down link, instructions, and Escape release while hovered or focused. Ctrl/Meta/Alt gestures pass through. |
| Mobile/tablet | The wheel enhancement requires at least 1024px plus a fine hover pointer. Phones and touch tablets retain the original gallery. A narrow heading can reflow when text is enlarged. |
| Reduced motion / performance | User-controlled cycling remains available without eased movement or parallax. Animation frames run only while settling; observers and listeners clean up on resize/unmount. |
| Filtering | Stable selected-set IDs prevent an exiting card's stale numeric index from opening an invalid lightbox after filtering. |
| Keyboard zoom | The zoomed viewport is focusable and supports arrow-key panning; normal gallery navigation resumes after zooming out. |
| Development server | Vite was updated from 7.2.2 to 7.3.8, with a regenerated lockfile. Development and preview bind to localhost by default. |
| Static response headers | Hashed assets now retain nosniff, referrer, and frame policies despite their location-specific cache header. |
| Docker build context | Environment files, npm credentials, and common private-key filenames are excluded. No embedded credentials or private studio address were found in the reviewed source. |

The Vite issue affects an explicitly network-exposed development server, not the deployed Nginx static runtime. See the [official advisory](https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7). Nginx's header inheritance behavior is documented [here](https://nginx.org/en/docs/http/ngx_http_headers_module.html).

## Residual dependency finding

The full npm audit reports **seven moderate, zero high, and zero critical findings**, all through the development-only TypeScript ESLint/minimatch chain. These are not seven separate runtime flaws. The underlying [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) concerns denial of service from attacker-controlled glob patterns.

At review time, the latest stable TypeScript ESLint release still uses the affected minimatch major. The compatible upstream dependency change is not yet in a stable release. Retain the working pin and lockfile rather than applying an untested major override or an unreleased package version. Review this finding again when a stable upstream fix is available. The deployed image contains static build output, not this development toolchain.

## Content and deployment follow-up

- Replace or explicitly approve the generated demonstration nail photographs, repeated sample entries, studio image, and placeholder About narrative before presenting them as Kalisa's real portfolio. They remain documented in `public/media/ASSETS.md` and the README.
- Confirm mobile readability on actual devices; primary mobile copy is currently 11–12px. No mobile carousel interaction has been introduced.
- Preserve Caddy's shared network in its **service-level Compose networks list** when recreating the proxy. The host's Jellyfin/Caddy configuration is outside this repository.
- Check public DNS, TLS, and the rebuilt live page after deployment. Passive access to the public endpoint was blocked by this workspace's network policy; that does not establish a problem with the site.

## Verification

The repository CI runs strict TypeScript, ESLint, a production build, Chromium desktop/mobile interaction tests, a production dependency audit, and a production Docker image check. Browser checks cover wheel movement/reversal, complete loops, keyboard controls, zoom-gesture passthrough, Escape/outside scrolling, resize/touch fallback, reduced motion, gallery race conditions, focus restoration, and zoom panning. It also checks the heading at 320px with enlarged text.

The Docker check runs `nginx -t` and requests real generated assets, HTML, and a missing asset to verify response headers, MIME handling, 404 behavior, and immutable caching. Full dependency-audit output and production/browser artifacts are retained by CI. Review [the checks for the deployed revision](https://github.com/Naiguy1/finebykay/actions) rather than assuming an earlier passing run validates a later change.

The reviewers did not conduct penetration testing, a live TLS review, a container-image CVE scan, or rendered cross-browser/device inspection. Chromium results do not establish Safari/Firefox compatibility or visual approval on real devices.
