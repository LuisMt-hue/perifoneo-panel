import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Rol } from '../../types/auth.types';

interface RutaProtegidaProps {
  /** Rol mínimo requerido para acceder a la ruta (opcional) */
  rol?: Rol;
  children?: React.ReactNode;
}

/**
 * Componente Guard de Enrutamiento (`RutaProtegida`).
 *
 * Protege vistas requiriendo autenticación activa en el backend de Traccar.
 * Opcionalmente verifica si el usuario tiene el rol necesario (RBAC). Si el usuario
 * no está autenticado o la sesión expiró, redirige hacia `/login`.
 */
export const RutaProtegida: React.FC<RutaProtegidaProps> = ({ rol, children }) => {
  const { user, isAuthenticated, isAdmin, sessionExpiredFlag } = useAuth();

  // Requiere sesión activa del usuario autenticado con Traccar
  if (!isAuthenticated || !user) {
    return <Navigate to={sessionExpiredFlag ? '/login?expirada=1' : '/login'} replace />;
  }

  // Si se exige un rol específico (ej. ADMIN) y el usuario no lo posee, redirigir a inicio
  if (rol === 'ADMIN' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (rol && user.rol !== rol && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RutaProtegida;
