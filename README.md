# finebykay

A single-page nail portfolio for **nails.bowerbanks.com**, inspired by the supplied editorial gallery references. Built with React, TypeScript, Vite, Tailwind CSS v4, Framer Motion, and Lucide. It builds to ordinary static files with **no Framer site-builder runtime, account, backend, booking service, or remote image/font requests**. The open-source Framer Motion animation library is bundled locally.

## Local development

Use Node **22.12+** (Node 22 LTS recommended).

```bash
npm ci
npm run dev
```

Vite prints the local development URL. Development and preview servers bind to localhost by default. Use production static hosting for public traffic.

Direct dependencies and the resolved dependency tree are pinned in `package.json` and `package-lock.json`. Motion's DOM/utilities packages are pinned together because later transitive releases changed exports. Use `npm ci` for reproducible installs. When intentionally changing dependencies, use `npm install` and commit the updated lockfile. CI also uploads the lockfile with the production build.

```bash
npm run lint
npm run build
npx playwright install chromium webkit
npm run test:e2e
npm run preview
```

`npm run build` first runs strict TypeScript checking, then outputs the site to **`dist/`**. `preview` is for inspecting that output locally, not a production server. The GitHub Actions workflow runs ESLint, the production build, and Chromium desktop/mobile and WebKit mobile browser checks for filtering, keyboard navigation, modal focus, zoom, local images, anchors, mobile menu, viewport overflow, wheel cycling, touch gesture handling, and reduced motion. It also verifies the production Docker image and HTTP security headers. The workflow does not deploy the site.

## Dependency updates and failed checks

Use the pinned Node 22 build environment and `npm ci` with the committed lockfile. Vite, its React plugin, and Tailwind's Vite integration must accept the same Vite major. The current supported stack uses Vite 7; Vite 8 requires a coordinated plugin migration. ESLint, its configuration packages/plugins, and the TypeScript parser also need compatible peer versions. Update React and React DOM together.

Dependabot groups related packages and limits automatic npm updates to patch/minor releases. Major releases remain deliberate migrations: check peer requirements and security advisories, regenerate the lockfile normally, and run the full validation before merging. Do not bypass a peer conflict with `--force` or `--legacy-peer-deps`, and do not disable audit gates to make checks green. If a security fix requires a major upgrade, perform that coordinated migration promptly.

CI uses Ubuntu 24.04 with the pinned Playwright version; do not change the runner image independently of browser support. CI validates pull requests and pushes to `main`, avoiding duplicate feature-branch runs. Check the first failed stage: **installation**, **dependency audit**, **content**, **lint**, **build**, **browser installation/tests**, or **container**. The stage table distinguishes failed checks from checks that did not run; an audit failure can coexist with passing functional checks. Installation and audit output is preserved in the validation report and uploaded artifacts alongside later-stage logs.

### Picomatch advisory status (updated November 18, 2026)

[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) was withdrawn by GitHub on November 18, 2026. Its earlier audit report produced 12 affected-package findings through build-tool dependency paths; that historical report should not be treated as a newly failing installation or browser test. The [upstream discussion](https://github.com/micromatch/picomatch/pull/235#issuecomment-6986653594) also records the withdrawal.

Keep the normal full `npm audit` and production audit gates enabled. Run fresh validation against the current registry data: historical failed workflow runs do not update when an advisory is withdrawn. No advisory exception, locally renamed dependency, or custom picomatch fork is required for this withdrawal. Continue to use reviewed configuration patterns rather than accepting arbitrary user-supplied glob or regular-expression patterns.

Independent content, lint, build, browser, and container checks still run when their own prerequisites pass, so their results can be assessed separately. An installation failure still prevents dependency-dependent checks.

## Edit names, descriptions, and photos

**Edit `content/sets.yaml`** to change a set's name, description, image description, category, or tags. This is the only authored source for portfolio content. You can edit it directly in GitHub; no React or TypeScript changes are needed.

```yaml
- id: botanical-gel
  name: Botanical study
  description: >-
    Write the story of this set here.
    Several indented lines become one paragraph.
  category: Intricate Art
  image: /media/botanical-gel.jpg
  image_description: Sheer pink nails with hand-painted burgundy flowers.
  tags:
    - Botanical detail
    - Burgundy
```

- **Keep `id` unchanged when renaming an existing set.** Its permanent shared address is `https://nails.bowerbanks.com/sets/botanical-gel/`. IDs use lowercase letters, numbers, and single hyphens. A new set needs a new, unique ID. Keep published entries if their shared links should continue to work.
- `name` appears on the site and in shared previews. `description` is the short paragraph in its reveal and shared preview. Descriptions describe the visible design and can be rewritten here.
- `image_description` describes what is actually visible for people using screen readers. Preserve the existing accurate image descriptions when editing names or filler copy.
- Category must be **Natural Nails**, **Structured Gel**, or **Intricate Art**. Tags are optional; use `tags: []` for none.
- Put original photos in **`public/media/`** and use `/media/filename.jpg` in the YAML. A roughly 3:4 portrait crop works well. WebP/JPEG is recommended, around 150–400KB for the grid. Preserve existing originals when adding sets.
- Optional fields are `lookbook_order: 1`, `high_resolution: /media/photo-large.jpg`, `image_position: "50% 50%"`, and `video: /media/detail.mp4`. Videos use native controls and never autoplay. Paths with spaces may be percent-encoded (`%20`).

To add a set, copy an entry in the YAML, change its ID, update its text and photo path, then rebuild. Every published set automatically joins the carousel and keeps its shared page. Only entries with `lookbook_order` appear in the curated lookbook, sorted by that number (1 first). The current six selections use 1–6; omit the field to keep a set out of the grid. Keep order numbers positive and unique. Saving YAML alone does not update the live site: **rebuild and redeploy** to publish. Restart the development server after editing YAML during local work.

```bash
npm run content:generate  # validates the YAML and media paths
npm run test:content      # checks content validation and static page generation
npm run lint
npm run build
npm run test:e2e
```

YAML indentation matters: keep two spaces before fields and four spaces before description lines. Text after `>-` can include ordinary punctuation without quotes. Build errors identify the set and the field that needs attention, including missing photos, duplicate IDs, and misspelled field names.

The build generates `src/data/sets.generated.json` for the browser and a real `dist/sets/<id>/index.html` for every shared link. **Do not edit generated files.** Each static page includes its own title, description, canonical URL, photograph, Open Graph/Twitter preview metadata, and a no-JavaScript fallback. The built sitemap includes every set. Messaging platforms control preview display and may cache older previews.

The About introduction and studio links remain in `src/data/portfolio.ts`; starting pricing lives in `src/components/Services.tsx`. The homepage social image and central hero preload are configured in `index.html`.

## Design and behavior

- Tokens and responsive styling: `src/styles.css`, including Tailwind `@theme` colors and locally bundled Cormorant Garamond / Inter fonts via Fontsource.
- Components: `src/components/` (Header, Hero, Lookbook, Lightbox, Services, About, Contact).
- Anchors: `#work`, `#services`, `#about`, `#contact`.
- Motion: 0.7–1.1 second entrances, custom `[0.22, 1, 0.36, 1]` easing, scroll-linked hero depth, magnetic links, image settling, and a shared category pill. Set reveals expand from the selected photograph and support reduced motion.
- Reduced motion: OS preferences disable scroll animation, parallax, magnetic movement, layout motion, image scaling, and long transitions.
- Hero carousel: swipe left or right on phones and touch tablets to cycle seamlessly through the featured sets. Vertical scrolling and browser pinch zoom remain available; short, cancelled, and multi-touch gestures do not change sets. Arrow buttons/keys work at every size. On screens at least 1024px wide with a fine hover pointer, wheel over the images to cycle. Move the pointer away or press Escape to restore page scrolling; Ctrl/Meta wheel zoom is left to the browser. Resizing preserves the selected set, and reduced motion removes easing and parallax.
- Lightbox: native modal dialog for focus trapping and background inertness; focus returns to the opening card; Escape closes; arrow keys and horizontal swipes move through the current category; zoom enables image panning. Optional video supports native controls and never autoplays.
- Contact: Instagram only. There is no booking widget or calendar integration.

## Self-host as static files

```bash
npm ci
npm run lint
npm run build
```

Serve the **contents of `dist/`** from any static web server at `https://nails.bowerbanks.com/`. Assets and fonts are included. The build includes the homepage and one real HTML directory per set. Serve directory indexes normally; no application server or catch-all route is needed. Configure your DNS and HTTPS with your hosting provider. Canonical, Open Graph, robots, and sitemap URLs already use `nails.bowerbanks.com`.

Example Caddy configuration when serving a copied `dist/` directory:

```caddyfile
nails.bowerbanks.com {
    root * /srv/finebykay/dist
    encode zstd gzip
    file_server
}
```

## Self-host with Docker

```bash
docker compose up -d --build
```

The multi-stage Dockerfile builds the static site and serves it with unprivileged Nginx on port **8080**. Compose binds it to **127.0.0.1:8080** for an existing reverse proxy on the same host. Docker Compose v2 is assumed. Build steps require internet access to npm; the running container does not.

Example Caddy reverse proxy on that host:

```caddyfile
nails.bowerbanks.com {
    reverse_proxy 127.0.0.1:8080
}
```

If the reverse proxy also runs in Docker, attach both services to a shared Docker network and proxy to `finebykay:8080` rather than localhost. Configure the DNS record to point to your server and let your proxy handle TLS. Neither DNS nor production deployment is performed by this repo.

## Source ownership

This is a new implementation based on the supplied design brief and screenshots, not an export of Framer's proprietary project or its template source. No template code or museum photographs are included. Fonts retain their upstream licenses in the installed Fontsource packages. No open-source license for the original site code is assumed; the repository owner can add one if desired.
