import React from 'react';
import type { Itinerary, TripDetails, TravelAdvisory } from '../types';
import { BriefcaseIcon, PieChartIcon, CheckCircleIcon, ShareIcon } from './icons';
import TravelAlerts from './TravelAlerts';

interface TripSidebarProps {
    itinerary: Itinerary;
    details: TripDetails;
    isAuthenticated: boolean;
    onSaveTrip: () => void;
    onShare: () => void;
    onEditTrip: () => void;
    onPlanNewTrip: () => void;
    advisories: TravelAdvisory[];
}

const TripSidebar: React.FC<TripSidebarProps> = ({ itinerary, details, isAuthenticated, onSaveTrip, onShare, onEditTrip, onPlanNewTrip, advisories }) => {
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    const breakdown = itinerary.detailed_cost_breakdown;
    const total = itinerary.total_estimated_cost;
    const budgetData = total > 0 ? [
        { label: 'Stay', value: breakdown.stay, color: 'bg-blue-500' },
        { label: 'Travel', value: breakdown.travel, color: 'bg-purple-500' },
        { label: 'Food', value: breakdown.food, color: 'bg-orange-500' },
        { label: 'Activities', value: breakdown.activities, color: 'bg-green-500' },
        { label: 'Misc.', value: breakdown.miscellaneous, color: 'bg-gray-500' },
    ] : [];

    return (
        <div className="sticky top-24 space-y-6">
            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:border dark:border-gray-700 p-6">
                <div className="flex items-center mb-4">
                    <BriefcaseIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400 mr-3" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Trip Overview</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{itinerary.trip_summary.description}</p>
                <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Key Highlights</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {itinerary.trip_summary.highlights.map((highlight, i) => <li key={i}>{highlight}</li>)}
                    </ul>
                </div>
            </div>
            
            {/* Actions Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:border dark:border-gray-700 p-6">
                <div className="grid grid-cols-1 gap-3">
                    <button onClick={onShare} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2">
                        <ShareIcon className="h-5 w-5" /> Share Trip
                    </button>
                    {isAuthenticated && (
                        <button onClick={onSaveTrip} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2">
                           <CheckCircleIcon className="h-5 w-5" /> Save Trip
                        </button>
                    )}
                </div>
            </div>

            {/* Budget Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:border dark:border-gray-700 p-6">
                 <div className="flex items-center mb-4">
                    <PieChartIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400 mr-3" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Budget Breakdown</h3>
                </div>
                <div className="text-center mb-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <p className="font-semibold text-sm text-gray-600 dark:text-gray-300">Total Estimated Cost</p>
                    <p className="text-3xl font-bold text-cyan-800 dark:text-cyan-300">{formatCurrency(total)}</p>
                </div>
                {details.budget && (
                    <div className={`p-2 mb-4 rounded-lg text-center text-sm ${total > details.budget ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'}`}>
                        Your budget is {formatCurrency(details.budget)}.
                    </div>
                )}
                <div className="space-y-3">
                    {total > 0 && <div className="w-full flex h-4 rounded-full overflow-hidden">
                        {budgetData.map(item => (
                            <div key={item.label} className={item.color} style={{ width: `${(item.value / total) * 100}%` }} title={`${item.label}: ${formatCurrency(item.value)}`}></div>
                        ))}
                    </div>}
                    <div className="grid grid-cols-1 gap-x-4 gap-y-1">
                        {budgetData.map(item => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                    <span className={`h-2.5 w-2.5 rounded-full mr-2 ${item.color}`}></span>
                                    <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                                </div>
                                <span className="font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Travel Alerts */}
            <TravelAlerts tripDetails={details} advisories={advisories} />
            
            {/* New Plan Card */}
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:border dark:border-gray-700 p-6 text-center">
               <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Not what you wanted?</h3>
               <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">You can easily modify your trip details or start a fresh plan.</p>
               <div className="mt-4 grid grid-cols-1 gap-3">
                  <button onClick={onEditTrip} className="w-full bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-900/50 dark:hover:bg-cyan-900 dark:text-cyan-300 font-bold py-2 px-4 rounded-lg transition duration-300">
                    Edit This Trip
                  </button>
                  <button onClick={onPlanNewTrip} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                    Plan a New Trip
                  </button>
               </div>
            </div>
        </div>
    );
}

export default TripSidebar;
