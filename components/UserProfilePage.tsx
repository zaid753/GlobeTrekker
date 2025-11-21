
import React, { useState, useEffect } from 'react';
import type { User, SavedTrip, UserPreferences } from '../types';
import SavedTripCard from './SavedTripCard';
import { UserIcon, ArrowLeftIcon, PiggyBankIcon, BuildingIcon, SparklesIcon, PlaneDepartIcon, CheckCircleIcon, SpinnerIcon } from './icons';
import { cities } from '../data/cities';
import ConfirmationModal from './ConfirmationModal';

interface UserProfilePageProps {
    user: User;
    onLoadTrip: (trip: SavedTrip, index: number) => void;
    onPlanNewTrip: () => void;
    onBack: () => void;
    canGoBack: boolean;
    onEditTrip: (trip: SavedTrip) => void;
    preferences: UserPreferences;
    onPreferencesChange: (prefs: UserPreferences) => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ user, onLoadTrip, onPlanNewTrip, onBack, canGoBack, onEditTrip, preferences, onPreferencesChange }) => {
    const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
    const [prefsForm, setPrefsForm] = useState<UserPreferences>(preferences);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [departureSuggestions, setDepartureSuggestions] = useState<string[]>([]);
    const [tripToDelete, setTripToDelete] = useState<SavedTrip | null>(null);

    useEffect(() => {
        const trips = JSON.parse(localStorage.getItem(`savedTrips_${user.email}`) || '[]');
        setSavedTrips(trips);
    }, [user.email]);
    
    useEffect(() => {
        setPrefsForm(preferences);
    }, [preferences]);

    const handleDeleteClick = (trip: SavedTrip) => {
        setTripToDelete(trip);
    };

    const confirmDeleteTrip = () => {
        if (tripToDelete) {
            const updatedTrips = savedTrips.filter(trip => 
                JSON.stringify(trip.details) !== JSON.stringify(tripToDelete.details)
            );
            setSavedTrips(updatedTrips);
            localStorage.setItem(`savedTrips_${user.email}`, JSON.stringify(updatedTrips));
            setTripToDelete(null);
        }
    };
    
    const handlePrefsDepartureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPrefsForm(prev => ({ ...prev, [name]: value }));
        
        if (value.trim().length > 0) {
            setDepartureSuggestions(
                cities.filter(city => city.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
            );
        } else {
            setDepartureSuggestions([]);
        }
    };

    const handleSelectDeparture = (city: string) => {
        setPrefsForm(prev => ({ ...prev, defaultDepartureCity: city }));
        setDepartureSuggestions([]);
    };

    const handleInterestToggle = (interest: string) => {
        const currentInterests = prefsForm.defaultInterests || [];
        const newInterests = currentInterests.includes(interest)
            ? currentInterests.filter(i => i !== interest)
            : [...currentInterests, interest];
        setPrefsForm(prev => ({ ...prev, defaultInterests: newInterests }));
    };
    
    const handleSavePreferences = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate a short delay for better UX
        setTimeout(() => {
            onPreferencesChange(prefsForm);
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2500);
        }, 500);
    };

    const interestOptions = ['History', 'Food', 'Hiking', 'Art', 'Nightlife', 'Shopping', 'Beaches', 'Adventure', 'Relaxation', 'Museums', 'Nature', 'Sports'];
    const travelStyleDetails = {
      Economy: { icon: PiggyBankIcon, description: "Budget-friendly" },
      Standard: { icon: BuildingIcon, description: "Balanced" },
      Luxury: { icon: SparklesIcon, description: "High-end" },
    };
    
    const hasChanges = JSON.stringify(preferences) !== JSON.stringify(prefsForm);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 pt-24 md:pt-28 transition-colors duration-300">
            <div className="container mx-auto max-w-6xl space-y-10">
                <header className="relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:border dark:border-gray-700 flex items-center gap-4">
                    {canGoBack && (
                        <button 
                            onClick={onBack}
                            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeftIcon className="h-7 w-7" />
                        </button>
                    )}
                    <UserIcon className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                </header>
                
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">My Travel Preferences</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:border dark:border-gray-700 p-6">
                        <form onSubmit={handleSavePreferences}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <label htmlFor="defaultDepartureCity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Departure City</label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">This will be your starting point for new trip plans.</p>
                                    <div className="relative">
                                        <PlaneDepartIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                                        <input 
                                            type="text"
                                            id="defaultDepartureCity"
                                            name="defaultDepartureCity"
                                            placeholder="e.g., Mumbai"
                                            value={prefsForm.defaultDepartureCity || ''}
                                            onChange={handlePrefsDepartureChange}
                                            onBlur={() => setTimeout(() => setDepartureSuggestions([]), 150)}
                                            className="form-input w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none transition-all bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                                            autoComplete="off"
                                        />
                                        {departureSuggestions.length > 0 && (
                                            <ul className="absolute z-20 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-b-lg mt-0 max-h-60 overflow-y-auto shadow-lg">
                                                {departureSuggestions.map((city) => (
                                                    <li 
                                                        key={city} 
                                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        onMouseDown={() => handleSelectDeparture(city)}
                                                    >
                                                        {city}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Travel Style</label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-2">Sets the default mood for your travels.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {(Object.keys(travelStyleDetails) as Array<keyof typeof travelStyleDetails>).map((style) => {
                                            const { icon: Icon } = travelStyleDetails[style];
                                            const isSelected = prefsForm.defaultTravelStyle === style;
                                            return (
                                                <label key={style} className={`relative flex flex-col items-center justify-center text-center p-3 border-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/50' : 'border-gray-300 dark:border-gray-600 hover:border-cyan-400'}`}>
                                                    <input type="radio" name="defaultTravelStyle" value={style} checked={isSelected} onChange={() => setPrefsForm(p => ({...p, defaultTravelStyle: style}))} className="sr-only" />
                                                    <Icon className={`h-6 w-6 mb-1 ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500'}`} />
                                                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{style}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Interests</label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">We'll use these to suggest activities you'll love.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {interestOptions.map(interest => (
                                            <button
                                              type="button"
                                              key={interest}
                                              onClick={() => handleInterestToggle(interest)}
                                              className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all transform active:scale-95 duration-200 ${
                                                prefsForm.defaultInterests?.includes(interest)
                                                  ? 'bg-cyan-600 text-white shadow-sm'
                                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                                              }`}
                                            >
                                              {interest}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end items-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button 
                                    type="submit" 
                                    disabled={isSaving || showSuccess || !hasChanges}
                                    className={`font-semibold py-2 px-5 rounded-lg transition-all duration-300 transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 flex items-center justify-center w-36
                                    ${showSuccess ? 'bg-green-600 text-white' : 'bg-cyan-600 text-white hover:bg-cyan-700'}
                                    ${isSaving || !hasChanges ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {isSaving ? (
                                        <SpinnerIcon className="h-5 w-5 animate-spin" />
                                    ) : showSuccess ? (
                                        <><CheckCircleIcon className="h-5 w-5 mr-1.5" /> Saved!</>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">My Saved Trips</h2>
                    {savedTrips.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedTrips.map((trip, index) => (
                                <div key={index}>
                                    <SavedTripCard 
                                        trip={trip} 
                                        onLoad={() => onLoadTrip(trip, index)} 
                                        onDelete={handleDeleteClick} 
                                        onEdit={onEditTrip}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:border dark:border-gray-700">
                            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">No trips saved yet!</h2>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">Start planning your next adventure to see your saved itineraries here.</p>
                             <button
                                onClick={onPlanNewTrip}
                                className="mt-6 bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-all duration-300 transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-offset-gray-800"
                            >
                                Plan a New Trip
                            </button>
                        </div>
                    )}
                </section>
                
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">My Travel History</h2>
                    <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:border dark:border-gray-700">
                         <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Feature Coming Soon!</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Soon you'll be able to mark trips as completed and see your travel history here.</p>
                    </div>
                </section>
            </div>
            
            <ConfirmationModal
                isOpen={!!tripToDelete}
                title="Delete Trip"
                message={`Are you sure you want to delete "${tripToDelete?.itinerary.trip_title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmDeleteTrip}
                onCancel={() => setTripToDelete(null)}
                isDestructive={true}
            />
        </div>
    );
};

export default UserProfilePage;
