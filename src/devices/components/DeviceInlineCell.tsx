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
  type?: 'text' | 'boolean' | 'number';
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
        className={`px-2 py-0.5 rounded-md text-2xs font-semibold font-mono transition-all flex items-center gap-1 ${
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

  // Modo edición activo
  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[120px]">
        <input
          ref={inputRef}
          type="text"
          value={currentVal}
          onChange={(e) => setCurrentVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleConfirm}
          className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border-2 border-blue-500 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none shadow-sm font-mono"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleConfirm}
          title="Guardar (Enter)"
          className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
        >
          <Check size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCancel}
          title="Cancelar (Esc)"
          className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
      className={`group relative flex items-center justify-between gap-1.5 py-1 px-1.5 rounded-lg cursor-pointer transition-all hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 ${
        isSuccess ? 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : ''
      }`}
      title="Doble clic para editar rápidamente"
    >
      <span className={`truncate text-xs ${displayVal ? 'text-zinc-800 dark:text-zinc-200 font-medium' : 'text-zinc-400 italic font-normal text-2xs'}`}>
        {displayVal || placeholder}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isSaving ? (
          <Loader2 size={12} className="animate-spin text-blue-500 shrink-0" />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Editar celda"
            className="p-0.5 rounded text-zinc-400 hover:text-blue-500"
          >
            <Edit2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(DeviceInlineCell);
