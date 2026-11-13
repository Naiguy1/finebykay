import { ArrowUpRight } from 'lucide-react';
import { services } from '../data/portfolio';
import { Reveal } from './Motion';

export function Services() {
  return <section id="services" className="section services" aria-labelledby="services-title">
    <Reveal><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" />The studio menu</p><h2 id="services-title">A little care.<br /><em>A little expression.</em></h2></div><div className="price-note"><span className="eyebrow">Services starting at</span><p>$35<span> / a little time for you</span></p><span>Final pricing reflects length and<br />hand-painted design complexity.</span></div></div></Reveal>
    <div className="service-list">{services.map((service, index) => <Reveal key={service.number} delay={index * 0.08}><div className="service-row"><span className="service-number">{service.number}</span><h3>{service.title}</h3><p>{service.description}</p><span className="service-detail">{service.detail}<ArrowUpRight size={18} strokeWidth={1} aria-hidden="true" /></span></div></Reveal>)}</div>
    <Reveal><p className="studio-location"><span className="status-dot" />Private studio location — exact address provided upon appointment confirmation.</p></Reveal>
  </section>;
}
