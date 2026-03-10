import { Forecast, AlertRule, WeatherAlert, ForecastPeriod } from '../../types';

export class AlertEngine {
  private hasPermission: boolean = false;

  constructor() {
    this.checkPermission();
  }

  private async checkPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      this.hasPermission = true;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    return this.hasPermission;
  }

  evaluateRules(forecast: Forecast, alerts: WeatherAlert[], rules: AlertRule[]) {
    if (!this.hasPermission || rules.length === 0) return;

    // We only evaluate rules against the nearest 2-3 periods (today)
    const activePeriods = forecast.periods.slice(0, 3);
    
    // Evaluate custom user rules
    rules.filter(r => r.enabled).forEach(rule => {
      for (const period of activePeriods) {
        if (this.matchesRule(period, rule)) {
          this.notify(`Weather Alert: ${rule.type}`, `Condition met: ${rule.type} is ${rule.condition} ${rule.threshold} during ${period.name}`);
          break; // only notify once per rule
        }
      }
    });

    // Evaluate NWS active alerts
    if (rules.some(r => r.enabled && r.type === 'severe')) {
      alerts.forEach(alert => {
        if (['Extreme', 'Severe'].includes(alert.severity)) {
          this.notify(`Severe Weather: ${alert.event}`, alert.headline);
        }
      });
    }
  }

  private matchesRule(period: ForecastPeriod, rule: AlertRule): boolean {
    let value = 0;
    
    switch (rule.type) {
      case 'temperature':
        value = period.temperature;
        break;
      case 'precipitation':
        value = period.probabilityOfPrecipitation?.value || 0;
        break;
      case 'wind':
        // Extremely crude parsing of "10 to 15 mph"
        const matches = period.windSpeed.match(/(\d+)/g);
        value = matches ? Math.max(...matches.map(Number)) : 0;
        break;
      default:
        return false;
    }

    switch (rule.condition) {
      case 'above': return value > rule.threshold;
      case 'below': return value < rule.threshold;
      case 'equals': return value === rule.threshold;
      default: return false;
    }
  }

  private notify(title: string, body: string) {
    // Only notify if we haven't notified about this specific thing recently
    // For MVP, we'll just fire it. In a real app we'd track sent notifications in IDB.
    if (this.hasPermission) {
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png'
      });
    }
  }
}

export const alertEngine = new AlertEngine();
