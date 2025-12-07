
import React, { useState, useEffect } from 'react';
import type { TripDetails, UserPreferences } from '../types';
import { 
  GlobeIcon, CalendarIcon, UsersIcon, ArrowLeftIcon, 
  PiggyBankIcon, BuildingIcon, SparklesIcon, PlaneDepartIcon, MapPinIcon, CheckCircleIcon, TrashIcon
} from './icons';
import { cities } from '../data/cities';

interface TripFormProps {
  onSubmit: (details: TripDetails) => void;
  isLoading: boolean;
  initialDetails?: TripDetails | null;
  onBack: () => void;
  canGoBack: boolean;
  userPreferences?: UserPreferences;
}

const TripForm: React.FC<TripFormProps> = ({ onSubmit, isLoading, initialDetails, onBack, canGoBack, userPreferences }) => {
  // Initialize state with initialDetails (edit mode) -> userPreferences (defaults) -> empty/default
  const [departureCity, setDepartureCity] = useState(initialDetails?.departureCity || userPreferences?.defaultDepartureCity || '');
  const [startDate, setStartDate] = useState(initialDetails?.startDate || '');
  const [endDate, setEndDate] = useState(initialDetails?.endDate || '');
  const [travellers, setTravellers] = useState(initialDetails?.travellers || 1);
  const [travelStyle, setTravelStyle] = useState<'Economy' | 'Standard' | 'Luxury'>(initialDetails?.travelStyle || userPreferences?.defaultTravelStyle || 'Standard');
  const [budget, setBudget] = useState<number | undefined>(initialDetails?.budget);
  const [interests, setInterests] = useState<string[]>(initialDetails?.interests || userPreferences?.defaultInterests || []);
  const [customInterest, setCustomInterest] = useState('');
  const [duration, setDuration] = useState<number | null>(initialDetails?.duration || null);
  
  // Multi-destination state
  const [destinations, setDestinations] = useState<string[]>(
      initialDetails?.destination ? initialDetails.destination.split(', ') : []
  );
  const [currentDestinationInput, setCurrentDestinationInput] = useState('');
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [departureSuggestions, setDepartureSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDuration(diffDays);
        setErrors(prev => ({ ...prev, dates: null }));
      } else {
        setDuration(null);
        setErrors(prev => ({ ...prev, dates: "End date must be on or after start date." }));
      }
    } else {
      setDuration(null);
    }
  }, [startDate, endDate]);

  const handleDateChange = (newStart: string, newEnd: string) => {
      setStartDate(newStart);
      // If new start is after current end, reset end
      if (newStart && newEnd && new Date(newStart) > new Date(newEnd)) {
          setEndDate('');
      } else {
          setEndDate(newEnd);
      }
  };

  const handleDepartureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDepartureCity(value);
    if (value.trim().length > 0) {
        const lowerCaseValue = value.toLowerCase();
        const startsWith = cities.filter(city => city.toLowerCase().startsWith(lowerCaseValue));
        const includes = cities.filter(city => !city.toLowerCase().startsWith(lowerCaseValue) && city.toLowerCase().includes(lowerCaseValue));
        setDepartureSuggestions([...startsWith, ...includes].slice(0, 5));
    } else {
        setDepartureSuggestions([]);
    }
  };

  const handleSelectDeparture = (city: string) => {
    setDepartureCity(city);
    setDepartureSuggestions([]);
  };
  
  const handleDestinationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentDestinationInput(value);
    if (value.trim().length > 0) {
        const lowerCaseValue = value.toLowerCase();
        const startsWith = cities.filter(city => city.toLowerCase().startsWith(lowerCaseValue));
        const includes = cities.filter(city => !city.toLowerCase().startsWith(lowerCaseValue) && city.toLowerCase().includes(lowerCaseValue));
        setDestinationSuggestions([...startsWith, ...includes].slice(0, 5));
    } else {
        setDestinationSuggestions([]);
    }
  };

  const addDestination = (city: string) => {
      if (city && !destinations.includes(city)) {
          setDestinations([...destinations, city]);
          setCurrentDestinationInput('');
          setDestinationSuggestions([]);
      }
  };
  
  const removeDestination = (city: string) => {
      setDestinations(destinations.filter(d => d !== city));
  };

  const handleSelectDestinationSuggestion = (city: string) => {
      addDestination(city);
  };

  const handleDestinationKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          addDestination(currentDestinationInput);
      }
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow clearing the input
    if (value === '') {
        setBudget(undefined);
        setErrors(prev => ({ ...prev, budget: null }));
        return;
    }
    
    // Regex validation: Allows only digits (positive integers)
    // This prevents negative signs, decimals, or any non-numeric characters
    if (!/^\d+$/.test(value)) {
        return;
    }

    const numValue = parseInt(value, 10);
    
    if (numValue < 0) {
      setErrors(prev => ({ ...prev, budget: "Budget cannot be negative." }));
    } else {
      setErrors(prev => ({ ...prev, budget: null }));
    }
    setBudget(numValue);
  };
  
  const handleInterestToggle = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };
  
  const handleAddCustomInterest = () => {
    const trimmedInterest = customInterest.trim();
    if (trimmedInterest && !interests.includes(trimmedInterest)) {
      setInterests(prev => [...prev, trimmedInterest]);
      setCustomInterest('');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const inputStyles = "form-input w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-all bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 dark:focus:ring-cyan-400/50 dark:focus:border-cyan-400 text-base";

  const travelStyleDetails = {
      Economy: { icon: PiggyBankIcon, description: "Budget-friendly stays and transport." },
      Standard: { icon: BuildingIcon, description: "Comfortable balance of cost and quality." },
      Luxury: { icon: SparklesIcon, description: "High-end hotels and premium experiences." },
  }

  const steps = [
    { id: 1, name: 'The Basics', icon: MapPinIcon },
    { id: 2, name: 'Traveler Details', icon: UsersIcon },
    { id: 3, name: 'Budget & Interests', icon: SparklesIcon },
  ];

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string | null } = {};
    switch (step) {
      case 1:
        if (!departureCity) newErrors.departureCity = "Departure city is required.";
        if (destinations.length === 0) newErrors.destination = "At least one destination is required.";
        if (!startDate) newErrors.startDate = "Start date is required.";
        if (!endDate) newErrors.endDate = "End date is required.";
        if (duration === null || duration <= 0) newErrors.dates = "End date must be on or after start date.";
        break;
      case 2:
        if (!travellers || travellers <= 0) newErrors.travellers = "At least one traveler is required.";
        break;
      case 3:
        if (interests.length === 0) newErrors.interests = "Please select at least one interest.";
        if (budget !== undefined && budget < 0) newErrors.budget = "Budget cannot be negative.";
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isStep1Valid = validateStep(1);
    const isStep2Valid = validateStep(2);
    const isStep3Valid = validateStep(3);

    if (isStep1Valid && isStep2Valid && isStep3Valid) {
        onSubmit({ 
            destination: destinations.join(', '), 
            departureCity, 
            startDate, 
            endDate, 
            travellers, 
            travelStyle, 
            budget, 
            interests, 
            duration: duration! 
        });
    } else {
        if (!isStep1Valid) setCurrentStep(1);
        else if (!isStep2Valid) setCurrentStep(2);
        else if (!isStep3Valid) setCurrentStep(3);
    }
  };
  
  const interestOptions = ['History', 'Food', 'Hiking', 'Art', 'Nightlife', 'Shopping', 'Beaches', 'Adventure', 'Relaxation', 'Museums', 'Nature', 'Sports'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 pt-28 transition-colors duration-300">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:border dark:border-gray-700 p-5 md:p-8 space-y-8 relative">
        {canGoBack && (
            <button 
                onClick={onBack}
                className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                aria-label="Go back"
            >
                <ArrowLeftIcon className="h-7 w-7" />
            </button>
        )}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-gray-100">Design Your Dream Trip</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">Let our AI craft the perfect itinerary for you.</p>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
            <nav className="-mb-px flex justify-center space-x-6 md:space-x-12" aria-label="Steps">
                {steps.map((step) => {
                    const isCompleted = currentStep > step.id;
                    const isCurrent = currentStep === step.id;
                    return (
                        <div key={step.name} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                isCompleted ? 'bg-cyan-600 text-white' : isCurrent ? 'bg-cyan-100 dark:bg-cyan-900 border-2 border-cyan-500' : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                            }`}>
                                {isCompleted ? <CheckCircleIcon className="w-6 h-6" /> : <step.icon className={`w-5 h-5 ${isCurrent ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500'}`} />}
                            </div>
                            <p className={`text-xs md:text-sm font-medium ${isCurrent || isCompleted ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`}>{step.name}</p>
                        </div>
                    );
                })}
            </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">Departure City</label>
                        <div className="relative">
                            <PlaneDepartIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                            <input 
                                type="text" 
                                placeholder="e.g., Mumbai" 
                                value={departureCity} 
                                onChange={handleDepartureChange}
                                onBlur={() => setTimeout(() => setDepartureSuggestions([]), 150)}
                                className={inputStyles} 
                                autoComplete="off"
                            />
                            {departureSuggestions.length > 0 && (
                                <ul className="absolute z-20 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-b-lg mt-0 max-h-60 overflow-y-auto shadow-lg">
                                    {departureSuggestions.map((city) => (
                                        <li 
                                            key={city} 
                                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
                                            onMouseDown={() => handleSelectDeparture(city)}
                                        >
                                            {city}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {errors.departureCity && <p className="text-red-500 text-xs mt-1 ml-2">{errors.departureCity}</p>}
                    </div>
                    
                    <div className="col-span-1">
                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">Destinations</label>
                         <div className="relative">
                            <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                            <input 
                                type="text" 
                                placeholder="Add city (e.g., Paris)" 
                                value={currentDestinationInput} 
                                onChange={handleDestinationInputChange}
                                onKeyDown={handleDestinationKeyDown}
                                onBlur={() => setTimeout(() => setDestinationSuggestions([]), 150)}
                                className={inputStyles}
                                autoComplete="off"
                            />
                             {destinationSuggestions.length > 0 && (
                                <ul className="absolute z-20 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-b-lg mt-0 max-h-60 overflow-y-auto shadow-lg">
                                    {destinationSuggestions.map((city) => (
                                        <li 
                                            key={city} 
                                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
                                            onMouseDown={() => handleSelectDestinationSuggestion(city)}
                                        >
                                            {city}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        
                        {/* Selected Destinations Tags */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {destinations.map((city, index) => (
                                <div key={index} className="bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 px-3 py-1 rounded-full flex items-center text-sm font-medium animate-fade-in">
                                    {city}
                                    <button 
                                        type="button"
                                        onClick={() => removeDestination(city)}
                                        className="ml-2 text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-white focus:outline-none"
                                    >
                                        <TrashIcon className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {errors.destination && <p className="text-red-500 text-xs mt-1 ml-2">{errors.destination}</p>}
                    </div>

                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">Start Date</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                            <input 
                                type="date" 
                                value={startDate} 
                                min={today}
                                onChange={(e) => handleDateChange(e.target.value, endDate)}
                                className={inputStyles}
                            />
                        </div>
                         {errors.startDate && <p className="text-red-500 text-xs mt-1 ml-2">{errors.startDate}</p>}
                    </div>

                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">End Date</label>
                        <div className="relative">
                             <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                            <input 
                                type="date" 
                                value={endDate} 
                                min={startDate || today}
                                onChange={(e) => handleDateChange(startDate, e.target.value)}
                                className={inputStyles}
                            />
                        </div>
                        {errors.endDate && <p className="text-red-500 text-xs mt-1 ml-2">{errors.endDate}</p>}
                    </div>

                    <div className="md:col-span-2 text-center h-6 -mt-2">
                         {duration && duration > 0 ? (
                                <p className="font-semibold text-cyan-700 dark:text-cyan-300 text-sm">Total Duration: {duration} {duration > 1 ? 'Days' : 'Day'}</p>
                            ) : (
                                (errors.dates || (startDate && endDate)) && <p className="text-red-500 text-sm">{errors.dates || "End date must be after start date."}</p>
                            )}
                    </div>
                </div>
            </div>
          </div>
          
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <div className="relative">
                    <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="number" placeholder="Number of Travelers" value={travellers} min="1" onChange={(e) => setTravellers(parseInt(e.target.value))} className={inputStyles} />
                    {errors.travellers && <p className="text-red-500 text-xs mt-1 ml-2">{errors.travellers}</p>}
                </div>
                <div className="space-y-3">
                    <p className="font-medium text-gray-900 dark:text-gray-300">Travel Style</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(Object.keys(travelStyleDetails) as Array<keyof typeof travelStyleDetails>).map((style) => {
                            const { icon: Icon, description } = travelStyleDetails[style];
                            return (
                                <label key={style} className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${travelStyle === style ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/50' : 'border-gray-300 dark:border-gray-600 hover:border-cyan-400'}`}>
                                    <input type="radio" name="travelStyle" value={style} checked={travelStyle === style} onChange={() => setTravelStyle(style)} className="sr-only" />
                                    <Icon className={`h-8 w-8 mb-2 ${travelStyle === style ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500'}`} />
                                    <span className="font-semibold text-gray-800 dark:text-gray-100">{style}</span>
                                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">{description}</p>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>
          </div>

          <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
            <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                 <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
                    <input 
                      type="number" 
                      placeholder="Total Budget (Optional)" 
                      value={budget || ''} 
                      min="0"
                      onChange={handleBudgetChange} 
                      className={`${inputStyles} pl-8`}
                    />
                    {errors.budget && <p className="text-red-500 text-xs mt-1 ml-2">{errors.budget}</p>}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">What You Love</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select your interests or add your own.</p>
                     {errors.interests && <p className="text-red-500 text-xs mt-1">{errors.interests}</p>}
                    <div className="flex flex-wrap gap-3 mt-4">
                        {interestOptions.map(interest => (
                            <button
                              type="button"
                              key={interest}
                              onClick={() => handleInterestToggle(interest)}
                              className={`px-4 py-2 rounded-full font-semibold text-sm transform transition-all duration-300 ease-in-out active:scale-95 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-offset-gray-800 ${
                                interests.includes(interest)
                                  ? 'bg-cyan-600 text-white shadow-md hover:shadow-lg hover:-translate-y-px'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {interest}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-4">
                        <input
                            type="text"
                            placeholder="Add a custom interest"
                            value={customInterest}
                            onChange={(e) => setCustomInterest(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomInterest(); } }}
                            className={`${inputStyles} flex-grow pl-4`}
                        />
                        <button type="button" onClick={handleAddCustomInterest} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 transform active:scale-95">
                            Add
                        </button>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="py-2 px-4 font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 shadow-sm hover:shadow-md hover:-translate-y-px transform transition-all duration-300 ease-in-out active:scale-95 active:shadow-sm active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>

            {currentStep < steps.length ? (
                <button
                    type="button"
                    onClick={handleNext}
                    className="py-2 px-6 font-bold text-white bg-cyan-600 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-px transform transition-all duration-300 ease-in-out active:scale-95 active:shadow-sm active:translate-y-0"
                >
                    Next
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`py-3 px-6 font-bold text-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-px transform transition-all duration-300 ease-in-out active:scale-95 active:shadow-sm active:translate-y-0 flex items-center justify-center ${
                    isLoading
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-cyan-600 hover:bg-cyan-700'
                    }`}
                >
                     {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </>
                        ) : 'Generate My Itinerary'}
                </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripForm;
