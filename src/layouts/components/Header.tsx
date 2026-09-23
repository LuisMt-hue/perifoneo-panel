import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LogOut,
  Map,
  History,
  BarChart3,
  ChevronDown,
  Menu,
  X,
  Activity,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Barra Superior estilo macOS Apple UI (`Header`).
 *
 * Presenta estética translúcida, controles de semáforo de ventana macOS,
 * controles segmentados de navegación, indicador de usuario con menú popover
 * para salir y modo claro exclusivo.
 */
export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const menuUsuarioRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú del usuario al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuUsuarioRef.current &&
        !menuUsuarioRef.current.contains(event.target as Node)
      ) {
        setMenuUsuarioAbierto(false);
      }
    };

    if (menuUsuarioAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuUsuarioAbierto]);

  const getSegmentClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
      isActive
        ? 'bg-white text-zinc-900 shadow-xs font-semibold'
        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
    }`;

  const nombreUsuario = user?.nombre || user?.email?.split('@')[0] || 'Usuario';

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

        <NavLink to="/reportes" className={getSegmentClass}>
          <BarChart3 size={14} />
          <span>Reportes</span>
        </NavLink>
      </nav>

      {/* Lado Derecho: Menú de Usuario con estilo Apple */}
      <div className="flex items-center gap-2">
        {/* Nombre del Usuario interactivo con popover estilo Apple */}
        <div className="relative hidden md:block" ref={menuUsuarioRef}>
          <button
            type="button"
            onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              menuUsuarioAbierto
                ? 'bg-zinc-200/80 text-zinc-900 shadow-2xs'
                : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Cuenta de usuario"
          >
            <span className="max-w-[150px] truncate">{nombreUsuario}</span>
            <ChevronDown
              size={12}
              className={`text-zinc-400 transition-transform duration-200 ${
                menuUsuarioAbierto ? 'rotate-180 text-zinc-700' : ''
              }`}
            />
          </button>

          {/* Menú Desplegable Popover estilo macOS */}
          {menuUsuarioAbierto && (
            <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl py-1.5 z-50 border border-zinc-200/80 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1.5 text-2xs text-zinc-400 font-medium truncate border-b border-zinc-100 mb-1">
                {user?.email || nombreUsuario}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuUsuarioAbierto(false);
                  logout();
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer text-left"
              >
                <LogOut size={14} className="shrink-0" />
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>

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
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 text-xs">
            <span className="font-semibold text-zinc-500">Usuario</span>
            <span className="font-bold text-zinc-800">{nombreUsuario}</span>
          </div>

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

          <NavLink
            to="/reportes"
            onClick={() => setMenuMovilAbierto(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`
            }
          >
            <BarChart3 size={16} />
            <span>Reportes Consolidados</span>
          </NavLink>

          <div className="pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => {
                setMenuMovilAbierto(false);
                logout();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
            >
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
