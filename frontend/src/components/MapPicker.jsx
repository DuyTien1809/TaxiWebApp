import { useEffect, useRef, useState } from 'react';

export default function MapPicker({ onSelect, placeholder, initialValue }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [value, setValue] = useState(initialValue?.address || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Kiểm tra Google Maps đã load chưa
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initAutocomplete();
        setIsLoaded(true);
      } else {
        // Thử lại sau 500ms
        setTimeout(checkGoogleMaps, 500);
      }
    };

    const initAutocomplete = () => {
      if (!inputRef.current || autocompleteRef.current) return;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'vn' },
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['geocode', 'establishment']
      });

      // Style cho dropdown gợi ý
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer) {
        pacContainer.style.zIndex = '9999';
        pacContainer.style.borderRadius = '12px';
        pacContainer.style.marginTop = '4px';
        pacContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
      }

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry) {
          const location = {
            address: place.formatted_address || place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          setValue(location.address);
          onSelect(location);
        }
      });
    };

    checkGoogleMaps();

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onSelect]);

  return (
    <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full pl-12 pr-10 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
      />
      {!isLoaded && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      )}
      {value && isLoaded && (
        <button
          type="button"
          onClick={() => { setValue(''); onSelect(null); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
