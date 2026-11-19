import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { studio } from '../data/portfolio';

const links = [['Work', '#work'], ['Services', '#services'], ['About', '#about']] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 641px)');
    const close = () => { if (media.matches) setOpen(false); };
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);
  return <header className="site-header">
    <a className="skip-link" href="#main">Skip to content</a>
    <a href="#" className="wordmark" aria-label="finebykay home">finebykay<span aria-hidden="true">✳</span></a>
    <nav className="desktop-nav" aria-label="Main navigation">{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
    <a className="header-social" href={studio.instagram} target="_blank" rel="noopener noreferrer">{studio.handle}<ArrowUpRight size={14} aria-hidden="true" /></a>
    <button ref={toggle} className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
    <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation" hidden={!open} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== toggle.current) setOpen(false);
    }} onClick={(event) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (!link) return;
      const target = document.querySelector<HTMLElement>(link.hash);
      setOpen(false);
      target?.setAttribute('tabindex', '-1');
      target?.focus({ preventScroll: true });
    }}>{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}<a href="#contact">Get in touch</a></nav>
  </header>;
}

