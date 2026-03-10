import React, { useMemo } from 'react';
import { useWeatherStore } from '../../store';
import { activityEngine } from '../../services/intelligence/activityEngine';

export function WeatherInsights() {
  const { currentLocation, forecasts } = useWeatherStore();
  const forecast = currentLocation ? forecasts[currentLocation.id] : null;

  const recommendations = useMemo(() => {
    if (!forecast || forecast.periods.length === 0) return [];
    return activityEngine.generateRecommendations(forecast.periods[0]);
  }, [forecast]);

  if (!forecast) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 bg-white rounded-3xl shadow p-8 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        Smart Insights
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Activity Recommendations */}
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recommended Activities</h4>
          <div className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <div key={i} className="flex items-start p-4 bg-primary-50 rounded-2xl border border-primary-100">
                  <div className="text-3xl mr-4">{rec.icon}</div>
                  <div>
                    <h5 className="font-bold text-gray-900">{rec.activity}</h5>
                    <p className="text-sm text-gray-600">{rec.reason}</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${rec.score}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-gray-50 rounded-2xl text-sm text-gray-500 border border-gray-100">
                Weather conditions aren't ideal for typical outdoor activities today.
              </div>
            )}
          </div>
        </div>

        {/* Quick Insights */}
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Today's Weather Narrative</h4>
          <div className="prose prose-sm text-gray-700">
            <p className="leading-relaxed">
              {forecast.periods[0].detailedForecast}
            </p>
            <p className="mt-4 leading-relaxed text-gray-500 italic text-sm">
              The intelligence engine analyzes temperature, wind, and precipitation to determine optimal activities and notify you of critical thresholds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
