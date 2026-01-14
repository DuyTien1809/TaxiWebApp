import { useState, useRef, useEffect } from 'react';

export default function LocationPicker({ onSelect, placeholder, initialValue, value: externalValue }) {
  const [value, setValue] = useState(initialValue?.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Sync với external value (khi chọn từ bản đồ)
  useEffect(() => {
    if (externalValue?.address) {
      setValue(externalValue.address);
    } else if (externalValue === null) {
      setValue('');
    }
  }, [externalValue]);

  // Search using Nominatim (OpenStreetMap)
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      const data = await response.json();
      setSuggestions(data.map(item => ({
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      })));
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocation(newValue), 300);
  };

  const handleSelect = (location) => {
    setValue(location.address);
    setSuggestions([]);
    onSelect(location);
  };

  const handleClear = () => {
    setValue('');
    setSuggestions([]);
    onSelect(null);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setTimeout(() => setSuggestions([]), 200);
    };
    if (isFocused) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isFocused]);

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
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full pl-12 pr-10 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
      />

      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {value && !loading && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[9999] max-h-60 overflow-y-auto">
          {suggestions.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0"
            >
              <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="text-sm text-gray-700 line-clamp-2">{item.address}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
