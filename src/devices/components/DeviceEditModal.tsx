import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Smartphone, Loader2 } from 'lucide-react';
import type { TraccarDevice, ManagedDevice } from '../types';
import type { TraccarGeofence, TraccarGroup } from '../../live/types';
import SearchSelectCombobox from '../../shared/components/ui/SearchSelectCombobox';

interface DeviceEditModalProps {
  device: ManagedDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: TraccarDevice) => Promise<unknown>;
  geofences: TraccarGeofence[];
  groups: TraccarGroup[];
  basesConocidas: string[];
}

export const DeviceEditModal: React.FC<DeviceEditModalProps> = ({
  device,
  isOpen,
  onClose,
  onSave,
  geofences,
  groups,
  basesConocidas,
}) => {
  const [name, setName] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [phone, setPhone] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [base, setBase] = useState('');
  const [sector, setSector] = useState('');
  const [groupId, setGroupId] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const opcionesGrupo = useMemo(() => groups.map((g) => ({ value: String(g.id), label: g.name })), [groups]);
  const opcionesSector = useMemo(() => geofences.map((g) => ({ value: g.name, label: g.name })), [geofences]);
  const opcionesBase = useMemo(() => basesConocidas.map((b) => ({ value: b, label: b })), [basesConocidas]);

  useEffect(() => {
    if (device && isOpen) {
      setName(device.name || '');
      setUniqueId(device.uniqueId || '');
      setPhone(device.phone || '');
      setDisabled(Boolean(device.disabled));
      setBase(device.attributes?.base ? String(device.attributes.base) : '');
      setSector(device.attributes?.sector ? String(device.attributes.sector) : '');
      setGroupId(device.groupId != null ? String(device.groupId) : '');
      setErrorLocal(null);
    }
  }, [device, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen || !device) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorLocal(null);
    try {
      const finalAttributes: Record<string, any> = { ...(device.attributes || {}) };
      if (base.trim()) finalAttributes.base = base.trim();
      else delete finalAttributes.base;
      if (sector) finalAttributes.sector = sector;
      else delete finalAttributes.sector;

      const updatedDevice: TraccarDevice = {
        id: device.id,
        name: name.trim(),
        uniqueId: uniqueId.trim(),
        phone: phone.trim() || undefined,
        contact: device.contact,
        category: device.category,
        disabled,
        status: device.status,
        lastUpdate: device.lastUpdate,
        positionId: device.positionId,
        groupId: groupId ? Number(groupId) : undefined,
        model: device.model,
        attributes: finalAttributes,
      };

      await onSave(updatedDevice);
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar dispositivo:', err);
      setErrorLocal(err.message || 'Error al guardar los cambios en Traccar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-600/10 text-[#155BD0] dark:text-blue-400 flex items-center justify-center">
              <Smartphone size={16} />
            </div>
            <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Editar Dispositivo</h2>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
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
              disabled={saving}
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                disabled={saving}
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-mono transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Celular
              </label>
              <input
                type="text"
                disabled={saving}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Número telefónico"
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
            <div>
              <div className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">Habilitación</div>
              <div className="text-[11px] text-zinc-500">
                {disabled ? 'Deshabilitado en Traccar' : 'Habilitado y activo para rastreo'}
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => setDisabled(!disabled)}
              className={`h-7 px-3.5 rounded-full text-[11px] font-bold font-mono transition-all cursor-pointer shadow-xs ${
                disabled
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {disabled ? 'Deshabilitado' : 'Habilitado'}
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-semibold rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !uniqueId.trim()}
              className="h-9 flex items-center gap-2 px-5 text-[13px] font-semibold rounded-lg bg-[#155BD0] hover:bg-[#114eb3] text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceEditModal;
