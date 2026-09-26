/**
 * Constantes para el módulo de Gestión de Dispositivos Traccar.
 */

// Las 15 propiedades oficiales reconocidas por el modelo org.traccar.model.Device en Jackson
export const ALLOWED_TRACCAR_DEVICE_KEYS = new Set<string>([
  'id',
  'attributes',
  'name',
  'uniqueId',
  'status',
  'lastUpdate',
  'positionId',
  'groupId',
  'phone',
  'model',
  'contact',
  'category',
  'disabled',
  'expirationTime',
  'calendarId',
]);

/**
 * Columnas fijas de la tabla de dispositivos: NOMBRE | DNI | CELULAR | GRUPO | BASE | SECTOR.
 * A diferencia de la versión anterior, ya no son configurables por el usuario.
 */
export interface DeviceColumnDef {
  key: string;
  label: string;
  type: 'standard' | 'attribute' | 'group';
  attributeKey?: string;
}

export const DEVICE_TABLE_COLUMNS: DeviceColumnDef[] = [
  { key: 'name', label: 'NOMBRE', type: 'standard' },
  { key: 'uniqueId', label: 'DNI', type: 'standard' },
  { key: 'phone', label: 'CELULAR', type: 'standard' },
  { key: 'groupId', label: 'GRUPO', type: 'group' },
  { key: 'base', label: 'BASE', type: 'attribute', attributeKey: 'base' },
  { key: 'sector', label: 'SECTOR', type: 'attribute', attributeKey: 'sector' },
];
