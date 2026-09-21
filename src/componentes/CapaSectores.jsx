import { GeoJSON, Popup } from 'react-leaflet';

export default function CapaSectores({ sectores = [] }) {
  const lista = Array.isArray(sectores) ? sectores : [];
  if (!lista.length) return null;

  return (
    <>
      {lista.map((sector) => {
        const raw = sector.geojson ?? sector.sector_geojson ?? sector.geometry ?? sector.geom;
        if (!raw) return null;
        let geojsonData;
        try {
          geojsonData = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
          console.error("Error parsing GeoJSON for sector", sector.id, e);
          return null;
        }
        
        return (
          <GeoJSON 
            key={sector.id} 
            data={geojsonData} 
            style={{
              color: sector.color || '#3388ff',
              weight: 2,
              dashArray: '5, 5',
              fillOpacity: 0.15
            }}
          >
            <Popup>{sector.nombre}</Popup>
          </GeoJSON>
        );
      })}
    </>
  );
}
