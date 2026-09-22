import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import RutaProtegida from './components/auth/RutaProtegida';

// Importación de Páginas con nombres semánticos
import LoginPage from './pages/auth/LoginPage';
import LivePage from './live/LivePage';
import HistorialRecorridosPage from './pages/history/HistorialRecorridosPage';
import DetalleRecorridoPage from './pages/history/DetalleRecorridoPage';
import ReportesPage from './pages/reports/ReportesPage';
import DevicesPage from './devices/DevicesPage';
import GestionUsuariosPage from './pages/admin/GestionUsuariosPage';
import HerramientasAdminPage from './pages/admin/HerramientasAdminPage';

/**
 * Componente Guard para la ruta de Login.
 * Si el usuario ya cuenta con sesión activa y token válido, lo redirige al inicio.
 */
const LoginRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />;
};

/**
 * Enrutador Principal de la Aplicación (`App`).
 *
 * Estructura la navegación jerárquica:
 * - Rutas públicas: /login
 * - Rutas operativas autenticadas: /, /historial, /recorrido/:id, /reportes
 * - Rutas de administración protegidas por rol ADMIN: /admin/*
 */
export const App: React.FC = () => {
  return (
    <Routes>
      {/* Ruta pública de acceso */}
      <Route path="/login" element={<LoginRoute />} />

      {/* Rutas protegidas que requieren sesión activa */}
      <Route element={<RutaProtegida />}>
        <Route element={<MainLayout />}>
          {/* Vistas operativas y de supervisión */}
          <Route path="/" element={<LivePage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/historial" element={<HistorialRecorridosPage />} />
          <Route path="/recorrido/:id" element={<DetalleRecorridoPage />} />
          <Route path="/reportes" element={<ReportesPage />} />

          {/* Vistas de administración (RBAC: Rol ADMIN) */}
          <Route element={<RutaProtegida rol="ADMIN" />}>
            <Route path="/admin/usuarios" element={<GestionUsuariosPage />} />
            <Route path="/admin/dispositivos" element={<DevicesPage />} />
            <Route path="/admin/perifoneadores" element={<Navigate to="/devices" replace />} />
            <Route path="/admin/herramientas" element={<HerramientasAdminPage />} />
          </Route>
        </Route>
      </Route>

      {/* Redirección ante rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
