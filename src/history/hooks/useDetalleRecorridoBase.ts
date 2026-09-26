import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTraccarDevicesQuery, useTraccarGeofencesQuery } from '../../shared/hooks/useTraccarCatalogQueries';
import { obtenerTripsTraccar, resolverSectorDispositivo } from '../api';
import { parseTraccarGeofence } from '../../live/utils/geofenceParser';
import type { Sector } from '../../shared/types/perifoneo.types';

export const DEFAULT_SECTOR_COLOR = '#155BD0';

/**
 * Catálogos + info de sector + viajes (trips) del rango completo para el detalle de un
 * recorrido. Ya NO trae stops/geofence-intervals (solo alimentaban el panel de auditoría
 * eliminado) ni la ruta punto-a-punto del rango (eso queda lazy en useViajeSeleccionado).
 */
export function useDetalleRecorridoBase(deviceId: number, desde: string, hasta: string) {
  const devicesQuery = useTraccarDevicesQuery();
  const geofencesQuery = useTraccarGeofencesQuery();

  const dispositivos = devicesQuery.data || [];
  const geocercas = geofencesQuery.data || [];

  const dispositivo = useMemo(
    () => dispositivos.find((d) => d.id === deviceId),
    [dispositivos, deviceId]
  );

  const sectorInfo = useMemo(() => {
    if (!dispositivo) return { sectorNombre: null, geofenceId: null };
    return resolverSectorDispositivo(dispositivo, geocercas);
  }, [dispositivo, geocercas]);

  const sectoresFondo: Sector[] = useMemo(() => {
    if (!sectorInfo.geofenceId) return [];
    const g = geocercas.find((geo) => geo.id === sectorInfo.geofenceId);
    if (!g) return [];
    const feat = parseTraccarGeofence(g);
    if (!feat) return [];

    return [
      {
        id: g.id,
        nombre: g.name,
        geojson: feat.geometry,
        color: g.attributes?.color || DEFAULT_SECTOR_COLOR,
      },
    ];
  }, [sectorInfo, geocercas]);

  const fromISO = useMemo(() => new Date(`${desde}T00:00:00-05:00`).toISOString(), [desde]);
  const toISO = useMemo(() => new Date(`${hasta}T23:59:59.999-05:00`).toISOString(), [hasta]);

  const tripsQuery = useQuery({
    queryKey: ['traccarDeviceTrips', deviceId, desde, hasta],
    enabled: Boolean(deviceId),
    queryFn: () => obtenerTripsTraccar({ deviceIds: [deviceId], from: fromISO, to: toISO }),
  });

  const trips = useMemo(() => {
    return [...(tripsQuery.data || [])].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [tripsQuery.data]);

  return {
    dispositivo,
    sectorInfo,
    sectoresFondo,
    trips,
    cargandoTrips: tripsQuery.isLoading,
    cargandoCatalogos: devicesQuery.isLoading || geofencesQuery.isLoading,
  };
}
