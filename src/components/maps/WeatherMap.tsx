import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useWeatherStore } from '../../store';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function WeatherMap() {
  const { currentLocation } = useWeatherStore();
  
  if (!currentLocation) return null;

  const center: [number, number] = [currentLocation.latitude, currentLocation.longitude];

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 bg-white rounded-3xl shadow p-6 border border-gray-100 overflow-hidden relative z-0">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Regional Map</h3>
      <div className="h-96 w-full rounded-2xl overflow-hidden relative z-0 border border-gray-200">
        <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Add an openweathermap or rainviewer radar tile if available, but omitting due to API constraints in MVP */}
          <Marker position={center}>
            <Popup>
              {currentLocation.name}
            </Popup>
          </Marker>
          <MapUpdater center={center} />
        </MapContainer>
      </div>
    </div>
  );
}
