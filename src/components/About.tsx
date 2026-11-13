import { ArrowUpRight } from 'lucide-react';
import { studio } from '../data/portfolio';
import { MagneticLink, Reveal } from './Motion';

export function About() {
  return <section id="about" className="about" aria-labelledby="about-title"><div className="about-inner">
    <Reveal className="about-image"><p className="eyebrow"><span className="eyebrow-line" />The hands behind the art</p><img src={studio.image} width="900" height="1200" loading="lazy" alt="A quiet studio table with linen, manicure tools, and burgundy flowers in warm window light" /><span className="about-caption">A calm corner. A considered ritual.</span></Reveal>
    <Reveal className="about-copy" delay={0.15}><p className="eyebrow">A note from Kay</p><h2 id="about-title">More than a manicure.<br /><em>A moment for you.</em></h2>{studio.paragraphs.map((paragraph) => <p className="about-paragraph" key={paragraph}>{paragraph}</p>)}<MagneticLink href={studio.instagram} className="text-link" external>Let’s make something beautiful <ArrowUpRight size={18} aria-hidden="true" /></MagneticLink><p className="signature">With care, Kay</p></Reveal>
  </div></section>;
}
