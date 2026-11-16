import { useCallback, useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { heroSets } from '../data/portfolio';
import type { PortfolioSet } from '../data/portfolio';
import { useDesktopCarousel } from '../hooks/useDesktopCarousel';

const wrap = (value: number, length: number) => ((value % length) + length) % length;

function CarouselCard({ set, index, count, width, gap, viewport, offset, progress }: {
  set: PortfolioSet;
  index: number;
  count: number;
  width: number;
  gap: number;
  viewport: number;
  offset: MotionValue<number>;
  progress: MotionValue<number>;
}) {
  const reduced = useReducedMotion();
  const step = width + gap;
  const period = step * count;
  // Recycle only beyond the viewport; repeat short lists just enough to cover it.
  const x = useTransform(offset, (value) => wrap((index - 2) * step + (viewport - width) / 2 - value + step, period) - step);
  const y = useTransform(() => {
    const distance = Math.min(Math.abs(x.get() + width / 2 - viewport / 2) / (step * 2), 1);
    return (viewport <= 640 ? 34 : 49) * (1 - distance) - (reduced ? 0 : progress.get() * 25);
  });
  const rotate = useTransform(x, (value) => Math.max(-5, Math.min(5, (viewport / 2 - value - width / 2) / (step * 2) * 5)));

  return (
    <motion.div className="carousel-card" style={{ x, y, rotate, width }}>
      <motion.img
        src={set.image}
        alt=""
        width="900"
        height="1200"
        loading={index < 5 ? 'eager' : 'lazy'}
        draggable={false}
        fetchPriority={index === 2 ? 'high' : 'auto'}
        style={{ objectPosition: set.objectPosition }}
        initial={{ scale: reduced ? 1 : 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: reduced ? 0 : 1.1 }}
      />
      <span className="hero-card-index">{String(index % heroSets.length + 1).padStart(2, '0')}</span>
    </motion.div>
  );
}

export function HeroCarousel({ progress }: { progress: MotionValue<number> }) {
  const wheelEnabled = useDesktopCarousel();
  const region = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Set<number>());
  const gesture = useRef<{ id: number; x: number; y: number; offset: number; snap: number; axis: 'horizontal' | 'vertical' | null } | null>(null);
  const target = useRef(0);
  const released = useRef(false);
  const hovered = useRef(false);
  const frame = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const offset = useMotionValue(0);
  const [viewport, setViewport] = useState(() => window.innerWidth);
  const [active, setActive] = useState(() => wrap(2, heroSets.length));
  const gap = viewport <= 640 ? 15 : Math.min(44, Math.max(18, viewport * 0.028));
  const stripRatio = viewport <= 640 ? 2.18 : viewport <= 1000 ? 1.35 : 1.15;
  const width = (viewport * stripRatio - gap * 4) / 5;
  const step = width + gap;
  const previousStep = useRef(step);
  const cardCount = Math.ceil((Math.ceil(viewport / step) + 2) / heroSets.length) * heroSets.length;
  const cards = Array.from({ length: cardCount }, (_, index) => heroSets[index % heroSets.length]);

  useMotionValueEvent(offset, 'change', (value) => {
    const next = wrap(2 + Math.round(value / step), heroSets.length);
    setActive((previous) => previous === next ? previous : next);
  });

  const moveTo = useCallback((value: number) => {
    target.current = value;
    if (reduced) {
      offset.set(value);
      return;
    }
    if (frame.current !== null) return;
    let previousTime = performance.now();
    const settle = (now: number) => {
      const difference = target.current - offset.get();
      if (Math.abs(difference) < 0.1) {
        offset.set(target.current);
        frame.current = null;
        return;
      }
      const delta = Math.min(now - previousTime, 64);
      previousTime = now;
      offset.set(offset.get() + difference * (1 - Math.exp(-delta / 160)));
      frame.current = requestAnimationFrame(settle);
    };
    frame.current = requestAnimationFrame(settle);
  }, [offset, reduced]);

  const cancelGesture = useCallback(() => {
    const current = gesture.current;
    gesture.current = null;
    if (!current) return;
    // Clear before releasing capture: lostpointercapture must not cancel a new snap.
    const element = region.current;
    if (element?.hasPointerCapture(current.id)) element.releasePointerCapture(current.id);
    moveTo(current.snap);
  }, [moveTo]);

  useEffect(() => {
    const activePointers = pointers.current;
    const down = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      activePointers.add(event.pointerId);
      // Observe secondary contacts anywhere on the page, including outside this region.
      if (activePointers.size > 1) cancelGesture();
    };
    const up = (event: PointerEvent) => activePointers.delete(event.pointerId);
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', up, true);
      activePointers.clear();
    };
  }, [cancelGesture]);

  useEffect(() => {
    if (reduced) offset.set(target.current);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [offset, reduced]);

  useEffect(() => {
    // Retain the current set and any in-flight movement when the layout changes.
    const ratio = step / previousStep.current;
    previousStep.current = step;
    const current = gesture.current;
    gesture.current = null;
    if (current) {
      target.current = current.snap;
      if (region.current?.hasPointerCapture(current.id)) region.current.releasePointerCapture(current.id);
      offset.set(current.snap);
    }
    target.current *= ratio;
    offset.set(offset.get() * ratio);
    setActive(wrap(2 + Math.round(offset.get() / step), heroSets.length));
  }, [offset, step]);

  useEffect(() => {
    const release = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && hovered.current && !document.querySelector('dialog[open]')) released.current = true;
    };
    window.addEventListener('keydown', release);
    return () => window.removeEventListener('keydown', release);
  }, []);

  useEffect(() => {
    const element = region.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setViewport(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = region.current;
    if (!element || !wheelEnabled) return;
    const onWheel = (event: WheelEvent) => {
      if (released.current || event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest('a, button, video')) return;
      const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport : 1;
      const delta = Math.max(-step * 2, Math.min(step * 2, raw * unit * 0.8));
      if (!Number.isFinite(delta) || delta === 0) return;
      event.preventDefault();
      moveTo(target.current + delta);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [moveTo, step, viewport, wheelEnabled]);

  const advance = (direction: number) => {
    moveTo((Math.round(target.current / step) + direction) * step);
  };

  return (
    <>
      <div
        ref={region}
        className={`hero-gallery hero-carousel${wheelEnabled ? ' wheel-gallery' : ''}`}
        role="region"
        aria-roledescription="carousel"
        aria-label="Signature nail sets"
        aria-describedby="hero-carousel-help"
        tabIndex={0}
        data-active-set={heroSets[active].id}
        onPointerEnter={() => { hovered.current = true; }}
        onPointerLeave={() => { hovered.current = false; released.current = false; }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
          if (!event.isPrimary || pointers.current.size > 1 || gesture.current) {
            cancelGesture();
            return;
          }
          if (event.target instanceof Element && event.target.closest('a, button, video')) return;
          gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: offset.get(), snap: Math.round(target.current / step) * step, axis: null };
          if (frame.current !== null) cancelAnimationFrame(frame.current);
          frame.current = null;
          // Capture keeps a drag intact when the finger or pen leaves the carousel.
          // Synthetic accessibility/test events may not represent an active pointer.
          try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* No active native pointer. */ }
        }}
        onPointerMove={(event) => {
          const current = gesture.current;
          if (!current || current.id !== event.pointerId) return;
          const dx = event.clientX - current.x;
          const dy = event.clientY - current.y;
          if (!current.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
            if (Math.abs(dy) >= Math.abs(dx)) current.axis = 'vertical';
            else if (Math.abs(dx) > Math.abs(dy) * 1.25) current.axis = 'horizontal';
          }
          if (current.axis === 'horizontal') offset.set(current.offset - Math.max(-step, Math.min(step, dx)));
        }}
        onPointerUp={(event) => {
          const current = gesture.current;
          if (!current || current.id !== event.pointerId) return;
          gesture.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          const dx = event.clientX - current.x;
          const dy = event.clientY - current.y;
          // A fast flick may deliver down/up with no intermediate pointermove.
          const swiped = current.axis !== 'vertical' && Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25;
          moveTo(current.snap + (swiped ? (dx < 0 ? step : -step) : 0));
        }}
        onPointerCancel={(event) => { if (gesture.current?.id === event.pointerId) cancelGesture(); }}
        onLostPointerCapture={(event) => { if (gesture.current?.id === event.pointerId) cancelGesture(); }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            advance(event.key === 'ArrowRight' ? 1 : -1);
          }
          if (event.key === 'Escape') released.current = true;
        }}
      >
        <div className="carousel-track" aria-hidden="true">
          {cards.map((set, index) => (
            <CarouselCard key={`${set.id}-${index}`} set={set} index={index} count={cardCount} width={width} gap={gap} viewport={viewport} offset={offset} progress={progress} />
          ))}
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">Featured set: {heroSets[active].title}. {heroSets[active].alt}</p>
        <a className="scroll-circle" href="#work" aria-label="Scroll to the lookbook"><ArrowDown size={25} strokeWidth={1.2} /></a>
      </div>
      <div className="carousel-toolbar">
        <button className="icon-button" aria-label="Previous signature set" onClick={() => advance(-1)}><ArrowLeft size={17} /></button>
        <p id="hero-carousel-help">{wheelEnabled ? 'Scroll to explore' : 'Swipe to explore'}<span>{wheelEnabled ? 'Move your pointer away to scroll the page. Press Escape to release the wheel.' : 'Swipe left or right, or use the arrows.'}</span></p>
        <button className="icon-button" aria-label="Next signature set" onClick={() => advance(1)}><ArrowRight size={17} /></button>
      </div>
    </>
  );
}
