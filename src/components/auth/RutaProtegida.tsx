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
 * Protege vistas requiriendo autenticación activa. Opcionalmente verifica
 * si el usuario tiene el rol necesario (RBAC). Si el usuario no está autenticado
 * o su token caducó, redirige hacia `/login`.
 */
export const RutaProtegida: React.FC<RutaProtegidaProps> = ({ rol, children }) => {
  const { token, user, isAuthenticated } = useAuth();

  // Si no existe token o la sesión no es válida, redirigir al login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // Si se exige un rol específico (ej. ADMIN) y el usuario no lo posee, redirigir a inicio
  if (rol && user?.rol !== rol) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RutaProtegida;
