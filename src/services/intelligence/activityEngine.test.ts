import { describe, it, expect } from 'vitest';
import { activityEngine } from './activityEngine';
import { ForecastPeriod } from '../../types';

describe('Activity Engine', () => {
  it('should generate recommendations for clear, moderate weather', () => {
    const mockPeriod: ForecastPeriod = {
      number: 1,
      name: 'Today',
      startTime: '',
      endTime: '',
      temperature: 72,
      temperatureUnit: 'F',
      probabilityOfPrecipitation: { unitCode: 'percent', value: 0 },
      precipitationAmount: 0,
      precipitationType: undefined,
      windSpeed: '5 mph',
      windDirection: 'W',
      icon: '',
      shortForecast: 'Sunny',
      detailedForecast: 'Sunny, with a high near 72.'
    };

    const recs = activityEngine.generateRecommendations(mockPeriod);

    // With 72F and Sunny, Hiking/Running should definitely be recommended and score well.
    expect(recs.length).toBeGreaterThan(0);
    const hiking = recs.find(r => r.activity === 'Hiking');
    expect(hiking).toBeDefined();
    expect(hiking?.score).toBeGreaterThan(80);
  });

  it('should not recommend running during a thunderstorm', () => {
    const mockPeriod: ForecastPeriod = {
      number: 1,
      name: 'This Afternoon',
      startTime: '',
      endTime: '',
      temperature: 85,
      temperatureUnit: 'F',
      probabilityOfPrecipitation: { unitCode: 'percent', value: 90 },
      precipitationAmount: 1.5,
      precipitationType: 'Thunderstorms',
      windSpeed: '20 mph',
      windDirection: 'SE',
      icon: '',
      shortForecast: 'Severe Thunderstorms',
      detailedForecast: 'Severe thunderstorms likely.'
    };

    const recs = activityEngine.generateRecommendations(mockPeriod);

    // Precipitation and high winds should filter out most outdoor activities
    // It should recommend 'Reading Indoors'
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].activity).toBe('Reading Indoors');
  });
});
