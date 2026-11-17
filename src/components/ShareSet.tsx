import { useRef, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import type { PortfolioSet } from '../data/portfolio';
import { setPath } from '../hooks/useSetViewer';

export function ShareSet({ set }: { set: PortfolioSet }) {
  const url = new URL(setPath(set.id), 'https://nails.bowerbanks.com').href;
  const [status, setStatus] = useState('');
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      setStatus('Link copied');
      setManual(false);
    } catch {
      setManual(true);
      setStatus('Select and copy the link below.');
      requestAnimationFrame(() => { input.current?.focus(); input.current?.select(); });
    }
  };
  const share = async () => {
    if (!navigator.share) { await copy(); return; }
    setBusy(true);
    try {
      await navigator.share({ title: `${set.title} | finebykay`, text: `Nail art by Kalisa — ${set.title}`, url });
      setStatus('');
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError') && !(error instanceof Error && error.name === 'AbortError')) {
        setManual(true);
        setStatus('Sharing is unavailable here. Copy the link below.');
      }
    } finally { setBusy(false); }
  };
  return <div className="set-sharing">
    <div className="set-share-actions">
      <button className="button set-share-button" onClick={share} disabled={busy}><Share2 size={15} aria-hidden="true" />Share this set</button>
      <button className="set-copy-button" onClick={copy}>{status === 'Link copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}Copy link</button>
    </div>
    <p className="set-share-status" role="status">{status}</p>
    {manual && <input ref={input} className="set-share-url" aria-label="Link to this set" value={url} readOnly onFocus={(event) => event.currentTarget.select()} />}
  </div>;
}
