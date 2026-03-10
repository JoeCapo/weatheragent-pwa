import { dbService } from '../storage/indexedDBService';
import { Location } from '../../types';

// Wait, we don't have uuid installed. I'll just use crypto.randomUUID()

const NOMINATIM_BASE = import.meta.env.VITE_NOMINATIM_API_BASE || 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'WeatherAgent/1.0';

export interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export class LocationService {
  async getCurrentPosition(): Promise<{ lat: number, lon: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
          },
          (error) => {
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    });
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    const cacheKey = `revgeo_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = await dbService.getCached<string>(cacheKey);
    if (cached) return cached;

    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json`;
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      const data = await response.json();
      
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown Location';
      const state = data.address?.state || '';
      const name = state ? `${city}, ${state}` : city;
      
      await dbService.setCache(cacheKey, name, 30 * 24 * 60 * 60); // Cache for 30 days
      return name;
    } catch (error) {
      console.error('Reverse geocoding failed', error);
      return 'Current Location';
    }
  }

  async searchLocation(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    
    // Debounce should be handled by the component, but we can cache the exact query string
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = await dbService.getCached<SearchResult[]>(cacheKey);
    if (cached) return cached;

    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&countrycodes=us&addressdetails=1&limit=5`;
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      const data = await response.json();
      await dbService.setCache(cacheKey, data, 24 * 60 * 60); // Cache search for 24h
      return data;
    } catch (error) {
      console.error('Search failed', error);
      return [];
    }
  }

  createLocationObject(name: string, lat: number, lon: number): Location {
    return {
      id: crypto.randomUUID(),
      name,
      latitude: lat,
      longitude: lon,
      isFavorite: false,
      lastUpdated: new Date()
    };
  }
}

export const locationService = new LocationService();
