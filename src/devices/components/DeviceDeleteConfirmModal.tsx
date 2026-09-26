import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import type { ManagedDevice } from '../types';

interface DeviceDeleteConfirmModalProps {
  device: ManagedDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  isDeleting: boolean;
}

export const DeviceDeleteConfirmModal: React.FC<DeviceDeleteConfirmModalProps> = ({
  device,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setErrorLocal(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen || !device) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm(device.id);
    } catch (err: any) {
      setErrorLocal(err.message || 'Error al eliminar el dispositivo en Traccar.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 transform transition-all animate-in fade-in zoom-in-95 duration-150 p-6 overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mensaje */}
        <div className="mt-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            ¿Eliminar dispositivo de Traccar?
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Esta acción eliminará de forma permanente la unidad del servidor Traccar. Su configuración y datos operativos serán eliminados.
          </p>

          <div className="mt-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-sm">
            <div className="font-bold text-zinc-900 dark:text-zinc-100">{device.name}</div>
            <div className="text-zinc-500 font-mono text-xs mt-1">DNI: {device.uniqueId} (ID #{device.id})</div>
          </div>

          {errorLocal && (
            <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              {errorLocal}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="h-10 px-4 text-sm font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="h-10 flex items-center gap-2 px-5 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Eliminar Definitivamente</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceDeleteConfirmModal;
