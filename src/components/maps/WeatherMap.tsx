import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useWeatherStore } from '../../store';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import L from 'leaflet';

// Define extended Leaflet default icon to fix TS any and missing URLs
const DefaultIcon = L.Icon.Default as any;
delete DefaultIcon.prototype._getIconUrl;

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

interface RainViewerFrame {
  path: string;
  time: number;
}

export function WeatherMap() {
  const { currentLocation } = useWeatherStore();
  const [frames, setFrames] = useState<RainViewerFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [opacity, setOpacity] = useState(0.6);

  useEffect(() => {
    // Fetch RainViewer past/forecast radar frames
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        // use past and forecast frames
        const allFrames = [...data.radar.past, ...data.radar.nowcast];
        setFrames(allFrames);
        setCurrentFrameIndex(data.radar.past.length - 1); // Start at current time
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let interval: number;
    if (isPlaying && frames.length > 0) {
      interval = window.setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      }, 500); // 500ms per frame
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  const currentFrame = frames[currentFrameIndex];
  // Rainviewer requires tile dimensions to be 256 for standard map libraries
  // The correct URL path looks like: https://tilecache.rainviewer.com{path}/256/{z}/{x}/{y}/2/1_1.png
  // However, zoom level 'z' is only supported up to ~11 or 12 for some areas.
  // Standard format per Rainviewer's current docs: https://tilecache.rainviewer.com{path}/{size}/{z}/{x}/{y}/{color}/{smooth}_{snow}.png
  // Using 256 for size, color scale 2 (default), smooth 1, snow 1.
  const radarUrl = currentFrame 
    ? `https://tilecache.rainviewer.com${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png` 
    : '';

  const formatTime = (unixTime: number) => {
    return new Date(unixTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentLocation) return null;
  const center: [number, number] = [currentLocation.latitude, currentLocation.longitude];

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 bg-white rounded-3xl shadow p-6 border border-gray-100 overflow-hidden relative z-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          Interactive Radar
        </h3>
        
        {frames.length > 0 && (
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600 w-20 text-right">
              {formatTime(currentFrame?.time || 0)}
            </span>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-primary-100 text-primary-600 rounded-full hover:bg-primary-200 transition"
              aria-label={isPlaying ? "Pause Radar" : "Play Radar"}
            >
              {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Opacity</span>
              <input 
                type="range" 
                min="0" max="1" step="0.1" 
                value={opacity} 
                onChange={e => setOpacity(parseFloat(e.target.value))}
                className="w-20 accent-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="h-96 w-full rounded-2xl overflow-hidden relative z-0 border border-gray-200">
        <MapContainer center={center} zoom={8} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {radarUrl && (
            <TileLayer
              key={radarUrl} // Force re-render on url change for smooth animation
              url={radarUrl}
              opacity={opacity}
              zIndex={10}
              maxNativeZoom={7} // Rainviewer free tier only goes up to zoom level 7
              maxZoom={18}      // Scale up the native 7 tiles for higher zooms
            />
          )}
          <Marker position={center}>
            <Popup>{currentLocation.name}</Popup>
          </Marker>
          <MapUpdater center={center} />
        </MapContainer>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center space-x-1">
          <div className="w-full flex space-x-1">
            {frames.map((f, i) => (
              <div 
                key={i} 
                className={`h-1.5 w-1.5 rounded-full ${i === currentFrameIndex ? 'bg-primary-500' : (i < frames.length / 2 ? 'bg-gray-300' : 'bg-blue-200')}`} 
                title={formatTime(f.time)}
              />
            ))}
          </div>
        </div>
        <span>Radar provided by RainViewer</span>
      </div>
    </div>
  );
}
