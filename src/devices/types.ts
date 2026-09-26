import type { TraccarDevice } from '../live/types';
import type { EstadoDispositivo } from '../shared/utils/deviceStatus';

export type { TraccarDevice };

export interface ManagedDevice extends TraccarDevice {
  estado: EstadoDispositivo;
  grupoNombre: string | null;
}

export interface DeviceFilterState {
  search: string;
  estadoFiltro: 'TODOS' | 'ACTIVO' | 'DETENIDO' | 'DESCONECTADO';
  soloDeshabilitados: boolean;
}

export interface CreateDevicePayload {
  name: string;
  uniqueId: string;
  phone?: string;
  contact?: string;
  category?: string;
  disabled?: boolean;
  base?: string;
  sector?: string;
  groupId?: number;
  attributes?: Record<string, any>;
}
