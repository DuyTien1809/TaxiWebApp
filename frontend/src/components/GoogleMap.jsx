import { useEffect, useRef, useState, useCallback } from 'react';

export default function GoogleMap({ 
  pickup, 
  dropoff, 
  driverLocation,
  showRoute = false,
  onRouteCalculated,
  height = '500px'
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.log(err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => console.log(err));
    }
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Resize map khi fullscreen thay đổi
      if (mapInstanceRef.current) {
        setTimeout(() => {
          window.google?.maps?.event?.trigger(mapInstanceRef.current, 'resize');
        }, 100);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      if (!window.google?.maps) {
        setTimeout(initMap, 500);
        return;
      }

      try {
        const defaultCenter = { lat: 10.8231, lng: 106.6297 }; // HCM City
        
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: pickup || defaultCenter,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          scaleControl: true,
          panControl: false,
          gestureHandling: 'greedy'
        });

        directionsServiceRef.current = new window.google.maps.DirectionsService();
        
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#4F46E5',
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });
        
        directionsRendererRef.current.setMap(mapInstanceRef.current);
        setMapReady(true);
        setError(false);
      } catch (err) {
        console.error('Map init error:', err);
        setError(true);
      }
    };

    initMap();

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      markersRef.current.forEach(m => m.setMap(null));
    };
  }, []);

  // Vẽ route và markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Clear old directions
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }

    // Nếu có cả pickup và dropoff, vẽ đường đi
    if (showRoute && pickup && dropoff && directionsServiceRef.current) {
      directionsServiceRef.current.route({
        origin: { lat: pickup.lat, lng: pickup.lng },
        destination: { lat: dropoff.lat, lng: dropoff.lng },
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK' && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
          
          const route = result.routes[0].legs[0];
          if (onRouteCalculated) {
            onRouteCalculated({
              distance: route.distance.value,
              duration: route.duration.value,
              distanceText: route.distance.text,
              durationText: route.duration.text
            });
          }

          // Thêm driver marker nếu có
          if (driverLocation) {
            const driverMarker = new window.google.maps.Marker({
              position: { lat: driverLocation.lat, lng: driverLocation.lng },
              map: mapInstanceRef.current,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3
              },
              title: 'Tài xế',
              zIndex: 200
            });
            markersRef.current.push(driverMarker);
          }
        } else {
          // Fallback: hiển thị markers nếu không vẽ được route
          addMarkers();
        }
      });
    } else {
      // Chỉ hiển thị markers
      addMarkers();
    }

    function addMarkers() {
      if (pickup) {
        const pickupMarker = new window.google.maps.Marker({
          position: { lat: pickup.lat, lng: pickup.lng },
          map: mapInstanceRef.current,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new window.google.maps.Size(40, 40)
          },
          title: 'Điểm đón'
        });
        markersRef.current.push(pickupMarker);
        mapInstanceRef.current.setCenter({ lat: pickup.lat, lng: pickup.lng });
      }

      if (dropoff) {
        const dropoffMarker = new window.google.maps.Marker({
          position: { lat: dropoff.lat, lng: dropoff.lng },
          map: mapInstanceRef.current,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(40, 40)
          },
          title: 'Điểm đến'
        });
        markersRef.current.push(dropoffMarker);
      }

      if (driverLocation) {
        const driverMarker = new window.google.maps.Marker({
          position: { lat: driverLocation.lat, lng: driverLocation.lng },
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          },
          title: 'Tài xế'
        });
        markersRef.current.push(driverMarker);
      }

      // Fit bounds
      if (pickup && dropoff) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: pickup.lat, lng: pickup.lng });
        bounds.extend({ lat: dropoff.lat, lng: dropoff.lng });
        if (driverLocation) {
          bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });
        }
        mapInstanceRef.current.fitBounds(bounds, 60);
      }
    }
  }, [pickup, dropoff, driverLocation, showRoute, mapReady, onRouteCalculated]);

  if (error) {
    return (
      <div style={{ width: '100%', height }} className="rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <span className="text-4xl block mb-2">🗺️</span>
          <p>Không thể tải bản đồ</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : ''}`}
      style={{ width: '100%', height: isFullscreen ? '100vh' : height }}
    >
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Nút Fullscreen */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-10 bg-white hover:bg-gray-100 p-2.5 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
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

      {/* Nút Zoom */}
      <div className="absolute bottom-20 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => mapInstanceRef.current?.setZoom((mapInstanceRef.current?.getZoom() || 14) + 1)}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-all"
          title="Phóng to"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
        <button
          onClick={() => mapInstanceRef.current?.setZoom((mapInstanceRef.current?.getZoom() || 14) - 1)}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-all"
          title="Thu nhỏ"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      {(pickup || dropoff || driverLocation) && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-xs">
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
