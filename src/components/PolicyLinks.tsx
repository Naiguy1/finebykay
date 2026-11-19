import policies from '../../content/legal.json';

export function PolicyLinks() {
  return <nav className="policy-links" aria-label="Policies and help">
    {policies.map(({ slug, title }) => <a key={slug} href={`/${slug}/`}>{title}</a>)}
  </nav>;
}
