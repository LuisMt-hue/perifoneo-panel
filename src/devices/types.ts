import type { TraccarDevice } from '../live/types';

export type { TraccarDevice };

export interface ManagedDevice extends TraccarDevice {
  // Propiedad en memoria calculada exclusivamente en el frontend (NUNCA enviada a Traccar)
  isOnline?: boolean;
}

export interface DeviceFilterState {
  search: string;
  status: 'all' | 'online' | 'offline' | 'disabled';
  category: string | null;
  missingAttribute: string | null;
}

export interface AttributeColumnConfig {
  key: string;
  label: string;
  type: 'standard' | 'attribute';
  visible: boolean;
  isPriority?: boolean;
  isCustom?: boolean;
  attributeKey?: string;
  description?: string;
}

export interface CreateDevicePayload {
  name: string;
  uniqueId: string;
  phone?: string;
  contact?: string;
  category?: string;
  disabled?: boolean;
  base?: string;
  distrito?: string;
  placa?: string;
  sector?: string;
  attributes?: Record<string, any>;
}

export interface BulkUpdateOptions {
  attributeKey: string;
  attributeValue: any;
  targetDeviceIds: number[];
}

export interface AddAttributePayload {
  key: string;
  defaultValue?: any;
  target: 'all' | 'selected';
  selectedIds?: number[];
}

export interface AttributeStats {
  key: string;
  deviceCount: number;
  totalDevices: number;
  isPriority: boolean;
}
