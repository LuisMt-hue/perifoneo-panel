import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Loader2, Edit2 } from 'lucide-react';

interface DeviceInlineCellProps {
  value: any;
  deviceId: number;
  fieldKey: string;
  isAttribute: boolean;
  isSaving: boolean;
  isSuccess: boolean;
  onSave: (deviceId: number, key: string, value: any, isAttribute: boolean) => Promise<void>;
  type?: 'text' | 'boolean' | 'number' | 'select';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const DeviceInlineCell: React.FC<DeviceInlineCellProps> = ({
  value,
  deviceId,
  fieldKey,
  isAttribute,
  isSaving,
  isSuccess,
  onSave,
  type = 'text',
  options = [],
  placeholder = 'Vacío',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState<string>(
    value === null || value === undefined ? '' : String(value)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentVal(value === null || value === undefined ? '' : String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleConfirm = async () => {
    if (currentVal === (value === null || value === undefined ? '' : String(value))) {
      setIsEditing(false);
      return;
    }
    setIsEditing(false);
    await onSave(deviceId, fieldKey, currentVal, isAttribute);
  };

  const handleCancel = () => {
    setCurrentVal(value === null || value === undefined ? '' : String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Render especial para booleanos (ej. 'disabled')
  if (type === 'boolean' || typeof value === 'boolean') {
    const isChecked = Boolean(value);
    return (
      <button
        type="button"
        disabled={isSaving}
        onClick={() => onSave(deviceId, fieldKey, !isChecked, isAttribute)}
        className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
          isChecked
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50'
            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
        }`}
      >
        {isSaving ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
        )}
        <span>{isChecked ? 'Deshabilitado' : 'Habilitado'}</span>
      </button>
    );
  }

  // Render especial para selects (GRUPO/SECTOR): control siempre interactivo, sin doble clic
  if (type === 'select') {
    const displayValue = value === null || value === undefined ? '' : String(value);
    return (
      <div className="relative inline-flex items-center gap-1.5 min-w-[120px]">
        <select
          disabled={isSaving}
          value={displayValue}
          onChange={(e) => onSave(deviceId, fieldKey, e.target.value || null, isAttribute)}
          className="w-full h-7 px-2 text-[12px] bg-transparent hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#155BD0] cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isSaving && <Loader2 size={11} className="animate-spin text-[#155BD0] shrink-0" />}
      </div>
    );
  }

  // Modo edición activo con input refinado tamaño Apple
  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[130px]">
        <input
          ref={inputRef}
          type="text"
          value={currentVal}
          onChange={(e) => setCurrentVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleConfirm}
          className="w-full h-7 px-2 text-[12px] bg-white dark:bg-zinc-800 border-2 border-[#155BD0] rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none shadow-xs font-medium"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleConfirm}
          title="Guardar (Enter)"
          className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
        >
          <Check size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCancel}
          title="Cancelar (Esc)"
          className="p-1 rounded-md bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  // Vista estática interactiva
  const displayVal = value !== null && value !== undefined && value !== '' ? String(value) : '';

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={`group relative flex items-center justify-between gap-1.5 py-0.5 px-1.5 rounded-lg cursor-pointer transition-all hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80 ${
        isSuccess ? 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : ''
      }`}
      title="Doble clic o clic en el lápiz para editar"
    >
      <span
        className={`truncate text-[12px] ${
          displayVal
            ? 'text-zinc-800 dark:text-zinc-200 font-normal'
            : 'text-zinc-400 italic font-normal text-[11px]'
        }`}
      >
        {displayVal || placeholder}
      </span>

      <div className="flex items-center gap-1 opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        {isSaving ? (
          <Loader2 size={11} className="animate-spin text-[#155BD0] shrink-0" />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Editar celda"
            className="p-0.5 rounded-md text-zinc-400 hover:text-[#155BD0] hover:bg-white dark:hover:bg-zinc-700 transition-colors"
          >
            <Edit2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(DeviceInlineCell);
