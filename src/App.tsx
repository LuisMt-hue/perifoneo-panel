import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './shared/context/AuthContext';
import MainLayout from './shared/components/layout/MainLayout';
import RutaProtegida from './shared/components/auth/RutaProtegida';

// Importación de Páginas por módulos
import LoginPage from './auth/LoginPage';
import LivePage from './live/LivePage';
import DevicesPage from './devices/DevicesPage';
import HistorialRecorridosPage from './history/HistorialRecorridosPage';
import DetalleRecorridoPage from './history/DetalleRecorridoPage';

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
 * - Rutas operativas autenticadas: /, /devices, /historial, /recorrido/:id
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

          {/* Rutas obsoletas de admin redirigidas */}
          <Route path="/admin/*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>

      {/* Redirección ante rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
