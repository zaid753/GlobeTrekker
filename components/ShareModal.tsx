import React, { useState, useMemo, useEffect } from 'react';
import type { Itinerary, TripDetails } from '../types';
import { CloseIcon, CheckCircleIcon, ShareIcon } from './icons';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    itinerary: Itinerary;
    details: TripDetails;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, itinerary, details }) => {
    const [selections, setSelections] = useState({
        summary: true,
        itinerary: true,
        days: itinerary.schedule.map(() => true),
        accommodation: true,
        transportation: true,
        food: true,
        weather: true,
        budget: true,
    });
    const [generatedLink, setGeneratedLink] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        // Reset state when modal is opened
        if (isOpen) {
            setSelections({
                summary: true,
                itinerary: true,
                days: itinerary.schedule.map(() => true),
                accommodation: true,
                transportation: true,
                food: true,
                weather: true,
                budget: true,
            });
            setGeneratedLink('');
            setIsCopied(false);
        }
    }, [isOpen, itinerary]);
    
    const handleMainSelectionChange = (key: keyof typeof selections, value: boolean) => {
        setSelections(prev => ({ ...prev, [key]: value }));
    };

    const handleDaySelectionChange = (index: number, value: boolean) => {
        setSelections(prev => {
            const newDays = [...prev.days];
            newDays[index] = value;
            return { ...prev, days: newDays };
        });
    };
    
    const toggleSelectAll = (select: boolean) => {
        setSelections({
            summary: select,
            itinerary: select,
            days: itinerary.schedule.map(() => select),
            accommodation: select,
            transportation: select,
            food: select,
            weather: select,
            budget: select,
        });
    };

    const handleGenerateLink = () => {
        const filteredItinerary: Itinerary = JSON.parse(JSON.stringify(itinerary));

        if (!selections.summary) {
            filteredItinerary.trip_summary = { description: 'Not shared.', highlights: [] };
        }
        if (!selections.accommodation) {
            filteredItinerary.accommodation_recommendations = { budget: [], standard: [], luxury: [] };
        }
        if (!selections.transportation) {
            filteredItinerary.transportation_options = { long_distance_options: [], local_suggestions: [] };
        }
        if (!selections.food) {
            filteredItinerary.food_recommendations = { restaurants: [], local_specialties: [], ai_foodie_tip: 'Not shared.' };
        }
        if (!selections.weather) {
            filteredItinerary.weather_forecast = { daily_forecasts: [], packing_recommendation: 'Not shared.', weekly_summary: 'Not shared.' };
        }
        if (!selections.budget) {
            filteredItinerary.total_estimated_cost = 0;
            filteredItinerary.detailed_cost_breakdown = { stay: 0, travel: 0, food: 0, activities: 0, miscellaneous: 0 };
        }
        
        if (!selections.itinerary) {
            filteredItinerary.schedule = [];
        } else {
            filteredItinerary.schedule = itinerary.schedule.filter((_, index) => selections.days[index]);
        }

        // Create a storable version without image data to prevent storage quota errors
        const storableItinerary = {
            ...filteredItinerary,
            schedule: filteredItinerary.schedule.map(({ imageUrl, imageLoading, ...day }) => day),
        };
        
        // Use a more robust unique ID
        const shareId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        try {
            localStorage.setItem(`trip_${shareId}`, JSON.stringify({ details, itinerary: storableItinerary }));
            const shareUrl = `${window.location.origin}${window.location.pathname}?tripId=${shareId}`;
            setGeneratedLink(shareUrl);
        } catch (e) {
            alert("Could not save shared trip. Your browser's storage may be full.");
            console.error("Error saving to local storage:", e);
        }
    };
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Trip Plan: ${itinerary.trip_title}`,
                    text: `Check out this trip I planned to ${details.destination}!`,
                    url: generatedLink,
                });
            } catch (error) {
                console.error("Error using Web Share API:", error);
            }
        }
    };


    if (!isOpen) return null;

    const Checkbox = ({ id, checked, onChange, label }: { id: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string }) => (
        <div className="flex items-center">
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor={id} className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {label}
            </label>
        </div>
    );
    
    const allSelected = Object.values(selections).every(val => Array.isArray(val) ? val.every(Boolean) : val);
    const noneSelected = Object.values(selections).every(val => Array.isArray(val) ? val.every(v => !v) : !val);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:border dark:border-gray-700 p-6 max-w-2xl w-full relative max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 z-10">
                    <CloseIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center mb-4 pb-4 border-b dark:border-gray-700">
                    <ShareIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mr-3" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Customize Your Shared Trip</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Select the sections you want to include in your shareable link.</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                     <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Select Sections</p>
                        <div className="flex gap-2">
                           <button onClick={() => toggleSelectAll(true)} disabled={allSelected} className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform">Select All</button>
                           <button onClick={() => toggleSelectAll(false)} disabled={noneSelected} className="text-xs font-medium text-gray-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform">Deselect All</button>
                        </div>
                     </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                       <Checkbox id="summary" checked={selections.summary} onChange={(e) => handleMainSelectionChange('summary', e.target.checked)} label="Trip Summary" />
                       <Checkbox id="accommodation" checked={selections.accommodation} onChange={(e) => handleMainSelectionChange('accommodation', e.target.checked)} label="Accommodation" />
                       <Checkbox id="transportation" checked={selections.transportation} onChange={(e) => handleMainSelectionChange('transportation', e.target.checked)} label="Transportation" />
                       <Checkbox id="food" checked={selections.food} onChange={(e) => handleMainSelectionChange('food', e.target.checked)} label="Food Guide" />
                       <Checkbox id="weather" checked={selections.weather} onChange={(e) => handleMainSelectionChange('weather', e.target.checked)} label="Weather Forecast" />
                       <Checkbox id="budget" checked={selections.budget} onChange={(e) => handleMainSelectionChange('budget', e.target.checked)} label="Budget Breakdown" />
                    </div>
                    
                    <div className="pt-2">
                        <Checkbox id="itinerary" checked={selections.itinerary} onChange={(e) => handleMainSelectionChange('itinerary', e.target.checked)} label="Daily Itinerary" />
                        {selections.itinerary && (
                            <div className="mt-2 pl-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-l-2 ml-2 pl-4 border-gray-200 dark:border-gray-600">
                                {itinerary.schedule.map((day, index) => (
                                    <div key={day.day}>
                                        <Checkbox
                                            id={`day-${day.day}`}
                                            checked={selections.days[index]}
                                            onChange={(e) => handleDaySelectionChange(index, e.target.checked)}
                                            label={`Day ${day.day}: ${day.title}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 mt-4 border-t dark:border-gray-700">
                    {generatedLink ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your custom link is ready:</label>
                            <div className="flex gap-2 mt-1">
                                <input type="text" readOnly value={generatedLink} className="form-input w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
                                {navigator.share && (
                                    <button
                                        onClick={handleNativeShare}
                                        className="font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center text-sm bg-cyan-600 text-white hover:bg-cyan-700"
                                        aria-label="Share via native dialog"
                                    >
                                        <ShareIcon className="h-5 w-5 mr-1.5"/>
                                        Share
                                    </button>
                                )}
                                <button
                                    onClick={handleCopyLink}
                                    className={`w-28 flex-shrink-0 font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center text-sm
                                    ${isCopied ? 'bg-green-600 text-white' : (navigator.share ? 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100' : 'bg-cyan-600 text-white hover:bg-cyan-700')}`}
                                    aria-label="Copy link to clipboard"
                                >
                                    {isCopied ? <><CheckCircleIcon className="h-5 w-5 mr-1.5"/> Copied!</> : 'Copy'}
                                </button>
                            </div>
                        </div>
                    ) : (
                         <button 
                            onClick={handleGenerateLink} 
                            className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 transition-all duration-300 transform active:scale-95 flex items-center justify-center"
                         >
                            <ShareIcon className="h-5 w-5 mr-2"/>
                            Generate Share Link
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;