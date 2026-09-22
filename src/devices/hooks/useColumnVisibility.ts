import { useState, useEffect, useMemo, useCallback } from 'react';
import type { AttributeColumnConfig } from '../types';
import {
  PRIORITY_COLUMNS,
  PRIORITY_COLUMN_KEYS,
  SECONDARY_STANDARD_COLUMNS,
  STORAGE_KEY_VISIBLE_COLUMNS,
} from '../constants';

export function useColumnVisibility(todasLasClavesAtributos: string[]) {
  // Inicializar estado de columnas ocultas desde localStorage
  const [columnasOcultas, setColumnasOcultas] = useState<Set<string>>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_VISIBLE_COLUMNS);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch (e) {
      console.error('Error al cargar configuración de columnas de localStorage:', e);
    }

    // Por defecto: Ocultar columnas secundarias y dejar ÚNICAMENTE las prioritarias
    const defaultOcultas = new Set<string>();
    for (const sec of SECONDARY_STANDARD_COLUMNS) {
      defaultOcultas.add(sec.key);
    }
    return defaultOcultas;
  });

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_VISIBLE_COLUMNS,
        JSON.stringify(Array.from(columnasOcultas))
      );
    } catch (e) {
      console.error('Error al guardar configuración de columnas en localStorage:', e);
    }
  }, [columnasOcultas]);

  // Lista consolidada y ordenada de todas las columnas posibles
  const columnasDisponibles = useMemo<AttributeColumnConfig[]>(() => {
    // 1. Columnas Prioritarias
    const prioritarias: AttributeColumnConfig[] = PRIORITY_COLUMNS.map((col) => ({
      key: col.key,
      label: col.label,
      type: col.type,
      attributeKey: col.attributeKey,
      visible: !columnasOcultas.has(col.key),
      isPriority: true,
      description: col.description,
    }));

    // 2. Columnas Estándar Secundarias
    const secundarias: AttributeColumnConfig[] = SECONDARY_STANDARD_COLUMNS.map((col) => ({
      key: col.key,
      label: col.label,
      type: 'standard',
      visible: !columnasOcultas.has(col.key),
      isPriority: false,
      description: col.description,
    }));

    // 3. Atributos dinámicos adicionales (excluyendo los que ya son columnas prioritarias)
    const priorityAttrKeys = new Set(['base', 'distrito', 'placa', 'sector']);
    const atributosDinamicos: AttributeColumnConfig[] = todasLasClavesAtributos
      .filter((k) => !priorityAttrKeys.has(k.toLowerCase()) && !PRIORITY_COLUMN_KEYS.includes(k))
      .map((k) => ({
        key: k,
        label: k.toUpperCase(),
        type: 'attribute',
        attributeKey: k,
        visible: !columnasOcultas.has(k),
        isPriority: false,
        isCustom: true,
        description: `Atributo dinámico "${k}"`,
      }));

    return [...prioritarias, ...secundarias, ...atributosDinamicos];
  }, [todasLasClavesAtributos, columnasOcultas]);

  const columnasVisibles = useMemo(() => {
    return columnasDisponibles.filter((c) => c.visible);
  }, [columnasDisponibles]);

  // Alternar visibilidad de una columna
  const toggleVisibilidadColumna = useCallback((colKey: string) => {
    setColumnasOcultas((prev) => {
      const next = new Set(prev);
      if (next.has(colKey)) {
        next.delete(colKey);
      } else {
        next.add(colKey);
      }
      return next;
    });
  }, []);

  // Marcar todas como visibles
  const marcarTodas = useCallback(() => {
    setColumnasOcultas(new Set());
  }, []);

  // Desmarcar todas (deja al menos la columna 'name' para no quedar con tabla vacía)
  const desmarcarTodas = useCallback(() => {
    const todasLasKeys = columnasDisponibles.map((c) => c.key);
    const next = new Set(todasLasKeys);
    next.delete('name'); // Mantener NOMBRE visible
    setColumnasOcultas(next);
  }, [columnasDisponibles]);

  // Restablecer a columnas prioritarias por defecto
  const restablecerPrioritarias = useCallback(() => {
    const next = new Set<string>();
    // Ocultar secundarias
    for (const sec of SECONDARY_STANDARD_COLUMNS) {
      next.add(sec.key);
    }
    // Ocultar atributos personalizados no prioritarios
    for (const k of todasLasClavesAtributos) {
      if (!['base', 'distrito', 'placa', 'sector'].includes(k.toLowerCase())) {
        next.add(k);
      }
    }
    setColumnasOcultas(next);
  }, [todasLasClavesAtributos]);

  return {
    columnasDisponibles,
    columnasVisibles,
    toggleVisibilidadColumna,
    marcarTodas,
    desmarcarTodas,
    restablecerPrioritarias,
    totalVisibles: columnasVisibles.length,
    totalDisponibles: columnasDisponibles.length,
  };
}
