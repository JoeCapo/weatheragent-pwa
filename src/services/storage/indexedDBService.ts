import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Location, Forecast, WeatherAlert, UserPreferences } from '../../types';

interface WeatherAgentDB extends DBSchema {
  locations: {
    key: string;
    value: Location;
    indexes: { 'name': string, 'isFavorite': number };
  };
  forecasts: {
    key: string;
    value: Forecast;
    indexes: { 'generatedAt': Date };
  };
  alerts: {
    key: string;
    value: WeatherAlert;
    indexes: { 'severity': string, 'expires': string };
  };
  preferences: {
    key: string;
    value: UserPreferences;
  };
  cache: {
    key: string;
    value: any;
    indexes: { 'expiresAt': number };
  };
}

const DB_NAME = 'WeatherAgentDB';
const DB_VERSION = 1;

export class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase<WeatherAgentDB>>;

  constructor() {
    this.dbPromise = openDB<WeatherAgentDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('locations')) {
          const store = db.createObjectStore('locations', { keyPath: 'id' });
          store.createIndex('name', 'name');
          // idb doesn't index booleans directly so we'll just not use an index for simple boolean search unless it's a number (0/1). But PRD specified 'isFavorite' index. We can coerce it when adding or just keep it simple.
          store.createIndex('isFavorite', 'isFavorite');
        }
        if (!db.objectStoreNames.contains('forecasts')) {
          const store = db.createObjectStore('forecasts', { keyPath: 'locationId' });
          store.createIndex('generatedAt', 'generatedAt');
        }
        if (!db.objectStoreNames.contains('alerts')) {
          const store = db.createObjectStore('alerts', { keyPath: 'id' });
          store.createIndex('severity', 'severity');
          store.createIndex('expires', 'expires');
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt');
        }
      },
    });
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    const db = await this.dbPromise;
    return db.getAll('locations');
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const db = await this.dbPromise;
    return db.get('locations', id);
  }

  async saveLocation(location: Location): Promise<void> {
    const db = await this.dbPromise;
    await db.put('locations', location);
  }

  async deleteLocation(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('locations', id);
  }

  // Forecasts
  async getForecast(locationId: string): Promise<Forecast | undefined> {
    const db = await this.dbPromise;
    return db.get('forecasts', locationId);
  }

  async saveForecast(forecast: Forecast): Promise<void> {
    const db = await this.dbPromise;
    await db.put('forecasts', forecast);
  }

  // Preferences
  async getPreferences(): Promise<UserPreferences | undefined> {
    const db = await this.dbPromise;
    // @ts-ignore
    return db.get('preferences', 'default');
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    const db = await this.dbPromise;
    // @ts-ignore
    await db.put('preferences', { id: 'default', ...prefs });
  }

  // Generic Cache
  async getCached<T>(key: string): Promise<T | null> {
    const db = await this.dbPromise;
    const item = await db.get('cache', key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      await db.delete('cache', key);
      return null;
    }
    return item.data as T;
  }

  async setCache(key: string, data: any, ttlSeconds: number): Promise<void> {
    const db = await this.dbPromise;
    await db.put('cache', {
      key,
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }
}

export const dbService = new IndexedDBService();
