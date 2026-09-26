import { useMemo, useState } from 'react';
import type { TraccarDevice, TraccarGeofence } from '../../live/types';
import { resolverSectorDispositivo } from '../api';
import { hoy } from '../../shared/utils/formato';

export interface HistorialFiltrosState {
  fechaInicio: string;
  fechaFin: string;
  dispositivoFiltro: string;
  sectorFiltro: string;
  grupoFiltro: string;
  baseFiltro: string;
  soloConActividad: boolean;
}

const ESTADO_INICIAL: HistorialFiltrosState = {
  fechaInicio: hoy(),
  fechaFin: hoy(),
  dispositivoFiltro: '',
  sectorFiltro: '',
  grupoFiltro: '',
  baseFiltro: '',
  soloConActividad: false,
};

/**
 * Estado de filtros del Historial + cálculo de `targetDeviceIds` como pipeline de
 * predicados combinables con AND (dispositivo, sector, grupo y base pueden aplicarse
 * juntos), usado para el push-down hacia /api/reports/summary.
 */
export function useHistorialFiltros(dispositivos: TraccarDevice[], geocercas: TraccarGeofence[]) {
  const [filtros, setFiltrosState] = useState<HistorialFiltrosState>(ESTADO_INICIAL);

  const setFiltros = (parcial: Partial<HistorialFiltrosState>) =>
    setFiltrosState((prev) => ({ ...prev, ...parcial }));

  const targetDeviceIds = useMemo(() => {
    const { dispositivoFiltro, sectorFiltro, grupoFiltro, baseFiltro } = filtros;

    return dispositivos
      .filter((d) => {
        if (dispositivoFiltro && d.id !== Number(dispositivoFiltro)) return false;

        if (sectorFiltro) {
          const { sectorNombre } = resolverSectorDispositivo(d, geocercas);
          if (sectorFiltro === 'SIN_SECTOR') {
            if (sectorNombre !== null) return false;
          } else if (sectorNombre?.toLowerCase() !== sectorFiltro.toLowerCase()) {
            return false;
          }
        }

        if (grupoFiltro && String(d.groupId ?? '') !== grupoFiltro) return false;

        if (baseFiltro && String(d.attributes?.base || '').trim() !== baseFiltro) return false;

        return true;
      })
      .map((d) => d.id);
  }, [dispositivos, geocercas, filtros]);

  return { filtros, setFiltros, targetDeviceIds };
}
