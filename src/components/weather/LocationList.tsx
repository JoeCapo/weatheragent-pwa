import React, { useState } from 'react';
import { useWeatherStore } from '../../store';
import { MapPinIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export function LocationList() {
  const { locations, currentLocation, setCurrentLocation, removeLocation, addLocation } = useWeatherStore();
  const [isOpen, setIsOpen] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent, loc: any) => {
    e.stopPropagation();
    const updated = { ...loc, isFavorite: !loc.isFavorite };
    await addLocation(updated);
  };

  const handleSelect = (loc: any) => {
    setCurrentLocation(loc);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm font-medium text-gray-700 hover:text-primary-600 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm transition"
      >
        <MapPinIcon className="h-5 w-5 mr-2 text-primary-500" />
        Saved Locations ({locations.length})
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 overflow-hidden transform origin-top-right transition-all">
            <div className="p-3 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 text-sm">
              Your Locations
            </div>
            {locations.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">No locations saved yet.</div>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {locations.map((loc) => (
                  <li 
                    key={loc.id} 
                    className={`flex items-center justify-between p-3 hover:bg-primary-50 cursor-pointer border-l-4 transition-colors ${currentLocation?.id === loc.id ? 'border-primary-500 bg-primary-50/50' : 'border-transparent'}`}
                    onClick={() => handleSelect(loc)}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{loc.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button onClick={(e) => toggleFavorite(e, loc)} className="p-1 hover:bg-white rounded-full transition">
                        {loc.isFavorite 
                          ? <StarIconSolid className="h-5 w-5 text-yellow-400" /> 
                          : <StarIcon className="h-5 w-5 text-gray-400 hover:text-yellow-400" />
                        }
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); removeLocation(loc.id); }} className="p-1 hover:bg-white rounded-full transition group">
                        <TrashIcon className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
