import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { PortfolioSet } from '../data/portfolio';
import { ShareSet } from './ShareSet';

interface LightboxProps {
  sets: readonly PortfolioSet[];
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
  origin?: HTMLElement | null;
  closing?: boolean;
  onExited?: () => void;
  sharedEntry?: boolean;
}

const easing = 'cubic-bezier(.22, 1, .36, 1)';

/** Measure the photograph rather than its caption or the rotated bounding box. */
function photograph(origin?: HTMLElement | null) {
  if (!origin?.isConnected) return null;
  const frame = origin.querySelector<HTMLElement>('.portfolio-photo') ?? origin;
  const bounds = frame.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0 || bounds.bottom <= 0 || bounds.top >= innerHeight || bounds.right <= 0 || bounds.left >= innerWidth) return null;
  let rotation = 0;
  let parent: HTMLElement | null = frame;
  while (parent && parent !== document.body) {
    const style = getComputedStyle(parent);
    const transform = style.transform;
    if (transform !== 'none') {
      const matrix = new DOMMatrixReadOnly(transform);
      rotation += Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
    }
    // Individual CSS rotate is composed outside the transform matrix.
    const angle = style.rotate?.split(' ').at(-1);
    if (angle && angle !== 'none') {
      const amount = parseFloat(angle);
      if (Number.isFinite(amount)) rotation += angle.endsWith('grad') ? amount * 0.9 : angle.endsWith('rad') ? amount * 180 / Math.PI : angle.endsWith('turn') ? amount * 360 : amount;
    }
    parent = parent.parentElement;
  }
  const width = frame.offsetWidth;
  const height = frame.offsetHeight;
  return { frame, left: bounds.left + bounds.width / 2 - width / 2, top: bounds.top + bounds.height / 2 - height / 2, width, height, rotation, radius: getComputedStyle(frame).borderRadius };
}

/** object-fit: contain leaves empty space around the visible photograph. */
function containedImage(viewport: HTMLElement, sourceImage?: HTMLImageElement | null) {
  const bounds = viewport.getBoundingClientRect();
  const image = viewport.querySelector('img');
  const loaded = image?.naturalWidth ? image : sourceImage;
  const ratio = loaded?.naturalWidth && loaded.naturalHeight ? loaded.naturalWidth / loaded.naturalHeight : 3 / 4;
  const width = Math.min(bounds.width, bounds.height * ratio);
  const height = width / ratio;
  return { left: bounds.left + (bounds.width - width) / 2, top: bounds.top + (bounds.height - height) / 2, width, height, rotation: 0, radius: '10px' };
}

function imageFrame(box: NonNullable<ReturnType<typeof photograph>> | ReturnType<typeof containedImage>) {
  return { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, transform: `rotate(${box.rotation}deg)`, borderRadius: box.radius };
}

export function Lightbox({ sets, index, onNavigate, onClose, origin, closing = false, onExited, sharedEntry = false }: LightboxProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; horizontal: boolean } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [direction, setDirection] = useState(1);
  const reduced = useReducedMotion();
  const dragX = useMotionValue(0);
  const set = sets[index];
  const initial = useRef({ origin, setId: set.id, image: set.image, objectPosition: set.objectPosition, reduced: !!reduced });
  const running = useRef<Animation[]>([]);
  const ready = useRef(false);
  const phase = useRef<'opening' | 'open' | 'closing'>('opening');

  useLayoutEffect(() => {
    const element = dialog.current!;
    const content = shell.current!;
    const overlay = ghost.current!;
    const media = viewport.current!;
    phase.current = 'opening';
    ready.current = false;
    const previousFocus = initial.current.origin ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const overflow = document.body.style.overflow;
    const source = initial.current.origin?.dataset.setId && initial.current.origin.dataset.setId !== initial.current.setId ? null : photograph(initial.current.origin);
    const oldVisibility = source?.frame.style.visibility ?? '';
    element.showModal();
    document.body.style.overflow = 'hidden';
    const destination = containedImage(media, source?.frame.querySelector('img'));
    const canReveal = source && !initial.current.reduced;
    const duration = initial.current.reduced ? 0 : 520;
    const animations: Animation[] = [];
    let cancelled = false;
    if (canReveal) {
      source.frame.style.visibility = 'hidden';
      overlay.style.visibility = 'visible';
      media.style.visibility = 'hidden';
      Object.assign(overlay.style, imageFrame(destination));
      animations.push(overlay.animate([imageFrame(source), imageFrame(destination)], { duration, easing, fill: 'both' }));
    }
    animations.push(content.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing, fill: 'both' }));
    running.current = animations;
    Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => {
      if (cancelled || phase.current !== 'opening') return;
      content.style.opacity = '1';
      media.style.visibility = '';
      overlay.style.visibility = 'hidden';
      animations.forEach((animation) => animation.cancel());
      running.current = [];
      ready.current = true;
      phase.current = 'open';
    });
    return () => {
      cancelled = true;
      running.current.forEach((animation) => animation.cancel());
      if (source) source.frame.style.visibility = oldVisibility;
      element.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      // React restores commit-time focus after layout cleanup; restore the opener
      // once the portal is removed, without stealing focus from a newer viewer.
      if (initial.current.origin) requestAnimationFrame(() => {
        if (previousFocus?.isConnected && !document.querySelector('dialog[open]')) previousFocus.focus({ preventScroll: true });
      });
    };
  }, []);

  useEffect(() => {
    setZoomed(false);
    dragX.set(0);
    if (viewport.current) { viewport.current.scrollTop = 0; viewport.current.scrollLeft = 0; }
  }, [set.id, dragX]);

  useEffect(() => {
    if (zoomed) viewport.current?.focus({ preventScroll: true });
  }, [zoomed]);

  useLayoutEffect(() => {
    const content = shell.current!;
    const media = viewport.current!;
    const overlay = ghost.current!;
    if (!closing) {
      if (phase.current === 'closing') {
        phase.current = 'open';
        ready.current = true;
        content.style.opacity = '1';
        media.style.visibility = '';
        overlay.style.visibility = 'hidden';
      }
      return;
    }
    phase.current = 'closing';
    running.current.forEach((animation) => animation.cancel());
    running.current = [];
    media.style.visibility = '';
    content.style.opacity = '1';
    const source = photograph(initial.current.origin);
    const canReturn = source && (!initial.current.origin?.dataset.setId || initial.current.origin.dataset.setId === set.id) && set.id === initial.current.setId && !set.video && !zoomed && !reduced && ready.current;
    const duration = reduced ? 0 : canReturn ? 340 : 200;
    const animations: Animation[] = [];
    let cancelled = false;
    if (canReturn) {
      const destination = containedImage(media);
      overlay.style.visibility = 'visible';
      media.style.visibility = 'hidden';
      Object.assign(overlay.style, imageFrame(source));
      animations.push(overlay.animate([imageFrame(destination), imageFrame(source)], { duration, easing, fill: 'both' }));
    } else overlay.style.visibility = 'hidden';
    animations.push(content.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing, fill: 'forwards' }));
    running.current = animations;
    Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(() => {
      if (!cancelled) onExited?.();
    });
    return () => { cancelled = true; animations.forEach((animation) => animation.cancel()); };
  }, [closing, onExited, reduced, set.id, set.video, zoomed]);

  const navigate = (next: number) => {
    if (closing) return;
    if (phase.current === 'opening') {
      phase.current = 'open';
      ready.current = true;
      running.current.forEach((animation) => animation.cancel());
      running.current = [];
      if (shell.current) shell.current.style.opacity = '1';
      if (viewport.current) viewport.current.style.visibility = '';
      if (ghost.current) ghost.current.style.visibility = 'hidden';
    }
    setDirection(next > index ? 1 : -1);
    setZoomed(false);
    animate(dragX, 0, { duration: reduced ? 0 : 0.2 });
    onNavigate((next + sets.length) % sets.length);
  };

  return createPortal(<dialog ref={dialog} className={`lightbox${closing ? ' is-closing' : ''}`} aria-labelledby="lightbox-title" aria-describedby="lightbox-instructions" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => {
    if (event.key === 'Tab') {
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], video[controls], [tabindex]:not([tabindex="-1"])')).filter((control) => control.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (active === last || !event.currentTarget.contains(active))) { event.preventDefault(); first?.focus(); }
      return;
    }
    if (event.target instanceof HTMLVideoElement || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement || (event.target instanceof HTMLElement && event.target.isContentEditable)) return;
    if (zoomed && event.target === viewport.current && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      viewport.current?.scrollBy({ left: event.key === 'ArrowLeft' ? -100 : event.key === 'ArrowRight' ? 100 : 0, top: event.key === 'ArrowUp' ? -100 : event.key === 'ArrowDown' ? 100 : 0, behavior: 'auto' });
      return;
    }
    if (event.key === 'ArrowRight') { event.preventDefault(); navigate(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(index - 1); }
  }}>
    <div ref={shell} className="lightbox-shell" style={{ opacity: 0 }}>
      <div className="lightbox-top"><span className="wordmark">finebykay</span><span className="eyebrow">A closer look</span><button className="icon-button" aria-label="Close lookbook" onClick={onClose} autoFocus><X size={22} /></button></div>
      <div className="lightbox-layout">
        <div ref={viewport} className={`lightbox-image${zoomed ? ' is-zoomed' : ''}`} tabIndex={zoomed ? 0 : undefined} role={zoomed ? 'region' : undefined} aria-label={zoomed ? 'Zoomed image. Use arrow keys to pan.' : undefined}
          onTouchStart={(event) => {
            const point = event.touches[0];
            touch.current = !zoomed && !closing && !set.video && event.touches.length === 1 ? { x: point.clientX, y: point.clientY, horizontal: false } : null;
            if (!touch.current) dragX.set(0);
          }}
          onTouchMove={(event) => {
            const start = touch.current;
            if (!start || event.touches.length !== 1) { touch.current = null; dragX.set(0); return; }
            const dx = event.touches[0].clientX - start.x;
            const dy = event.touches[0].clientY - start.y;
            if (!start.horizontal && Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx)) { touch.current = null; return; }
            if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) start.horizontal = true;
            if (start.horizontal && !reduced) dragX.set(Math.max(-120, Math.min(120, dx * 0.6)));
          }}
          onTouchCancel={() => { touch.current = null; animate(dragX, 0, { duration: reduced ? 0 : 0.2 }); }}
          onTouchEnd={(event) => {
            const start = touch.current;
            touch.current = null;
            animate(dragX, 0, { duration: reduced ? 0 : 0.2 });
            if (!start || zoomed || event.touches.length || !event.changedTouches.length) return;
            const dx = event.changedTouches[0].clientX - start.x;
            const dy = event.changedTouches[0].clientY - start.y;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(index + (dx < 0 ? 1 : -1));
          }}>
          <motion.div className="lightbox-swipe" style={{ x: dragX }}>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div key={set.id} className="lightbox-media" custom={direction} variants={{ enter: (value: number) => ({ opacity: 0, x: reduced ? 0 : value * 28 }), visible: { opacity: 1, x: 0 }, exit: (value: number) => ({ opacity: 0, x: reduced ? 0 : value * -28 }) }} initial="enter" animate="visible" exit="exit" transition={{ duration: reduced ? 0 : 0.2 }}>
                {set.video ? <video controls playsInline preload="metadata" poster={set.image} src={set.video} aria-label={set.title} /> : <img src={set.highRes ?? set.image} alt={set.alt} width="1200" height="1600" />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
        <div className="lightbox-bottom">
          <div className="lightbox-story" key={`story-${set.id}`}><p className="eyebrow">{set.category}</p><h2 id="lightbox-title">{set.title}</h2><p className="lightbox-tags">{set.tags.join(' · ')}</p><p className="lightbox-description">{set.description}</p></div>
          <ShareSet key={`share-${set.id}`} set={set} />
          {sharedEntry && <button className="lightbox-explore" onClick={onClose}>Explore more work <ArrowUpRight size={16} aria-hidden="true" /></button>}
          <div className="lightbox-controls"><button className="icon-button" aria-label="Previous set" onClick={() => navigate(index - 1)}><ArrowLeft size={20} /></button><span aria-live="polite" aria-atomic="true">{String(index + 1).padStart(2, '0')} / {String(sets.length).padStart(2, '0')}</span><button className="icon-button" aria-label="Next set" onClick={() => navigate(index + 1)}><ArrowRight size={20} /></button>{!set.video && <button className="icon-button" aria-label={zoomed ? 'Zoom out' : 'Zoom in'} aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}</button>}</div>
          <p id="lightbox-instructions" className="lightbox-hint">{zoomed ? 'Arrow keys to pan · Tab for gallery controls · Escape to close' : 'Arrow keys or swipe to explore · Escape to close'}</p>
        </div>
      </div>
    </div>
    <div ref={ghost} className="lightbox-reveal" aria-hidden="true"><img src={initial.current.image} style={{ objectPosition: initial.current.objectPosition }} alt="" /></div>
  </dialog>, document.body);
}
