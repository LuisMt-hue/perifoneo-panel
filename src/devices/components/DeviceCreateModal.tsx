import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Loader2, Check } from 'lucide-react';
import type { CreateDevicePayload } from '../types';
import type { TraccarGeofence, TraccarGroup } from '../../live/types';
import SearchSelectCombobox from '../../shared/components/ui/SearchSelectCombobox';

interface DeviceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateDevicePayload) => Promise<unknown>;
  geofences: TraccarGeofence[];
  groups: TraccarGroup[];
  basesConocidas: string[];
}

export const DeviceCreateModal: React.FC<DeviceCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  geofences,
  groups,
  basesConocidas,
}) => {
  const [name, setName] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [phone, setPhone] = useState('');
  const [base, setBase] = useState('');
  const [sector, setSector] = useState('');
  const [groupId, setGroupId] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const opcionesGrupo = useMemo(() => groups.map((g) => ({ value: String(g.id), label: g.name })), [groups]);
  const opcionesSector = useMemo(() => geofences.map((g) => ({ value: g.name, label: g.name })), [geofences]);
  const opcionesBase = useMemo(() => basesConocidas.map((b) => ({ value: b, label: b })), [basesConocidas]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setUniqueId('');
      setPhone('');
      setBase('');
      setSector('');
      setGroupId('');
      setErrorLocal(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !creando) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, creando]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorLocal('El nombre de la unidad es requerido.');
      return;
    }
    if (!uniqueId.trim()) {
      setErrorLocal('El DNI o identificador único es requerido.');
      return;
    }

    setCreando(true);
    setErrorLocal(null);
    try {
      await onCreate({
        name: name.trim(),
        uniqueId: uniqueId.trim(),
        phone: phone.trim() || undefined,
        base: base.trim() || undefined,
        sector: sector || undefined,
        groupId: groupId ? Number(groupId) : undefined,
        disabled: false,
      });
      onClose();
    } catch (err: any) {
      console.error('Error al crear dispositivo:', err);
      setErrorLocal(err.message || 'Error al conectar con Traccar para registrar el dispositivo.');
    } finally {
      setCreando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !creando) onClose();
      }}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 transform transition-all animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-600/10 text-[#155BD0] dark:text-blue-400 flex items-center justify-center">
              <Plus size={16} />
            </div>
            <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Nuevo Perifoneador</h3>
          </div>

          <button
            type="button"
            disabled={creando}
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorLocal && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[13px]">
              {errorLocal}
            </div>
          )}

          {/* Nombre: fila completa */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={creando}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: MÓVIL 01"
              className="w-full h-9 px-3 text-[13px] bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-medium transition-all"
            />
          </div>

          {/* DNI + Celular: misma fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                DNI <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={creando}
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value)}
                placeholder="Ej: 72849182"
                className="w-full h-9 px-3 text-[13px] bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-mono transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Celular
              </label>
              <input
                type="text"
                disabled={creando}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 952123456"
                className="w-full h-9 px-3 text-[13px] bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-mono transition-all"
              />
            </div>
          </div>

          {/* Grupo, Base, Sector: una lista debajo de la otra */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Grupo
            </label>
            <SearchSelectCombobox
              options={opcionesGrupo}
              value={groupId}
              onChange={setGroupId}
              placeholder={opcionesGrupo.length === 0 ? 'Sin grupos en Traccar' : 'Buscar grupo...'}
              emptyOptionLabel="Sin grupo"
              allowCustomValue={false}
              disabled={creando}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Base
            </label>
            <SearchSelectCombobox
              options={opcionesBase}
              value={base}
              onChange={setBase}
              placeholder="Buscar o escribir una base..."
              emptyOptionLabel="Sin base"
              allowCustomValue
              disabled={creando}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Sector
            </label>
            <SearchSelectCombobox
              options={opcionesSector}
              value={sector}
              onChange={setSector}
              placeholder="Buscar sector..."
              emptyOptionLabel="Sin sector"
              allowCustomValue={false}
              disabled={creando}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              disabled={creando}
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-semibold rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creando || !name.trim() || !uniqueId.trim()}
              className="h-9 flex items-center gap-2 px-5 text-[13px] font-semibold rounded-lg bg-[#155BD0] hover:bg-[#114eb3] text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {creando ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Registrar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceCreateModal;
