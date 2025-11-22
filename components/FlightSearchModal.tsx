
import React, { useState, useEffect, useMemo } from 'react';
import type { Activity, FlightInfo } from '../types';
import { searchFlights, AIRLINES } from '../services/bookingService';
import { CloseIcon, PlaneIcon, SearchIcon, XCircleIcon, FilterIcon, ArrowRightIcon } from './icons';

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
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white font-bold text-xl shadow-md transform transition-transform group-hover:scale-105`} aria-hidden="true">
            {initial}
        </div>
    );
};

const FlightSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm animate-pulse grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-3 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
        <div className="md:col-span-6 flex flex-col justify-center space-y-3">
             <div className="flex justify-between">
                 <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                 <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
             </div>
             <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
        </div>
        <div className="md:col-span-3 flex flex-col items-end gap-2">
             <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
             <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
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
    const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');
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

    const parseDuration = (durationStr: string) => {
        const parts = durationStr.match(/(\d+)h\s*(\d*)m?/);
        if (!parts) return 0;
        return parseInt(parts[1]) * 60 + (parseInt(parts[2]) || 0);
    };

    const sortedResults = useMemo(() => {
        if (!results) return null;
        return [...results].sort((a, b) => {
            if (sortBy === 'price') return a.price - b.price;
            if (sortBy === 'duration') return parseDuration(a.duration) - parseDuration(b.duration);
            if (sortBy === 'departure') return a.departureTime.localeCompare(b.departureTime);
            return 0;
        });
    }, [results, sortBy]);

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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:border dark:border-gray-800 p-0 max-w-4xl w-full relative max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                            <PlaneIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Flight</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-md">{activity.description}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 bg-gray-50 dark:bg-black/20">
                    <form onSubmit={handleSearch} className="space-y-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Filter Results</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Departure Time</label>
                                    <select
                                        value={preferredTime}
                                        onChange={(e) => setPreferredTime(e.target.value as any)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm dark:text-white transition-all cursor-pointer"
                                    >
                                        <option value="Any">Any Time</option>
                                        <option value="Morning">Morning (05:00 - 12:00)</option>
                                        <option value="Afternoon">Afternoon (12:00 - 18:00)</option>
                                        <option value="Evening">Evening (18:00 - 00:00)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stops</label>
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-1 rounded-xl">
                                        {(['Direct', '1 Stop', 'Any'] as const).map((label, index) => (
                                            <button
                                                type="button"
                                                key={label}
                                                onClick={() => setMaxStops(index)}
                                                className={`flex-1 text-center px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${maxStops === index ? 'bg-white dark:bg-gray-600 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="lg:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Airlines</label>
                                    <div className="flex flex-wrap gap-2">
                                        {AIRLINES.map(airline => (
                                            <button
                                                type="button"
                                                key={airline}
                                                onClick={() => handleAirlineToggle(airline)}
                                                className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all duration-200 border ${
                                                    preferredAirlines.includes(airline)
                                                        ? 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
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
                        <div className="space-y-4">
                             {/* Sort Controls */}
                             {results && results.length > 0 && (
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{results.length} flights found</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><FilterIcon className="h-3 w-3"/> Sort by:</span>
                                        <select 
                                            value={sortBy} 
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="text-sm bg-transparent font-bold text-cyan-600 dark:text-cyan-400 focus:outline-none cursor-pointer"
                                        >
                                            <option value="price">Lowest Price</option>
                                            <option value="duration">Fastest</option>
                                            <option value="departure">Earliest</option>
                                        </select>
                                    </div>
                                </div>
                             )}

                             {isLoading ? (
                                <div className="space-y-4">
                                    <FlightSkeleton />
                                    <FlightSkeleton />
                                    <FlightSkeleton />
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-3">
                                        <XCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Search Failed</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-xs mt-2">{error}</p>
                                    <button 
                                        onClick={() => handleSearch()} 
                                        className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-90 transition-opacity"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : sortedResults && (
                                <div className="space-y-4">
                                    {sortedResults.length > 0 ? sortedResults.map((flight, index) => (
                                        <div key={index} className="group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row items-center gap-6">
                                            
                                            {/* Airline Info */}
                                            <div className="flex items-center gap-4 w-full md:w-1/4">
                                                <AirlineLogo airline={flight.airline} />
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{flight.airline}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded mt-1 inline-block">Economy</p>
                                                </div>
                                            </div>

                                            {/* Flight Timeline */}
                                            <div className="flex-grow w-full md:w-2/4 flex items-center justify-between gap-4 px-2">
                                                <div className="text-center">
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{flight.departureTime}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">DEP</p>
                                                </div>
                                                
                                                <div className="flex-grow flex flex-col items-center gap-1">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{flight.duration}</p>
                                                    <div className="w-full h-px bg-gray-300 dark:bg-gray-600 relative flex items-center justify-center">
                                                        <div className="absolute bg-white dark:bg-gray-800 p-1">
                                                            <PlaneIcon className="h-3 w-3 text-gray-400 rotate-90" />
                                                        </div>
                                                        <div className="absolute -left-1 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                                        <div className="absolute -right-1 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                                    </div>
                                                    <p className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${flight.stops === 0 ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' : 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                        {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                                                    </p>
                                                </div>

                                                <div className="text-center">
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{flight.arrivalTime}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">ARR</p>
                                                </div>
                                            </div>

                                            {/* Price & Action */}
                                            <div className="w-full md:w-1/4 flex md:flex-col justify-between md:justify-center items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
                                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(flight.price)}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">per person</p>
                                                </div>
                                                <button 
                                                    onClick={() => onFlightSelect(flight)}
                                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 text-sm flex items-center gap-2"
                                                >
                                                    Select <ArrowRightIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-16 px-6">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <SearchIcon className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">No Flights Found</h4>
                                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                                We couldn't find any flights matching your filters. Try adjusting the time or number of stops.
                                            </p>
                                            <button 
                                                onClick={() => {
                                                    setPreferredTime('Any');
                                                    setMaxStops(2);
                                                    setPreferredAirlines([]);
                                                }}
                                                className="mt-6 text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                                            >
                                                Clear All Filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {!hasSearched && (
                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                         <button onClick={handleSearch} className="w-full py-4 font-bold text-lg text-white rounded-xl transition-all duration-300 flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                            Search Flights
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightSearchModal;
