/**
 * Constantes para el módulo de Gestión de Dispositivos y Atributos Traccar.
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
 * Definición de las 7 Columnas Prioritarias solicitadas:
 * NOMBRE | DNI | BASE | DISTRITO | PLACA DEL CARRO | CELULAR | SECTOR
 */
export interface PriorityColumnDef {
  key: string;
  label: string;
  type: 'standard' | 'attribute';
  attributeKey?: string;
  description: string;
}

export const PRIORITY_COLUMNS: PriorityColumnDef[] = [
  {
    key: 'name',
    label: 'NOMBRE',
    type: 'standard',
    description: 'Nombre o código de la unidad',
  },
  {
    key: 'uniqueId',
    label: 'DNI',
    type: 'standard',
    description: 'DNI / Identificador único de rastreo',
  },
  {
    key: 'base',
    label: 'BASE',
    type: 'attribute',
    attributeKey: 'base',
    description: 'Base de operaciones asignada',
  },
  {
    key: 'distrito',
    label: 'DISTRITO',
    type: 'attribute',
    attributeKey: 'distrito',
    description: 'Distrito asignado para el perifoneo',
  },
  {
    key: 'placa',
    label: 'PLACA DEL CARRO',
    type: 'attribute',
    attributeKey: 'placa',
    description: 'Placa de la unidad móvil o vehículo',
  },
  {
    key: 'phone',
    label: 'CELULAR',
    type: 'standard',
    description: 'Número de teléfono / celular de contacto',
  },
  {
    key: 'sector',
    label: 'SECTOR',
    type: 'attribute',
    attributeKey: 'sector',
    description: 'Sector o cuadrante específico',
  },
];

export const PRIORITY_COLUMN_KEYS = PRIORITY_COLUMNS.map((col) => col.key);

// Columnas estándar secundarias de Traccar (visibles opcionalmente mediante modal)
export const SECONDARY_STANDARD_COLUMNS: Array<{ key: string; label: string; description: string }> = [
  { key: 'status', label: 'ESTADO', description: 'En línea / Desconectado' },
  { key: 'category', label: 'CATEGORÍA', description: 'Tipo de ícono / vehículo en Traccar' },
  { key: 'contact', label: 'CONTACTO / CHOFER', description: 'Nombre del chofer o responsable' },
  { key: 'model', label: 'MODELO', description: 'Modelo del equipo GPS / teléfono' },
  { key: 'disabled', label: 'HABILITADO', description: 'Estado de habilitación en servidor' },
  { key: 'lastUpdate', label: 'ÚLTIMA ACT.', description: 'Última fecha y hora de reporte' },
];

export const STORAGE_KEY_VISIBLE_COLUMNS = 'perifoneo_devices_visible_columns';
