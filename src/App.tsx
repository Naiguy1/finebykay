import { MotionConfig } from 'framer-motion';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Lookbook } from './components/Lookbook';
import { Services } from './components/Services';
import { About } from './components/About';
import { Contact } from './components/Contact';

export default function App() {
  return <MotionConfig reducedMotion="user" transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}><Header /><main id="main"><Hero /><Lookbook /><Services /><About /></main><Contact /></MotionConfig>;
}
