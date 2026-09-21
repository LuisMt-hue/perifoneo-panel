import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Usuario, AuthContextType } from '../types/auth.types';
import { tokenStorage, onSessionExpired } from '../services/auth/tokenStorage';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Proveedor Global de Autenticación (`AuthProvider`).
 *
 * Administra el estado de la sesión, sincronizándolo con `tokenStorage`
 * y escuchando eventos de revocación o expiración de tokens JWT.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Inicialización limpia: tokenStorage valida la expiración del token al recuperarlo
  const [token, setToken] = useState<string | null>(() => tokenStorage.getToken());
  const [user, setUser] = useState<Usuario | null>(() => {
    const validToken = tokenStorage.getToken();
    return validToken ? tokenStorage.getUser() : null;
  });

  // Suscribirse al evento de expiración de sesión (ej. emitido por respuesta 401)
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setToken(null);
      setUser(null);
    });
    return unsubscribe;
  }, []);

  const login = (newToken: string, usuario: Usuario) => {
    tokenStorage.setSession(newToken, usuario);
    setToken(newToken);
    setUser(usuario);
  };

  const logout = () => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.rol === 'ADMIN',
      login,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizado para consumir el contexto de autenticación en cualquier componente.
 *
 * @throws Error si se invoca fuera de un `AuthProvider`.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider.');
  }
  return context;
};
