import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon (webpack/vite asset issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * SafeMap — mounts Leaflet imperatively so AnimatePresence / portals
 * don't cause "removeChild" crashes when the modal unmounts.
 *
 * Props:
 *   lat, lng   — coordinates
 *   zoom       — default 15
 *   height     — CSS string, default '220px'
 *   interactive — if false, disables scroll/drag (default false)
 *   onClick    — optional (lat, lng) => void  called on map click
 */
const SafeMap = ({ lat, lng, zoom = 15, height = '220px', interactive = false, onClick }) => {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center:            [lat, lng],
      zoom,
      scrollWheelZoom:   false,
      dragging:          interactive,
      touchZoom:         interactive,
      doubleClickZoom:   interactive,
      zoomControl:       interactive,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    markerRef.current = L.marker([lat, lng]).addTo(map);

    if (onClick) {
      map.on('click', (e) => onClick(e.latlng.lat, e.latlng.lng));
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current  = null;
      markerRef.current = null;
    };
  }, []); // intentionally empty — mount once, cleanup on unmount

  // Update marker position when lat/lng props change (e.g. AddCustomer picker)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const pos = [lat, lng];
    markerRef.current.setLatLng(pos);
    mapRef.current.setView(pos, mapRef.current.getZoom());
  }, [lat, lng]);

  return <div ref={containerRef} style={{ height, width: '100%' }} />;
};

export default SafeMap;
