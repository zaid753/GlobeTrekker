
import React, { useEffect, useRef, useMemo, useState } from 'react';
import type { DayPlan, TripDetails, Activity, LocationPoint } from '../types';
import { getDummyImageUrl } from '../services/geminiService';

declare var L: any; // Use Leaflet from CDN

interface MapViewProps {
    schedule: DayPlan[];
    details: TripDetails;
    locations: LocationPoint[];
}

const iconStrings: { [key in Activity['type'] | 'Default' | 'cafe' | 'museum' | 'attraction']: string } = {
    Food: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z" /><path d="M21 15v6" /><path d="M15 15h6" /></svg>`,
    Sightseeing: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>`,
    Activity: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13.2 21.8-3.4-3.4" /><path d="m10.8 18.4 3.4 3.4" /><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3-2-3s-2.5 1.5-3.5 2.5-2 2.5-3 2.5-1.5-1-2.5-2-1.5-2.5-2.5-2.5-2 1-2 3a7 7 0 0 0 7 7Z" /><path d="m14 4 3 3" /><path d="M12 6a3 3 0 0 0-3 3" /></svg>`,
    Travel: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 18H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" /><path d="M10 6V4" /><path d="M14 6V4" /><path d="M12 18V6" /></svg>`,
    Accommodation: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.2c0-1.5.9-2.8 2.3-3.2" /><path d="m22 8.2c0-1.5-1-2.8-2.3-3.2" /><path d="M15 11h.01" /><path d="M11 11h.01" /><path d="M7 11h.01" /><path d="M22 12v4.8c0 1.5-.9 2.8-2.3 3.2" /><path d="M2 12v4.8c0 1.5.9 2.8 2.3 3.2" /><path d="M17 19.8c-1.5.4-3.2.6-4.9.6-1.8 0-3.5-.2-5.1-.6" /><path d="M17 5c-1.5-.4-3.2-.6-4.9-.6-1.8 0-3.5.2-5.1-.6" /></svg>`,
    cafe: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
    museum: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`,
    attraction: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/></svg>`,
    Default: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>`,
};


const MapView: React.FC<MapViewProps> = ({ schedule, details, locations }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any | null>(null);
    const markerClusterGroupRef = useRef<any | null>(null);
    
    const [poiData, setPoiData] = useState<{ [key: string]: any[] }>({});
    const [activePois, setActivePois] = useState<{ [key: string]: boolean }>({ cafe: false, museum: false, attraction: false });
    const [isLoadingPoi, setIsLoadingPoi] = useState<{ [key: string]: boolean }>({});

    const dayColors = useMemo(() => [
        '#3b82f6', // blue-500
        '#10b981', // emerald-500
        '#ef4444', // red-500
        '#f97316', // orange-500
        '#8b5cf6', // violet-500
        '#ec4899', // pink-500
        '#f59e0b', // amber-500
    ], []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
    };

    const togglePoi = async (type: string) => {
        const isActive = !activePois[type];
        setActivePois(prev => ({ ...prev, [type]: isActive }));

        if (isActive && !poiData[type]) {
            setIsLoadingPoi(prev => ({ ...prev, [type]: true }));
            try {
                const query = `${type} in ${details.destination}`;
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=15`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    const fetchedPois = data.map((d: any) => ({
                        lat: parseFloat(d.lat),
                        lon: parseFloat(d.lon),
                        name: d.display_name.split(',')[0],
                        type: type,
                        fullname: d.display_name
                    }));
                    setPoiData(prev => ({ ...prev, [type]: fetchedPois }));
                }
            } catch (e) {
                console.error('Failed to fetch POIs', e);
            } finally {
                setIsLoadingPoi(prev => ({ ...prev, [type]: false }));
            }
        }
    };

    useEffect(() => {
        if (!mapContainerRef.current) {
            return;
        }

        // Initialize map and cluster group only once
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);
            markerClusterGroupRef.current = L.markerClusterGroup();
            mapRef.current.addLayer(markerClusterGroupRef.current);
        }

        const map = mapRef.current;
        const markers = markerClusterGroupRef.current;
        
        // Clear existing markers from the cluster group
        markers.clearLayers();
        
        const bounds = L.latLngBounds();

        if (locations.length === 0) {
            // Fallback to destination if no locations plotted
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(details.destination)}&format=json&limit=1`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);
                        const marker = L.marker([lat, lon]).bindPopup(`<b>${details.destination}</b><br/><span class="text-sm">Main Destination</span>`);
                        markers.addLayer(marker);
                        map.setView([lat, lon], 12);
                    } else {
                        map.setView([20.5937, 78.9629], 5);
                    }
                }).catch(() => map.setView([20.5937, 78.9629], 5));
            // Render POIs anyway if toggled
        }

        locations.forEach(location => {
            // Try to find matching activities for extra details, but don't block rendering if not found
            const matchingActivities = schedule
                .find(day => day.day === location.day)?.activities
                .filter(act => act.description.toLowerCase().includes(location.name.toLowerCase().split(',')[0])) || [];

            // Determine icon based on matched activity or default
            let primaryActivityType = 'Sightseeing';
            if (matchingActivities.length > 0 && matchingActivities[0].type) {
                primaryActivityType = matchingActivities[0].type;
            }
            
            // Safe lookup
            const iconSvg = (iconStrings[primaryActivityType as keyof typeof iconStrings] || iconStrings.Default) || "";
            
            // Ensure we have an icon string before trying to manipulate it
            if (!iconSvg) return;
            
            const dayIndex = Number(location.day) - 1;
            const dayColor = dayColors[dayIndex % dayColors.length] || dayColors[0];
            
            const iconHtml = `
                <div style="position: relative; width: 36px; height: 36px; font-size: 0;">
                    <svg viewBox="0 0 24 24" width="36" height="36" style="position: absolute; top: -36px; left: -18px; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${dayColor}" />
                    </svg>
                    <div style="position: absolute; top: -28px; left: -10px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
                        ${iconSvg.replace(/stroke="currentColor"/g, 'stroke="white"').replace(/width="24"/g, 'width="16"').replace(/height="24"/g, 'height="16"')}
                    </div>
                </div>`;

            const customIcon = L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36],
            });

            const marker = L.marker([location.lat, location.lng], { icon: customIcon });
            
            // Generate Image URL for the popup
            const imageUrl = getDummyImageUrl(details.destination, location.name, location.day);

            let popupContent = `
                <div class="p-1" style="width: 220px; font-family: sans-serif;">
                    <img src="${imageUrl}" alt="${location.name}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />
                    <b class="text-base text-gray-800 dark:text-gray-100 block mb-1">${location.name}</b>
                    <span class="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">Day ${location.day}</span>`;
            
            if (matchingActivities.length > 0) {
                matchingActivities.forEach(act => {
                    const actIconSvg = iconStrings[act.type as keyof typeof iconStrings] || iconStrings.Default;
                    popupContent += `
                        <div class="mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
                            <div class="flex items-center gap-2 mb-1">
                                <div style="width: 16px; height: 16px; color: #4b5563;">${actIconSvg}</div>
                                <p class="m-0 font-semibold text-sm text-gray-700 dark:text-gray-200">${act.time}</p>
                            </div>
                            <p class="m-0 text-sm text-gray-600 dark:text-gray-400 pl-6 line-clamp-2">${act.description}</p>
                            ${act.estimated_cost > 0 ? `<p class="m-0 text-xs text-green-600 dark:text-green-400 pl-6 font-bold mt-1">Est: ${formatCurrency(act.estimated_cost)}</p>` : ''}
                        </div>`;
                });
            } else {
                popupContent += `<p class="m-0 text-sm text-gray-600 dark:text-gray-400 mt-2">Key location for your trip.</p>`;
            }
            
            // Add External Links
            popupContent += `
                <div class="mt-3 flex gap-2">
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ' ' + details.destination)}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background-color: #0891b2; color: white; text-decoration: none; padding: 4px; font-size: 12px; border-radius: 4px; font-weight: bold;">Directions</a>
                    <a href="https://www.google.com/search?q=${encodeURIComponent(location.name + ' ' + details.destination)}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background-color: #f3f4f6; color: #374151; text-decoration: none; padding: 4px; font-size: 12px; border-radius: 4px; font-weight: bold; border: 1px solid #d1d5db;">Info</a>
                </div>
            </div>`;

            marker.bindPopup(popupContent);
            markers.addLayer(marker);
            bounds.extend([location.lat, location.lng]);
        });

        // Add POIs to map
        Object.keys(activePois).forEach(type => {
            if (activePois[type] && poiData[type]) {
                const iconSvg = iconStrings[type as keyof typeof iconStrings] || iconStrings.Default;
                const poiColor = type === 'cafe' ? '#eab308' : type === 'museum' ? '#6366f1' : '#a855f7';
                
                poiData[type].forEach(poi => {
                    const iconHtml = `
                        <div style="position: relative; width: 28px; height: 28px; font-size: 0;">
                            <svg viewBox="0 0 24 24" width="28" height="28" style="position: absolute; top: -28px; left: -14px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${poiColor}" stroke="white" stroke-width="1.5" />
                            </svg>
                            <div style="position: absolute; top: -23px; left: -8px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: white;">
                                ${iconSvg.replace(/stroke="currentColor"/g, 'stroke="white"').replace(/width="24"/g, 'width="12"').replace(/height="24"/g, 'height="12"')}
                            </div>
                        </div>`;

                    const customIcon = L.divIcon({
                        html: iconHtml,
                        className: '',
                        iconSize: [28, 28],
                        iconAnchor: [14, 28],
                        popupAnchor: [0, -28],
                    });

                    const marker = L.marker([poi.lat, poi.lon], { icon: customIcon });
                    
                    const popupContent = `
                        <div class="p-1" style="width: 180px; font-family: sans-serif;">
                            <b class="text-sm text-gray-800 dark:text-gray-100 block mb-1">${poi.name}</b>
                            <span class="text-xs text-gray-500 capitalize tracking-wide font-medium block mb-2">${type} • Point of Interest</span>
                            <div class="mt-2 flex gap-2">
                                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' ' + details.destination)}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background-color: #f3f4f6; color: #374151; text-decoration: none; padding: 4px; font-size: 12px; border-radius: 4px; font-weight: bold; border: 1px solid #d1d5db;">Directions</a>
                            </div>
                        </div>`;

                    marker.bindPopup(popupContent);
                    markers.addLayer(marker);
                    bounds.extend([poi.lat, poi.lon]);
                });
            }
        });

        if (bounds.isValid() && (locations.length > 0 || Object.values(activePois).some(v => v))) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (locations.length === 0) {
             // Let the fallback handle
        }
        
    }, [locations, dayColors, schedule, details.destination, activePois, poiData]);

    return (
        <div>
             <div className="flex flex-wrap items-center gap-3 mb-4">
                 <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Discover Nearby:</span>
                 {['cafe', 'museum', 'attraction'].map((type) => (
                     <button
                         key={type}
                         onClick={() => togglePoi(type)}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm cursor-pointer
                             ${activePois[type] 
                                 ? type === 'cafe' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400' 
                                 : type === 'museum' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-400'
                                 : 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-400'
                                 : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                             }`}
                     >
                         <span className="w-4 h-4 flex items-center justify-center">
                             {isLoadingPoi[type] ? (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                             ) : (
                                <div dangerouslySetInnerHTML={{ __html: iconStrings[type as keyof typeof iconStrings] || iconStrings.Default }} className="w-full h-full" />
                             )}
                         </span>
                         <span className="capitalize">{type}s</span>
                     </button>
                 ))}
             </div>
             
             <div ref={mapContainerRef} style={{ height: '60vh', borderRadius: '12px', zIndex: 0 }} aria-label="Interactive map of trip locations"></div>
             
             {locations.length > 0 && (
                 <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                    {Array.from(new Set(locations.map(l => l.day))).sort((a, b) => Number(a) - Number(b)).map(dayNum => (
                         <div key={String(dayNum)} className="flex items-center">
                            <span className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: dayColors[(Number(dayNum) - 1) % dayColors.length] || dayColors[0] }}></span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Day {String(dayNum)}</span>
                        </div>
                    ))}
                 </div>
             )}
        </div>
    );
};

export default MapView;
