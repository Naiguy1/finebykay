import { useCallback, useEffect, useRef, useState } from 'react';
import { portfolio } from '../data/portfolio';
import type { PortfolioSet } from '../data/portfolio';

export const setPath = (id: string) => `/sets/${encodeURIComponent(id)}/`;

function setAtLocation() {
  const match = /^\/sets\/([^/]+)\/?$/.exec(window.location.pathname);
  if (!match) return undefined;
  try { return portfolio.find((set) => set.id === decodeURIComponent(match[1])); }
  catch { return undefined; }
}

interface Selection {
  sets: readonly PortfolioSet[];
  id: string;
  origin: HTMLElement | null;
  sharedEntry: boolean;
}

/** One history entry per visit to the viewer, even when browsing many sets. */
export function useSetViewer() {
  const [selection, setSelection] = useState<Selection | null>(() => {
    const set = setAtLocation();
    return set ? { sets: portfolio, id: set.id, origin: null, sharedEntry: true } : null;
  });
  const [closing, setClosing] = useState(false);
  const current = useRef(selection);
  const exiting = useRef(false);
  const exploreAfterClose = useRef(false);
  const token = useRef(crypto.randomUUID());
  const opener = useRef<HTMLElement | null>(null);
  const lastVisit = useRef<Selection | null>(selection);

  const show = useCallback((next: Selection) => {
    current.current = next;
    lastVisit.current = next;
    exiting.current = false;
    setClosing(false);
    setSelection(next);
  }, []);

  useEffect(() => {
    const pop = () => {
      const set = setAtLocation();
      if (set) {
        const previous = current.current ?? lastVisit.current;
        const internal = history.state?.finebykayViewer === token.current;
        show({
          sets: previous?.sets.some((item) => item.id === set.id) ? previous.sets : portfolio,
          id: set.id,
          origin: internal ? previous?.origin ?? opener.current : null,
          sharedEntry: !internal,
        });
      } else if (current.current) {
        exiting.current = true;
        setClosing(true);
      }
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [show]);

  useEffect(() => {
    document.title = selection ? `${selection.sets.find((set) => set.id === selection.id)?.title ?? 'The lookbook'} | finebykay` : 'finebykay — Nail Art by Kalisa';
  }, [selection]);

  const open = useCallback((id: string, sets: readonly PortfolioSet[], origin: HTMLElement) => {
    if (!sets.some((set) => set.id === id)) return;
    opener.current = origin;
    exploreAfterClose.current = false;
    history.pushState({ ...history.state, finebykayViewer: token.current }, '', setPath(id));
    show({ sets, id, origin, sharedEntry: false });
  }, [show]);

  const navigate = useCallback((index: number) => {
    const previous = current.current;
    const set = previous?.sets[index];
    if (!previous || !set || exiting.current) return;
    history.replaceState(history.state, '', setPath(set.id));
    show({ ...previous, id: set.id });
  }, [show]);

  const close = useCallback(() => {
    if (exiting.current || !current.current) return;
    if (history.state?.finebykayViewer === token.current) {
      exiting.current = true;
      history.back();
    } else {
      // A link arrival has no in-site history entry to return to.
      history.replaceState(null, '', '/#work');
      exploreAfterClose.current = true;
      exiting.current = true;
      setClosing(true);
    }
  }, []);

  const finishClose = useCallback(() => {
    if (!exiting.current) return;
    current.current = null;
    setSelection(null);
    setClosing(false);
    exiting.current = false;
    if (exploreAfterClose.current) {
      exploreAfterClose.current = false;
      requestAnimationFrame(() => {
        const heading = document.getElementById('work-title');
        heading?.setAttribute('tabindex', '-1');
        heading?.focus({ preventScroll: true });
        document.getElementById('work')?.scrollIntoView({ behavior: 'instant' });
      });
    }
  }, []);

  return { selection, closing, open, navigate, close, finishClose };
}
