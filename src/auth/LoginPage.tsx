import React from 'react';
import { Info } from 'lucide-react';
import { LoginBackground } from './components/LoginBackground';
import { LoginHeader } from './components/LoginHeader';
import { LoginForm } from './components/LoginForm';
import { useLogin } from './hooks/useLogin';

/**
 * Página principal de Inicio de Sesión estilo macOS (`LoginPage`).
 *
 * Arquitectura modular:
 * - `LoginBackground`: Fondo con estética macOS y luces volumétricas difusas.
 * - `LoginHeader`: Semáforos de ventana macOS y encabezado institucional de Perifoneo.
 * - `LoginForm`: Formulario reactivo de credenciales Traccar.
 * - `useLogin`: Hook encargado de la lógica y autenticación con el backend de Traccar.
 */
export const LoginPage: React.FC = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    sesionExpirada,
    handleSubmit,
  } = useLogin();

  return (
    <LoginBackground>
      {/* Ventana Flotante macOS con efecto Glassmorphism */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 dark:bg-zinc-900/60 backdrop-blur-3xl border border-white/20 dark:border-zinc-700/50 rounded-3xl shadow-2xl p-7 sm:p-9 text-white">
          <LoginHeader />

          {sesionExpirada && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-medium animate-in fade-in duration-200">
              <Info size={16} className="shrink-0 mt-0.5 text-amber-400" />
              <span>Tu sesión de Traccar ha expirado. Por favor ingresa nuevamente.</span>
            </div>
          )}

          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </LoginBackground>
  );
};

export default LoginPage;
