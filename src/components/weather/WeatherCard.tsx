import React from 'react';
import { useWeatherStore } from '../../store';
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export function WeatherCard() {
  const { currentLocation, forecasts, isLoading, error, refreshWeather, lastSync } = useWeatherStore();
  const forecast = currentLocation ? forecasts[currentLocation.id] : null;

  if (isLoading && !forecast) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-6 bg-white rounded-2xl shadow p-8 text-center animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-32 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}
        </div>
      </div>
    );
  }

  if (error && !forecast) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-6 p-8 text-center text-red-600 bg-red-50 rounded-2xl border border-red-100">
        <p className="font-semibold mb-2 text-lg">Unable to load weather data</p>
        <p className="text-sm mb-4">{error}</p>
        <button 
          onClick={refreshWeather} 
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentLocation || !forecast) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-6 p-12 text-center text-gray-500 bg-white rounded-2xl shadow border border-gray-100">
        <MapPinIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">Please search for a location to view the weather forecast.</p>
      </div>
    );
  }

  const currentPeriod = forecast.periods[0];
  const nextPeriods = forecast.periods.slice(1, 8); 
  const hourly = forecast.hourlyPeriods?.slice(0, 12) || [];

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
      {isLoading && <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 animate-pulse"></div>}
      
      {/* Header section with current conditions */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center text-left">
              <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 opacity-80 flex-shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-none">{currentLocation.name}</span>
            </h2>
            <p className="text-primary-100 mt-1 capitalize text-base sm:text-lg text-left">{currentPeriod.shortForecast}</p>
          </div>
          <button 
            onClick={refreshWeather}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition group"
            title="Refresh weather"
            aria-label="Refresh weather"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin text-white' : 'text-primary-100 group-hover:text-white'}`} />
          </button>
        </div>

        <div className="mt-6 sm:mt-8 flex items-center justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <img 
              src={currentPeriod.icon.replace('small', 'large')} 
              alt={currentPeriod.shortForecast} 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-lg self-center sm:self-auto"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <div className="text-6xl sm:text-7xl font-bold tracking-tighter shadow-sm text-center sm:text-left">
                {currentPeriod.temperature}&deg;{currentPeriod.temperatureUnit}
              </div>
              <div className="text-primary-100 mt-2 text-base sm:text-lg flex flex-col sm:flex-row sm:space-x-4">
                <span>Wind: {currentPeriod.windSpeed} {currentPeriod.windDirection}</span>
                {currentPeriod.probabilityOfPrecipitation?.value != null && (
                  <span className="mt-1 sm:mt-0 flex items-center">
                    <span className="opacity-80 mr-1">Precip:</span> {currentPeriod.probabilityOfPrecipitation.value}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {error && <div className="mt-4 text-sm bg-red-500/20 p-2 rounded text-red-100">Offline Warning: {error}</div>}
      </div>

      {/* Hourly Forecast */}
      {hourly.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Hourly Forecast</h3>
          <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
            {hourly.map((hour, idx) => {
              const date = new Date(hour.startTime);
              return (
                <div key={idx} className="flex flex-col items-center justify-between min-w-[4.5rem] p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-primary-50 transition">
                  <span className="text-sm font-medium text-gray-500">
                    {date.toLocaleTimeString([], { hour: 'numeric' })}
                  </span>
                  <img src={hour.icon} alt={hour.shortForecast} className="w-10 h-10 my-2" />
                  <span className="text-lg font-bold text-gray-900">{hour.temperature}&deg;</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Forecast */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Extended Forecast</h3>
        <div className="space-y-3">
          {nextPeriods.map((day, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition">
              <div className="w-1/3 text-left font-medium text-gray-700 truncate pr-2">{day.name}</div>
              <div className="w-1/3 flex justify-center">
                <div className="flex items-center text-gray-500 text-sm">
                  <img src={day.icon} alt={day.shortForecast} className="w-6 h-6 sm:w-8 sm:h-8 mr-1 sm:mr-2" />
                  <span className="truncate max-w-[60px] sm:max-w-[100px]" title={day.shortForecast}>{day.shortForecast}</span>
                </div>
              </div>
              <div className="w-1/3 text-right font-bold text-gray-900 text-base sm:text-lg flex justify-end items-center space-x-2">
                {day.probabilityOfPrecipitation?.value ? (
                  <span className="text-xs text-blue-500 font-normal mr-2">{day.probabilityOfPrecipitation.value}%</span>
                ) : null}
                <span>{day.temperature}&deg;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 text-xs text-center text-gray-400 border-t border-gray-100">
        Last updated: {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never'} • 
        Data provided by the National Weather Service
      </div>
    </div>
  );
}
