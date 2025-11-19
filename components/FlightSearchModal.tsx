
import React, { useState, useEffect, useMemo } from 'react';
import type { Activity, FlightInfo } from '../types';
import { searchFlights, AIRLINES } from '../services/bookingService';
import { CloseIcon, PlaneIcon, SearchIcon, XCircleIcon } from './icons';

// Simple Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(value), delay]);
    return debouncedValue;
}

interface FlightSearchModalProps {
    activity: Activity;
    travelersCount: number;
    onClose: () => void;
    onFlightSelect: (flight: FlightInfo) => void;
}

const AirlineLogo: React.FC<{ airline: string }> = ({ airline }) => {
    // Simple hash function to get a consistent color for logos
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };

    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
    const colorIndex = Math.abs(hashCode(airline)) % colors.length;
    const color = colors[colorIndex];
    const initial = airline.charAt(0).toUpperCase();

    return (
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm`} aria-hidden="true">
            {initial}
        </div>
    );
};

const FlightSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center gap-4 border border-gray-100 dark:border-gray-700 shadow-sm animate-pulse">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-grow space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
        <div className="flex flex-col items-end gap-2">
             <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24" />
             <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
    </div>
);


const FlightSearchModal: React.FC<FlightSearchModalProps> = ({ activity, travelersCount, onClose, onFlightSelect }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<FlightInfo[] | null>(null);
    const [preferredAirlines, setPreferredAirlines] = useState<string[]>([]);
    const [preferredTime, setPreferredTime] = useState<'Any' | 'Morning' | 'Afternoon' | 'Evening'>('Any');
    const [maxStops, setMaxStops] = useState<number>(2); // 0, 1, or 2 for 2+
    const [hasSearched, setHasSearched] = useState(false);

    const filters = useMemo(() => ({
        airlines: preferredAirlines,
        time: preferredTime,
        maxStops: maxStops,
    }), [preferredAirlines, preferredTime, maxStops]);

    const debouncedFilters = useDebounce(filters, 500);

    const handleAirlineToggle = (airline: string) => {
        setPreferredAirlines(prev =>
            prev.includes(airline) ? prev.filter(a => a !== airline) : [...prev, airline]
        );
    };

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!hasSearched) {
            setHasSearched(true);
        }
        setIsLoading(true);
        setError(null);
        setResults(null); // Clear previous results to show skeleton
        
        try {
            const flightResults = await searchFlights(activity, travelersCount, filters);
            if (!flightResults || flightResults.length === 0) {
                // Optional: could handle specific 'no results' error logic here if needed, 
                // but returning empty array is valid.
            }
            setResults(flightResults);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to fetch flight data. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (hasSearched) {
            handleSearch();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedFilters, hasSearched]);
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:border dark:border-gray-700 p-6 max-w-3xl w-full relative max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 z-10">
                    <CloseIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center mb-4 flex-shrink-0">
                    <PlaneIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mr-3" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Search Flights</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Flight Preferences</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Time</label>
                                    <select
                                        value={preferredTime}
                                        onChange={(e) => setPreferredTime(e.target.value as any)}
                                        className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-cyan-400/50 dark:focus:border-cyan-400 transition-all"
                                    >
                                        <option value="Any">Any Time</option>
                                        <option value="Morning">Morning (5am - 12pm)</option>
                                        <option value="Afternoon">Afternoon (12pm - 6pm)</option>
                                        <option value="Evening">Evening (6pm onwards)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Stops</label>
                                    <div className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                                        {(['Direct', '1 Stop', 'Any'] as const).map((label, index) => (
                                            <button
                                                type="button"
                                                key={label}
                                                onClick={() => setMaxStops(index)}
                                                className={`w-full text-center px-3 py-1 rounded-md font-semibold text-sm transition-all ${maxStops === index ? 'bg-white dark:bg-gray-800 text-cyan-600 dark:text-cyan-400 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Airlines</label>
                                    <div className="flex flex-wrap gap-2">
                                        {AIRLINES.map(airline => (
                                            <button
                                                type="button"
                                                key={airline}
                                                onClick={() => handleAirlineToggle(airline)}
                                                className={`px-3 py-1 rounded-full font-semibold text-xs transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-offset-gray-800 ${
                                                    preferredAirlines.includes(airline)
                                                        ? 'bg-cyan-600 text-white shadow-md'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                                                }`}
                                            >
                                                {airline}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                    
                    {hasSearched && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                             {isLoading ? (
                                <div className="space-y-4 py-4">
                                    <FlightSkeleton />
                                    <FlightSkeleton />
                                    <FlightSkeleton />
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center px-4 animate-fade-in">
                                    <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-3">
                                        <XCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Search Failed</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-xs">{error}</p>
                                    <button 
                                        onClick={() => handleSearch()} 
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : results && (
                                <div>
                                    {results.length > 0 ? (
                                        <>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                                                Search Results ({results.length})
                                            </h3>
                                            <div className="space-y-3">
                                                {results.map((flight, index) => (
                                                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center gap-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                                                        <AirlineLogo airline={flight.airline} />
                                                        <div className="flex-grow">
                                                            <p className="font-bold text-gray-800 dark:text-gray-100">{flight.airline}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">{flight.departureTime} &rarr; {flight.arrivalTime} ({flight.duration})</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {flight.stops === 0 ? (
                                                                    <span className="text-green-600 dark:text-green-400 font-medium">Non-stop</span>
                                                                ) : (
                                                                    `${flight.stops} stop(s)`
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <div className="text-right">
                                                                <p className="text-lg font-bold text-cyan-700 dark:text-cyan-400">
                                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(flight.price)}
                                                                </p>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500">per person</p>
                                                            </div>
                                                            <button 
                                                                onClick={() => onFlightSelect(flight)}
                                                                className="bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-700 transition duration-300 text-sm whitespace-nowrap shadow-sm"
                                                            >
                                                                Select
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-10 px-6">
                                            <SearchIcon className="mx-auto h-12 w-12 text-gray-400" />
                                            <h4 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-100">No Flights Found</h4>
                                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                                We couldn't find any flights that match your current filters. Try changing the time of day or increasing the max stops.
                                            </p>
                                            <button 
                                                onClick={() => {
                                                    setPreferredTime('Any');
                                                    setMaxStops(2);
                                                    setPreferredAirlines([]);
                                                }}
                                                className="mt-4 text-cyan-600 dark:text-cyan-400 font-medium hover:underline"
                                            >
                                                Clear Filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    {!hasSearched ? (
                         <button onClick={handleSearch} className="w-full py-3 font-bold text-white rounded-lg transition duration-300 flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 shadow-lg">
                            Search Flights
                        </button>
                    ) : (
                         <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            Results update automatically as you change filters.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlightSearchModal;
