import { useEffect, useState } from 'react';

const desktopQuery = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';

export function useDesktopCarousel() {
  const [enabled, setEnabled] = useState(() => window.matchMedia(desktopQuery).matches);
  useEffect(() => {
    const query = window.matchMedia(desktopQuery);
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return enabled;
}
