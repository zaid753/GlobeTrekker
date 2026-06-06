
import React from 'react';
import { motion } from 'motion/react';
import type { SavedTrip } from '../types';
import { CalendarIcon, GlobeIcon, TrashIcon, ArrowRightIcon, EditIcon } from './icons';
import { getDummyImageUrl } from '../services/geminiService';

interface SavedTripCardProps {
    trip: SavedTrip;
    onLoad: (trip: SavedTrip) => void;
    onDelete: (trip: SavedTrip) => void;
    onEdit: (trip: SavedTrip) => void;
}

const SavedTripCard: React.FC<SavedTripCardProps> = ({ trip, onLoad, onDelete, onEdit }) => {
    const { details, itinerary } = trip;
    const coverImage = getDummyImageUrl(details.destination, "iconic landmark", 1, 'banner');

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:border dark:border-gray-700 overflow-hidden transition-shadow duration-300 hover:shadow-2xl dark:hover:border-cyan-500/50 group flex flex-col h-full"
        >
            <div className="relative h-40 overflow-hidden">
                <img 
                    src={coverImage} 
                    alt={details.destination} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"></div>
                <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold text-white truncate shadow-sm font-serif">{itinerary.trip_title}</h3>
                </div>
            </div>
            
            <div className="p-4 flex-grow flex flex-col justify-between">
                <div className="space-y-2">
                    <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                        <GlobeIcon className="h-4 w-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                        <span className="font-medium">{details.destination}</span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                        <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                        <span>{details.startDate} • {details.duration} Days</span>
                    </div>
                </div>
                
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
                    <button
                        onClick={() => onLoad(trip)}
                        className="bg-cyan-600 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-cyan-700 transition-all duration-300 transform active:scale-95 flex items-center text-xs shadow-sm"
                    >
                        View <ArrowRightIcon className="h-3 w-3 ml-1.5" />
                    </button>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onEdit(trip)}
                            className="p-2 text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-full transition-colors"
                            title="Edit Trip"
                        >
                            <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete(trip)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                            title="Delete Trip"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SavedTripCard;
