import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { studio } from '../data/portfolio';

const links = [['Work', '#work'], ['Services', '#services'], ['About', '#about']] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  return <header className="site-header">
    <a className="skip-link" href="#main">Skip to content</a>
    <a href="#" className="wordmark" aria-label="finebykay home">finebykay<span aria-hidden="true">✳</span></a>
    <nav className="desktop-nav" aria-label="Main navigation">{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
    <a className="header-social" href={studio.instagram} target="_blank" rel="noopener noreferrer">{studio.handle}<ArrowUpRight size={14} aria-hidden="true" /></a>
    <button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
    {open && <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}<a href="#contact" onClick={() => setOpen(false)}>Get in touch</a></nav>}
  </header>;
}
