import React, { useState, useEffect } from 'react';
import { useWeatherStore } from '../../store';
import { locationService, SearchResult } from '../../services/api/locationService';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { addLocation, setCurrentLocation } = useWeatherStore();

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const res = await locationService.searchLocation(query);
      setResults(res);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = async (res: SearchResult) => {
    const loc = locationService.createLocationObject(res.display_name, parseFloat(res.lat), parseFloat(res.lon));
    await addLocation(loc);
    setCurrentLocation(loc);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-md mx-auto z-50">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 shadow-sm transition-shadow"
          placeholder="Search city, state, or ZIP..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-gray-400">Searching...</span>
          </div>
        )}
      </div>
      
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {results.map((r, i) => (
            <li
              key={i}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-50 text-gray-900 group"
              onClick={() => handleSelect(r)}
            >
              <div className="flex items-center">
                <MapPinIcon className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-primary-500 mr-2" />
                <span className="truncate">{r.display_name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
