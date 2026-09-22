import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, Check } from 'lucide-react';
import type { CreateDevicePayload } from '../types';

interface DeviceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateDevicePayload) => Promise<void>;
}

const CATEGORIAS_SUGERIDAS = [
  { key: 'moto', label: 'Moto' },
  { key: 'car', label: 'Auto' },
  { key: 'truck', label: 'Camioneta' },
  { key: 'person', label: 'Peatonal / Persona' },
  { key: 'default', label: 'Por defecto' },
];

export const DeviceCreateModal: React.FC<DeviceCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [base, setBase] = useState('');
  const [distrito, setDistrito] = useState('');
  const [placa, setPlaca] = useState('');
  const [phone, setPhone] = useState('');
  const [sector, setSector] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState('moto');
  const [creando, setCreando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setUniqueId('');
      setBase('');
      setDistrito('');
      setPlaca('');
      setPhone('');
      setSector('');
      setContact('');
      setCategory('moto');
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
        base: base.trim() || undefined,
        distrito: distrito.trim() || undefined,
        placa: placa.trim() || undefined,
        phone: phone.trim() || undefined,
        sector: sector.trim() || undefined,
        contact: contact.trim() || undefined,
        category: category.trim() || undefined,
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
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-xl border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 transform transition-all animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Cabecera macOS */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <div className="ml-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600/10 text-[#155BD0] dark:text-blue-400 flex items-center justify-center">
                <Plus size={16} />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Nuevo Perifoneador / Dispositivo
              </h3>
            </div>
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorLocal && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              {errorLocal}
            </div>
          )}

          {/* Grupo 1: Identificación Principal (NOMBRE, DNI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                NOMBRE <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={creando}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: MÓVIL 01"
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
                disabled={creando}
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value)}
                placeholder="Ej: 72849182"
                className="w-full h-10 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-mono transition-all"
              />
            </div>
          </div>

          {/* Grupo 2: Datos Operativos Prioritarios (BASE, DISTRITO, PLACA, CELULAR, SECTOR) */}
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 space-y-3.5">
            <div className="text-xs uppercase font-extrabold text-[#155BD0] dark:text-blue-400 tracking-wider">
              Datos Operativos Prioritarios
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  BASE
                </label>
                <input
                  type="text"
                  disabled={creando}
                  value={base}
                  onChange={(e) => setBase(e.target.value)}
                  placeholder="Ej: Base Sur"
                  className="w-full h-10 px-3.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  DISTRITO
                </label>
                <input
                  type="text"
                  disabled={creando}
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                  placeholder="Ej: Tacna"
                  className="w-full h-10 px-3.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  PLACA DEL CARRO
                </label>
                <input
                  type="text"
                  disabled={creando}
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  placeholder="Ej: Z1A-452"
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
                  disabled={creando}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 952123456"
                  className="w-full h-10 px-3.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  SECTOR
                </label>
                <input
                  type="text"
                  disabled={creando}
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="Ej: Sector 2"
                  className="w-full h-10 px-3.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-medium transition-all"
                />
              </div>
            </div>
          </div>

          {/* Grupo 3: Contacto y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Chofer / Contacto
              </label>
              <input
                type="text"
                disabled={creando}
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
              <select
                disabled={creando}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] transition-all cursor-pointer"
              >
                {CATEGORIAS_SUGERIDAS.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label} ({cat.key})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pie del Formulario */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              disabled={creando}
              onClick={onClose}
              className="h-10 px-4 text-sm font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creando || !name.trim() || !uniqueId.trim()}
              className="h-10 flex items-center gap-2 px-5 text-sm font-semibold rounded-xl bg-[#155BD0] hover:bg-[#114eb3] text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {creando ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creando en Traccar...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Registrar Dispositivo</span>
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
