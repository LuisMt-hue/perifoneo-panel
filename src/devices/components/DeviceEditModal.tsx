import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Plus, Smartphone, Loader2 } from 'lucide-react';
import type { TraccarDevice, ManagedDevice } from '../types';

interface DeviceEditModalProps {
  device: ManagedDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: TraccarDevice) => Promise<void>;
}

export const DeviceEditModal: React.FC<DeviceEditModalProps> = ({
  device,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [phone, setPhone] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState('');
  const [disabled, setDisabled] = useState(false);

  // Campos prioritarios directos
  const [base, setBase] = useState('');
  const [distrito, setDistrito] = useState('');
  const [placa, setPlaca] = useState('');
  const [sector, setSector] = useState('');

  // Lista editable de atributos adicionales (excluyendo base, distrito, placa, sector)
  const [attributesList, setAttributesList] = useState<Array<{ key: string; value: string }>>([]);

  const [saving, setSaving] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (device && isOpen) {
      setName(device.name || '');
      setUniqueId(device.uniqueId || '');
      setPhone(device.phone || '');
      setContact(device.contact || '');
      setCategory(device.category || '');
      setDisabled(Boolean(device.disabled));

      const attrs = { ...(device.attributes || {}) };
      setBase(attrs.base !== undefined ? String(attrs.base) : '');
      setDistrito(attrs.distrito !== undefined ? String(attrs.distrito) : '');
      setPlaca(attrs.placa !== undefined ? String(attrs.placa) : '');
      setSector(attrs.sector !== undefined ? String(attrs.sector) : (attrs.sector_asignado !== undefined ? String(attrs.sector_asignado) : ''));

      // Otros atributos
      const otros = Object.entries(attrs)
        .filter(([k]) => !['base', 'distrito', 'placa', 'sector', 'sector_asignado'].includes(k.toLowerCase()))
        .map(([key, value]) => ({
          key,
          value: value === null || value === undefined ? '' : String(value),
        }));
      setAttributesList(otros);
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

  const handleAddAttribute = () => {
    setAttributesList([...attributesList, { key: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributesList(attributesList.filter((_, i) => i !== index));
  };

  const handleAttrKeyChange = (index: number, newKey: string) => {
    const next = [...attributesList];
    next[index].key = newKey;
    setAttributesList(next);
  };

  const handleAttrValueChange = (index: number, newVal: string) => {
    const next = [...attributesList];
    next[index].value = newVal;
    setAttributesList(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorLocal(null);
    try {
      // Reconstruir objeto de atributos consolidado
      const finalAttributes: Record<string, any> = {};

      if (base.trim()) finalAttributes.base = base.trim();
      if (distrito.trim()) finalAttributes.distrito = distrito.trim();
      if (placa.trim()) finalAttributes.placa = placa.trim();
      if (sector.trim()) finalAttributes.sector = sector.trim();

      for (const item of attributesList) {
        const k = item.key.trim();
        if (k) {
          finalAttributes[k] = item.value;
        }
      }

      // NUNCA incluir 'isOnline' u otras propiedades fuera de Traccar Device
      const updatedDevice: TraccarDevice = {
        id: device.id,
        name: name.trim(),
        uniqueId: uniqueId.trim(),
        phone: phone.trim() || undefined,
        contact: contact.trim() || undefined,
        category: category.trim() || undefined,
        disabled,
        status: device.status,
        lastUpdate: device.lastUpdate,
        positionId: device.positionId,
        groupId: device.groupId,
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
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabecera macOS */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <div className="ml-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600/10 text-[#155BD0] dark:text-blue-400 flex items-center justify-center">
                <Smartphone size={16} />
              </div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Editar Dispositivo #{device.id}
              </h2>
            </div>
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

        {/* Cuerpo con scroll */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {errorLocal && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              {errorLocal}
            </div>
          )}

          {/* Propiedades Estándar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                NOMBRE DE UNIDAD <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={saving}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-semibold transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                DNI / IDENTIFICADOR <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={saving}
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value)}
                className="w-full h-10 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-mono transition-all"
              />
            </div>
          </div>

          {/* Sección Campos Prioritarios */}
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 space-y-3.5">
            <div className="text-xs uppercase font-extrabold text-[#155BD0] dark:text-blue-400 tracking-wider">
              Campos Prioritarios de la Tabla
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  BASE
                </label>
                <input
                  type="text"
                  disabled={saving}
                  value={base}
                  onChange={(e) => setBase(e.target.value)}
                  placeholder="Base asignada"
                  className="w-full h-10 px-3.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  DISTRITO
                </label>
                <input
                  type="text"
                  disabled={saving}
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                  placeholder="Distrito"
                  className="w-full h-10 px-3.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  PLACA DEL CARRO
                </label>
                <input
                  type="text"
                  disabled={saving}
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  placeholder="Placa del vehículo"
                  className="w-full h-10 px-3.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-mono transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  CELULAR
                </label>
                <input
                  type="text"
                  disabled={saving}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Número telefónico"
                  className="w-full h-10 px-3.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  SECTOR
                </label>
                <input
                  type="text"
                  disabled={saving}
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="Sector asignado"
                  className="w-full h-10 px-3.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-medium transition-all"
                />
              </div>
            </div>
          </div>

          {/* Contacto y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Contacto / Chofer
              </label>
              <input
                type="text"
                disabled={saving}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Nombre del chofer"
                className="w-full h-10 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Categoría (Ícono)
              </label>
              <input
                type="text"
                disabled={saving}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="moto, car, truck, person..."
                className="w-full h-10 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-mono transition-all"
              />
            </div>
          </div>

          {/* Toggle de Deshabilitado */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
            <div>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Estado de Habilitación
              </div>
              <div className="text-xs text-zinc-500">
                {disabled ? 'Deshabilitado en Traccar' : 'Habilitado y activo para rastreo'}
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => setDisabled(!disabled)}
              className={`h-8 px-4 rounded-full text-xs font-bold font-mono transition-all cursor-pointer shadow-xs ${
                disabled
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {disabled ? 'Deshabilitado' : 'Habilitado'}
            </button>
          </div>

          {/* Sección de Atributos Personalizados adicionales */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Otros Atributos ({attributesList.length})
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={handleAddAttribute}
                className="h-8 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Añadir Atributo</span>
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {attributesList.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl">
                  Sin atributos adicionales.
                </div>
              ) : (
                attributesList.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled={saving}
                      value={attr.key}
                      onChange={(e) => handleAttrKeyChange(idx, e.target.value)}
                      placeholder="Clave (ej: turno)"
                      className="w-1/3 h-9 px-3 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                    <input
                      type="text"
                      disabled={saving}
                      value={attr.value}
                      onChange={(e) => handleAttrValueChange(idx, e.target.value)}
                      placeholder="Valor"
                      className="flex-1 h-9 px-3 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleRemoveAttribute(idx)}
                      title="Eliminar atributo"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botones de Pie */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-10 px-4 text-sm font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !uniqueId.trim()}
              className="h-10 flex items-center gap-2 px-5 text-sm font-semibold rounded-xl bg-[#155BD0] hover:bg-[#114eb3] text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Guardando en Traccar...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
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
