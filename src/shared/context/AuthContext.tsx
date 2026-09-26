import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Usuario, AuthContextType } from '../types/auth.types';
import { tokenStorage, onSessionExpired } from '../services/tokenStorage';
import { verificarSesionTraccar, logoutTraccar } from '../services/traccarAuth';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Proveedor Global de Autenticación (`AuthProvider`).
 *
 * Administra el estado de la sesión validado contra el backend de Traccar,
 * sincronizándolo con `tokenStorage` y escuchando expiraciones o cierres de sesión.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => tokenStorage.getToken());
  const [user, setUser] = useState<Usuario | null>(() => tokenStorage.getUser());

  // Verificar la sesión con el backend de Traccar al montar la aplicación
  useEffect(() => {
    let activo = true;

    const comprobarSesion = async () => {
      // Si hay datos locales o cookies de sesión previas, validar contra Traccar
      if (tokenStorage.getUser() || tokenStorage.getToken()) {
        const usuarioTraccar = await verificarSesionTraccar();
        if (!activo) return;

        if (usuarioTraccar) {
          setUser(usuarioTraccar);
          tokenStorage.setUser(usuarioTraccar);
        } else {
          // Sesión no válida en Traccar
          tokenStorage.clear();
          setToken(null);
          setUser(null);
        }
      }
    };

    comprobarSesion();

    return () => {
      activo = false;
    };
  }, []);

  // Suscribirse a eventos de expiración de sesión
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
    logoutTraccar();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      isAdmin: user?.rol === 'ADMIN' || Boolean(user?.administrator),
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

export default AuthContext;
