import React from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import type { Sector } from '../../types/perifoneo.types';

export interface CapaSectoresProps {
  sectores?: Sector[];
}

/**
 * Constantes de estilo cartográfico para polígonos de sectores
 */
export const DEFAULT_SECTOR_BORDER_COLOR = '#2563eb';
export const SECTOR_BORDER_WEIGHT = 2;
export const SECTOR_DASH_ARRAY = '5, 5';
export const SECTOR_FILL_OPACITY = 0.15;

/**
 * Capa Cartográfica de Polígonos de Sectores (`CapaSectores`).
 *
 * Dibuja las geocercas poligonales de los sectores sobre el mapa Leaflet,
 * aplicando el color característico de cada zona con borde segmentado y relleno translúcido.
 */
export const CapaSectores: React.FC<CapaSectoresProps> = ({ sectores = [] }) => {
  const lista = Array.isArray(sectores) ? sectores : [];
  if (!lista.length) return null;

  return (
    <>
      {lista.map((sector) => {
        const raw = sector.geojson ?? sector.sector_geojson ?? sector.geometry ?? sector.geom;
        if (!raw) return null;

        let geojsonData: GeoJsonObject;
        try {
          geojsonData =
            typeof raw === 'string'
              ? (JSON.parse(raw) as GeoJsonObject)
              : (raw as GeoJsonObject);
        } catch (e) {
          console.error('Error al procesar GeoJSON del sector:', sector.id, e);
          return null;
        }

        const colorBorde = sector.color || DEFAULT_SECTOR_BORDER_COLOR;

        return (
          <GeoJSON
            key={sector.id}
            data={geojsonData}
            style={{
              color: colorBorde,
              weight: SECTOR_BORDER_WEIGHT,
              dashArray: SECTOR_DASH_ARRAY,
              fillOpacity: SECTOR_FILL_OPACITY,
            }}
          >
            <Popup>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                <span>Sector: {sector.nombre}</span>
              </div>
            </Popup>
          </GeoJSON>
        );
      })}
    </>
  );
};

export default CapaSectores;
