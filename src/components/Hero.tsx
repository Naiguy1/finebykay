import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { MagneticLink, Reveal } from './Motion';
import { HeroCarousel } from './HeroCarousel';
import type { PortfolioSet } from '../data/portfolio';

export function Hero({ onOpen }: { onOpen: (id: string, sets: readonly PortfolioSet[], origin: HTMLElement) => void }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  return <section ref={section} className="hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <Reveal><p className="eyebrow justify-center"><span className="status-dot" />Private nail studio · By appointment</p></Reveal>
      <Reveal delay={0.1}><h1 id="hero-title">Nail Art <em>by Kalisa</em></h1></Reveal>
      <Reveal delay={0.2}><p className="hero-handle">@finebykay</p></Reveal>
      <Reveal delay={0.3}><MagneticLink href="#work" className="button button-burgundy">Explore the Lookbook <ArrowDown size={16} aria-hidden="true" /></MagneticLink></Reveal>
    </div>
    <HeroCarousel progress={scrollYProgress} onOpen={onOpen} />
    <div className="hero-footnote"><span>Hand-painted nail art</span><span>Appointments via Instagram</span></div>
  </section>;
}
