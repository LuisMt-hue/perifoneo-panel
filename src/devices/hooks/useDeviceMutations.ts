import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TraccarDevice, TraccarGroup } from '../../live/types';
import type { CreateDevicePayload } from '../types';
import {
  crearDispositivoTraccar,
  guardarDispositivoTraccar,
  eliminarDispositivoTraccar,
  actualizarCampoOAtributo,
  propagarAtributoEnLote,
} from '../api';
import {
  crearGrupoTraccar,
  renombrarGrupoTraccar,
  eliminarGrupoTraccar,
} from '../../shared/services/traccarCatalog';
import {
  TRACCAR_DEVICES_QUERY_KEY,
  TRACCAR_GROUPS_QUERY_KEY,
} from '../../shared/hooks/useTraccarCatalogQueries';

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
 * CRUD de "Base": no es una entidad nativa de Traccar, así que renombrar/eliminar
 * opera en lote sobre todos los dispositivos que actualmente tengan ese valor
 * (decisión ya tomada: la lista de bases se deriva solo de los dispositivos existentes,
 * no hay una lista independiente — "crear" una base nueva ocurre al asignarla a un
 * dispositivo desde el combobox, no desde este modal de gestión).
 */
export interface RenameBaseParams {
  valorActual: string;
  nuevoValor: string; // '' para eliminar el atributo en todos los dispositivos que lo tenían
  onProgress?: (actual: number, total: number) => void;
}

export function useRenameBaseMutation() {
  const queryClient = useDevicesQueryClient();
  return useMutation({
    mutationFn: ({ valorActual, nuevoValor, onProgress }: RenameBaseParams) => {
      const devices = queryClient.getQueryData<TraccarDevice[]>(TRACCAR_DEVICES_QUERY_KEY) || [];
      const targetIds = devices
        .filter((d) => String(d.attributes?.base || '').trim() === valorActual)
        .map((d) => d.id);
      return propagarAtributoEnLote(devices, targetIds, 'base', nuevoValor || null, onProgress, true);
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
 * CRUD del grupo nativo de Traccar. Crear/renombrar/eliminar afecta la entidad real
 * en Traccar (no un atributo), por lo que solo se actualiza la cache de ['traccarGroups'];
 * los dispositivos que quedan sin grupo tras un delete se resuelven al refetch de devices.
 */
export function useCreateGroupMutation() {
  const queryClient = useDevicesQueryClient();
  return useMutation({
    mutationFn: (name: string) => crearGrupoTraccar(name),
    onSuccess: (nuevo) => {
      queryClient.setQueryData<TraccarGroup[]>(TRACCAR_GROUPS_QUERY_KEY, (old = []) => [...old, nuevo]);
    },
  });
}

export function useRenameGroupMutation() {
  const queryClient = useDevicesQueryClient();
  return useMutation({
    mutationFn: ({ grupo, nuevoNombre }: { grupo: TraccarGroup; nuevoNombre: string }) =>
      renombrarGrupoTraccar(grupo, nuevoNombre),
    onSuccess: (actualizado) => {
      queryClient.setQueryData<TraccarGroup[]>(TRACCAR_GROUPS_QUERY_KEY, (old = []) =>
        old.map((g) => (g.id === actualizado.id ? actualizado : g))
      );
    },
  });
}

export function useDeleteGroupMutation() {
  const queryClient = useDevicesQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarGrupoTraccar(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<TraccarGroup[]>(TRACCAR_GROUPS_QUERY_KEY, (old = []) =>
        old.filter((g) => g.id !== id)
      );
      // Los dispositivos que tenían este grupo quedan con un groupId huérfano hasta
      // el próximo fetch; se invalida para que se reflejen como "Sin grupo".
      queryClient.invalidateQueries({ queryKey: TRACCAR_DEVICES_QUERY_KEY });
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
  const renameBase = useRenameBaseMutation();
  const createGroup = useCreateGroupMutation();
  const renameGroup = useRenameGroupMutation();
  const deleteGroup = useDeleteGroupMutation();

  return {
    create,
    update,
    updateField,
    remove,
    bulkEditField,
    renameBase,
    createGroup,
    renameGroup,
    deleteGroup,
  };
}
