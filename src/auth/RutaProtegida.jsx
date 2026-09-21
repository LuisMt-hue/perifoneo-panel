import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const RutaProtegida = ({ rol }) => {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (rol && user?.rol !== rol) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RutaProtegida;
