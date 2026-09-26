import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, Smartphone, History } from 'lucide-react';

/**
 * Barra de Navegación Inferior estilo iOS (`MobileTabBar`).
 *
 * Sustituye el menú desplegable móvil del `Header` por una tab bar fija en la
 * parte inferior de la pantalla, visible solo por debajo de `md`. Al ser un
 * hermano flex normal dentro de `MainLayout` (no `fixed`/`absolute`), el
 * `<main>` se encoge automáticamente para dejarle espacio, así que el resto de
 * la app no necesita padding manual para no quedar tapada.
 */
const TABS = [
  { to: '/', label: 'En vivo', Icon: Map, end: true },
  { to: '/devices', label: 'Dispositivos', Icon: Smartphone, end: false },
  { to: '/historial', label: 'Historial', Icon: History, end: false },
] as const;

export const MobileTabBar: React.FC = () => {
  return (
    <nav
      className="md:hidden shrink-0 h-15 z-50 bg-white/90 backdrop-blur-2xl border-t border-zinc-200/80 flex items-stretch select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition-colors ${
              isActive ? 'text-blue-600' : 'text-zinc-500 hover:text-zinc-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} className={isActive ? 'text-blue-600' : 'text-zinc-500'} />
              <span className={isActive ? 'font-semibold' : ''}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileTabBar;
