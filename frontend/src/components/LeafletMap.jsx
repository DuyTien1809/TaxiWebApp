import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icon mặc định của Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function LeafletMap({ 
  pickup, 
  dropoff, 
  driverLocation,
  showRoute = false,
  onRouteCalculated,
  onMapClick,
  selectMode,
  height = '500px'
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clickLoading, setClickLoading] = useState(false);

  // Custom icons
  const pickupIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:24px;height:24px;background:#22C55E;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const dropoffIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:24px;height:24px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const driverIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:32px;height:32px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><span style="font-size:16px">🚗</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // Reverse geocode - lấy địa chỉ từ tọa độ
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
      }).catch(err => console.log(err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
      }).catch(err => console.log(err));
    }
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = [10.8231, 106.6297]; // HCM City
    
    mapInstanceRef.current = L.map(mapRef.current, {
      center: pickup ? [pickup.lat, pickup.lng] : defaultCenter,
      zoom: 14,
      zoomControl: false
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle map click
  useEffect(() => {
    if (!mapInstanceRef.current || !onMapClick) return;

    const handleClick = async (e) => {
      if (!selectMode) return;
      
      setClickLoading(true);
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onMapClick({ lat, lng, address }, selectMode);
      setClickLoading(false);
    };

    mapInstanceRef.current.on('click', handleClick);
    
    return () => {
      mapInstanceRef.current?.off('click', handleClick);
    };
  }, [onMapClick, selectMode]);

  // Fetch route from OSRM
  const fetchRoute = useCallback(async (start, end) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]),
          distance: route.distance,
          duration: route.duration
        };
      }
      return null;
    } catch (error) {
      console.error('OSRM routing error:', error);
      return null;
    }
  }, []);

  // Lưu callback ref để tránh re-render
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  useEffect(() => {
    onRouteCalculatedRef.current = onRouteCalculated;
  }, [onRouteCalculated]);

  // Update markers and route
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Clear old route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    const bounds = L.latLngBounds([]);

    if (pickup) {
      const marker = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Điểm đón');
      markersRef.current.push(marker);
      bounds.extend([pickup.lat, pickup.lng]);
    }

    if (dropoff) {
      const marker = L.marker([dropoff.lat, dropoff.lng], { icon: dropoffIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Điểm đến');
      markersRef.current.push(marker);
      bounds.extend([dropoff.lat, dropoff.lng]);
    }

    if (driverLocation) {
      const marker = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Tài xế');
      markersRef.current.push(marker);
      bounds.extend([driverLocation.lat, driverLocation.lng]);
    }

    // Draw route - luôn vẽ khi có cả pickup và dropoff
    if (pickup && dropoff) {
      fetchRoute(pickup, dropoff).then(routeData => {
        if (routeData && mapInstanceRef.current) {
          // Clear route cũ nếu có
          if (routeLayerRef.current) {
            routeLayerRef.current.remove();
          }
          
          routeLayerRef.current = L.polyline(routeData.coordinates, {
            color: '#4F46E5',
            weight: 6,
            opacity: 0.8
          }).addTo(mapInstanceRef.current);

          // Gọi callback với thông tin route
          if (onRouteCalculatedRef.current) {
            onRouteCalculatedRef.current({
              distance: routeData.distance,
              duration: routeData.duration,
              distanceText: `${(routeData.distance / 1000).toFixed(1)} km`,
              durationText: `${Math.round(routeData.duration / 60)} phút`
            });
          }

          // Fit bounds theo route
          mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
        }
      });
    } else if (bounds.isValid()) {
      // Fit bounds nếu chưa có route
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup) {
      mapInstanceRef.current.setView([pickup.lat, pickup.lng], 14);
    }
  }, [pickup, dropoff, driverLocation, fetchRoute]);

  // Update cursor based on select mode
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.style.cursor = selectMode ? 'crosshair' : 'grab';
  }, [selectMode]);

  return (
    <div 
      ref={containerRef} 
      className={`relative rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : ''}`}
      style={{ width: '100%', height: isFullscreen ? '100vh' : height }}
    >
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Loading overlay khi đang lấy địa chỉ */}
      {clickLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-[1001]">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-700">Đang lấy địa chỉ...</span>
          </div>
        </div>
      )}

      {/* Select mode indicator */}
      {selectMode && (
        <div className="absolute top-3 left-3 z-[1000] bg-white px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${selectMode === 'pickup' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm font-medium text-gray-700">
              Nhấn vào bản đồ để chọn {selectMode === 'pickup' ? 'điểm đón' : 'điểm đến'}
            </span>
          </div>
        </div>
      )}

      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-[1000] bg-white hover:bg-gray-100 p-2.5 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
        title={isFullscreen ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'}
      >
        {isFullscreen ? (
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* Zoom Controls */}
      <div className="absolute bottom-20 right-3 z-[1000] flex flex-col gap-1">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-all"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-all"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      {(pickup || dropoff || driverLocation) && !selectMode && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-xs">
          {pickup && (
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-gray-700">Điểm đón</span>
            </div>
          )}
          {dropoff && (
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="text-gray-700">Điểm đến</span>
            </div>
          )}
          {driverLocation && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-gray-700">Tài xế</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
