import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RefreshCw, MapPin, Zap, Navigation, History } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const issIcon = L.divIcon({
  html: '<div style="font-size:24px;display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:white;border-radius:50%;border:2px solid #ff4d4d;box-shadow:0 2px 6px rgba(0,0,0,.2)">🛰️</div>',
  className: 'custom-iss-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function RecenterMap({ position }) {
  const map = useMap();
  React.useEffect(() => {
    if (position) map.panTo([position.lat, position.lng]);
  }, [position, map]);
  return null;
}

export default function ISSTracker({ issData }) {
  const { positions, currentPos, astros, isAutoRefresh, setIsAutoRefresh, isLoading, nearestPlace, refreshNow } = issData;
  const polylinePositions = positions.slice(-15).map(p => [p.lat, p.lng]);

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">ISS Live Tracking</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshNow}
            className="px-4 py-1.5 bg-white dark:bg-navy-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh Now
          </button>
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className="px-4 py-1.5 bg-white dark:bg-navy-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-all shadow-sm"
          >
            Auto-Refresh: {isAutoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <span className="accent-text flex items-center gap-1.5 mb-2"><MapPin size={10} /> Latitude / Longitude</span>
          <p className="text-base font-bold text-gray-800 dark:text-white">
            {currentPos ? `${currentPos.lat.toFixed(3)}, ${currentPos.lng.toFixed(3)}` : '---'}
          </p>
        </div>
        <div className="stat-card">
          <span className="accent-text flex items-center gap-1.5 mb-2"><Zap size={10} /> Speed</span>
          <p className="text-base font-bold text-gray-800 dark:text-white">
            {currentPos && currentPos.speed ? `${currentPos.speed.toFixed(2)} km/h` : 'Calculating...'}
          </p>
        </div>
        <div className="stat-card">
          <span className="accent-text flex items-center gap-1.5 mb-2"><Navigation size={10} /> Nearest Place</span>
          <p className="text-base font-bold text-gray-800 dark:text-white truncate">{nearestPlace}</p>
        </div>
        <div className="stat-card">
          <span className="accent-text flex items-center gap-1.5 mb-2"><History size={10} /> Tracked Positions</span>
          <p className="text-base font-bold text-gray-800 dark:text-white">{positions.length}</p>
        </div>
      </div>

      <div className="relative h-[400px] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 mb-6 shadow-inner">
        {currentPos ? (
          <MapContainer center={[currentPos.lat, currentPos.lng]} zoom={3} className="h-full w-full" zoomControl={true}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            <Marker position={[currentPos.lat, currentPos.lng]} icon={issIcon}>
              <Popup>
                <b>ISS Location</b><br />
                Lat: {currentPos.lat.toFixed(4)}<br />
                Lng: {currentPos.lng.toFixed(4)}<br />
                Speed: {currentPos.speed.toFixed(2)} km/h
              </Popup>
            </Marker>
            <Polyline positions={polylinePositions} color="#ff4d4d" weight={3} opacity={0.8} />
            <RecenterMap position={currentPos} />
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-navy-800">
            <RefreshCw className="animate-spin text-gray-400" size={32} />
          </div>
        )}
      </div>

    </div>
  );
}
