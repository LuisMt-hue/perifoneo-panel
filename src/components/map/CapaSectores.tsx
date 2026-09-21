import React from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import type { Sector } from '../../types/perifoneo.types';

export interface CapaSectoresProps {
  sectores?: Sector[];
}

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

        const colorBorde = sector.color || '#2563eb';

        return (
          <GeoJSON
            key={sector.id}
            data={geojsonData}
            style={{
              color: colorBorde,
              weight: 2,
              dashArray: '5, 5',
              fillOpacity: 0.15,
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
