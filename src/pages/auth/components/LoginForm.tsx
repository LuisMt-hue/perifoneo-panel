import React from 'react';
import { Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Formulario modular de inicio de sesión con inputs estilizados estilo macOS,
 * validación reactiva, alertas de error y botón de acción principal.
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onSubmit,
}) => {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {/* Campo: Correo Electrónico Traccar */}
      <div>
        <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 pl-1">
          Correo Institucional / Traccar
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Mail size={16} />
          </div>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@tacna.gob.pe"
            disabled={loading}
            className="block w-full pl-9 pr-3 py-2.5 bg-black/20 border border-white/15 rounded-xl text-xs text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all disabled:opacity-60"
          />
        </div>
      </div>

      {/* Campo: Contraseña Traccar */}
      <div>
        <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 pl-1">
          Contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Lock size={16} />
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            className="block w-full pl-9 pr-3 py-2.5 bg-black/20 border border-white/15 rounded-xl text-xs text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all disabled:opacity-60"
          />
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-200 animate-in fade-in duration-200">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Botón de Envío */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-400/40 shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all cursor-pointer active:scale-98"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Iniciando sesión en Traccar...</span>
            </span>
          ) : (
            <>
              <span>Ingresar al Panel</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
