import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Lock, Mail, AlertCircle, Info, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { login as loginApi } from '../../services/api/endpoints';
import { getJwtClaims } from '../../services/auth/jwt';
import type { Usuario } from '../../types/auth.types';

/**
 * Página de Inicio de Sesión estilo macOS (`LoginPage`).
 *
 * Presenta una ventana de autenticación tipo macOS Sonoma con tarjeta de vidrio esmerilado,
 * controles de semáforo y animación sutil de carga.
 */
export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const sesionExpirada = searchParams.get('expirada') === '1';

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await loginApi({ email: email.trim(), password });

      let usuario: Usuario;
      if (resp.usuario) {
        usuario = resp.usuario;
      } else if (resp.user) {
        usuario = resp.user;
      } else {
        const claims = getJwtClaims(resp.token);
        usuario = {
          id: Number(claims?.id || claims?.sub || 0),
          email: claims?.email || email,
          nombre: claims?.nombre || email.split('@')[0],
          rol: claims?.rol || 'SUPERVISOR',
          activo: true,
        };
      }

      authLogin(resp.token, usuario);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Credenciales no válidas. Verifique sus datos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-slate-900 to-zinc-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative overflow-hidden select-none">
      {/* Luces de fondo decorativas estilo macOS */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Ventana Flotante macOS */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 dark:bg-zinc-900/60 backdrop-blur-3xl border border-white/20 dark:border-zinc-700/50 rounded-3xl shadow-2xl p-7 sm:p-9 text-white">
          {/* Controles de Semáforo macOS */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-2xs" />
          </div>

          {/* Logo y Encabezado */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-400 shadow-inner mb-3">
              <Activity size={28} className="animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Perifoneo Tacna
            </h1>
            <p className="mt-1 text-xs text-zinc-300">
              Panel de Supervisión y Auditoría Satelital
            </p>
          </div>

          {sesionExpirada && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-medium">
              <Info size={16} className="shrink-0 mt-0.5 text-amber-400" />
              <span>Tu sesión anterior ha expirado. Por favor ingresa nuevamente.</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 pl-1">
                Correo Institucional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@tacna.gob.pe"
                  className="block w-full pl-9 pr-3 py-2.5 bg-black/20 border border-white/15 rounded-xl text-xs text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-black/20 border border-white/15 rounded-xl text-xs text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-200">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-400/40 shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all cursor-pointer active:scale-98"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Iniciando sesión...</span>
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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
