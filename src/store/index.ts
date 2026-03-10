import { create } from 'zustand';
import { AppState, Location, Forecast, WeatherAlert, UserPreferences, AlertRule } from '../types';
import { dbService } from '../services/storage/indexedDBService';
import { weatherService } from '../services/api/weatherService';
import { locationService } from '../services/api/locationService';

export interface WeatherStore extends AppState {
  initApp: () => Promise<void>;
  setCurrentLocation: (location: Location) => void;
  addLocation: (location: Location) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  refreshWeather: () => Promise<void>;
  detectLocation: () => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  temperatureUnit: 'F',
  windSpeedUnit: 'mph',
  timeFormat: '12h',
  theme: 'auto',
  notificationsEnabled: false,
  alertPreferences: [],
  favoriteLocations: []
};

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  currentLocation: null,
  locations: [],
  forecasts: {},
  alerts: [],
  preferences: defaultPreferences,
  isLoading: true,
  error: null,
  lastSync: null,

  initApp: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const prefs = await dbService.getPreferences();
      const locations = await dbService.getLocations();
      
      set({ 
        preferences: prefs || defaultPreferences,
        locations
      });

      if (prefs?.defaultLocation) {
        const defaultLoc = locations.find(l => l.id === prefs.defaultLocation);
        if (defaultLoc) {
          get().setCurrentLocation(defaultLoc);
          return;
        }
      }

      // If no default location, try to detect or just stay empty
      if (locations.length > 0) {
        get().setCurrentLocation(locations[0]);
      } else {
        await get().detectLocation().catch(() => {
          // Failure to detect is okay on first load
          set({ isLoading: false });
        });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  setCurrentLocation: (location: Location) => {
    set({ currentLocation: location });
    get().refreshWeather();
  },

  addLocation: async (location: Location) => {
    await dbService.saveLocation(location);
    const locations = await dbService.getLocations();
    set({ locations });
  },

  removeLocation: async (id: string) => {
    await dbService.deleteLocation(id);
    const locations = await dbService.getLocations();
    set({ locations });
    if (get().currentLocation?.id === id) {
      if (locations.length > 0) {
        get().setCurrentLocation(locations[0]);
      } else {
        set({ currentLocation: null, forecasts: {}, alerts: [] });
      }
    }
  },

  updatePreferences: async (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...get().preferences, ...newPrefs };
    await dbService.savePreferences(updated);
    set({ preferences: updated });
  },

  refreshWeather: async () => {
    const loc = get().currentLocation;
    if (!loc) return;
    
    set({ isLoading: true, error: null });
    try {
      let gridId = loc.gridId;
      let gridX = loc.gridX;
      let gridY = loc.gridY;

      if (!gridId || gridX === undefined || gridY === undefined) {
        const gridData = await weatherService.getGridPoint(loc.latitude, loc.longitude);
        gridId = gridData.gridId;
        gridX = gridData.gridX;
        gridY = gridData.gridY;
        
        // Update stored location with grid info
        const updatedLoc = { ...loc, gridId, gridX, gridY };
        await dbService.saveLocation(updatedLoc);
        set(state => ({
          currentLocation: updatedLoc,
          locations: state.locations.map(l => l.id === loc.id ? updatedLoc : l)
        }));
      }

      const [forecast, alerts] = await Promise.all([
        weatherService.getForecast(gridId, gridX, gridY, loc.id),
        weatherService.getAlerts(loc.latitude, loc.longitude)
      ]);

      set(state => ({
        forecasts: { ...state.forecasts, [loc.id]: forecast },
        alerts,
        lastSync: new Date(),
        isLoading: false
      }));

    } catch (e: any) {
      // Apply offline fallback if available
      const cachedForecast = await dbService.getForecast(loc.id);
      if (cachedForecast) {
        set(state => ({
          forecasts: { ...state.forecasts, [loc.id]: cachedForecast },
          error: 'Offline: showing cached data',
          isLoading: false
        }));
      } else {
        set({ error: 'Failed to fetch weather data: ' + e.message, isLoading: false });
      }
    }
  },

  detectLocation: async () => {
    set({ isLoading: true, error: null });
    try {
      const coords = await locationService.getCurrentPosition();
      const name = await locationService.reverseGeocode(coords.lat, coords.lon);
      const newLoc = locationService.createLocationObject(name, coords.lat, coords.lon);
      
      await get().addLocation(newLoc);
      get().setCurrentLocation(newLoc);
    } catch (e: any) {
      set({ error: 'Failed to detect location: ' + e.message, isLoading: false });
      throw e;
    }
  }
}));
