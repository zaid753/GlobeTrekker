import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
    extractLocationsFromSchedule,
    getDummyImageUrl
} from './services/geminiService';
import type { TripDetails, Itinerary, User, SavedTrip, UserPreferences, TravelAdvisory, LocationPoint, AccommodationRecommendations, Transportation, FoodRecommendations, WeatherForecast, ChatMessage, Hotel, Restaurant } from './types';
import ChatBot from './components/ChatBot';
import AuthModal from './components/AuthModal';
import UserProfilePage from './components/UserProfilePage';
import HeroSection from './components/HeroSection';
import { GlobeIcon } from './components/icons';
import ItineraryReport from './components/ItineraryReport';
import ShareModal from './components/ShareModal';
import { auth, onAuthStateChanged, logout, FirebaseUser, db } from './services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Toast from './components/Toast';
import ConfirmationModal from './components/ConfirmationModal';
import AdminPanel from './components/AdminPanel';

type View = 'hero' | 'form' | 'results' | 'profile' | 'admin';

const loadingMessages = [
    "Analyzing your preferences...",
    "Discovering hidden gems...",
    "Calculating travel times...",
    "Building your personalized schedule...",
    "Crafting recommendations...",
    "Finalizing your adventure..."
];

const LoadingState = ({ message }: { message: string }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 pt-28 text-center p-4 transition-colors duration-300">
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

const pageTransition = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -15, scale: 0.98 },
  transition: { duration: 0.4, ease: "easeOut" }
};

const logErrorToFirestore = async (errorMsg: string, stack?: string, type: string = 'runtime') => {
  try {
      await addDoc(collection(db, 'error_logs'), {
          errorMsg,
          stack: stack || null,
          type,
          timestamp: serverTimestamp(),
          url: window.location.href,
          userAgent: navigator.userAgent
      });
  } catch (e) {
      console.error("Failed to log error to Firestore:", e);
  }
};

function App() {
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [formInitialData, setFormInitialData] = useState<TripDetails | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('hero');
  const [viewHistory, setViewHistory] = useState<View[]>(['hero']);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [editingTripIndex, setEditingTripIndex] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [travelAdvisories, setTravelAdvisories] = useState<TravelAdvisory[] | null>(null);
  const [mapLocations, setMapLocations] = useState<LocationPoint[] | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasResumableTrip, setHasResumableTrip] = useState(false);
  const [isCreatingNewTrip, setIsCreatingNewTrip] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
      currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global Error Caught:", event.error);
      logErrorToFirestore(event.message, event.error?.stack, 'runtime');
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled Promise Rejection:", event.reason);
      let errorMsg = "Unknown promise rejection";
      let stack = undefined;
      
      if (event.reason instanceof Error) {
          errorMsg = event.reason.message;
          stack = event.reason.stack;
      } else if (typeof event.reason === 'string') {
          errorMsg = event.reason;
      } else if (event.reason) {
          errorMsg = JSON.stringify(event.reason);
      }
      
      const isAuthError = errorMsg.includes('auth/') || errorMsg.toLowerCase().includes('firebase: error');
      logErrorToFirestore(errorMsg, stack, isAuthError ? 'authentication' : 'unhandled_rejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const generateImagesParallel = useCallback(async (itineraryForImages: Itinerary, detailsForImages: TripDetails) => {
    await processWithConcurrency(itineraryForImages.schedule, 2, async (day) => {
        try {
            const imageUrl = await generateImageForActivity(`${day.title} in ${detailsForImages.destination}`, 'banner');
            setItinerary(current => {
                if (!current) return null;
                const newSchedule = current.schedule.map(d => 
                    d.day === day.day ? { ...d, imageUrl: imageUrl || d.imageUrl, imageLoading: false } : d
                );
                return { ...current, schedule: newSchedule };
            });
        } catch (e) {
             setItinerary(current => {
                if (!current) return null;
                const newSchedule = current.schedule.map(d => d.day === day.day ? { ...d, imageLoading: false } : d);
                return { ...current, schedule: newSchedule };
            });
        }
    });
  }, []);

  const generateHotelImages = useCallback(async (recommendations: AccommodationRecommendations, destination: string) => {
      const categories: ('budget' | 'standard' | 'luxury')[] = ['budget', 'standard', 'luxury'];
      const allHotels = categories.flatMap(cat => (recommendations[cat] || []).map((hotel, index) => ({ cat, hotel, index })));
      await processWithConcurrency(allHotels, 2, async ({ cat, hotel, index }) => {
          try {
               const prompt = `${hotel.name} hotel in ${destination}`;
               const url = await generateImageForActivity(prompt, 'hotel');
               setItinerary(current => {
                     if (!current || !current.accommodation_recommendations) return current;
                     const updatedRecs = { ...current.accommodation_recommendations };
                     if (updatedRecs[cat] && updatedRecs[cat][index]) {
                        const updatedCategory = [...updatedRecs[cat]];
                        updatedCategory[index] = { ...updatedCategory[index], imageUrl: url || updatedCategory[index].imageUrl, imageLoading: false };
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
      await processWithConcurrency(allRestaurants, 2, async ({ restaurant, index }) => {
          try {
              const dish = restaurant.must_try_dishes[0] || 'signature dish';
              const prompt = `${dish} at ${restaurant.name} in ${destination}`;
              const url = await generateImageForActivity(prompt, 'food');
              setItinerary(current => {
                    if (!current || !current.food_recommendations) return current;
                    const updatedRecs = { ...current.food_recommendations };
                    const updatedRestaurants = [...updatedRecs.restaurants];
                    if (updatedRestaurants[index]) {
                        updatedRestaurants[index] = { ...updatedRestaurants[index], imageUrl: url || updatedRestaurants[index].imageUrl, imageLoading: false };
                        updatedRecs.restaurants = updatedRestaurants;
                    }
                    return { ...current, food_recommendations: updatedRecs };
               });
          } catch (e) {
              setItinerary(current => {
                    if (!current || !current.food_recommendations) return current;
                    const updatedRecs = { ...current.food_recommendations };
                    const updatedRestaurants = [...updatedRecs.restaurants];
                    if (updatedRestaurants[index]) {
                        updatedRestaurants[index] = { ...updatedRestaurants[index], imageLoading: false };
                        updatedRecs.restaurants = updatedRestaurants;
                    }
                    return { ...current, food_recommendations: updatedRecs };
               });
          }
      });
  }, []);

  const navigateTo = useCallback((newView: View) => {
    setViewHistory(prev => (prev[prev.length - 1] !== newView ? [...prev, newView] : prev));
    setView(newView);
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'form' && isCreatingNewTrip) setIsCreatingNewTrip(false);
    setViewHistory(prev => {
        if (prev.length <= 1) { setView('hero'); return ['hero']; }
        const newHistory = [...prev]; newHistory.pop();
        setView(newHistory[newHistory.length - 1]);
        return newHistory;
    });
  }, [view, isCreatingNewTrip]);

  const guardWithAuth = useCallback((action: () => void) => {
    if (isAuthenticated) action();
    else { setPendingAction(() => action); setAuthView('login'); setIsAuthModalOpen(true); }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user && user.email) {
        const appUser: User = { email: user.email };
        setCurrentUser(appUser);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
        // Persist user in admin list for panel persistence
        const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
        if (!adminUsers.find((u: any) => u.email === user.email)) {
            adminUsers.push({ email: user.email, joined: new Date().getFullYear(), id: `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}` });
            localStorage.setItem('admin_users', JSON.stringify(adminUsers));
        }
        const savedPrefs = localStorage.getItem(`userPrefs_${user.email}`);
        if (savedPrefs) { try { setUserPreferences(JSON.parse(savedPrefs)); } catch { setUserPreferences({}); } }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setUserPreferences({});
        setTripDetails(null);
        setItinerary(null);
        setEditingTripIndex(null);
        setView('hero');
        setViewHistory(['hero']);
      }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
     const checkUpcomingTrips = () => {
         if (!currentUserRef.current) return;
         const savedTrips = JSON.parse(localStorage.getItem(`savedTrips_${currentUserRef.current.email}`) || '[]');
         const now = new Date();
         const threeDaysFromNow = new Date();
         threeDaysFromNow.setDate(now.getDate() + 3);

         savedTrips.forEach((trip: any) => {
             if (trip.details && trip.details.startDate) {
                 const tripStart = new Date(trip.details.startDate);
                 if (tripStart > now && tripStart <= threeDaysFromNow) {
                     const notifiedKey = `notified_trip_${trip.details.destination}_${trip.details.startDate}`;
                     if (!localStorage.getItem(notifiedKey)) {
                         const sendNotification = () => {
                             new Notification('Upcoming Trip!', {
                                 body: `Your trip to ${trip.details.destination} starts in less than 3 days!`,
                             });
                             localStorage.setItem(notifiedKey, 'true');
                         };

                         if (Notification.permission === 'granted') {
                             sendNotification();
                         } else if (Notification.permission !== 'denied') {
                             Notification.requestPermission().then(permission => {
                                 if (permission === 'granted') sendNotification();
                             });
                         }
                     }
                 }
             }
         });
     };
     
     const timeoutId = setTimeout(checkUpcomingTrips, 5000);
     return () => clearTimeout(timeoutId);
  }, [currentUser]);

  useEffect(() => {
     const handleOffline = () => setToast({ message: 'You are currently offline. Using cached data.', type: 'error' });
     const handleOnline = () => setToast({ message: 'Back online!', type: 'success' });
     
     window.addEventListener('offline', handleOffline);
     window.addEventListener('online', handleOnline);
     
     if (!navigator.onLine) handleOffline();

     return () => {
         window.removeEventListener('offline', handleOffline);
         window.removeEventListener('online', handleOnline);
     };
  }, []);
  
  useEffect(() => {
    if (isAuthenticated && pendingAction) { pendingAction(); setPendingAction(null); }
  }, [isAuthenticated, pendingAction]);

  useEffect(() => {
    const lastDetails = localStorage.getItem('lastTripDetails');
    if (lastDetails) setHasResumableTrip(true);
  }, []);

  useEffect(() => {
    const loadTripAndGenerateImages = (details: TripDetails, savedItinerary: Itinerary, tripId: string) => {
        setTripDetails(details); setItinerary({ ...savedItinerary, tripId }); setCurrentTripId(tripId);
        generateImagesParallel(savedItinerary, details);
    };
    const loadSharedTrip = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const tripId = urlParams.get('tripId');
        if (tripId) {
            try {
                const { getTripFromRemote } = await import('./services/dbService');
                const pTrip = await getTripFromRemote(tripId);
                if (pTrip) {
                    loadTripAndGenerateImages(pTrip.details, pTrip.itinerary, tripId);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    navigateTo('results');
                    return;
                }
            } catch(e) { console.error("Firebase fetch failed", e); }
            
            try {
                const sharedTripJSON = localStorage.getItem(`trip_${tripId}`);
                if (sharedTripJSON) {
                    const { details, itinerary: sharedItinerary } = JSON.parse(sharedTripJSON);
                    loadTripAndGenerateImages(details, sharedItinerary, tripId);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    navigateTo('results');
                }
            } catch (e) { console.error(e); }
        }
    };
    loadSharedTrip();
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
    if (itinerary && tripDetails && !isCreatingNewTrip) {
        const { accommodationLoading, transportationLoading, foodLoading, weatherLoading, ...restOfItinerary } = itinerary;
        const cleanSchedule = restOfItinerary.schedule.map(({ imageUrl, imageLoading, ...day }) => day);
        let cleanAccommodation = undefined;
        if (restOfItinerary.accommodation_recommendations) {
             cleanAccommodation = {
                budget: restOfItinerary.accommodation_recommendations.budget.map(({ imageUrl, imageLoading, ...h }) => h),
                standard: restOfItinerary.accommodation_recommendations.standard.map(({ imageUrl, imageLoading, ...h }) => h),
                luxury: restOfItinerary.accommodation_recommendations.luxury.map(({ imageUrl, imageLoading, ...h }) => h),
                ai_stay_tip: restOfItinerary.accommodation_recommendations.ai_stay_tip
            };
        }
        let cleanFood = undefined;
        if (restOfItinerary.food_recommendations) {
            cleanFood = {
                ...restOfItinerary.food_recommendations,
                restaurants: restOfItinerary.food_recommendations.restaurants.map(({ imageUrl, imageLoading, ...r }) => r),
            };
        }
        const storableItinerary = { ...restOfItinerary, schedule: cleanSchedule, accommodation_recommendations: cleanAccommodation || restOfItinerary.accommodation_recommendations, food_recommendations: cleanFood || restOfItinerary.food_recommendations };
        try {
            localStorage.setItem('lastTripDetails', JSON.stringify(tripDetails));
            localStorage.setItem('lastItinerary', JSON.stringify(storableItinerary));
            setHasResumableTrip(true);
            if (currentTripId) localStorage.setItem(`trip_${currentTripId}`, JSON.stringify({ details: tripDetails, itinerary: storableItinerary }));
        } catch (e) { console.error(e); }
    }
  }, [itinerary, tripDetails, currentTripId, isCreatingNewTrip]);

  const handleSaveTrip = async () => {
      if (!currentUser || !tripDetails || !itinerary) return;
      const { accommodationLoading, transportationLoading, foodLoading, weatherLoading, ...restOfItinerary } = itinerary;
      const cleanSchedule = restOfItinerary.schedule.map(({ imageUrl, imageLoading, ...day }) => day);
      let cleanAccommodation = undefined;
      if (restOfItinerary.accommodation_recommendations) {
           cleanAccommodation = {
              budget: restOfItinerary.accommodation_recommendations.budget.map(({ imageUrl, imageLoading, ...h }) => h),
              standard: restOfItinerary.accommodation_recommendations.standard.map(({ imageUrl, imageLoading, ...h }) => h),
              luxury: restOfItinerary.accommodation_recommendations.luxury.map(({ imageUrl, imageLoading, ...h }) => h),
              ai_stay_tip: restOfItinerary.accommodation_recommendations.ai_stay_tip
          };
      }
      let cleanFood = undefined;
      if (restOfItinerary.food_recommendations) {
          cleanFood = { ...restOfItinerary.food_recommendations, restaurants: restOfItinerary.food_recommendations.restaurants.map(({ imageUrl, imageLoading, ...r }) => r) };
      }
      const storableItinerary = { ...restOfItinerary, schedule: cleanSchedule, accommodation_recommendations: cleanAccommodation || restOfItinerary.accommodation_recommendations, food_recommendations: cleanFood || restOfItinerary.food_recommendations };
      const storageKey = `savedTrips_${currentUser.email}`;
      const tripToSave: SavedTrip = { details: tripDetails, itinerary: storableItinerary as Itinerary };
      
      try {
          const { saveTripToRemote } = await import('./services/dbService');
          if (!itinerary.tripId && !currentTripId) {
             const newId = await saveTripToRemote(tripToSave);
             if (newId) {
                 tripToSave.itinerary.tripId = newId;
                 setCurrentTripId(newId);
                 setItinerary(prev => prev ? { ...prev, tripId: newId } : null);
             }
          }
      } catch (e) {
          console.error("Failed to save remote trip", e);
      }

      try {
          const existingTripsJson = localStorage.getItem(storageKey);
          let existingTrips: SavedTrip[] = existingTripsJson ? JSON.parse(existingTripsJson) : [];
          if (editingTripIndex !== null && existingTrips[editingTripIndex]) {
              existingTrips[editingTripIndex] = tripToSave;
              setToast({ message: "Trip updated in your profile!", type: 'success' });
          } else {
              const isDuplicate = existingTrips.some(t => t.details.destination === tripDetails.destination && t.details.startDate === tripDetails.startDate && t.itinerary.trip_title === itinerary.trip_title);
              if (isDuplicate) { setToast({ message: "This trip is already saved.", type: 'error' }); return; }
              existingTrips.push(tripToSave);
              setEditingTripIndex(existingTrips.length - 1);
              setToast({ message: "Trip saved to your profile!", type: 'success' });
          }
          localStorage.setItem(storageKey, JSON.stringify(existingTrips));
      } catch (e) { setToast({ message: "Failed to save trip. Storage full.", type: 'error' }); }
  };

  const handleFormSubmit = async (details: TripDetails) => {
    // Admin Maintenance Check
    if (localStorage.getItem('admin_maintenance_mode') === 'true') {
        setToast({ message: "Maintenance in progress. New trip generation is temporarily disabled.", type: 'error' });
        return;
    }

    setIsLoading(true);
    setError(null);
    setIsCreatingNewTrip(false);
    setEditingTripIndex(null);
    setTripDetails(details);
    setItinerary({
        trip_title: `Trip to ${details.destination}`, total_estimated_cost: 0, currency: 'INR',
        trip_summary: { description: '', highlights: [] },
        detailed_cost_breakdown: { stay: 0, travel: 0, food: 0, activities: 0, miscellaneous: 0 },
        schedule: Array.from({ length: details.duration }, (_, i) => ({ day: i + 1, title: `Day ${i + 1}`, activities: [], ai_tip: '', imageLoading: true })),
        accommodationLoading: true, transportationLoading: true, foodLoading: true, weatherLoading: true
    });
    navigateTo('results');
    try {
      const coreItinerary = await generateCoreItinerary(details);
      const itineraryWithLoadingImages = { ...coreItinerary, schedule: coreItinerary.schedule.map(day => ({ ...day, imageUrl: getDummyImageUrl(details.destination, day.title, day.day, 'banner'), imageLoading: true })) };
      setItinerary(prev => ({ ...prev!, ...itineraryWithLoadingImages, accommodationLoading: true, transportationLoading: true, foodLoading: true, weatherLoading: true }));
      generateImagesParallel(itineraryWithLoadingImages, details);
      // Run background API requests sequentially to avoid rate limits
      (async () => {
          const recs = await generateAccommodationRecommendations(details);
          if (recs) {
               const recsWithImages = { ...recs, budget: recs.budget.map(h => ({ ...h, imageLoading: true })), standard: recs.standard.map(h => ({ ...h, imageLoading: true })), luxury: recs.luxury.map(h => ({ ...h, imageLoading: true })) };
               setItinerary(prev => prev ? ({ ...prev, accommodation_recommendations: recsWithImages, accommodationLoading: false }) : null);
               generateHotelImages(recsWithImages, details.destination);
          } else setItinerary(prev => prev ? ({ ...prev, accommodationLoading: false }) : null);

          const trans = await generateTransportationOptions(details);
          setItinerary(prev => prev ? ({ ...prev, transportation_options: trans || undefined, transportationLoading: false }) : null);

          const food = await generateFoodRecommendations(details);
          if (food) {
               const foodWithImages = { ...food, restaurants: food.restaurants.map(r => ({ ...r, imageLoading: true })) };
               setItinerary(prev => prev ? ({ ...prev, food_recommendations: foodWithImages, foodLoading: false }) : null);
               generateRestaurantImages(foodWithImages, details.destination);
          } else setItinerary(prev => prev ? ({ ...prev, foodLoading: false }) : null);

          const weather = await generateWeatherForecast(details);
          setItinerary(prev => prev ? ({ ...prev, weather_forecast: weather || undefined, weatherLoading: false }) : null);
      })();
      getTravelAdvisories(details.destination, details.startDate, details.endDate).then(setTravelAdvisories);
      extractLocationsFromSchedule(coreItinerary.schedule, details.destination).then(setMapLocations);
    } catch (err: any) { setError(err.message || "Failed to generate itinerary."); setItinerary(null); } finally { setIsLoading(false); }
  };

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300 ${view === 'admin' ? '' : 'font-sans'}`}>
        {view !== 'admin' && (
            <Navbar isAuthenticated={isAuthenticated} userEmail={currentUser?.email || null} onLoginClick={() => { setAuthView('login'); setIsAuthModalOpen(true); }} onSignUpClick={() => { setAuthView('signup'); setIsAuthModalOpen(true); }} onLogout={logout} onProfileClick={() => navigateTo('profile')} onNavigate={(id) => { if (view !== 'hero') navigateTo('hero'); setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }} currentView={view} />
        )}
        <AnimatePresence mode="wait">
        {view === 'hero' && (
            <motion.div key="hero" {...pageTransition}>
              <HeroSection onPlanTripClick={() => guardWithAuth(() => navigateTo('form'))} onResumeClick={() => guardWithAuth(() => { const savedItinerary = localStorage.getItem('lastItinerary'); const savedDetails = localStorage.getItem('lastTripDetails'); if (savedItinerary && savedDetails) { try { setItinerary(JSON.parse(savedItinerary)); setTripDetails(JSON.parse(savedDetails)); navigateTo('results'); } catch (e) { setToast({ message: "Resumption failed.", type: 'error' }); } } else setToast({ message: "No saved journey found.", type: 'error' }); })} hasResumableTrip={hasResumableTrip} onAdminLogin={() => navigateTo('admin')} />
            </motion.div>
        )}
        {view === 'form' && (
            <motion.div key="form" {...pageTransition}>
              <TripForm onSubmit={handleFormSubmit} isLoading={isLoading} initialDetails={formInitialData} onBack={handleBack} canGoBack={true} userPreferences={userPreferences} />
            </motion.div>
        )}
        {view === 'results' && (
            <motion.div key="results" {...pageTransition}>
              {isLoading ? ( <LoadingState message={currentLoadingMessage} /> ) : (itinerary && tripDetails) ? (
                  <ItineraryReport itinerary={itinerary} details={tripDetails} setItinerary={setItinerary} onSaveTrip={() => guardWithAuth(handleSaveTrip)} onShare={() => setIsShareModalOpen(true)} onEditTrip={() => { setFormInitialData(tripDetails); navigateTo('form'); }} onPlanNewTrip={() => { setFormInitialData(null); setIsCreatingNewTrip(true); navigateTo('form'); }} travelAdvisories={travelAdvisories} mapLocations={mapLocations} guardWithAuth={guardWithAuth} onOpenChat={() => setIsChatOpen(true)} />
              ) : (
                  <div className="pt-28 text-center text-red-500"><p>{error || "Something went wrong."}</p><button onClick={() => navigateTo('hero')} className="mt-4 text-cyan-600 hover:underline">Go Home</button></div>
              )}
            </motion.div>
        )}
        {view === 'profile' && currentUser && (
            <motion.div key="profile" {...pageTransition}>
              <UserProfilePage user={currentUser} onLoadTrip={(trip, index) => { setTripDetails(trip.details); setItinerary(trip.itinerary); setEditingTripIndex(index); navigateTo('results'); }} onPlanNewTrip={() => { setFormInitialData(null); setIsCreatingNewTrip(true); navigateTo('form'); }} onBack={handleBack} canGoBack={true} onEditTrip={(trip) => { setFormInitialData(trip.details); navigateTo('form'); }} preferences={userPreferences} onPreferencesChange={(prefs) => { setUserPreferences(prefs); localStorage.setItem(`userPrefs_${currentUser.email}`, JSON.stringify(prefs)); }} />
            </motion.div>
        )}
        {view === 'admin' && (
            <motion.div key="admin" {...pageTransition}>
              <AdminPanel onExit={() => navigateTo('hero')} />
            </motion.div>
        )}
        </AnimatePresence>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authView} />
        {itinerary && tripDetails && ( <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} itinerary={itinerary} details={tripDetails} /> )}
        {toast && ( <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> )}
        {view !== 'admin' && ( <ChatBot itinerary={itinerary} details={tripDetails} isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} /> )}
    </div>
  );
}

export default App;