import React, { useState } from 'react';
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
  if (!isOpen || !device) return null;

  const [name, setName] = useState(device.name || '');
  const [uniqueId, setUniqueId] = useState(device.uniqueId || '');
  const [phone, setPhone] = useState(device.phone || '');
  const [contact, setContact] = useState(device.contact || '');
  const [category, setCategory] = useState(device.category || '');
  const [disabled, setDisabled] = useState(Boolean(device.disabled));

  // Lista editable de atributos clave-valor
  const [attributesList, setAttributesList] = useState<Array<{ key: string; value: string }>>(
    Object.entries(device.attributes || {}).map(([key, value]) => ({
      key,
      value: value === null || value === undefined ? '' : String(value),
    }))
  );

  const [saving, setSaving] = useState(false);

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
    try {
      // Reconstruir objeto de atributos
      const finalAttributes: Record<string, any> = {};
      for (const item of attributesList) {
        const k = item.key.trim();
        if (k) {
          finalAttributes[k] = item.value;
        }
      }

      const updatedDevice: TraccarDevice = {
        ...device,
        name: name.trim(),
        uniqueId: uniqueId.trim(),
        phone: phone.trim() || undefined,
        contact: contact.trim() || undefined,
        category: category.trim() || undefined,
        disabled,
        attributes: finalAttributes,
      };

      await onSave(updatedDevice);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Smartphone size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Editar Dispositivo #{device.id}
              </h2>
              <p className="text-2xs text-zinc-500 dark:text-zinc-400">
                Ajuste de propiedades estándar y atributos personalizados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Propiedades Estándar */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Nombre de Unidad
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                DNI / Identificador (uniqueId)
              </label>
              <input
                type="text"
                required
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 904020436"
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Contacto / Chofer
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Nombre del conductor"
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Categoría (Ícono Traccar)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: default, animal, car, truck, person..."
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Toggle de Deshabilitado */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
            <div>
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Estado del Dispositivo
              </div>
              <div className="text-2xs text-zinc-500">
                {disabled ? 'Deshabilitado en Traccar' : 'Habilitado y activo para rastreo'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDisabled(!disabled)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all ${
                disabled
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {disabled ? 'Deshabilitado' : 'Habilitado'}
            </button>
          </div>

          {/* Sección de Atributos Personalizados */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Atributos Personalizados ({attributesList.length})
              </label>
              <button
                type="button"
                onClick={handleAddAttribute}
                className="flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus size={12} />
                <span>Añadir Atributo</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {attributesList.length === 0 ? (
                <div className="text-center py-4 text-2xs text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                  Sin atributos adicionales. Haz clic en "Añadir Atributo" para agregar uno.
                </div>
              ) : (
                attributesList.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={attr.key}
                      onChange={(e) => handleAttrKeyChange(idx, e.target.value)}
                      placeholder="Clave (ej: Placa)"
                      className="w-1/3 px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => handleAttrValueChange(idx, e.target.value)}
                      placeholder="Valor"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(idx)}
                      title="Eliminar atributo"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botones de Pie */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceEditModal;
