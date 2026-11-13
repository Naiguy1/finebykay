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
npx playwright install chromium
npm run test:e2e
npm run preview
```

`npm run build` first runs strict TypeScript checking, then outputs the site to **`dist/`**. `preview` is for inspecting that output locally, not a production server. The GitHub Actions workflow runs ESLint, the production build, and Chromium desktop/mobile browser checks for filtering, keyboard navigation, modal focus, zoom, local images, anchors, mobile menu, viewport overflow, wheel cycling, touch-device fallback, and reduced motion. It also verifies the production Docker image and HTTP security headers. The workflow does not deploy the site.

## Replace the sample work

**The included nail photos and studio image are AI-generated sample imagery, not Kalisa's client work or a photograph of her studio.** Six demonstration entries reuse three nail images so you can see filtering and layout. Replace the images and placeholder About narrative before presenting this as a portfolio of actual work. No location, availability schedule, qualifications, or booking promises have been invented.

1. Put original photos in **`public/media/`**, e.g. `public/media/botanical-gel.webp`. Use a roughly 3:4 portrait crop, ideally 1200 × 1600px. WebP/JPEG is recommended, around 150–400KB for the grid. Keep source originals separately.
2. Edit **`src/data/portfolio.ts`**. Add or update a typed entry:

```ts
{
  id: 'botanical-gel',
  title: 'Botanical study',
  category: 'Intricate Art', // Natural Nails | Structured Gel | Intricate Art
  image: '/media/botanical-gel.webp',
  highRes: '/media/botanical-gel-large.webp', // optional, detail view only
  alt: 'Sheer pink almond nails with hand-painted burgundy flowers',
  tags: ['Builder gel', 'Hand-painted botanical'],
  objectPosition: '50% 50%', // optional crop alignment
  // video: '/media/botanical-detail.mp4', // optional lightbox video, controls, no autoplay
}
```

3. Update `heroSets` in the same file to choose the five hero positions. Update `studio.image` and `studio.paragraphs` for the studio photo and About copy. The `services` array holds the editable menu descriptions. Starting pricing lives in `src/components/Services.tsx`.
4. For a social sharing image, replace `public/media/rose.webp` or update the absolute `og:image` URL in `index.html`. Also update its preload link if changing the central hero image.
5. Run lint, build, and browser checks again. All public paths start with `/media/`, **not** `/public/media/`. This app expects to be served at the domain root.

Sample image provenance and generation prompts: [`public/media/ASSETS.md`](public/media/ASSETS.md).

## Design and behavior

- Tokens and responsive styling: `src/styles.css`, including Tailwind `@theme` colors and locally bundled Cormorant Garamond / Inter fonts via Fontsource.
- Components: `src/components/` (Header, Hero, Lookbook, Lightbox, Services, About, Contact).
- Anchors: `#work`, `#services`, `#about`, `#contact`.
- Motion: 0.7–1.1 second entrances, custom `[0.22, 1, 0.36, 1]` easing, scroll-linked hero depth, magnetic links, image settling, and a shared category pill. The lightbox uses a shorter opacity crossfade to keep navigation comfortable.
- Reduced motion: OS preferences disable scroll animation, parallax, magnetic movement, layout motion, image scaling, and long transitions.
- Desktop hero carousel: on screens at least 1024px wide with a fine hover pointer, wheel over the images to cycle seamlessly in either direction. Arrow buttons/keys also work. Move the pointer away or press Escape to restore page scrolling; Ctrl/Meta wheel zoom is left to the browser. Phones and touch tablets keep the original static/parallax strip. Reduced motion removes easing and parallax.
- Lightbox: native modal dialog for focus trapping and background inertness; focus returns to the opening card; Escape closes; arrow keys and horizontal swipes move through the current category; zoom enables image panning. Optional video supports native controls and never autoplays.
- Contact: Instagram only. There is no booking widget or calendar integration.

## Self-host as static files

```bash
npm ci
npm run lint
npm run build
```

Serve the **contents of `dist/`** from any static web server at `https://nails.bowerbanks.com/`. Assets and fonts are included. There is one HTML page; no application server or catch-all route is needed. Configure your DNS and HTTPS with your hosting provider. Canonical, Open Graph, robots, and sitemap URLs already use `nails.bowerbanks.com`.

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
