import { GeoJSON, Popup } from 'react-leaflet';

export default function CapaSectores({ sectores = [] }) {
  if (!sectores || sectores.length === 0) return null;

  return (
    <>
      {sectores.map((sector) => {
        if (!sector.geojson) return null;
        let geojsonData;
        try {
          geojsonData = typeof sector.geojson === 'string' ? JSON.parse(sector.geojson) : sector.geojson;
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
