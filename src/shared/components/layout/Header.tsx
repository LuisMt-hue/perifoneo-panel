import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Map, History, Activity, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Barra Superior estilo macOS (`Header`).
 *
 * Controles de semáforo macOS, controles segmentados de navegación
 * y botón directo sólido para cerrar sesión (sin nombres ni menús desplegables).
 * La navegación móvil vive en `MobileTabBar` (tab bar inferior estilo iOS),
 * así que aquí solo queda el logo y un acceso directo a "Salir".
 */
export const Header: React.FC = () => {
  const { logout } = useAuth();

  const getSegmentClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
      isActive
        ? 'bg-white text-zinc-900 shadow-xs font-semibold'
        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
    }`;

  return (
    <header className="relative z-40 h-14 bg-white/80 backdrop-blur-xl border-b border-zinc-200/80 px-4 flex items-center justify-between transition-colors">
      {/* Lado Izquierdo: Traffic Lights & Identidad macOS */}
      <div className="flex items-center gap-4">
        {/* Controles de Ventana tipo macOS (Traffic Lights) */}
        <div className="hidden sm:flex items-center gap-2 group">
          <span
            className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block shadow-2xs group-hover:opacity-90 transition-opacity"
            title="Cerrar"
          />
          <span
            className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block shadow-2xs group-hover:opacity-90 transition-opacity"
            title="Minimizar"
          />
          <span
            className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block shadow-2xs group-hover:opacity-90 transition-opacity"
            title="Expandir"
          />
        </div>

        <div className="h-4 w-px bg-zinc-300 hidden sm:block" />

        {/* Logo / Título del Sistema */}
        <NavLink
          to="/"
          className="flex items-center gap-2 text-zinc-900 font-semibold text-sm tracking-tight hover:opacity-85 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shadow-2xs">
            <Activity size={16} className="animate-pulse" />
          </div>
          <span className="font-bold">Perifoneo Tacna</span>
        </NavLink>
      </div>

      {/* Centro: Controles Segmentados macOS (Desktop) */}
      <nav className="hidden md:flex items-center bg-zinc-200/60 p-1 rounded-xl border border-zinc-300/40 shadow-2xs">
        <NavLink to="/" className={getSegmentClass} end>
          <Map size={14} />
          <span>En vivo</span>
        </NavLink>

        <NavLink to="/devices" className={getSegmentClass}>
          <Smartphone size={14} />
          <span>Dispositivos</span>
        </NavLink>

        <NavLink to="/historial" className={getSegmentClass}>
          <History size={14} />
          <span>Historial</span>
        </NavLink>
      </nav>

      {/* Lado Derecho: Botón Salir sólido (sin nombres ni menús desplegables) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={logout}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition-colors cursor-pointer"
          title="Cerrar sesión"
        >
          <LogOut size={13} />
          <span>Salir</span>
        </button>

        {/* En móvil la navegación vive en la tab bar inferior; aquí solo el salir directo */}
        <button
          type="button"
          onClick={logout}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-colors cursor-pointer"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
