import type { TraccarDevice } from '../live/types';

export type { TraccarDevice };

export interface ManagedDevice extends TraccarDevice {
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
  isCustom?: boolean;
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
