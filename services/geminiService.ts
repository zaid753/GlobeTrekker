import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { TripDetails, Itinerary, ChatMessage, TravelAdvisory, DayPlan, AccommodationRecommendations, Transportation, FoodRecommendations, WeatherForecast, LocationPoint } from '../types';

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set. Please configure it to use AI features.");
}
const ai = new GoogleGenAI({ apiKey });

// --- Image Caching ---
const imageCache = new Map<string, string>();

// --- Retry Logic ---
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('Quota exceeded');
        const isServerOverload = error.message?.includes('503') || error.status === 503;
        
        if (retries > 0 && (isRateLimit || isServerOverload)) {
            let waitTime = delay;
            if (isRateLimit) {
                const match = error.message?.match(/retry in (\d+(?:\.\d+)?)s/);
                if (match && match[1]) {
                    waitTime = (parseFloat(match[1]) + 1) * 1000;
                } else {
                    waitTime = Math.max(delay, 15000);
                }
            }
            console.log(`Rate limited or overloaded. Retrying in ${waitTime}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return retryWithBackoff(fn, retries - 1, isRateLimit ? waitTime : delay * 2);
        }
        
        // If we're out of retries, or it's a different error, interpret and throw descriptive error
        let userMessage = "An unexpected error occurred. Please try again.";
        if (isRateLimit) {
            userMessage = "We are receiving too many requests right now. Please try again in a few moments.";
        } else if (isServerOverload) {
             userMessage = "The AI service is currently overloaded. Please try again later.";
        } else if (error.message?.includes('SAFETY')) {
             userMessage = "The request was flagged by safety filters. Please modify your request and try again.";
        } else if (error.message?.includes('API_KEY')) {
             userMessage = "There is an issue with the API configuration. Please check your API key.";
        }

        const newError = new Error(userMessage);
        (newError as any).originalError = error;
        throw newError;
    }
};

export const getDummyImageUrl = (destination: string, keywords: string, seedExtra: number | string, type: 'banner' | 'hotel' | 'food' | 'activity' = 'banner') => {
    // Enhanced prompt for Pollinations.ai for better accuracy and relevance
    let contextTerms = "";
    switch (type) {
        case 'hotel':
            contextTerms = "luxury hotel exterior, modern architecture, resort, swimming pool, golden hour";
            break;
        case 'food':
            contextTerms = "gourmet food photography, delicious dish, fine dining, macro shot, restaurant atmosphere";
            break;
        case 'activity':
            contextTerms = "tourist attraction, scenic view, travel photography, vibrant colors, adventure";
            break;
        case 'banner':
        default:
            contextTerms = "cinematic travel photography, wide angle, iconic landmark, award winning, 8k, breathtaking view";
            break;
    }

    const prompt = encodeURIComponent(`${keywords} in ${destination}, ${contextTerms}`);
    // Dimensions optimization
    const width = type === 'banner' ? 1200 : 800;
    const height = type === 'banner' ? 600 : 600;
    
    return `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&nologo=true&seed=${seedExtra}&model=flux`;
};

// Reusable sub-schemas
const hotelSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        address: { type: Type.STRING, description: "Address." },
        star_rating: { type: Type.NUMBER },
        rating: { type: Type.NUMBER },
        amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
        estimated_nightly_cost: { type: Type.NUMBER, description: "Cost in INR" },
    },
    required: ["name", "address", "star_rating", "rating", "amenities", "estimated_nightly_cost"]
};

// Schemas for modular generation
const coreItinerarySchema = {
    type: Type.OBJECT,
    properties: {
        trip_title: { type: Type.STRING },
        total_estimated_cost: { type: Type.NUMBER },
        currency: { type: Type.STRING },
        trip_summary: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING },
                highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["description", "highlights"],
        },
        detailed_cost_breakdown: {
            type: Type.OBJECT,
            properties: {
                stay: { type: Type.NUMBER },
                travel: { type: Type.NUMBER },
                food: { type: Type.NUMBER },
                activities: { type: Type.NUMBER },
                miscellaneous: { type: Type.NUMBER },
            },
            required: ["stay", "travel", "food", "activities", "miscellaneous"],
        },
        schedule: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    activities: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                time: { type: Type.STRING },
                                description: { type: Type.STRING },
                                type: { type: Type.STRING, description: "Type: 'Food', 'Sightseeing', 'Activity', 'Travel', 'Accommodation'" },
                                estimated_cost: { type: Type.NUMBER },
                                priority: { type: Type.STRING, description: "High, Medium, or Low" },
                                travel_details: {
                                    type: Type.OBJECT,
                                    properties: {
                                        distance: { type: Type.STRING },
                                        duration: { type: Type.STRING }
                                    }
                                }
                            },
                            required: ["time", "description", "type", "estimated_cost"],
                        },
                    },
                    ai_tip: { type: Type.STRING },
                },
                required: ["day", "title", "activities", "ai_tip"],
            },
        },
    },
    required: ["trip_title", "total_estimated_cost", "currency", "trip_summary", "detailed_cost_breakdown", "schedule"],
};

const accommodationSchema = {
    type: Type.OBJECT,
    properties: {
        accommodation_recommendations: {
            type: Type.OBJECT,
            properties: {
                budget: { type: Type.ARRAY, items: hotelSchema },
                standard: { type: Type.ARRAY, items: hotelSchema },
                luxury: { type: Type.ARRAY, items: hotelSchema },
                ai_stay_tip: { type: Type.STRING, description: "A helpful tip about choosing accommodation in this city, best areas etc." }
            },
            required: ["budget", "standard", "luxury", "ai_stay_tip"]
        }
    },
    required: ["accommodation_recommendations"]
};

// Enhanced Transportation Schema
const transportationSchema = {
    type: Type.OBJECT,
    properties: {
        transportation_options: {
            type: Type.OBJECT,
            properties: {
                long_distance_options: {
                    type: Type.ARRAY, 
                    items: {
                        type: Type.OBJECT, 
                        properties: {
                            mode: { type: Type.STRING }, 
                            details: { type: Type.STRING }, 
                            estimated_cost: { type: Type.NUMBER }, 
                            duration: { type: Type.STRING }, 
                            provider_examples: { type: Type.ARRAY, items: { type: Type.STRING } },
                            comfort_level: { type: Type.STRING, description: "High, Medium, or Low" },
                            frequency: { type: Type.STRING, description: "e.g., 'Daily', 'Hourly'" },
                            travel_tip: { type: Type.STRING },
                        },
                        required: ["mode", "details", "estimated_cost", "duration", "comfort_level"]
                    }
                },
                local_suggestions: {
                    type: Type.ARRAY, 
                    items: {
                        type: Type.OBJECT, 
                        properties: {
                            mode: { type: Type.STRING }, 
                            suggestion: { type: Type.STRING }, 
                            estimated_cost_range: { type: Type.STRING },
                        },
                        required: ["mode", "suggestion", "estimated_cost_range"]
                    }
                },
            },
            required: ["long_distance_options", "local_suggestions"]
        }
    },
    required: ["transportation_options"]
};

const foodSchema = {
    type: Type.OBJECT,
    properties: {
        food_recommendations: {
            type: Type.OBJECT,
            properties: {
                restaurants: {
                    type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: {
                            name: { type: Type.STRING }, cuisine_type: { type: Type.STRING }, estimated_cost_per_person: { type: Type.NUMBER }, rating: { type: Type.NUMBER }, notes: { type: Type.STRING }, price_range: { type: Type.STRING }, must_try_dishes: { type: Type.ARRAY, items: { type: Type.STRING } }, ambience: { type: Type.STRING },
                        },
                        required: ["name", "cuisine_type", "estimated_cost_per_person", "rating", "notes", "price_range", "must_try_dishes", "ambience"]
                    }
                },
                local_specialties: { type: Type.ARRAY, items: { type: Type.STRING } },
                ai_foodie_tip: { type: Type.STRING }
            },
            required: ["restaurants", "local_specialties", "ai_foodie_tip"]
        }
    },
    required: ["food_recommendations"]
};

const weatherSchema = {
    type: Type.OBJECT,
    properties: {
        weather_forecast: {
            type: Type.OBJECT,
            properties: {
                weekly_summary: { type: Type.STRING },
                daily_forecasts: {
                    type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: {
                            day: { type: Type.INTEGER }, 
                            high_temp_celsius: { type: Type.NUMBER }, 
                            low_temp_celsius: { type: Type.NUMBER }, 
                            description: { type: Type.STRING }, 
                            feels_like_celsius: { type: Type.NUMBER }, 
                            humidity_percent: { type: Type.NUMBER }, 
                            uv_index: { type: Type.STRING }, 
                            chance_of_rain_percent: { type: Type.NUMBER },
                        },
                        required: ["day", "high_temp_celsius", "low_temp_celsius", "description", "feels_like_celsius", "humidity_percent", "uv_index", "chance_of_rain_percent"]
                    }
                },
                packing_recommendation: { type: Type.STRING }
            },
            required: ["daily_forecasts", "packing_recommendation", "weekly_summary"]
        }
    },
    required: ["weather_forecast"]
};


const generateContentOrThrow = async <T>(prompt: string, schema: object): Promise<T> => {
    return retryWithBackoff(async () => {
        let jsonText = '';
        try {
            const response = await ai.models.generateContent({
                model: localStorage.getItem('admin_ai_model') || 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            if (!response.text) {
                throw new Error("Empty AI response.");
            }

            jsonText = response.text.trim();
            const cleanJsonText = jsonText.replace(/^```json\s*|```$/g, '');
            return JSON.parse(cleanJsonText) as T;

        } catch (error) {
            console.error("AI Gen Error:", error);
            throw error; 
        }
    });
};

const generateAndParse = async <T>(prompt: string, schema: object): Promise<T | null> => {
    try {
        return await generateContentOrThrow<T>(prompt, schema);
    } catch (error) {
        console.error("AI Supplemental Error (Final):", error);
        return null;
    }
};

export const generateCoreItinerary = async (details: TripDetails): Promise<Itinerary> => {
    const prompt = `
      Create a ${details.duration}-day trip itinerary to ${details.destination} from ${details.departureCity}.
      Travelers: ${details.travellers}. Style: ${details.travelStyle}. Interests: ${details.interests.join(', ')}.
      ${details.budget ? `Budget: ~${details.budget} INR.` : ''}
      
      REQUIREMENTS:
      1. Valid JSON only.
      2. All costs in INR. detailed_cost_breakdown sum must equal total_estimated_cost. Use realistic market prices for 2024.
      3. Schedule for exactly ${details.duration} days. Max 3-4 impactful activities per day to optimize speed and readability.
      4. Populate 'travel_details' for Travel activities.
      5. Relevance is critical: tailor every activity strictly to the user's interests (${details.interests.join(', ')}). Avoid generic tourist traps unless they align.
    `;
    return generateContentOrThrow<Itinerary>(prompt, coreItinerarySchema);
};

export const generateAccommodationRecommendations = async (details: TripDetails): Promise<AccommodationRecommendations | null> => {
    const prompt = `Recommend 3 budget, 3 standard, 3 luxury hotels in ${details.destination}. 
    IMPORTANT: estimated_nightly_cost MUST be in INR and reflect current 2024 real-world market rates for this specific location.
    Include a specific AI tip for staying in this area (e.g., best neighborhoods). JSON only.`;
    const result = await generateAndParse<{ accommodation_recommendations: AccommodationRecommendations }>(prompt, accommodationSchema);
    return result?.accommodation_recommendations || null;
};

export const generateTransportationOptions = async (details: TripDetails): Promise<Transportation | null> => {
    const prompt = `
      Transport options from ${details.departureCity} to ${details.destination}.
      Provide at least 3 long distance options (flight, train, bus/car) and local commute suggestions.
      Output MUST BE valid JSON with exact keys: "transportation_options" containing "long_distance_options" (array) and "local_suggestions" (array).
      Include realistic estimated costs in INR.
    `;
    const result = await generateAndParse<{ transportation_options: Transportation }>(prompt, transportationSchema);
    return result?.transportation_options || null;
};

export const generateFoodRecommendations = async (details: TripDetails): Promise<FoodRecommendations | null> => {
    const prompt = `
      Recommend 5 restaurants in ${details.destination} matching interests: ${details.interests.join(', ')}.
      IMPORTANT: estimated_cost_per_person MUST be in INR and reflect real menu prices for 2024 in this city.
      Include price range, must-try dishes. JSON only.
    `;
    const result = await generateAndParse<{ food_recommendations: FoodRecommendations }>(prompt, foodSchema);
    return result?.food_recommendations || null;
};

export const generateWeatherForecast = async (details: TripDetails): Promise<WeatherForecast | null> => {
    const prompt = `7-day weather forecast for ${details.destination} starting ${details.startDate}. Include 'uv_index' (e.g., 'High (7)'), 'humidity_percent' (number), 'chance_of_rain_percent' (number), 'feels_like_celsius' (number) for each day. JSON only.`;
    const result = await generateAndParse<{ weather_forecast: WeatherForecast }>(prompt, weatherSchema);
    return result?.weather_forecast || null;
};

type ImageContext = 'banner' | 'food' | 'hotel' | 'activity';

export const generateImageForActivity = async (prompt: string, context: ImageContext = 'banner'): Promise<string | null> => {
    // Check cache first
    const cacheKey = `${context}:${prompt}`;
    if (imageCache.has(cacheKey)) {
        return imageCache.get(cacheKey)!;
    }

    try {
        // Slightly increased delay for retries to handle rate limits better
        const imageUrl = await retryWithBackoff(async () => {
            let fullPrompt = "";
            
            // Optimized prompts for faster/better relevance
            switch (context) {
                case 'food':
                    fullPrompt = `Professional food photography of ${prompt}. Authentic dish from the region, gourmet plating, soft lighting, 4k resolution.`;
                    break;
                case 'hotel':
                    fullPrompt = `Exterior or interior architecture photography of ${prompt}. High-end travel magazine style, inviting atmosphere, 4k resolution.`;
                    break;
                case 'activity':
                    fullPrompt = `Travel photography of ${prompt}. Scenic, vibrant colors, golden hour lighting, 4k resolution.`;
                    break;
                case 'banner':
                default:
                    fullPrompt = `Cinematic wide shot of ${prompt}. Iconic landmark or landscape, travel wanderlust style, 8k resolution.`;
                    break;
            }
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: fullPrompt }],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            // Fix: Iterating through parts to find the image part as per @google/genai guidelines
            const candidates = response.candidates;
            if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            return null;
        }, 3, 2000); 

        if (imageUrl) {
            imageCache.set(cacheKey, imageUrl);
        }
        return imageUrl;

    } catch (error) {
        console.warn("Image generation failed or rate limited, using fallback.", error);
        return null;
    }
};

export const getChatResponse = async (history: ChatMessage[], newMessage: string, itinerary?: Itinerary | null, details?: TripDetails | null): Promise<string> => {
    try {
        let systemInstruction = `You are GlobeTrekker AI, a helpful travel assistant. Keep answers concise and friendly.`;

        if (itinerary && details) {
            const context = JSON.stringify({
                dest: details.destination,
                duration: details.duration,
                budget: itinerary.total_estimated_cost,
                schedule: itinerary.schedule.slice(0, 3) // limit context size
            });
            systemInstruction = `You are GlobeTrekker AI. User is viewing a trip to ${details.destination}. Context: ${context}. Answer questions about this trip or general travel. Be concise.`;
        }

        const chat = ai.chats.create({
            model: localStorage.getItem('admin_ai_model') || 'gemini-2.5-flash',
            history: history.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            })),
            config: { systemInstruction }
        });

        const response = await chat.sendMessage({ message: newMessage });
        // Fix: Use property .text and handle undefined as per @google/genai guidelines
        return response.text || "I'm sorry, I'm having trouble thinking of a response right now.";
    } catch (error) {
        return "I'm having trouble connecting right now.";
    }
};

const travelAdvisorySchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            details: { type: Type.STRING },
            severity: { type: Type.STRING },
        },
        required: ["title", "details", "severity"],
    }
};

export const getTravelAdvisories = async (destination: string, startDate: string, endDate: string): Promise<TravelAdvisory[] | null> => {
    const prompt = `Travel advisories for ${destination} (${startDate} to ${endDate}). JSON only. Max 3.`;
    return generateAndParse<TravelAdvisory[]>(prompt, travelAdvisorySchema);
};

const geocodeSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            day: { type: Type.INTEGER },
        },
        required: ["name", "lat", "lng", "day"],
    }
};

export const extractLocationsFromSchedule = async (schedule: DayPlan[], destination: string) => {
    const simplified = schedule.map(d => ({ d: d.day, a: d.activities.map(a => a.description) }));
    const prompt = `Geocode main locations for trip to ${destination}. Schedule: ${JSON.stringify(simplified)}. JSON array of {name, lat, lng, day}.`;
    const res = await generateAndParse<LocationPoint[]>(prompt, geocodeSchema);
    return res || [];
};
