import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { User, SavedTrip, UserPreferences, UserProfileDetails } from '../types';
import SavedTripCard from './SavedTripCard';
import { UserIcon, ArrowLeftIcon, PiggyBankIcon, BuildingIcon, SparklesIcon, PlaneDepartIcon, CheckCircleIcon, SpinnerIcon, EditIcon, MapPinIcon, PhoneIcon, FileTextIcon } from './icons';
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

const SettingsIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

const BellIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);


const UserProfilePage: React.FC<UserProfilePageProps> = ({ user, onLoadTrip, onPlanNewTrip, onBack, canGoBack, onEditTrip, preferences, onPreferencesChange }) => {
    const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
    const [prefsForm, setPrefsForm] = useState<UserPreferences>(preferences);
    const [profileDetails, setProfileDetails] = useState<UserProfileDetails>({});
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [showPrefsSuccess, setShowPrefsSuccess] = useState(false);
    const [showProfileSuccess, setShowProfileSuccess] = useState(false);
    const [departureSuggestions, setDepartureSuggestions] = useState<string[]>([]);
    const [tripToDelete, setTripToDelete] = useState<SavedTrip | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'settings'>('profile');

    useEffect(() => {
        const trips = JSON.parse(localStorage.getItem(`savedTrips_${user.email}`) || '[]');
        setSavedTrips(trips);
        
        const savedProfile = localStorage.getItem(`userProfile_${user.email}`);
        if (savedProfile) {
            setProfileDetails(JSON.parse(savedProfile));
        }
    }, [user.email]);
    
    useEffect(() => {
        setPrefsForm(preferences);
    }, [preferences]);

    const handleDeleteClick = (trip: SavedTrip) => {
        setTripToDelete(trip);
    };

    const confirmDeleteTrip = () => {
        if (tripToDelete) {
            const updatedTrips = savedTrips.filter(trip => trip !== tripToDelete);
            setSavedTrips(updatedTrips);
            localStorage.setItem(`savedTrips_${user.email}`, JSON.stringify(updatedTrips));
            setTripToDelete(null);
        }
    };
    
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfileDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setTimeout(() => {
            localStorage.setItem(`userProfile_${user.email}`, JSON.stringify(profileDetails));
            setIsSavingProfile(false);
            setShowProfileSuccess(true);
            setTimeout(() => setShowProfileSuccess(false), 2500);
        }, 500);
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
        setIsSavingPrefs(true);
        setTimeout(() => {
            onPreferencesChange(prefsForm);
            setIsSavingPrefs(false);
            setShowPrefsSuccess(true);
            setTimeout(() => setShowPrefsSuccess(false), 2500);
        }, 500);
    };

    const interestOptions = ['History', 'Food', 'Hiking', 'Art', 'Nightlife', 'Shopping', 'Beaches', 'Adventure', 'Relaxation', 'Museums', 'Nature', 'Sports'];
    const travelStyleDetails = {
      Economy: { icon: PiggyBankIcon, description: "Budget-friendly" },
      Standard: { icon: BuildingIcon, description: "Balanced" },
      Luxury: { icon: SparklesIcon, description: "High-end" },
    };
    
    const hasPrefsChanges = JSON.stringify(preferences) !== JSON.stringify(prefsForm);

    const totalTrips = savedTrips.length;
    const totalDays = savedTrips.reduce((acc, trip) => acc + trip.details.duration, 0);
    const uniqueDestinations = new Set(savedTrips.map(trip => trip.details.destination)).size;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 pt-20 md:pt-24 transition-colors duration-300 pb-20">
            <div className="container mx-auto max-w-6xl space-y-8">
                
                {/* Advanced Header with Cover Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 group">
                    <div className="h-48 md:h-64 w-full bg-gradient-to-r from-cyan-600 to-indigo-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50 transition-transform duration-700 group-hover:scale-105"></div>
                    </div>
                    
                    {canGoBack && (
                        <button 
                            onClick={onBack}
                            className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10"
                            aria-label="Go back"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                    )}

                    <div className="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end md:justify-between gap-4 -mt-16 md:-mt-20">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full md:w-auto text-center md:text-left z-10">
                            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center text-cyan-600 dark:text-cyan-400 overflow-hidden shadow-xl shrink-0">
                                <UserIcon className="h-16 w-16" />
                            </div>
                            <div className="pb-2">
                                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1 font-serif tracking-tight">
                                    {profileDetails.fullName || user.email.split('@')[0]}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2 text-sm font-medium">
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Banner inside header */}
                        <div className="flex bg-white dark:bg-gray-800 rounded-xl p-3 shadow-md border border-gray-100 dark:border-gray-700 gap-6 w-full md:w-auto justify-center md:justify-end z-10 mt-4 md:mt-0">
                            <div className="text-center px-4 border-r border-gray-100 dark:border-gray-700">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTrips}</p>
                                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Journeys</p>
                            </div>
                            <div className="text-center px-4 border-r border-gray-100 dark:border-gray-700">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueDestinations}</p>
                                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Places</p>
                            </div>
                            <div className="text-center px-4">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDays}</p>
                                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Days</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 no-scrollbar gap-8">
                    <button onClick={() => setActiveTab('profile')} className={`pb-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === 'profile' ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-600 dark:border-cyan-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>Overview & Detail</button>
                    <button onClick={() => setActiveTab('preferences')} className={`pb-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === 'preferences' ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-600 dark:border-cyan-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>Travel Preferences</button>
                    <button onClick={() => setActiveTab('settings')} className={`pb-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-600 dark:border-cyan-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>Account Settings</button>
                </div>
                
                <AnimatePresence mode="wait">
                {/* Profile Overview Tab */}
                {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="space-y-8">
                        {/* Interactive Travel Passport Card */}
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-slate-950 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden border border-indigo-500/30">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            </div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-[0.2em] mb-1">Travel Passport</h3>
                                    <p className="text-2xl font-serif">{profileDetails.fullName || 'Traveler'}</p>
                                </div>
                                <div className="w-12 h-16 border border-indigo-400/50 rounded flex items-center justify-center bg-indigo-800/30">
                                    <UserIcon className="h-6 w-6 text-indigo-300" />
                                </div>
                            </div>
                            
                            <form onSubmit={handleSaveProfile} className="space-y-4 relative z-10">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-indigo-300 mb-1">Full Name</label>
                                    <input type="text" name="fullName" value={profileDetails.fullName || ''} onChange={handleProfileChange} placeholder="Enter name" className="w-full bg-transparent border-b border-indigo-500/50 text-white focus:border-indigo-300 outline-none py-1 text-sm transition-colors" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-indigo-300 mb-1">Base Camp</label>
                                        <input type="text" name="location" value={profileDetails.location || ''} onChange={handleProfileChange} placeholder="City, Country" className="w-full bg-transparent border-b border-indigo-500/50 text-white focus:border-indigo-300 outline-none py-1 text-sm transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-indigo-300 mb-1">Contact</label>
                                        <input type="tel" name="phone" value={profileDetails.phone || ''} onChange={handleProfileChange} placeholder="+xx xxxxxxxxxx" className="w-full bg-transparent border-b border-indigo-500/50 text-white focus:border-indigo-300 outline-none py-1 text-sm transition-colors" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-indigo-300 mb-1">Travel Manifesto</label>
                                    <textarea name="bio" value={profileDetails.bio || ''} onChange={handleProfileChange} placeholder="What drives you to explore?" className="w-full bg-transparent border border-indigo-500/50 rounded text-white focus:border-indigo-300 outline-none p-2 text-sm transition-colors resize-none h-16" />
                                </div>
                                
                                <button type="submit" disabled={isSavingProfile || showProfileSuccess} className={`w-full text-xs font-bold uppercase tracking-wider py-2 rounded border transition-all ${showProfileSuccess ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-white/10 text-white hover:bg-white/20 border-white/20 hover:border-white/40'}`}>
                                    {isSavingProfile ? <SpinnerIcon className="h-4 w-4 animate-spin mx-auto" /> : showProfileSuccess ? 'Updated' : 'Stamp Passport'}
                                </button>
                            </form>
                        </div>

                        {/* Achievements / Badges */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 font-serif">
                                <TrophyIcon className="h-5 w-5 text-yellow-500" /> Milestone Badges
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className={`flex flex-col items-center text-center gap-2 p-3 rounded-xl border ${totalTrips > 0 ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700 opacity-50 grayscale'}`}>
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-600 dark:text-yellow-400 shadow-sm">
                                        <PlaneDepartIcon className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-gray-600 dark:text-gray-400">First Flight</span>
                                </div>
                                <div className={`flex flex-col items-center text-center gap-2 p-3 rounded-xl border ${totalTrips >= 5 ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700 opacity-50 grayscale'}`}>
                                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
                                        <SparklesIcon className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-gray-600 dark:text-gray-400">Explorer V</span>
                                </div>
                                <div className={`flex flex-col items-center text-center gap-2 p-3 rounded-xl border ${uniqueDestinations > 3 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700 opacity-50 grayscale'}`}>
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                        <MapPinIcon className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-gray-600 dark:text-gray-400">Globetrotter</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Trips */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">Your Adventures</h2>
                            <button onClick={onPlanNewTrip} className="text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/30 px-4 py-2 rounded-lg transition-colors">
                                + Plan explicitly
                            </button>
                        </div>

                        {savedTrips.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <AnimatePresence>
                                {savedTrips.map((trip, index) => (
                                    <motion.div key={index} className="h-full" layout>
                                        <SavedTripCard 
                                            trip={trip} 
                                            onLoad={() => onLoadTrip(trip, index)} 
                                            onDelete={handleDeleteClick} 
                                            onEdit={onEditTrip}
                                        />
                                    </motion.div>
                                ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6 bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 border-dashed border-2">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <PlaneDepartIcon className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">The map is blank</h3>
                                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Your journey awaits. Start generating AI-crafted itineraries to build your personal travel vault.</p>
                                <button onClick={onPlanNewTrip} className="mt-8 bg-cyan-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-cyan-500/25 hover:bg-cyan-700 transition-all duration-300 transform hover:-translate-y-1">
                                    Start Planning
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                </motion.div>
                )}
                
                {/* Travel Preferences Tab */}
                {activeTab === 'preferences' && (
                    <motion.div key="preferences" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 max-w-4xl mx-auto">
                        <div className="mb-8 text-center">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                                <SparklesIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">Algorithm Tuners</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Adjust these settings to guide the AI when generating your next adventure.</p>
                        </div>
                        
                        <form onSubmit={handleSavePreferences}>
                            <div className="space-y-8">
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <label htmlFor="defaultDepartureCity" className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Origin Base</label>
                                    <div className="relative">
                                        <PlaneDepartIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                                        <input 
                                            type="text"
                                            id="defaultDepartureCity"
                                            name="defaultDepartureCity"
                                            placeholder="Where do your journeys begin? (e.g., Delhi)"
                                            value={prefsForm.defaultDepartureCity || ''}
                                            onChange={handlePrefsDepartureChange}
                                            onBlur={() => setTimeout(() => setDepartureSuggestions([]), 150)}
                                            className="form-input w-full pl-12 pr-4 py-3 text-lg font-medium border rounded-xl focus:outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:border-cyan-500 shadow-sm"
                                            autoComplete="off"
                                        />
                                        {departureSuggestions.length > 0 && (
                                            <ul className="absolute z-20 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-xl mt-1 max-h-60 overflow-y-auto shadow-xl">
                                                {departureSuggestions.map((city) => (
                                                    <li 
                                                        key={city} 
                                                        className="px-5 py-3 cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-900/30 font-medium transition-colors"
                                                        onMouseDown={() => handleSelectDeparture(city)}
                                                    >
                                                        {city}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pacing & Luxury</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(Object.keys(travelStyleDetails) as Array<keyof typeof travelStyleDetails>).map((style) => {
                                            const { icon: Icon, description } = travelStyleDetails[style];
                                            const isSelected = prefsForm.defaultTravelStyle === style;
                                            return (
                                                <label key={style} className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 shadow-md transform -translate-y-1' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-cyan-300 dark:hover:border-cyan-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                                                    <input type="radio" name="defaultTravelStyle" value={style} checked={isSelected} onChange={() => setPrefsForm(p => ({...p, defaultTravelStyle: style}))} className="sr-only" />
                                                    <Icon className={`h-8 w-8 mb-3 transition-colors ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-400'}`} />
                                                    <span className={`font-bold text-lg mb-1 transition-colors ${isSelected ? 'text-cyan-800 dark:text-cyan-300' : 'text-gray-700 dark:text-gray-300'}`}>{style}</span>
                                                    <span className="text-xs text-center text-gray-500">{description}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Core Interests</label>
                                    <div className="flex flex-wrap gap-3">
                                        {interestOptions.map(interest => (
                                            <button
                                              type="button"
                                              key={interest}
                                              onClick={() => handleInterestToggle(interest)}
                                              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all transform active:scale-95 duration-200 ${
                                                  prefsForm.defaultInterests?.includes(interest)
                                                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20 ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-gray-900 border-none'
                                                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400'
                                              }`}
                                            >
                                              {interest}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={isSavingPrefs || showPrefsSuccess || !hasPrefsChanges}
                                    className={`py-3 px-8 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[200px]
                                    ${showPrefsSuccess ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-700 hover:shadow-cyan-500/40 hover:-translate-y-1'}
                                    ${isSavingPrefs || !hasPrefsChanges ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
                                >
                                    {isSavingPrefs ? <SpinnerIcon className="h-5 w-5 animate-spin" /> : showPrefsSuccess ? <><CheckCircleIcon className="h-5 w-5 mr-2" /> Synced perfectly</> : 'Update Blueprint'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
                )}
                
                {/* Account Settings Tab */}
                {activeTab === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                                    <BellIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Notifications</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-200">Trip Reminders</p>
                                        <p className="text-sm text-gray-500">Get alerted 2 days before a planned trip.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer: cursor-not-allowed opacity-50">
                                        <input type="checkbox" className="sr-only peer" disabled />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-200">Travel Newsletter</p>
                                        <p className="text-sm text-gray-500">Weekly curations of hidden gems.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer: cursor-not-allowed opacity-50">
                                        <input type="checkbox" className="sr-only peer" disabled checked />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                    </label>
                                </div>
                                
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl mt-4">
                                    <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">Notification settings are currently read-only in this beta version.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                    <SettingsIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Account Data</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">Email Address</p>
                                    <p className="text-gray-500 bg-gray-50 dark:bg-gray-900 py-2 px-3 rounded border border-gray-100 dark:border-gray-700">{user.email}</p>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <p className="font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</p>
                                    <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all saved itineraries. This cannot be undone.</p>
                                    <button className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-lg transition-colors border border-red-200 dark:border-red-800">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    </motion.div>
                )}
                </AnimatePresence>
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
