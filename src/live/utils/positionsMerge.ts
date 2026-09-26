import type { TraccarPosition } from '../types';

/**
 * Fusiona posiciones nuevas en el mapa existente, descartando cualquier posición
 * cuyo `fixTime` sea más antiguo que la ya almacenada para ese dispositivo.
 *
 * Necesario porque el WebSocket y el polling de respaldo pueden entregar datos
 * fuera de orden (ej. una respuesta de polling que tardó en llegar puede resolver
 * después de un mensaje de socket más reciente) y sin esto una posición vieja
 * podía pisar a una más nueva.
 */
export function mergePositionsByFixTime(
  prev: Record<number, TraccarPosition>,
  incoming: TraccarPosition[]
): Record<number, TraccarPosition> {
  let changed = false;
  const next = { ...prev };

  for (const p of incoming) {
    const actual = next[p.deviceId];
    if (!actual || new Date(p.fixTime).getTime() >= new Date(actual.fixTime).getTime()) {
      next[p.deviceId] = p;
      changed = true;
    }
  }

  return changed ? next : prev;
}
