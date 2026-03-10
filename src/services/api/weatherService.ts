import { dbService } from '../storage/indexedDBService';
import { Forecast, WeatherAlert, ForecastPeriod } from '../../types';
import { sumGridValuesForPeriod, mmToInches, extractPrecipType } from './nwsGridUtils';

const NWS_API_BASE = import.meta.env.VITE_NWS_API_BASE || 'https://api.weather.gov';

const CACHE_DURATIONS = {
  gridPoint: 24 * 60 * 60, // 24 hours in seconds
  forecast: 15 * 60,       // 15 minutes in seconds
  alerts: 5 * 60           // 5 minutes in seconds
};

interface GridPointResponse {
  properties: {
    gridId: string;
    gridX: number;
    gridY: number;
    forecast: string;
    forecastHourly: string;
  };
}

export class WeatherService {
  private async fetchWithRetry(url: string, retries = 2): Promise<Response> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'WeatherAgent/1.0' }
      });
      if (!response.ok) {
        if (response.status >= 500 && retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
          return this.fetchWithRetry(url, retries - 1);
        }
        throw new Error(`API Error: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return this.fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  }

  async getGridPoint(lat: number, lon: number): Promise<GridPointResponse['properties']> {
    const cacheKey = `grid_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    const cached = await dbService.getCached<GridPointResponse['properties']>(cacheKey);
    if (cached) return cached;

    const url = `${NWS_API_BASE}/points/${lat},${lon}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    
    await dbService.setCache(cacheKey, data.properties, CACHE_DURATIONS.gridPoint);
    return data.properties;
  }

  async getForecast(gridId: string, gridX: number, gridY: number, locationId: string): Promise<Forecast> {
    const cacheKey = `forecast_${gridId}_${gridX}_${gridY}`;
    const cached = await dbService.getCached<Forecast>(cacheKey);
    if (cached) return cached;

    const [dailyRes, hourlyRes, rawGridRes] = await Promise.all([
      this.fetchWithRetry(`${NWS_API_BASE}/gridpoints/${gridId}/${gridX},${gridY}/forecast`),
      this.fetchWithRetry(`${NWS_API_BASE}/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`).catch(() => null),
      this.fetchWithRetry(`${NWS_API_BASE}/gridpoints/${gridId}/${gridX},${gridY}`).catch(() => null)
    ]);

    const dailyData = await dailyRes.json();
    const hourlyData = hourlyRes ? await hourlyRes.json() : { properties: { periods: [] } };
    const rawGridData = rawGridRes ? await rawGridRes.json() : null;

    const enhancedPeriods = dailyData.properties.periods.map((period: ForecastPeriod) => {
      let amount = 0;
      const type = extractPrecipType(period.detailedForecast || period.shortForecast);

      if (rawGridData?.properties) {
        const pStart = new Date(period.startTime);
        const pEnd = new Date(period.endTime);
        
        if (type === 'Snow') {
           const snowMm = sumGridValuesForPeriod(pStart, pEnd, rawGridData.properties.snowfallAmount?.values || []);
           // NWS snowfallAmount is typically in mm of snow, equivalent to mm water * 10, often API provides it as actual snow depth in mm
           amount = mmToInches(snowMm);
        } else {
           const precipMm = sumGridValuesForPeriod(pStart, pEnd, rawGridData.properties.quantitativePrecipitation?.values || []);
           amount = mmToInches(precipMm);
        }
      }

      return {
        ...period,
        precipitationAmount: amount >= 0.01 ? Number(amount.toFixed(2)) : undefined,
        precipitationType: type
      };
    });

    const forecast: Forecast = {
      locationId,
      generatedAt: new Date(),
      periods: enhancedPeriods,
      hourlyPeriods: hourlyData.properties.periods
    };

    await dbService.setCache(cacheKey, forecast, CACHE_DURATIONS.forecast);
    await dbService.saveForecast(forecast); // Save for offline fallback
    return forecast;
  }

  async getAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    const cacheKey = `alerts_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    const cached = await dbService.getCached<WeatherAlert[]>(cacheKey);
    if (cached) return cached;

    const url = `${NWS_API_BASE}/alerts/active?point=${lat},${lon}`;
    try {
      const response = await this.fetchWithRetry(url, 1);
      const data = await response.json();
      const alerts: WeatherAlert[] = data.features.map((f: any) => ({
        id: f.properties.id,
        type: f.properties.msgType,
        severity: f.properties.severity,
        certainty: f.properties.certainty,
        urgency: f.properties.urgency,
        event: f.properties.event,
        headline: f.properties.headline,
        description: f.properties.description,
        instruction: f.properties.instruction,
        onset: f.properties.onset,
        expires: f.properties.expires,
        affectedZones: f.properties.affectedZones
      }));

      await dbService.setCache(cacheKey, alerts, CACHE_DURATIONS.alerts);
      return alerts;
    } catch {
      return []; // Return empty alerts on failure so as not to block weather load
    }
  }
}

export const weatherService = new WeatherService();
