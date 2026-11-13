import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { heroSets } from '../data/portfolio';
import type { PortfolioSet } from '../data/portfolio';
import { MagneticLink, Reveal } from './Motion';

function HeroCard({ set, index, progress }: { set: PortfolioSet; index: number; progress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const reduced = useReducedMotion();
  const y = useTransform(progress, [0, 1], [0, index % 2 ? -65 : 35]);
  return <motion.div className={`hero-card hero-card-${index}`} style={{ y: reduced ? 0 : y }}>
    <motion.img src={set.image} alt={index === 2 ? set.alt : ''} width="900" height="1200" fetchPriority={index === 2 ? 'high' : 'auto'} style={{ objectPosition: set.objectPosition }} initial={{ scale: reduced ? 1 : 1.06 }} animate={{ scale: 1 }} transition={{ duration: reduced ? 0 : 1.1 }} />
    <span className="hero-card-index" aria-hidden="true">0{index + 1}</span>
  </motion.div>;
}

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  return <section ref={section} className="hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <Reveal><p className="eyebrow justify-center"><span className="status-dot" />Private nail studio · By appointment</p></Reveal>
      <Reveal delay={0.1}><h1 id="hero-title">Nail Art <em>By Kay</em></h1></Reveal>
      <Reveal delay={0.2}><p className="hero-handle">@finebykay</p></Reveal>
      <Reveal delay={0.3}><MagneticLink href="#work" className="button button-burgundy">Explore the Lookbook <ArrowDown size={16} aria-hidden="true" /></MagneticLink></Reveal>
    </div>
    <div className="hero-gallery" aria-label="A glimpse of the lookbook">
      <div className="hero-strip">{heroSets.map((set, index) => <HeroCard key={`${set.id}-${index}`} set={set} index={index} progress={scrollYProgress} />)}</div>
      <a className="scroll-circle" href="#work" aria-label="Scroll to the lookbook"><ArrowDown size={25} strokeWidth={1.2} /></a>
    </div>
    <div className="hero-footnote"><span>Considered care. Tiny works of art.</span><span>Made slowly, just for you.</span></div>
  </section>;
}
