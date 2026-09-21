import React from 'react';
import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import { Activity, LogOut, Map, Clock, BarChart3, Settings, KeyRound } from 'lucide-react';
import Login from './paginas/Login.jsx';
import EnVivo from './paginas/EnVivo.jsx';
import Historial from './paginas/Historial.jsx';
import DetalleRecorrido from './paginas/DetalleRecorrido.jsx';
import Reportes from './paginas/Reportes.jsx';
import Usuarios from './paginas/admin/Usuarios.jsx';
import Perifoneadores from './paginas/admin/Perifoneadores.jsx';
import Herramientas from './paginas/admin/Herramientas.jsx';

// --- LAYOUT CON BARRA SUPERIOR ---
function Layout() {
  const { user, logout } = useAuth();
  const [mostrarCambiarClave, setMostrarCambiarClave] = React.useState(false);

  const enlaceClase = ({ isActive }) =>
    `px-3 py-1 rounded text-sm transition-colors ${
      isActive
        ? 'bg-white/20 text-white font-semibold'
        : 'text-blue-200 hover:text-white hover:bg-white/10'
    }`;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-[#1e3a8a] text-white px-4 py-2 flex justify-between items-center shadow-md z-20">
        <div className="flex items-center gap-6">
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Activity size={22} /> Perifoneo Tacna
          </h1>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={enlaceClase} end>
              <span className="flex items-center gap-1"><Map size={14} /> En vivo</span>
            </NavLink>
            <NavLink to="/historial" className={enlaceClase}>
              <span className="flex items-center gap-1"><Clock size={14} /> Historial</span>
            </NavLink>
            <NavLink to="/reportes" className={enlaceClase}>
              <span className="flex items-center gap-1"><BarChart3 size={14} /> Reportes</span>
            </NavLink>
            {user?.rol === 'ADMIN' && (
              <NavLink to="/admin/usuarios" className={enlaceClase}>
                <span className="flex items-center gap-1"><Settings size={14} /> Admin</span>
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm bg-blue-800 px-3 py-1 rounded-full hidden sm:inline">
            {user?.nombre}
          </span>
          <button
            onClick={logout}
            className="p-2 hover:bg-red-600 rounded text-sm flex items-center gap-1 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
}

// --- RUTAS AUXILIARES ---
function LoginRoute() {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : <Login />;
}

function RutaProtegida({ rol }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (rol && user?.rol !== rol) return <Navigate to="/" replace />;
  return <Outlet />;
}

// --- ENRUTADOR PRINCIPAL ---
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<EnVivo />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/recorrido/:id" element={<DetalleRecorrido />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route element={<RutaProtegida rol="ADMIN" />}>
            <Route path="/admin/usuarios" element={<Usuarios />} />
            <Route path="/admin/perifoneadores" element={<Perifoneadores />} />
            <Route path="/admin/herramientas" element={<Herramientas />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}