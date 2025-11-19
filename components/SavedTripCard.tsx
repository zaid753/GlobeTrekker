import React from 'react';
import type { SavedTrip } from '../types';
import { CalendarIcon, GlobeIcon, TrashIcon, ArrowRightIcon, EditIcon } from './icons';

interface SavedTripCardProps {
    trip: SavedTrip;
    onLoad: (trip: SavedTrip) => void;
    onDelete: (trip: SavedTrip) => void;
    onEdit: (trip: SavedTrip) => void;
}

const SavedTripCard: React.FC<SavedTripCardProps> = ({ trip, onLoad, onDelete, onEdit }) => {
    const { details, itinerary } = trip;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl dark:hover:border-cyan-500/50 group flex flex-col justify-between h-full">
            <div className="p-4">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate w-full">{itinerary.trip_title}</h3>
                <div className="mt-2 flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <GlobeIcon className="h-4 w-4 mr-2" />
                    <span>{details.destination}</span>
                </div>
                <div className="mt-1 flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{details.duration} days ({details.startDate} to {details.endDate})</span>
                </div>
            </div>
                
            <div className="p-4 mt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-2">
                <button
                    onClick={() => onLoad(trip)}
                    className="bg-cyan-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-cyan-700 transition-all duration-300 transform active:scale-95 flex items-center text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-offset-gray-800"
                >
                    View <ArrowRightIcon className="h-4 w-4 ml-1.5" />
                </button>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onEdit(trip)}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2 px-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 transform active:scale-95 flex items-center text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-offset-gray-800"
                        aria-label="Edit trip"
                    >
                        <EditIcon className="h-4 w-4 mr-1.5" /> Edit
                    </button>
                    <button
                        onClick={() => onDelete(trip)}
                        className="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 dark:focus-visible:ring-offset-gray-800"
                        aria-label="Delete trip"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SavedTripCard;