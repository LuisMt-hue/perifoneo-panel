import { useCallback, useState } from 'react';
import type { ManagedDevice } from '../types';

export interface UseDevicesSelectionReturn {
  selectedIds: Set<number>;
  toggleSeleccion: (id: number) => void;
  seleccionarTodosVisibles: () => void;
  deseleccionarTodo: () => void;
}

/**
 * Selección de filas de la tabla (para edición en masa), independiente de la fuente de datos.
 */
export function useDevicesSelection(visibleDevices: ManagedDevice[]): UseDevicesSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSeleccion = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const seleccionarTodosVisibles = useCallback(() => {
    setSelectedIds((prev) => {
      const todosEstan = visibleDevices.every((d) => prev.has(d.id));
      const next = new Set(prev);
      if (todosEstan) {
        for (const d of visibleDevices) next.delete(d.id);
      } else {
        for (const d of visibleDevices) next.add(d.id);
      }
      return next;
    });
  }, [visibleDevices]);

  const deseleccionarTodo = useCallback(() => setSelectedIds(new Set()), []);

  return { selectedIds, toggleSeleccion, seleccionarTodosVisibles, deseleccionarTodo };
}
