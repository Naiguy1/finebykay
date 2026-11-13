import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import type { ReactNode } from 'react';

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={{ opacity: 0, y: reduced ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: reduced ? 0.15 : 0.9, delay: reduced ? 0 : delay }}>{children}</motion.div>;
}

export function MagneticLink({ children, href, className = '', external = false }: { children: ReactNode; href: string; className?: string; external?: boolean }) {
  const reduced = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  return <motion.a href={href} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} animate={reduced ? { x: 0, y: 0 } : offset} transition={{ duration: 0.7 }} onPointerMove={(event) => {
    if (reduced || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    setOffset({ x: (event.clientX - rect.left - rect.width / 2) * 0.1, y: (event.clientY - rect.top - rect.height / 2) * 0.12 });
  }} onPointerLeave={() => setOffset({ x: 0, y: 0 })} onBlur={() => setOffset({ x: 0, y: 0 })}>{children}</motion.a>;
}
