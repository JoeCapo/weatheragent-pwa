export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  gridId?: string;
  gridX?: number;
  gridY?: number;
  isFavorite: boolean;
  lastUpdated: Date;
}

export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: 'F' | 'C';
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation?: number;
}

export interface Forecast {
  locationId: string;
  generatedAt: Date;
  periods: ForecastPeriod[];
  hourlyPeriods?: ForecastPeriod[];
}

export interface WeatherAlert {
  id: string;
  type: string;
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  certainty: 'Observed' | 'Likely' | 'Possible' | 'Unlikely' | 'Unknown';
  urgency: 'Immediate' | 'Expected' | 'Future' | 'Past' | 'Unknown';
  event: string;
  headline: string;
  description: string;
  instruction?: string;
  onset: string;
  expires: string;
  affectedZones: string[];
}

export interface AlertRule {
  type: 'temperature' | 'precipitation' | 'wind' | 'severe';
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  enabled: boolean;
}

export interface UserPreferences {
  temperatureUnit: 'F' | 'C';
  windSpeedUnit: 'mph' | 'kph';
  timeFormat: '12h' | '24h';
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  alertPreferences: AlertRule[];
  defaultLocation?: string;
  favoriteLocations: string[];
}

export interface ActivityRecommendation {
  activity: string;
  score: number; // 0-100
  reason: string;
  bestTime?: string;
  icon: string;
}

export interface AppState {
  currentLocation: Location | null;
  locations: Location[];
  forecasts: Record<string, Forecast>;
  alerts: WeatherAlert[];
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
}
