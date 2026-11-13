import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { PortfolioSet } from '../data/portfolio';

interface LightboxProps { sets: readonly PortfolioSet[]; index: number; onNavigate: (index: number) => void; onClose: () => void }

export function Lightbox({ sets, index, onNavigate, onClose }: LightboxProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const reduced = useReducedMotion();
  const set = sets[index];
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; previousFocus?.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    if (zoomed) viewport.current?.focus({ preventScroll: true });
  }, [zoomed]);
  const navigate = (next: number) => { setZoomed(false); onNavigate((next + sets.length) % sets.length); };

  return createPortal(<dialog ref={dialog} className="lightbox" aria-labelledby="lightbox-title" aria-describedby="lightbox-instructions" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => {
    if (event.key === 'Tab') {
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], video[controls], [tabindex]:not([tabindex="-1"])')).filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (active === last || !event.currentTarget.contains(active))) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }
    if (event.target instanceof HTMLVideoElement) return;
    if (zoomed && event.target === viewport.current && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const step = 100;
      viewport.current?.scrollBy({
        left: event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
        top: event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
        behavior: 'auto',
      });
      return;
    }
    if (event.key === 'ArrowRight') { event.preventDefault(); navigate(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(index - 1); }
  }}>
    <div className="lightbox-shell">
      <div className="lightbox-top"><span className="wordmark">finebykay</span><span className="eyebrow">The lookbook</span><button className="icon-button" aria-label="Close lookbook" onClick={onClose} autoFocus><X size={22} /></button></div>
      <div ref={viewport} className={`lightbox-image ${zoomed ? 'is-zoomed' : ''}`} tabIndex={zoomed ? 0 : undefined} role={zoomed ? 'region' : undefined} aria-label={zoomed ? 'Zoomed image. Use arrow keys to pan.' : undefined} onTouchStart={(event) => { const point = event.touches[0]; touch.current = event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null; }} onTouchEnd={(event) => {
        if (!touch.current || zoomed) return;
        const dx = touch.current.x - event.changedTouches[0].clientX;
        const dy = touch.current.y - event.changedTouches[0].clientY;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(index + (dx > 0 ? 1 : -1));
        touch.current = null;
      }}>
        <AnimatePresence mode="wait" initial={false}><motion.div key={set.id} className="lightbox-media" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.35 }}>
          {set.video ? <video controls playsInline preload="metadata" poster={set.image} src={set.video} aria-label={set.title} /> : <img src={set.highRes ?? set.image} alt={set.alt} width="1200" height="1600" />}
        </motion.div></AnimatePresence>
      </div>
      <div className="lightbox-bottom">
        <div><p className="eyebrow">{set.category}</p><h2 id="lightbox-title">{set.title}</h2><p className="lightbox-tags">{set.tags.join(' · ')}</p></div>
        <div className="lightbox-controls"><button className="icon-button" aria-label="Previous set" onClick={() => navigate(index - 1)}><ArrowLeft size={20} /></button><span aria-live="polite" aria-atomic="true">{String(index + 1).padStart(2, '0')} / {String(sets.length).padStart(2, '0')}</span><button className="icon-button" aria-label="Next set" onClick={() => navigate(index + 1)}><ArrowRight size={20} /></button>{!set.video && <button className="icon-button" aria-label={zoomed ? 'Zoom out' : 'Zoom in'} aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}</button>}</div>
      </div>
      <p id="lightbox-instructions" className="lightbox-hint">{zoomed ? 'Arrow keys to pan · Tab for gallery controls · Escape to close' : 'Arrow keys or swipe to explore · Escape to close'}</p>
    </div>
  </dialog>, document.body);
}
