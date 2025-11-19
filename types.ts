

export interface TripDetails {
  destination: string;
  departureCity: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  travellers: number;
  budget?: number; // Optional total budget
  travelStyle: 'Economy' | 'Standard' | 'Luxury';
  interests: string[];
  duration: number; // This will be calculated from start/end dates
}

export interface Activity {
  time: string;
  description: string;
  type: 'Food' | 'Sightseeing' | 'Activity' | 'Travel' | 'Accommodation';
  estimated_cost: number;
  priority?: 'High' | 'Medium' | 'Low'; // New field for priority
  travel_details?: { // Optional field for travel activities
    distance: string;
    duration: string;
  };
}

export interface DayPlan {
  day: number;
  title: string;
  activities: Activity[];
  ai_tip: string; // New field for AI-generated daily tips
  imageUrl?: string; // For visual trip preview
  imageLoading?: boolean; // To show skeleton loader while image is generating
}

export interface TripSummary {
  description: string;
  highlights: string[];
}

export interface DetailedCostBreakdown {
  stay: number;
  travel: number;
  food: number;
  activities: number;
  miscellaneous: number;
}

export interface Hotel {
  name: string;
  address: string;
  star_rating: number;
  rating: number; // A numerical user rating out of 5
  amenities: string[];
  estimated_nightly_cost: number;
  imageUrl?: string;
  imageLoading?: boolean;
}

export interface AccommodationRecommendations {
  budget: Hotel[];
  standard: Hotel[];
  luxury: Hotel[];
  ai_stay_tip?: string;
}

export interface TransportationOption {
    mode: string; // e.g., 'Flight', 'Train', 'Bus'
    details: string; // e.g., 'Direct flight from Mumbai (BOM) to Goa (GOI)'
    estimated_cost: number;
    duration: string;
    provider_examples?: string[]; // e.g., ["IndiGo", "Vistara"]
    comfort_level?: 'High' | 'Medium' | 'Low';
    frequency?: string; // e.g. "Daily", "Every 2 hours"
    travel_tip?: string;
}

export interface LocalSuggestion {
    mode: string; // e.g., 'Scooter', 'Ride-hailing', 'Metro'
    suggestion: string; // A brief description or tip
    estimated_cost_range?: string; // e.g., "₹300-500/day", "₹80-120 per 5km trip"
}

export interface Transportation {
    long_distance_options: TransportationOption[];
    local_suggestions: LocalSuggestion[];
}

export interface Restaurant {
    name: string;
    cuisine_type: string;
    estimated_cost_per_person: number;
    rating: number;
    notes: string;
    price_range: '$' | '$$' | '$$$';
    must_try_dishes: string[];
    ambience: string;
    imageUrl?: string;
    imageLoading?: boolean;
}

export interface FoodRecommendations {
    restaurants: Restaurant[];
    local_specialties: string[];
    ai_foodie_tip?: string;
}

export interface DailyWeather {
    day: number;
    high_temp_celsius: number;
    low_temp_celsius: number;
    description: string;
    feels_like_celsius: number;
    humidity_percent: number;
    uv_index: string; // e.g., "5 (Moderate)"
    chance_of_rain_percent: number;
}

export interface WeatherForecast {
    daily_forecasts: DailyWeather[];
    packing_recommendation: string;
    weekly_summary: string;
}

export interface Itinerary {
  trip_title: string;
  total_estimated_cost: number;
  currency: string;
  trip_summary: TripSummary;
  detailed_cost_breakdown: DetailedCostBreakdown;
  schedule: DayPlan[];
  accommodation_recommendations?: AccommodationRecommendations;
  transportation_options?: Transportation;
  food_recommendations?: FoodRecommendations;
  weather_forecast?: WeatherForecast;

  // For progressive loading UI
  accommodationLoading?: boolean;
  transportationLoading?: boolean;
  foodLoading?: boolean;
  weatherLoading?: boolean;
}


export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface User {
  email: string;
}

export interface SavedTrip {
  details: TripDetails;
  itinerary: Itinerary;
}

// Unified Booking Interfaces
export type BookingType = 'Flight' | 'Hotel' | 'Train' | 'Car' | 'Activity' | 'Dining';

export interface BookingDetails {
    type: BookingType;
    passengers?: { name: string; age?: number }[];
    guests?: { name: string }[];
    payment?: {
        cardNumber: string;
        expiryDate: string;
        cvc: string;
    };
    // Specific fields
    flightClass?: 'Economy' | 'Business' | 'First';
    roomType?: 'Standard' | 'Deluxe' | 'Suite';
    seatType?: 'Sleeper' | 'AC Chair' | 'General';
    specialRequests?: string;
    reservationTime?: string;
    partySize?: number;
}

// Legacy/Specific Booking Interfaces used by individual modals
export interface FlightBookingDetails {
    passengers: { name: string }[];
    payment: {
        cardNumber: string;
        expiryDate: string;
        cvc: string;
    };
}

export interface HotelBookingDetails {
    guests: { name: string }[];
    payment: {
        cardNumber: string;
        expiryDate: string;
        cvc: string;
    };
}

export interface LocalTransportBookingDetails {
    payment: {
        cardNumber: string;
        expiryDate: string;
        cvc: string;
    };
}

export interface FlightInfo {
    airline: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    price: number;
    stops: number;
}

export interface TravelAdvisory {
    title: string;
    details: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface BookingConfirmation {
    confirmationMessage: string;
    bookingId: string;
    details?: any;
}

export interface LocationPoint {
    name: string;
    lat: number;
    lng: number;
    day: number;
}

export interface UserPreferences {
    defaultDepartureCity?: string;
    defaultTravelStyle?: 'Economy' | 'Standard' | 'Luxury';
    defaultInterests?: string[];
}