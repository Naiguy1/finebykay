import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Plus } from 'lucide-react';
import { categories, portfolio } from '../data/portfolio';
import type { Category } from '../data/portfolio';
import { Lightbox } from './Lightbox';
import { Reveal } from './Motion';

export function Lookbook() {
  const [category, setCategory] = useState<Category>('All');
  const [selected, setSelected] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const filtered = useMemo(() => portfolio.filter((set) => category === 'All' || set.category === category), [category]);
  const close = useCallback(() => setSelected(null), []);
  return <section id="work" className="section lookbook" aria-labelledby="work-title">
    <Reveal><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" />The curated lookbook</p><h2 id="work-title">Nail art, <em>one set</em><br />at a time.</h2></div><p className="section-aside">A collection of little details.<br />A reflection of you.<ArrowUpRight size={26} strokeWidth={1} aria-hidden="true" /></p></div></Reveal>
    <Reveal><div className="filter-row" role="group" aria-label="Filter nail sets">{categories.map((item) => <button key={item} className="filter-button" aria-pressed={category === item} onClick={() => setCategory(item)}>{category === item && <motion.span className="filter-active" layoutId="category-pill" transition={{ duration: reduced ? 0 : 0.7 }} />}<span>{item}</span></button>)}</div></Reveal>
    <p className="sr-only" aria-live="polite">{filtered.length} sets shown</p>
    <motion.div className="portfolio-grid" layout={!reduced}>
      <AnimatePresence mode="popLayout" initial={false}>{filtered.map((set, index) => <motion.article key={set.id} layout={!reduced} initial={{ opacity: 0, y: reduced ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.8 }}>
        <button className="portfolio-card group" aria-label={`View ${set.title}`} onClick={() => setSelected(index)}>
          <span className="portfolio-photo"><motion.img src={set.image} alt={set.alt} width="900" height="1200" loading="lazy" style={{ objectPosition: set.objectPosition }} initial={{ scale: reduced ? 1 : 1.06 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: reduced ? 0 : 1.1 }} /><span className="photo-number">0{portfolio.indexOf(set) + 1}</span><span className="photo-plus"><Plus size={22} strokeWidth={1.3} /></span></span>
          <span className="portfolio-caption"><span>{set.title}</span><span>{set.category}</span></span>
        </button>
      </motion.article>)}</AnimatePresence>
    </motion.div>
    <Reveal><p className="lookbook-note">A few possibilities, endless personal touches.<span>Every set begins with a conversation.</span></p></Reveal>
    {selected !== null && <Lightbox sets={filtered} index={selected} onNavigate={setSelected} onClose={close} />}
  </section>;
}
