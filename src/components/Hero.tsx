import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { MagneticLink, Reveal } from './Motion';
import { HeroCarousel } from './HeroCarousel';

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  return <section ref={section} className="hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <Reveal><p className="eyebrow justify-center"><span className="status-dot" />Private nail studio · By appointment</p></Reveal>
      <Reveal delay={0.1}><h1 id="hero-title">Nail Art <em>by Kalisa</em></h1></Reveal>
      <Reveal delay={0.2}><p className="hero-handle">@finebykay</p></Reveal>
      <Reveal delay={0.3}><MagneticLink href="#work" className="button button-burgundy">Explore the Lookbook <ArrowDown size={16} aria-hidden="true" /></MagneticLink></Reveal>
    </div>
    <HeroCarousel progress={scrollYProgress} />
    <div className="hero-footnote"><span>Considered care. Tiny works of art.</span><span>Made slowly, just for you.</span></div>
  </section>;
}
