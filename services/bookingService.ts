
import type { Activity, BookingDetails, BookingConfirmation, FlightInfo } from '../types';

export const AIRLINES = ['SkyLink Airlines', 'AeroVista', 'CloudHopper', 'Quantum Flights', 'Horizon Air'];

/**
 * Creates a unique key for an activity to use with localStorage.
 */
const createActivityKey = (activity: Activity): string => {
  const desc = activity?.description ? String(activity.description) : 'activity';
  const time = activity?.time ? String(activity.time) : '00:00';
  const cleanedDescription = desc.replace(/[^a-zA-Z0-9]/g, '');
  const cleanedTime = time.replace(':', '');
  return `booking_${cleanedDescription.slice(0, 30)}_${cleanedTime}`;
};

/**
 * Simulates calling a flight search API.
 */
export const searchFlights = (
    activity: Activity,
    passengers: number,
    preferences?: { airlines?: string[]; time?: 'Any' | 'Morning' | 'Afternoon' | 'Evening', maxStops?: number }
): Promise<FlightInfo[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockResults: FlightInfo[] = [];
            const basePrice = (activity.estimated_cost || 5000) / (passengers || 1) * 0.8; 
            const airlines = AIRLINES;

            for (let i = 0; i < 15; i++) {
                const airline = airlines[Math.floor(Math.random() * airlines.length)];
                const departureHour = 6 + Math.floor(Math.random() * 15);
                const durationHours = 4 + Math.floor(Math.random() * 6);
                const arrivalHour = (departureHour + durationHours) % 24;
                const priceFluctuation = 1 + (Math.random() - 0.5) * 0.4;
                
                mockResults.push({
                    airline,
                    departureTime: `${departureHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                    arrivalTime: `${arrivalHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                    duration: `${durationHours}h ${Math.floor(Math.random() * 60)}m`,
                    price: Math.round(basePrice * priceFluctuation),
                    stops: Math.floor(Math.random() * 3),
                });
            }

            let filtered = mockResults;
            if (preferences?.airlines?.length) filtered = filtered.filter(f => preferences.airlines!.includes(f.airline));
            if (preferences?.maxStops !== undefined && preferences.maxStops < 2) filtered = filtered.filter(f => f.stops <= preferences.maxStops!);
            
            resolve(filtered);
        }, 300); 
    });
};

/**
 * Unified booking function handling all types.
 */
export const processBooking = (activity: Activity, details: BookingDetails): Promise<BookingConfirmation> => {
    console.log(`Processing ${details.type} booking for: ${activity.description}`, details);

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const cardNum = details.payment?.cardNumber || '';
            
            if (!/^\d{16}$/.test(cardNum.replace(/\s/g, ''))) {
                return reject(new Error('Invalid card number.'));
            }

            if (Math.random() > 0.1) { // 90% Success
                const prefix = details.type.substring(0, 3).toUpperCase();
                const bookingId = `GT-${prefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                
                const confirmation: BookingConfirmation = {
                    confirmationMessage: `${details.type} booking confirmed!`,
                    bookingId,
                    details: {
                        ...details,
                        bookedAt: new Date().toISOString(),
                        activityName: activity.description,
                        cost: activity.estimated_cost
                    }
                };

                try {
                    const key = createActivityKey(activity);
                    localStorage.setItem(key, JSON.stringify(confirmation));
                    resolve(confirmation);
                } catch (e) {
                    reject(new Error('Storage full.'));
                }
            } else {
                reject(new Error('Service temporarily unavailable.'));
            }
        }, 1000);
    });
};

// Legacy wrappers
export const bookFlightTicket = (activity: Activity, details: { passengers: any[], payment: any }): Promise<BookingConfirmation> => {
    const unifiedDetails: BookingDetails = {
        type: 'Flight',
        passengers: details.passengers,
        payment: details.payment,
        flightClass: 'Economy'
    };
    return processBooking(activity, unifiedDetails);
};

export const bookHotel = (activity: Activity, details: { guests: any[], payment: any }): Promise<BookingConfirmation> => {
     const unifiedDetails: BookingDetails = {
        type: 'Hotel',
        guests: details.guests,
        payment: details.payment,
        roomType: 'Standard'
    };
    return processBooking(activity, unifiedDetails);
};

export const bookLocalTransport = (activity: Activity, details: { payment: any }): Promise<BookingConfirmation> => {
     const unifiedDetails: BookingDetails = {
        type: 'Car',
        payment: details.payment
    };
    return processBooking(activity, unifiedDetails);
};

export const checkBookingStatus = (activity: Activity): boolean => {
    try {
        if (!activity) return false;
        const key = createActivityKey(activity);
        return localStorage.getItem(key) !== null;
    } catch {
        return false;
    }
};

export const getBookingDetails = (activity: Activity): any | null => {
    try {
        if (!activity) return null;
        const key = createActivityKey(activity);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const checkFlightBookingStatus = checkBookingStatus;
export const checkHotelBookingStatus = checkBookingStatus;
export const checkLocalTransportBookingStatus = checkBookingStatus;
