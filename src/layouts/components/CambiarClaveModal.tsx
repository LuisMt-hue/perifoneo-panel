import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import { cambiarPassword } from '../../services/api/endpoints';
import { KeyRound, CheckCircle2, AlertCircle, Lock, Loader2 } from 'lucide-react';

interface CambiarClaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de Cambio de Contraseña Propia estilo macOS (`CambiarClaveModal`).
 *
 * Permite al usuario autenticado cambiar su clave con validación,
 * modo oscuro e inputs protegidos.
 */
export const CambiarClaveModal: React.FC<CambiarClaveModalProps> = ({ isOpen, onClose }) => {
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nuevaClave.length < 6) {
      setError('La nueva contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (nuevaClave !== confirmarClave) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await cambiarPassword(nuevaClave);
      setExito(true);
      setTimeout(() => {
        setExito(false);
        setNuevaClave('');
        setConfirmarClave('');
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error al actualizar la contraseña.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setExito(false);
    setNuevaClave('');
    setConfirmarClave('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cambiar Contraseña">
      {exito ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-bounce" />
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            ¡Contraseña actualizada con éxito!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-2">
            <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Ingresa tu nueva contraseña para acceder al sistema.</span>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                required
                minLength={6}
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmarClave}
                onChange={(e) => setConfirmarClave(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CambiarClaveModal;
