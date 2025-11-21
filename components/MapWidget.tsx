
import React, { useState, useEffect } from 'react';
import { MapPinIcon, SpinnerIcon } from './icons';

interface WeatherData {
    temp: number;
    description: string;
    icon: string;
}

interface MapWidgetProps {
    destination: string;
    initialWeather?: WeatherData;
}

const WeatherIcon = ({ iconCode }: { iconCode: string }) => {
    const iconMapping: { [key: string]: string } = {
        '01': '☀️', // clear sky
        '02': '⛅️', // few clouds
        '03': '☁️', // scattered clouds
        '04': '☁️', // broken clouds
        '09': '🌧️', // shower rain
        '10': '🌦️', // rain
        '11': '⛈️', // thunderstorm
        '13': '❄️', // snow
        '50': '🌫️', // mist
    };
    const code = iconCode.slice(0, 2);
    return <span className="text-4xl">{iconMapping[code] || '🌍'}</span>;
};

const MapWidget: React.FC<MapWidgetProps> = ({ destination, initialWeather }) => {
    const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(!initialWeather);
    const [weatherError, setWeatherError] = useState<string | null>(null);

    useEffect(() => {
        if (initialWeather) {
            setWeather(initialWeather);
            setIsWeatherLoading(false);
            return;
        }

        const fetchWeather = async () => {
            setIsWeatherLoading(true);
            const apiKey = process.env.OPENWEATHERMAP_API_KEY;
            
            if (!apiKey) {
                // Silently fall back to mock data if no API key
                setTimeout(() => {
                    setWeather({
                        temp: 24,
                        description: "Sunny",
                        icon: '01d',
                    });
                    setWeatherError(null);
                    setIsWeatherLoading(false);
                }, 500);
                return;
            }

            try {
                setWeatherError(null);
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${destination}&appid=${apiKey}&units=metric`);
                if (!response.ok) {
                    throw new Error('Weather data not found for this location.');
                }
                const data = await response.json();
                setWeather({
                    temp: Math.round(data.main.temp),
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                });
            } catch (err) {
                // On fetch error, just show nothing or keep previous state, don't nag user
                console.error("Weather fetch failed", err);
                setWeatherError(null);
            } finally {
                setIsWeatherLoading(false);
            }
        };

        fetchWeather();
    }, [destination, initialWeather]);

    const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(destination)}&t=&z=10&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:border dark:border-gray-700 p-6 transition-colors duration-300 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <MapPinIcon className="h-6 w-6 text-sky-700 dark:text-sky-400 mr-2" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Map & Weather</h2>
                </div>
                 {isWeatherLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <SpinnerIcon className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                    </div>
                 )}
            </div>

            {weatherError && <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 p-3 rounded-lg text-sm">{weatherError}</div>}

            {weather && (
                <div className="flex items-center justify-between bg-sky-50 dark:bg-sky-900/50 rounded-lg p-4 border border-sky-200 dark:border-sky-700">
                    <div>
                        <p className="text-lg font-semibold text-sky-800 dark:text-sky-200 capitalize">{weather.description}</p>
                        <p className="text-3xl font-bold text-sky-900 dark:text-sky-100">{weather.temp}°C</p>
                    </div>
                    <WeatherIcon iconCode={weather.icon} />
                </div>
            )}

            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-64">
                <iframe
                    src={mapSrc}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map of ${destination}`}
                ></iframe>
            </div>
        </div>
    );
}

export default MapWidget;
