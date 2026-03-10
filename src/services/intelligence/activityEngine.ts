import { ForecastPeriod, ActivityRecommendation } from '../../types';

interface ActivityRule {
  activity: string;
  idealTemp: [number, number];
  maxWind: number;
  maxPrecipChance: number;
  icon: string;
}

const ACTIVITY_RULES: ActivityRule[] = [
  { activity: 'Running', idealTemp: [45, 75], maxWind: 15, maxPrecipChance: 20, icon: '🏃' },
  { activity: 'Cycling', idealTemp: [50, 85], maxWind: 12, maxPrecipChance: 15, icon: '🚴' },
  { activity: 'Hiking', idealTemp: [55, 80], maxWind: 20, maxPrecipChance: 30, icon: '🥾' },
  { activity: 'Beach', idealTemp: [75, 95], maxWind: 15, maxPrecipChance: 10, icon: '🏖️' },
  { activity: 'Gardening', idealTemp: [60, 80], maxWind: 15, maxPrecipChance: 40, icon: '🪴' },
  { activity: 'Reading Indoors', idealTemp: [-50, 150], maxWind: 200, maxPrecipChance: 100, icon: '📚' }, // Always an option, but score goes up when weather is bad
];

export class ActivityEngine {
  generateRecommendations(period: ForecastPeriod): ActivityRecommendation[] {
    const temp = period.temperature;
    const precip = period.probabilityOfPrecipitation?.value || 0;
    
    const windMatches = period.windSpeed.match(/(\d+)/g);
    const wind = windMatches ? Math.max(...windMatches.map(Number)) : 0;

    const recommendations = ACTIVITY_RULES.map(rule => {
      let score = 100;
      let reason = 'Perfect conditions!';

      // Temperature penalty
      if (temp < rule.idealTemp[0]) {
        score -= (rule.idealTemp[0] - temp) * 2;
        reason = 'A bit too cold';
      } else if (temp > rule.idealTemp[1]) {
        score -= (temp - rule.idealTemp[1]) * 2;
        reason = 'A bit too hot';
      }

      // Wind penalty
      if (wind > rule.maxWind) {
        score -= (wind - rule.maxWind) * 3;
        reason = 'Too windy';
      }

      // Precip penalty
      if (precip > rule.maxPrecipChance) {
        score -= (precip - rule.maxPrecipChance) * 2;
        reason = 'High chance of rain';
      }

      // Special case for indoor activities
      if (rule.activity === 'Reading Indoors') {
        // High score if weather is bad, low if weather is nice
        const niceWeatherScore = this.calculateNiceness(temp, precip, wind);
        score = 100 - (niceWeatherScore / 2);
        reason = niceWeatherScore < 50 ? 'Great weather to stay inside' : 'Might want to go outside instead';
      }

      return {
        activity: rule.activity,
        score: Math.max(0, Math.min(100, score)),
        reason,
        icon: rule.icon,
        bestTime: period.name
      };
    });

    // Sort by score
    return recommendations
      .filter(r => r.score > 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3
  }

  private calculateNiceness(temp: number, precip: number, wind: number) {
    let score = 100;
    if (temp < 50 || temp > 85) score -= 30;
    if (precip > 30) score -= 40;
    if (wind > 15) score -= 20;
    return Math.max(0, score);
  }
}

export const activityEngine = new ActivityEngine();
