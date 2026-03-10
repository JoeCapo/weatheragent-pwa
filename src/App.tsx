import React, { useEffect } from 'react';
import { SearchBar } from './components/weather/SearchBar';
import { WeatherCard } from './components/weather/WeatherCard';
import { LocationList } from './components/weather/LocationList';
import { WeatherInsights } from './components/weather/WeatherInsights';
import { WeatherMap } from './components/maps/WeatherMap';
import { SettingsModal } from './components/settings/SettingsModal';
import { useWeatherStore } from './store';
import { CloudIcon } from '@heroicons/react/24/solid';

function App() {
  const { initApp } = useWeatherStore();

  useEffect(() => {
    initApp();
  }, [initApp]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-200 selection:text-primary-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <CloudIcon className="h-8 w-8 text-primary-500 mr-2" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400 tracking-tight">
              WeatherAgent
            </h1>
          </div>
          <div className="hidden sm:block flex-1 max-w-md ml-8">
            <SearchBar />
          </div>
          <div className="flex items-center ml-auto">
            <LocationList />
            <SettingsModal />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="sm:hidden mb-6">
          <SearchBar />
        </div>
        
        <WeatherCard />
        <WeatherMap />
        <WeatherInsights />
      </main>
    </div>
  );
}

export default App;
