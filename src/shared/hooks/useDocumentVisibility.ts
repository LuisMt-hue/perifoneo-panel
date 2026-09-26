import { useEffect, useState } from 'react';

/**
 * Refleja si la pestaña del navegador está visible (Page Visibility API).
 * Se usa para pausar el WebSocket y el polling de respaldo cuando el panel
 * queda en segundo plano, evitando gastar batería/red sin necesidad.
 */
export function useDocumentVisibility(): boolean {
  const [visible, setVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return visible;
}
