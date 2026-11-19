import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import yaml from 'js-yaml';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const siteOrigin = 'https://nails.bowerbanks.com';
export const nailCategories = ['Natural Nails', 'Structured Gel', 'Intricate Art'];
const allowedFields = new Set(['id', 'name', 'description', 'category', 'image', 'image_description', 'tags', 'high_resolution', 'image_position', 'video', 'captions', 'video_description', 'lookbook_order']);

function fail(location, message) {
  throw new Error(`content/sets.yaml — ${location}: ${message}`);
}

function text(entry, key, location, required = true) {
  const value = entry[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim()) fail(location, `“${key}” must contain text.`);
  const hasControl = [...value].some((character) => {
    const code = character.charCodeAt(0);
    return (code < 32 && ![9, 10, 13].includes(code)) || code === 127;
  });
  if (value.length > 4000 || hasControl) fail(location, `“${key}” is too long or contains control characters.`);
  return value.trim();
}

function mediaPath(value, location, root, checkMedia, extensions) {
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { fail(location, 'The media path contains an invalid % escape.'); }
  if (!decoded.startsWith('/media/') || decoded.includes('\\') || decoded.includes('\0') || /[?#]/.test(decoded) || decoded.split('/').some((part) => part === '.' || part === '..')) {
    fail(location, 'Use a local /media/filename path, without ../, query strings, or external URLs.');
  }
  if (!extensions.test(decoded)) fail(location, 'The media filename has an unsupported extension.');
  const mediaRoot = resolve(root, 'public/media');
  const file = resolve(root, `public${decoded}`);
  if (!file.startsWith(mediaRoot + sep)) fail(location, 'The file must be inside public/media/.');
  if (checkMedia && (!existsSync(file) || !statSync(file).isFile())) fail(location, `Photo or video not found: public${decoded}`);
  if (checkMedia && !realpathSync(file).startsWith(realpathSync(mediaRoot) + sep)) fail(location, 'Media symlinks must stay inside public/media/.');
  return value;
}

/** Readable YAML is the only authored source for both the browser and shared pages. */
export function parseSets(source, { root = projectRoot, checkMedia = true } = {}) {
  if (source.length > 1_000_000) fail('sets', 'Content must be smaller than 1 MB.');
  let entries;
  try { entries = yaml.load(source, { schema: yaml.JSON_SCHEMA }); } catch (error) {
    fail('YAML formatting', error.message);
  }
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > 1000) fail('sets', 'Add 1–1000 sets, starting with “- id:”.');
  const ids = new Set();
  const lookbookOrders = new Set();
  return entries.map((entry, index) => {
    const location = `set ${index + 1}${typeof entry?.id === 'string' ? ` (${entry.id})` : ''}`;
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) fail(location, 'Each set must be a group of named fields.');
    for (const key of Object.keys(entry)) if (!allowedFields.has(key)) fail(location, `Unknown field “${key}”. Check its spelling.`);
    const id = text(entry, 'id', location);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail(location, '“id” may contain lowercase letters, numbers, and single hyphens only.');
    if (id.length > 100) fail(location, '“id” must be at most 100 characters.');
    if (ids.has(id)) fail(location, `The id “${id}” is used twice. Every set needs its own permanent id.`);
    ids.add(id);
    const title = text(entry, 'name', location);
    const description = text(entry, 'description', location);
    const category = text(entry, 'category', location);
    if (!nailCategories.includes(category)) fail(location, `Choose a category: ${nailCategories.join(' | ')}.`);
    const image = mediaPath(text(entry, 'image', location), `${location}, image`, root, checkMedia, /\.(?:jpe?g|png|webp|avif|gif)$/i);
    const alt = text(entry, 'image_description', location);
    const tags = entry.tags ?? [];
    if (!Array.isArray(tags) || tags.length > 20 || tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag.length > 100)) fail(location, '“tags” must be a list of at most 20 short text labels (100 characters each).');
    const result = { id, title, description, category, image, alt, tags: tags.map((tag) => tag.trim()) };
    if (entry.lookbook_order !== undefined) {
      const order = entry.lookbook_order;
      if (!Number.isSafeInteger(order) || order < 1) fail(location, '“lookbook_order” must be a positive whole number.');
      if (lookbookOrders.has(order)) fail(location, 'Each “lookbook_order” must be unique.');
      lookbookOrders.add(order);
      result.lookbookOrder = order;
    }
    const highRes = text(entry, 'high_resolution', location, false);
    const video = text(entry, 'video', location, false);
    const objectPosition = text(entry, 'image_position', location, false);
    if (highRes) result.highRes = mediaPath(highRes, `${location}, high_resolution`, root, checkMedia, /\.(?:jpe?g|png|webp|avif|gif)$/i);
    if (video) {
      result.video = mediaPath(video, `${location}, video`, root, checkMedia, /\.(?:mp4|webm)$/i);
      result.captions = mediaPath(text(entry, 'captions', location), `${location}, captions`, root, checkMedia, /\.vtt$/i);
      result.videoDescription = text(entry, 'video_description', location);
    } else if (entry.captions !== undefined || entry.video_description !== undefined) fail(location, 'Captions and video_description require a video.');
    if (objectPosition) {
      if (!/^(?:100|\d{1,2})(?:\.\d+)?% (?:100|\d{1,2})(?:\.\d+)?%$/.test(objectPosition) || objectPosition.split(' ').some((part) => parseFloat(part) > 100)) fail(location, '“image_position” must be two percentages between 0% and 100%.');
      result.objectPosition = objectPosition;
    }
    return result;
  });
}

export function readSets(options = {}) {
  const root = options.root ?? projectRoot;
  return parseSets(readFileSync(resolve(root, 'content/sets.yaml'), 'utf8'), { ...options, root });
}

export function setPath(id) { return `/sets/${id}/`; }

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function renderSetPage(template, set) {
  const policies = JSON.parse(readFileSync(resolve(projectRoot, 'content/legal.json'), 'utf8'));
  const footer = `<footer><nav class="policy-links" aria-label="Policies and help">${policies.map(({ slug, title }) => `<a href="/${escapeHtml(slug)}/">${escapeHtml(title)}</a>`).join('')}</nav></footer>`;
  const url = `${siteOrigin}${setPath(set.id)}`;
  const image = new URL(set.image, siteOrigin).href;
  const title = `${set.title} | finebykay`;
  const metadata = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(set.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="finebykay" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(set.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(set.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(set.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(set.alt)}" />`,
    `<link rel="preload" as="image" href="${escapeHtml(set.image)}" />`,
  ].join('\n    ');
  const fallback = `<noscript><main><p>finebykay · ${escapeHtml(set.category)}</p><h1>${escapeHtml(set.title)}</h1><img src="${escapeHtml(set.image)}" alt="${escapeHtml(set.alt)}" width="900" height="1200" /><p>${escapeHtml(set.description)}</p><p><a href="/#work">Explore more work</a> · <a href="https://instagram.com/finebykay" rel="noreferrer">@finebykay on Instagram</a></p></main>${footer}</noscript>`;
  return template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\b[^>]*(?:name=["'](?:description|twitter:[^"']+)["']|property=["']og:[^"']+["'])[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*rel=["']preload["'][^>]*as=["']image["'][^>]*>\s*/gi, '')
    .replace('</head>', `    ${metadata}\n  </head>`)
    .replace(/<noscript>[\s\S]*?<\/noscript>/i, fallback);
}

