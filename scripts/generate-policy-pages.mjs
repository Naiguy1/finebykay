import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { escapeHtml, projectRoot, siteOrigin } from './content.mjs';

const pages = JSON.parse(readFileSync(resolve(projectRoot, 'content/legal.json'), 'utf8'));
const template = readFileSync(resolve(projectRoot, 'dist/index.html'), 'utf8');
// Reuse the locally bundled fonts and styles, with no scripts on policy pages.
const styles = template.match(/<link\b[^>]*rel="stylesheet"[^>]*>/g)?.join('\n') ?? '';
const links = pages.map(({ slug, title }) => `<a href="/${escapeHtml(slug)}/">${escapeHtml(title)}</a>`).join('\n');
const slugs = new Set();
for (const page of pages) {
  if (!/^[a-z]+(?:-[a-z]+)*$/.test(page.slug) || slugs.has(page.slug)) throw new Error('Policy slugs must be safe and unique.');
  slugs.add(page.slug);
  const directory = resolve(projectRoot, 'dist', page.slug);
  const body = page.sections.map(({ heading, paragraphs }) => `<section><h2>${escapeHtml(heading)}</h2>${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</section>`).join('\n');
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(page.title)} | finebykay</title><meta name="robots" content="noindex, follow">
<meta name="description" content="${escapeHtml(page.title)} and contact information for finebykay.">
<link rel="canonical" href="${siteOrigin}/${page.slug}/">${styles}</head>
<body class="policy-page"><header><a class="skip-link" href="#main">Skip to content</a><a class="wordmark" href="/">finebykay</a></header>
<main id="main" tabindex="-1"><h1>${escapeHtml(page.title)}</h1>
<p class="policy-draft"><strong>Draft for legal review.</strong> Bracketed sections are unfinished and must be confirmed by the studio. This template is not a final legal policy.</p>
${body}<p><a href="https://instagram.com/finebykay" rel="noreferrer">Contact @finebykay on Instagram (external site)</a></p></main>
<footer><nav class="policy-links" aria-label="Policies and help">${links}</nav><a href="/">Return to the lookbook</a></footer></body></html>\n`);
}
