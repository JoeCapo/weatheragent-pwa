import React, { useState } from 'react';
import { useWeatherStore } from '../../store';
import { alertEngine } from '../../services/intelligence/alertEngine';
import { CogIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function SettingsModal() {
  const { preferences, updatePreferences } = useWeatherStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationToggle = async () => {
    if (!preferences.notificationsEnabled) {
      const granted = await alertEngine.requestPermission();
      if (granted) {
        updatePreferences({ notificationsEnabled: true });
      } else {
        alert('Notification permission denied by browser.');
      }
    } else {
      updatePreferences({ notificationsEnabled: false });
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition ml-2"
        title="Settings"
      >
        <CogIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 transform transition-all">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Preferences</h2>
            
            <div className="space-y-6">
              {/* Notifications */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Smart Notifications</h3>
                  <p className="text-sm text-gray-500 mt-1">Receive push alerts for severe weather or custom thresholds.</p>
                </div>
                <button 
                  onClick={handleNotificationToggle}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${preferences.notificationsEnabled ? 'bg-primary-500' : 'bg-gray-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                </button>
              </div>

              {/* Units */}
              <div className="border-b border-gray-100 pb-6">
                <h3 className="font-semibold text-gray-900 text-lg mb-4">Units</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => updatePreferences({ temperatureUnit: 'F' })}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition ${preferences.temperatureUnit === 'F' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Fahrenheit (&deg;F)
                  </button>
                  <button 
                    onClick={() => updatePreferences({ temperatureUnit: 'C' })}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition ${preferences.temperatureUnit === 'C' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Celsius (&deg;C)
                  </button>
                </div>
              </div>

              {/* Advanced Alerts Placeholder for MVP */}
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">Custom Alert Thresholds</h3>
                <p className="text-sm text-gray-500 mb-4">Define custom rules like "Temperature drops below 32&deg;F" (Coming in full release).</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center text-sm text-gray-400">
                  Feature unlocked in Phase 3
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
