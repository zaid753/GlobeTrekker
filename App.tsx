import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import TripForm from './components/TripForm';
import { 
    generateCoreItinerary,
    generateAccommodationRecommendations,
    generateTransportationOptions,
    generateFoodRecommendations,
    generateWeatherForecast,
    generateImageForActivity,
    getTravelAdvisories,
    extractLocationsFromSchedule 
} from './services/geminiService';
import type { TripDetails, Itinerary, User, SavedTrip, UserPreferences, TravelAdvisory, LocationPoint, AccommodationRecommendations, Transportation, FoodRecommendations, WeatherForecast, ChatMessage, Hotel, Restaurant } from './types';
import ChatBot from './components/ChatBot';
import AuthPage from './components/AuthPage';
import UserProfilePage from './components/UserProfilePage';
import HeroSection from './components/HeroSection';
import { GlobeIcon } from './components/icons';
import ItineraryReport from './components/ItineraryReport';
import ShareModal from './components/ShareModal';
import { auth, onAuthStateChanged, logout, FirebaseUser } from './services/firebase';
import Toast from './components/Toast';
import ConfirmationModal from './components/ConfirmationModal';

type View = 'hero' | 'form' | 'results' | 'login' | 'profile';
type AuthView = 'login' | 'signup';

const loadingMessages = [
    "Analyzing your preferences...",
    "Discovering hidden gems...",
    "Calculating travel times...",
    "Building your personalized schedule...",
    "Crafting recommendations...",
    "Finalizing your adventure..."
];

const LoadingState = ({ message }: { message: string }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 pt-20 text-center p-4 transition-colors duration-300">
        <div className="relative flex items-center justify-center h-48 w-48">
            <div className="absolute h-full w-full border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute h-full w-full border-t-4 border-cyan-600 dark:border-cyan-400 rounded-full animate-spin"></div>
            <GlobeIcon className="h-24 w-24 text-cyan-600 dark:border-cyan-400 animate-pulse" />
        </div>
        <h2 className="mt-8 text-2xl font-bold text-gray-800 dark:text-gray-100">Crafting Your Journey...</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300 text-lg font-semibold w-full max-w-md">{message}</p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">This can take up to 10 seconds. Good things come to those who wait!</p>
    </div>
);

// Utility for concurrent processing
const processWithConcurrency = async <T,>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<void>
) => {
  const queue = [...items];
  const worker = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) await task(item);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
};

function App() {
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('hero');
  const [viewHistory, setViewHistory] = useState<View[]>(['hero']);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [travelAdvisories, setTravelAdvisories] = useState<TravelAdvisory[] | null>(null);
  const [mapLocations, setMapLocations] = useState<LocationPoint[] | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasResumableTrip, setHasResumableTrip] = useState(false);
  
  // UI Feedback States
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saveConflictModal, setSaveConflictModal] = useState<{ isOpen: boolean; existingTripIndex: number } | null>(null);

  const generateImagesParallel = useCallback(async (itineraryForImages: Itinerary, detailsForImages: TripDetails) => {
    setItinerary(current => ({
        ...(current || itineraryForImages),
        schedule: (current?.schedule || itineraryForImages.schedule).map(day => ({...day, imageLoading: true}))
    }));

    await processWithConcurrency(itineraryForImages.schedule, 4, async (day) => {
        try {
            const imageUrl = await generateImageForActivity(`${day.title} in ${detailsForImages.destination}`, 'banner');
            setItinerary(current => {
                if (!current) return null;
                const newSchedule = current.schedule.map(d => 
                    d.day === day.day ? { ...d, imageUrl: imageUrl || undefined, imageLoading: false } : d
                );
                return { ...current, schedule: newSchedule };
            });
        } catch (e) {
            console.error(`Image gen failed for day ${day.day}`, e);
             setItinerary(current => {
                if (!current) return null;
                const newSchedule = current.schedule.map(d => 
                    d.day === day.day ? { ...d, imageLoading: false } : d
                );
                return { ...current, schedule: newSchedule };
            });
        }
    });
  }, []);

  const generateHotelImages = useCallback(async (recommendations: AccommodationRecommendations, destination: string) => {
      const categories: ('budget' | 'standard' | 'luxury')[] = ['budget', 'standard', 'luxury'];
      
      const allHotels = categories.flatMap(cat => 
          (recommendations[cat] || []).map((hotel, index) => ({ cat, hotel, index }))
      );
      
      setItinerary(current => {
          if (!current || !current.accommodation_recommendations) return current;
          const updatedRecs = { ...current.accommodation_recommendations };
          categories.forEach(cat => {
              if (updatedRecs[cat]) {
                  updatedRecs[cat] = updatedRecs[cat].map(hotel => ({...hotel, imageLoading: true}));
              }
          });
          return { ...current, accommodation_recommendations: updatedRecs };
      });

      await processWithConcurrency(allHotels, 4, async ({ cat, hotel, index }) => {
          try {
               const prompt = `${hotel.name} in ${destination}, a ${cat} category hotel with ${hotel.amenities[0] || 'amenities'}`;
               const url = await generateImageForActivity(prompt, 'hotel');
               
               setItinerary(current => {
                     if (!current || !current.accommodation_recommendations) return current;
                     const updatedRecs = { ...current.accommodation_recommendations };
                     if (updatedRecs[cat] && updatedRecs[cat][index]) {
                        const updatedCategory = [...updatedRecs[cat]];
                        updatedCategory[index] = { ...updatedCategory[index], imageUrl: url || undefined, imageLoading: false };
                        updatedRecs[cat] = updatedCategory;
                     }
                     return { ...current, accommodation_recommendations: updatedRecs };
                 });
          } catch (e) {
                 setItinerary(current => {
                     if (!current || !current.accommodation_recommendations) return current;
                     const updatedRecs = { ...current.accommodation_recommendations };
                     if (updatedRecs[cat] && updatedRecs[cat][index]) {
                        const updatedCategory = [...updatedRecs[cat]];
                        updatedCategory[index] = { ...updatedCategory[index], imageLoading: false };
                        updatedRecs[cat] = updatedCategory;
                     }
                     return { ...current, accommodation_recommendations: updatedRecs };
                 });
          }
      });
  }, []);

  const generateRestaurantImages = useCallback(async (recommendations: FoodRecommendations, destination: string) => {
      if (!recommendations.restaurants) return;
      
      const allRestaurants = recommendations.restaurants.map((restaurant, index) => ({ restaurant, index }));

      setItinerary(current => {
          if (!current || !current.food_recommendations) return current;
          const updatedRecs = { ...current.food_recommendations };
          updatedRecs.restaurants = updatedRecs.restaurants.map(r => ({...r, imageLoading: true}));
          return { ...current, food_recommendations: updatedRecs };
      });

      await processWithConcurrency(allRestaurants, 4, async ({ restaurant, index }) => {
          try {
              const dish = restaurant.must_try_dishes[0] || 'signature dish';
              const prompt = `The dish "${dish}" (${restaurant.cuisine_type} cuisine) served at ${restaurant.name} in ${destination}`;
              const url = await generateImageForActivity(prompt, 'food');
              
              setItinerary(current => {
                    if (!current || !current.food_recommendations) return current;
                    const updatedRecs = { ...current.food_recommendations };
                    const updatedRestaurants = [...updatedRecs.restaurants];
                    updatedRestaurants[index] = { ...updatedRestaurants[index], imageUrl: url || undefined, imageLoading: false };
                    updatedRecs.restaurants = updatedRestaurants;
                    return { ...current, food_recommendations: updatedRecs };
               });
          } catch (e) {
              setItinerary(current => {
                    if (!current || !current.food_recommendations) return current;
                    const updatedRecs = { ...current.food_recommendations };
                    const updatedRestaurants = [...updatedRecs.restaurants];
                    updatedRestaurants[index] = { ...updatedRestaurants[index], imageLoading: false };
                    updatedRecs.restaurants = updatedRestaurants;
                    return { ...current, food_recommendations: updatedRecs };
               });
          }
      });
  }, []);

  
  const navigateTo = useCallback((newView: View) => {
    setViewHistory(prev => {
        if (prev[prev.length - 1] !== newView) {
            return [...prev, newView];
        }
        return prev;
    });
    setView(newView);
  }, []);

  const handleBack = useCallback(() => {
    setViewHistory(prev => {
        if (prev.length <= 1) {
            setView('hero');
            return ['hero'];
        }
        const newHistory = [...prev];
        newHistory.pop();
        setView(newHistory[newHistory.length - 1]);
        return newHistory;
    });
  }, []);

  const guardWithAuth = useCallback((action: () => void) => {
    if (isAuthenticated) {
        action();
    } else {
        setPendingAction(() => action);
        navigateTo('login');
    }
  }, [isAuthenticated, navigateTo]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user && user.email) {
        const appUser: User = { email: user.email };
        setCurrentUser(appUser);
        setIsAuthenticated(true);
        const savedPrefs = localStorage.getItem(`userPrefs_${user.email}`);
        if (savedPrefs) {
            try {
                setUserPreferences(JSON.parse(savedPrefs));
            } catch {
                setUserPreferences({});
            }
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setUserPreferences({});
      }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (isAuthenticated && pendingAction) {
        pendingAction();
        setPendingAction(null);
    } else if (isAuthenticated && view === 'login') {
        handleBack();
    }
  }, [isAuthenticated, view, pendingAction, handleBack]);

  // Check for resumable trip on mount
  useEffect(() => {
    const lastDetails = localStorage.getItem('lastTripDetails');
    if (lastDetails) {
        setHasResumableTrip(true);
    }
  }, []);


  useEffect(() => {
    const loadTripAndGenerateImages = (details: TripDetails, savedItinerary: Itinerary, tripId: string) => {
        setTripDetails(details);
        setItinerary(savedItinerary); 
        setCurrentTripId(tripId);
        
        if (savedItinerary.schedule.some(d => !d.imageUrl)) {
            generateImagesParallel(savedItinerary, details);
        }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId');
    if (tripId) {
        try {
            const sharedTripJSON = localStorage.getItem(`trip_${tripId}`);
            if (sharedTripJSON) {
                const { details, itinerary: sharedItinerary } = JSON.parse(sharedTripJSON);
                loadTripAndGenerateImages(details, sharedItinerary, tripId);
                window.history.replaceState({}, document.title, window.location.pathname);
                navigateTo('results');
                return;
            }
        } catch (e) {
            console.error("Failed to load shared trip from local storage", e);
        }
    }
  }, [generateImagesParallel, navigateTo]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setCurrentLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);
  
  useEffect(() => {
    if (itinerary && tripDetails) {
        const { 
            accommodationLoading, 
            transportationLoading, 
            foodLoading, 
            weatherLoading, 
            ...restOfItinerary 
        } = itinerary;

        const cleanSchedule = restOfItinerary.schedule.map(({ imageUrl, imageLoading, ...day }) => day);
        
        let cleanAccommodation = undefined;
        if (restOfItinerary.accommodation_recommendations) {
             cleanAccommodation = {
                budget: restOfItinerary.accommodation_recommendations.budget.map(({ imageUrl, imageLoading, ...h }) => h),
                standard: restOfItinerary.accommodation_recommendations.standard.map(({ imageUrl, imageLoading, ...h }) => h),
                luxury: restOfItinerary.accommodation_recommendations.luxury.map(({ imageUrl, imageLoading, ...h }) => h),
            };
        }

        let cleanFood = undefined;
        if (restOfItinerary.food_recommendations) {
            cleanFood = {
                ...restOfItinerary.food_recommendations,
                restaurants: restOfItinerary.food_recommendations.restaurants.map(({ imageUrl, imageLoading, ...r }) => r)
            };
        }

        const storableItinerary = {
            ...restOfItinerary,
            schedule: cleanSchedule,
            accommodation_recommendations: cleanAccommodation || restOfItinerary.accommodation_recommendations,
            food_recommendations: cleanFood || restOfItinerary.food_recommendations,
        };

        try {
            localStorage.setItem('lastTripDetails', JSON.stringify(tripDetails));
            localStorage.setItem('lastItinerary', JSON.stringify(storableItinerary));
            setHasResumableTrip(true);
            if (currentTripId) {
                 localStorage.setItem(`trip_${currentTripId}`, JSON.stringify({ details: tripDetails, itinerary: storableItinerary }));
            }
        } catch (e) {
            console.error("Failed to save trip to localStorage: Quota may be exceeded.", e);
        }
    }
  }, [itinerary, tripDetails, currentTripId]);

  const handleResumeTrip = () => {
    try {
        const lastTripDetailsJSON = localStorage.getItem('lastTripDetails');
        const lastItineraryJSON = localStorage.getItem('lastItinerary');
        
        if (lastTripDetailsJSON && lastItineraryJSON) {
            const details = JSON.parse(lastTripDetailsJSON);
            const savedItinerary = JSON.parse(lastItineraryJSON);
            const newTripId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            
            setTripDetails(details);
            setItinerary(savedItinerary);
            setCurrentTripId(newTripId);
            
            navigateTo('results');
            
            // Trigger image regen if needed (background)
            if (savedItinerary.schedule.some((d: any) => !d.imageUrl)) {
                generateImagesParallel(savedItinerary, details);
            }
             // Also trigger supplemental data regen if missing (in case previous session was interrupted)
             if (savedItinerary.accommodationLoading || !savedItinerary.accommodation_recommendations) {
                 generateAccommodationRecommendations(details).then(res => {
                      if(res) setItinerary(prev => prev ? ({...prev, accommodation_recommendations: res, accommodationLoading: false}) : null);
                 });
             }
        }
    } catch (e) {
        console.error("Failed to resume trip", e);
        setToast({ message: "Could not resume previous trip.", type: 'error' });
    }
  };

  const handleFormSubmit = async (details: TripDetails) => {
    setIsLoading(true);
    setError(null);
    setTripDetails(details);
    setItinerary(null);
    setTravelAdvisories(null);
    setMapLocations(null);
    
    setCurrentLoadingMessage("Analyzing your preferences and generating core itinerary...");
    
    navigateTo('results');
    
    try {
      const coreItinerary = await generateCoreItinerary(details);
      
      const tripId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      setCurrentTripId(tripId);
      
      const initialItinerary: Itinerary = {
          ...coreItinerary,
          schedule: coreItinerary.schedule.map(day => ({ ...day, imageLoading: true })),
          accommodationLoading: true,
          transportationLoading: true,
          foodLoading: true,
          weatherLoading: true,
      };
      setItinerary(initialItinerary);
      
      setIsLoading(false);

      const fetchSupplementalData = async () => {
          const fetchers = [
              { key: 'accommodation', func: () => generateAccommodationRecommendations(details) },
              { key: 'transportation', func: () => generateTransportationOptions(details) },
              { key: 'food', func: () => generateFoodRecommendations(details) },
              { key: 'weather', func: () => generateWeatherForecast(details) },
              { key: 'advisories', func: () => getTravelAdvisories(details.destination, details.startDate, details.endDate) },
              { key: 'locations', func: () => extractLocationsFromSchedule(coreItinerary.schedule, details.destination) },
          ];

          await Promise.allSettled(fetchers.map(async ({ key, func }) => {
              try {
                  const result = await func();
                  
                  if (key === 'advisories') {
                      setTravelAdvisories(result as TravelAdvisory[] | null);
                  } else if (key === 'locations') {
                      setMapLocations(result as LocationPoint[] | null);
                  } else {
                      setItinerary(current => {
                          if (!current) return null;
                          const updated = { ...current };
                          switch (key) {
                              case 'accommodation': 
                                  updated.accommodation_recommendations = result as AccommodationRecommendations || undefined;
                                  updated.accommodationLoading = false;
                                  if (result) generateHotelImages(result as AccommodationRecommendations, details.destination);
                                  break;
                              case 'transportation':
                                  updated.transportation_options = result as Transportation || undefined;
                                  updated.transportationLoading = false;
                                  break;
                              case 'food':
                                  updated.food_recommendations = result as FoodRecommendations || undefined;
                                  updated.foodLoading = false;
                                  if (result) generateRestaurantImages(result as FoodRecommendations, details.destination);
                                  break;
                              case 'weather':
                                  updated.weather_forecast = result as WeatherForecast || undefined;
                                  updated.weatherLoading = false;
                                  break;
                          }
                          return updated;
                      });
                  }
              } catch (e) {
                  console.error(`Failed to fetch ${key}`, e);
                   if (key !== 'advisories' && key !== 'locations') {
                      setItinerary(current => {
                          if (!current) return null;
                          const updated = { ...current };
                          switch (key) {
                              case 'accommodation': updated.accommodationLoading = false; break;
                              case 'transportation': updated.transportationLoading = false; break;
                              case 'food': updated.foodLoading = false; break;
                              case 'weather': updated.weatherLoading = false; break;
                          }
                          return updated;
                      });
                   }
              }
          }));
      };

      fetchSupplementalData();
      generateImagesParallel(initialItinerary, details);

    } catch(err) {
      setError(err instanceof Error ? err.message : "An error occurred while generating the itinerary. Please check your connection and try again.");
      navigateTo('form');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
        await logout();
        localStorage.removeItem('lastTripDetails');
        localStorage.removeItem('lastItinerary');
        setTripDetails(null);
        setItinerary(null);
        setCurrentTripId(null);
        setHasResumableTrip(false);
        navigateTo('hero');
        setViewHistory(['hero']);
    } catch (error) {
        console.error("Logout Error:", error);
        setToast({ message: "Failed to log out. Please try again.", type: 'error' });
    }
  };

  const handleSaveTrip = () => {
    if (!currentUser || !tripDetails || !itinerary) return;

    try {
        const savedTrips: SavedTrip[] = JSON.parse(localStorage.getItem(`savedTrips_${currentUser.email}`) || '[]');
        const existingIndex = savedTrips.findIndex(t => t.itinerary.trip_title === itinerary.trip_title && t.details.destination === tripDetails.destination);

        if (existingIndex !== -1) {
            setSaveConflictModal({ isOpen: true, existingTripIndex: existingIndex });
            return;
        }

        const newTrip: SavedTrip = { details: tripDetails, itinerary };
        savedTrips.push(newTrip);
        localStorage.setItem(`savedTrips_${currentUser.email}`, JSON.stringify(savedTrips));
        setToast({ message: "Trip saved successfully!", type: 'success' });
    } catch (e) {
        console.error("Failed to save trip", e);
        setToast({ message: "Failed to save trip. Storage quota exceeded.", type: 'error' });
    }
  };

  const handleOverwriteTrip = () => {
    if (!currentUser || !tripDetails || !itinerary || !saveConflictModal) return;
    
    try {
        const savedTrips: SavedTrip[] = JSON.parse(localStorage.getItem(`savedTrips_${currentUser.email}`) || '[]');
        savedTrips[saveConflictModal.existingTripIndex] = { details: tripDetails, itinerary };
        
        localStorage.setItem(`savedTrips_${currentUser.email}`, JSON.stringify(savedTrips));
        setSaveConflictModal(null);
        setToast({ message: "Existing trip updated successfully!", type: 'success' });
    } catch (e) {
        setToast({ message: "Failed to update trip. Storage quota exceeded.", type: 'error' });
    }
  };

  const handleSaveAsNewTrip = () => {
     if (!currentUser || !tripDetails || !itinerary || !saveConflictModal) return;

     try {
         const savedTrips: SavedTrip[] = JSON.parse(localStorage.getItem(`savedTrips_${currentUser.email}`) || '[]');
         const newItinerary = { ...itinerary, trip_title: `${itinerary.trip_title} (${new Date().toLocaleDateString()})` };
         const newTrip: SavedTrip = { details: tripDetails, itinerary: newItinerary };
         
         savedTrips.push(newTrip);
         localStorage.setItem(`savedTrips_${currentUser.email}`, JSON.stringify(savedTrips));
         
         setItinerary(newItinerary);
         setSaveConflictModal(null);
         setToast({ message: "Trip saved as a new copy!", type: 'success' });
     } catch (e) {
         setToast({ message: "Failed to save new trip. Storage quota exceeded.", type: 'error' });
     }
  };


  const handleLoadTrip = (savedTrip: SavedTrip) => {
    setTripDetails(savedTrip.details);
    setItinerary(savedTrip.itinerary);
    const tripId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    setCurrentTripId(tripId);
    navigateTo('results');
  };
  
  const handleEditTrip = () => navigateTo('form');

  const handleEditSavedTrip = (savedTrip: SavedTrip) => {
    setTripDetails(savedTrip.details);
    setItinerary(null);
    setCurrentTripId(null);
    navigateTo('form');
  };

  const handlePlanNewTrip = () => {
    const initialDetails: Partial<TripDetails> = {
      destination: '',
      departureCity: userPreferences.defaultDepartureCity || '',
      startDate: '',
      endDate: '',
      travellers: 1,
      travelStyle: userPreferences.defaultTravelStyle || 'Standard',
      interests: userPreferences.defaultInterests || [],
    };
    setTripDetails(initialDetails as TripDetails);
    setItinerary(null);
    setCurrentTripId(null);
    localStorage.removeItem('lastTripDetails');
    localStorage.removeItem('lastItinerary');
    setHasResumableTrip(false);
    navigateTo('form');
  }

  const handleShare = () => {
    if (!tripDetails || !itinerary) return;
    setIsShareModalOpen(true);
  };
  
  const handleUpdatePreferences = (prefs: UserPreferences) => {
    if (currentUser) {
        setUserPreferences(prefs);
        localStorage.setItem(`userPrefs_${currentUser.email}`, JSON.stringify(prefs));
    }
  };

  const handleLoginClick = () => {
    setAuthView('login');
    navigateTo('login');
  };

  const handleSignUpClick = () => {
    setAuthView('signup');
    navigateTo('login');
  };

  const renderContent = () => {
    const canGoBack = viewHistory.length > 1;

    switch (view) {
      case 'hero':
        return (
            <HeroSection 
                onPlanTripClick={() => guardWithAuth(handlePlanNewTrip)} 
                onResumeClick={handleResumeTrip}
                hasResumableTrip={hasResumableTrip}
            />
        );
      case 'form':
        return (
            <div>
                {error && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">{error}</div>}
                <TripForm 
                    onSubmit={handleFormSubmit} 
                    isLoading={isLoading} 
                    initialDetails={tripDetails}
                    onBack={handleBack}
                    canGoBack={canGoBack}
                />
            </div>
        );
      case 'results':
        if (isLoading) {
          return <LoadingState message={currentLoadingMessage} />;
        }
       
        if (itinerary && tripDetails) {
          return (
            <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300 pt-20">
               <main className="container mx-auto p-4 md:p-6">
                 <ItineraryReport 
                    itinerary={itinerary} 
                    details={tripDetails} 
                    setItinerary={setItinerary}
                    onSaveTrip={handleSaveTrip}
                    onShare={handleShare}
                    onEditTrip={handleEditTrip}
                    onPlanNewTrip={() => guardWithAuth(handlePlanNewTrip)}
                    travelAdvisories={travelAdvisories}
                    mapLocations={mapLocations}
                    guardWithAuth={guardWithAuth}
                  />
               </main>
              {isShareModalOpen && tripDetails && itinerary && (
                <ShareModal 
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    itinerary={itinerary}
                    details={tripDetails}
                />
              )}
            </div>
          );
        }
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 pt-20">
             <div className="text-center">
                <p className="text-lg text-gray-600 dark:text-gray-300">Something went wrong.</p>
                <button onClick={() => navigateTo('form')} className="mt-4 bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-700 transition duration-300">
                    Start Over
                </button>
             </div>
          </div>
        );
      case 'login':
        return <AuthPage onBack={handleBack} canGoBack={canGoBack} initialView={authView} />;
      case 'profile':
        if (currentUser) {
          return <UserProfilePage 
            user={currentUser} 
            onLoadTrip={handleLoadTrip} 
            onPlanNewTrip={() => guardWithAuth(handlePlanNewTrip)} 
            onBack={handleBack} 
            canGoBack={canGoBack} 
            onEditTrip={handleEditSavedTrip}
            preferences={userPreferences}
            onPreferencesChange={handleUpdatePreferences}
          />;
        }
        navigateTo('login');
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="antialiased text-gray-900 dark:text-gray-100">
      <Navbar 
        isAuthenticated={isAuthenticated}
        userEmail={currentUser?.email || null}
        onLoginClick={handleLoginClick}
        onSignUpClick={handleSignUpClick}
        onLogout={handleLogout}
        onProfileClick={() => guardWithAuth(() => navigateTo('profile'))}
      />
      {renderContent()}
      <ChatBot
        isOpen={isChatOpen}
        onToggle={() => guardWithAuth(() => setIsChatOpen(prev => !prev))}
        itinerary={itinerary}
        details={tripDetails}
      />
      {toast && (
        <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
        />
      )}
      {saveConflictModal && (
        <ConfirmationModal
            isOpen={true}
            title="Duplicate Trip Found"
            message="A trip with this title and destination already exists in your saved trips. Would you like to overwrite it or save this as a new trip?"
            confirmLabel="Overwrite"
            alternativeLabel="Save as New"
            onConfirm={handleOverwriteTrip}
            onAlternative={handleSaveAsNewTrip}
            onCancel={() => setSaveConflictModal(null)}
        />
      )}
    </div>
  );
}

export default App;