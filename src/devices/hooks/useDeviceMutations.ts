import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TraccarDevice } from '../../live/types';
import type { CreateDevicePayload } from '../types';
import {
  crearDispositivoTraccar,
  guardarDispositivoTraccar,
  eliminarDispositivoTraccar,
  actualizarCampoOAtributo,
  propagarAtributoEnLote,
} from '../api';
import { TRACCAR_DEVICES_QUERY_KEY } from '../../shared/hooks/useTraccarCatalogQueries';

/**
 * Mutations CRUD del módulo Devices: en vez de mantener estado local (`setDevices`) y
 * reportar con `alert()`, cada operación actualiza la cache compartida de
 * ['traccarDevices'] en éxito, y expone `.error`/`.isError` para que el componente
 * muestre un banner local.
 */

function useDevicesQueryClient() {
  return useQueryClient();
}

export function useCreateDeviceMutation() {
  const queryClient = useDevicesQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDevicePayload) => crearDispositivoTraccar(payload),
    onSuccess: (nuevo) => {
      queryClient.setQueryData<TraccarDevice[]>(TRACCAR_DEVICES_QUERY_KEY, (old = []) => [nuevo, ...old]);
    },
  });
}

export function useUpdateDeviceMutation() {
  const queryClient = useDevicesQueryClient();
  return useMutation({
    mutationFn: (device: Partial<TraccarDevice> & { id: number }) => guardarDispositivoTraccar(device),
    onSuccess: (actualizado) => {
      queryClient.setQueryData<TraccarDevice[]>(TRACCAR_DEVICES_QUERY_KEY, (old = []) =>
        old.map((d) => (d.id === actualizado.id ? actualizado : d))
      );
    },
  });
}

export interface UpdateFieldParams {
  device: TraccarDevice;
  key: string;
  value: any;
  isAttribute: boolean;
}

export function useUpdateDeviceFieldMutation() {
  const queryClient = useDevicesQueryClient();
  return useMutation({
    mutationFn: ({ device, key, value, isAttribute }: UpdateFieldParams) =>
      actualizarCampoOAtributo(device, key, value, isAttribute),
    onSuccess: (actualizado) => {
      queryClient.setQueryData<TraccarDevice[]>(TRACCAR_DEVICES_QUERY_KEY, (old = []) =>
        old.map((d) => (d.id === actualizado.id ? actualizado : d))
      );
    },
  });
}

export function useDeleteDeviceMutation() {
  const queryClient = useDevicesQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarDispositivoTraccar(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<TraccarDevice[]>(TRACCAR_DEVICES_QUERY_KEY, (old = []) =>
        old.filter((d) => d.id !== id)
      );
    },
  });
}

export interface BulkEditFieldParams {
  targetIds: number[];
  fieldOrKey: string;
  value: any;
  isAttribute: boolean;
  onProgress?: (actual: number, total: number) => void;
}

export function useBulkEditFieldMutation() {
  const queryClient = useDevicesQueryClient();
  return useMutation({
    mutationFn: ({ targetIds, fieldOrKey, value, isAttribute, onProgress }: BulkEditFieldParams) => {
      const devices = queryClient.getQueryData<TraccarDevice[]>(TRACCAR_DEVICES_QUERY_KEY) || [];
      return propagarAtributoEnLote(devices, targetIds, fieldOrKey, value, onProgress, isAttribute);
    },
    onSuccess: ({ actualizados }) => {
      const map = new Map(actualizados.map((a) => [a.id, a]));
      queryClient.setQueryData<TraccarDevice[]>(TRACCAR_DEVICES_QUERY_KEY, (old = []) =>
        old.map((d) => map.get(d.id) ?? d)
      );
    },
  });
}

/**
 * Agrupa todas las mutations en un solo objeto, para componer fácilmente en useDevicesManager.
 */
export function useDeviceMutations() {
  const create = useCreateDeviceMutation();
  const update = useUpdateDeviceMutation();
  const updateField = useUpdateDeviceFieldMutation();
  const remove = useDeleteDeviceMutation();
  const bulkEditField = useBulkEditFieldMutation();

  return { create, update, updateField, remove, bulkEditField };
}
