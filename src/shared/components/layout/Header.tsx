import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LogOut,
  Map,
  History,
  Menu,
  X,
  Activity,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Barra Superior estilo macOS (`Header`).
 *
 * Controles de semáforo macOS, controles segmentados de navegación
 * y botón directo sólido para cerrar sesión (sin nombres ni menús desplegables).
 */
export const Header: React.FC = () => {
  const { logout } = useAuth();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

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

        {/* Botón Menú Móvil */}
        <button
          type="button"
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-zinc-700 hover:bg-zinc-100 border border-zinc-200/60 transition-colors cursor-pointer"
          aria-label="Menú móvil"
        >
          {menuMovilAbierto ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>

      {/* Menú Desplegable Móvil tipo Sheet macOS */}
      {menuMovilAbierto && (
        <div className="md:hidden absolute top-14 left-0 w-full z-50 bg-white/95 backdrop-blur-2xl border-b border-zinc-200/80 px-4 py-3 shadow-xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <NavLink
            to="/"
            end
            onClick={() => setMenuMovilAbierto(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`
            }
          >
            <Map size={16} />
            <span>En vivo</span>
          </NavLink>

          <NavLink
            to="/devices"
            onClick={() => setMenuMovilAbierto(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`
            }
          >
            <Smartphone size={16} />
            <span>Dispositivos</span>
          </NavLink>

          <NavLink
            to="/historial"
            onClick={() => setMenuMovilAbierto(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`
            }
          >
            <History size={16} />
            <span>Historial de Recorridos</span>
          </NavLink>

          <div className="pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => {
                setMenuMovilAbierto(false);
                logout();
              }}
              className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
