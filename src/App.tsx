import { MotionConfig } from 'framer-motion';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Lookbook } from './components/Lookbook';
import { Services } from './components/Services';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { Lightbox } from './components/Lightbox';
import { useSetViewer } from './hooks/useSetViewer';

export default function App() {
  const viewer = useSetViewer();
  const selectedIndex = viewer.selection?.sets.findIndex((set) => set.id === viewer.selection?.id) ?? -1;
  return <MotionConfig reducedMotion="user" transition={{ type: 'tween', duration: 0.9, ease: [0.22, 1, 0.36, 1] }}><Header /><main id="main" tabIndex={-1}><Hero onOpen={viewer.open} /><Lookbook onOpen={viewer.open} /><Services /><About /></main><Contact />{viewer.selection && selectedIndex >= 0 && <Lightbox sets={viewer.selection.sets} index={selectedIndex} onNavigate={viewer.navigate} onClose={viewer.close} origin={viewer.selection.origin} originFrame={viewer.selection.originFrame} sharedEntry={viewer.selection.sharedEntry} closing={viewer.closing} onExited={viewer.finishClose} />}</MotionConfig>;
}

