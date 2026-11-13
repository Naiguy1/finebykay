import { ArrowUp, ArrowUpRight, Instagram } from 'lucide-react';
import { studio } from '../data/portfolio';
import { MagneticLink, Reveal } from './Motion';

export function Contact() {
  return <footer id="contact" className="section contact" aria-labelledby="contact-title">
    <Reveal><p className="eyebrow justify-center"><span className="status-dot" />Your next little ritual</p><h2 id="contact-title">Something beautiful<br /><em>starts with a hello.</em></h2><p className="contact-description">For a little inspiration, current availability,<br />or an appointment, find me on Instagram.</p><MagneticLink href={studio.instagram} className="button button-burgundy" external><Instagram size={17} aria-hidden="true" />Say hello to @finebykay<ArrowUpRight size={16} aria-hidden="true" /></MagneticLink></Reveal>
    <div className="footer-bottom"><a className="wordmark" href="#">finebykay<span aria-hidden="true">✳</span></a><a className="footer-domain" href="https://nails.bowerbanks.com">nails.bowerbanks.com</a><span>Private studio · Address on request</span><a href={studio.instagram} target="_blank" rel="noopener noreferrer">Instagram<ArrowUpRight size={13} aria-hidden="true" /></a><a className="back-to-top" href="#" aria-label="Back to top"><ArrowUp size={17} /></a></div>
    <div className="footer-fineprint"><span>© {new Date().getFullYear()} finebykay</span><span>Thoughtfully made. Individually yours.</span></div>
  </footer>;
}
