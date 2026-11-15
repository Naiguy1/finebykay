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

function CarouselCard({ set, index, width, gap, viewport, offset, progress }: {
  set: PortfolioSet;
  index: number;
  width: number;
  gap: number;
  viewport: number;
  offset: MotionValue<number>;
  progress: MotionValue<number>;
}) {
  const reduced = useReducedMotion();
  const step = width + gap;
  const period = step * heroSets.length * 2;
  // Recycle each card only when it is offscreen. Two full sets cover both edges.
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
        loading="eager"
        fetchPriority={index === 2 ? 'high' : 'auto'}
        style={{ objectPosition: set.objectPosition }}
        initial={{ scale: reduced ? 1 : 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: reduced ? 0 : 1.1 }}
      />
      <span className="hero-card-index">0{index % heroSets.length + 1}</span>
    </motion.div>
  );
}

export function HeroCarousel({ progress }: { progress: MotionValue<number> }) {
  const wheelEnabled = useDesktopCarousel();
  const region = useRef<HTMLDivElement>(null);
  const touch = useRef<{ id: number; x: number; y: number; axis: 'horizontal' | 'vertical' | null } | null>(null);
  const target = useRef(0);
  const released = useRef(false);
  const hovered = useRef(false);
  const frame = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const offset = useMotionValue(0);
  const [viewport, setViewport] = useState(() => window.innerWidth);
  const [active, setActive] = useState(2);
  const gap = viewport <= 640 ? 15 : Math.min(44, Math.max(18, viewport * 0.028));
  const stripRatio = viewport <= 640 ? 2.18 : viewport <= 1000 ? 1.35 : 1.15;
  const width = (viewport * stripRatio - gap * 4) / 5;
  const step = width + gap;
  const previousStep = useRef(step);

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
    target.current *= ratio;
    offset.set(offset.get() * ratio);
    touch.current = null;
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
        onTouchStart={(event) => {
          if (event.touches.length !== 1 || (event.target instanceof Element && event.target.closest('a, button, video'))) {
            touch.current = null;
            return;
          }
          const point = event.touches[0];
          touch.current = { id: point.identifier, x: point.clientX, y: point.clientY, axis: null };
        }}
        onTouchMove={(event) => {
          const gesture = touch.current;
          if (!gesture || event.touches.length !== 1) {
            touch.current = null;
            return;
          }
          const point = event.touches[0];
          if (point.identifier !== gesture.id) {
            touch.current = null;
            return;
          }
          const dx = Math.abs(point.clientX - gesture.x);
          const dy = Math.abs(point.clientY - gesture.y);
          if (!gesture.axis && Math.max(dx, dy) > 8) {
            if (dy >= dx) gesture.axis = 'vertical';
            else if (dx > dy * 1.25) gesture.axis = 'horizontal';
          }
        }}
        onTouchEnd={(event) => {
          const gesture = touch.current;
          touch.current = null;
          if (!gesture || gesture.axis !== 'horizontal' || event.touches.length !== 0) return;
          const point = Array.from(event.changedTouches).find((point) => point.identifier === gesture.id);
          if (!point) return;
          const dx = point.clientX - gesture.x;
          const dy = point.clientY - gesture.y;
          if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25) advance(dx < 0 ? 1 : -1);
        }}
        onTouchCancel={() => { touch.current = null; }}
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
          {[...heroSets, ...heroSets].map((set, index) => (
            <CarouselCard key={`${set.id}-${index}`} set={set} index={index} width={width} gap={gap} viewport={viewport} offset={offset} progress={progress} />
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
