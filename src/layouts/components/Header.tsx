import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Radio,
  LogOut,
  Map,
  History,
  BarChart3,
  Settings,
  KeyRound,
  Users,
  Wrench,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X,
  User,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CambiarClaveModal from './CambiarClaveModal';

/**
 * Barra Superior macOS (`Header`).
 *
 * Presenta estética translúcida con botones de semáforo estilo ventana macOS,
 * controles segmentados de navegación, selector de tema claro/oscuro,
 * y menú responsivo para teléfonos móviles.
 */
export const Header: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [modalClaveAbierto, setModalClaveAbierto] = useState(false);
  const [menuAdminAbierto, setMenuAdminAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const getSegmentClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
      isActive
        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
    }`;

  return (
    <>
      <header className="relative z-40 h-14 bg-white/80 dark:bg-zinc-900/85 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 flex items-center justify-between transition-colors">
        {/* Lado Izquierdo: Traffic Lights & Identidad */}
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

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

          {/* Logo / Título del Sistema */}
          <NavLink
            to="/"
            className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm tracking-tight hover:opacity-85 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-2xs">
              <Activity size={16} className="animate-pulse" />
            </div>
            <span className="font-bold">Perifoneo Tacna</span>
          </NavLink>
        </div>

        {/* Centro: Controles Segmentados macOS (Desktop) */}
        <nav className="hidden md:flex items-center bg-zinc-200/60 dark:bg-zinc-950/60 p-1 rounded-xl border border-zinc-300/40 dark:border-zinc-800/80 shadow-2xs">
          <NavLink to="/" className={getSegmentClass} end>
            <Map size={14} />
            <span>En vivo</span>
          </NavLink>

          <NavLink to="/historial" className={getSegmentClass}>
            <History size={14} />
            <span>Historial</span>
          </NavLink>

          <NavLink to="/reportes" className={getSegmentClass}>
            <BarChart3 size={14} />
            <span>Reportes</span>
          </NavLink>

          {/* Desplegable de Administración */}
          {isAdmin && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAdminAbierto(!menuAdminAbierto)}
                onBlur={() => setTimeout(() => setMenuAdminAbierto(false), 200)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  menuAdminAbierto
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
                }`}
              >
                <Settings size={14} />
                <span>Admin</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    menuAdminAbierto ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {menuAdminAbierto && (
                <div className="absolute left-0 mt-2 w-52 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-xl shadow-xl py-1.5 z-50 border border-zinc-200/80 dark:border-zinc-800/90 text-zinc-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-2xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold">
                    Administración
                  </div>
                  <NavLink
                    to="/admin/usuarios"
                    onClick={() => setMenuAdminAbierto(false)}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Users size={14} />
                    <span>Gestión de Usuarios</span>
                  </NavLink>
                  <NavLink
                    to="/admin/perifoneadores"
                    onClick={() => setMenuAdminAbierto(false)}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Radio size={14} />
                    <span>Perifoneadores</span>
                  </NavLink>
                  <NavLink
                    to="/admin/herramientas"
                    onClick={() => setMenuAdminAbierto(false)}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Wrench size={14} />
                    <span>Herramientas del Sistema</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Lado Derecho: Controles de Usuario & Modo Oscuro */}
        <div className="flex items-center gap-2">
          {/* Alternador de Modo Oscuro / Claro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-all cursor-pointer shadow-2xs"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar tema de color"
          >
            {isDark ? (
              <Sun size={15} className="text-amber-400 transition-transform rotate-0" />
            ) : (
              <Moon size={15} className="text-zinc-600 transition-transform rotate-0" />
            )}
          </button>

          {/* Badge del Usuario */}
          <div className="hidden lg:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 px-2.5 py-1 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-blue-600/15 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xs">
              <User size={12} />
            </div>
            <span className="text-2xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {user?.rol || 'SUPERVISOR'}
            </span>
            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 max-w-[130px] truncate">
              {user?.nombre || user?.email}
            </span>
          </div>

          {/* Cambiar Clave */}
          <button
            type="button"
            onClick={() => setModalClaveAbierto(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-colors cursor-pointer shadow-2xs"
            title="Cambiar contraseña"
          >
            <KeyRound size={15} />
          </button>

          {/* Cerrar Sesión */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Salir</span>
          </button>

          {/* Botón Menú Móvil */}
          <button
            type="button"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-colors cursor-pointer"
            aria-label="Menú móvil"
          >
            {menuMovilAbierto ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </header>

      {/* Menú Desplegable Móvil tipo Sheet macOS */}
      {menuMovilAbierto && (
        <div className="md:hidden z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 shadow-xl flex flex-col gap-2">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">Usuario</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{user?.nombre || user?.email}</span>
          </div>

          <NavLink
            to="/"
            onClick={() => setMenuMovilAbierto(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`
            }
            end
          >
            <Map size={16} />
            <span>En vivo</span>
          </NavLink>

          <NavLink
            to="/historial"
            onClick={() => setMenuMovilAbierto(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`
            }
          >
            <BarChart3 size={16} />
            <span>Reportes Consolidados</span>
          </NavLink>

          {isAdmin && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
              <span className="text-2xs uppercase tracking-wider text-zinc-400 font-bold px-3">
                Administración
              </span>
              <NavLink
                to="/admin/usuarios"
                onClick={() => setMenuMovilAbierto(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Users size={16} />
                <span>Usuarios</span>
              </NavLink>
              <NavLink
                to="/admin/perifoneadores"
                onClick={() => setMenuMovilAbierto(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Radio size={16} />
                <span>Perifoneadores</span>
              </NavLink>
              <NavLink
                to="/admin/herramientas"
                onClick={() => setMenuMovilAbierto(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Wrench size={16} />
                <span>Herramientas</span>
              </NavLink>
            </div>
          )}
        </div>
      )}

      {/* Modal de Cambio de Contraseña */}
      <CambiarClaveModal
        isOpen={modalClaveAbierto}
        onClose={() => setModalClaveAbierto(false)}
      />
    </>
  );
};

export default Header;
