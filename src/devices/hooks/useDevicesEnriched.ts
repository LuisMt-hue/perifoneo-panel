import { useMemo } from 'react';
import type { TraccarDevice, TraccarGroup, TraccarPosition } from '../../live/types';
import type { ManagedDevice } from '../types';
import { calcularEstadoDispositivo } from '../../shared/utils/deviceStatus';

/**
 * Merge puro (sin red) de dispositivos + posiciones + grupos en ManagedDevice[],
 * con el estado calculado y el nombre de grupo resuelto desde groupId.
 */
export function useDevicesEnriched(
  devices: TraccarDevice[] | undefined,
  positions: Record<number, TraccarPosition> | undefined,
  groups: TraccarGroup[] | undefined
): ManagedDevice[] {
  return useMemo(() => {
    const nombrePorGrupoId = new Map((groups || []).map((g) => [g.id, g.name]));

    return (devices || []).map((d): ManagedDevice => {
      const pos = positions?.[d.id];
      const { estado } = calcularEstadoDispositivo({
        traccarStatus: d.status,
        lastUpdate: d.lastUpdate,
        positionFixTime: pos?.fixTime,
        speedKnots: pos?.speed,
      });

      return {
        ...d,
        estado,
        grupoNombre: d.groupId != null ? nombrePorGrupoId.get(d.groupId) ?? null : null,
      };
    });
  }, [devices, positions, groups]);
}
