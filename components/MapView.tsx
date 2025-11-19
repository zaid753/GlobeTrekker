import React, { useEffect, useRef, useMemo } from 'react';
import type { DayPlan, TripDetails, Activity, LocationPoint } from '../types';

declare var L: any; // Use Leaflet from CDN

interface MapViewProps {
    schedule: DayPlan[];
    details: TripDetails;
    locations: LocationPoint[];
}

const iconStrings: { [key in Activity['type'] | 'Default']: string } = {
    Food: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z" /><path d="M21 15v6" /><path d="M15 15h6" /></svg>`,
    Sightseeing: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>`,
    Activity: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13.2 21.8-3.4-3.4" /><path d="m10.8 18.4 3.4 3.4" /><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3-2-3s-2.5 1.5-3.5 2.5-2 2.5-3 2.5-1.5-1-2.5-2-1.5-2.5-2.5-2.5-2 1-2 3a7 7 0 0 0 7 7Z" /><path d="m14 4 3 3" /><path d="M12 6a3 3 0 0 0-3 3" /></svg>`,
    Travel: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 18H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" /><path d="M10 6V4" /><path d="M14 6V4" /><path d="M12 18V6" /></svg>`,
    Accommodation: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.2c0-1.5.9-2.8 2.3-3.2" /><path d="m22 8.2c0-1.5-1-2.8-2.3-3.2" /><path d="M15 11h.01" /><path d="M11 11h.01" /><path d="M7 11h.01" /><path d="M22 12v4.8c0 1.5-.9 2.8-2.3 3.2" /><path d="M2 12v4.8c0 1.5.9 2.8 2.3 3.2" /><path d="M17 19.8c-1.5.4-3.2.6-4.9.6-1.8 0-3.5-.2-5.1-.6" /><path d="M17 5c-1.5-.4-3.2-.6-4.9-.6-1.8 0-3.5.2-5.1-.6" /></svg>`,
    Default: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>`,
};


const MapView: React.FC<MapViewProps> = ({ schedule, details, locations }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any | null>(null);
    const markerClusterGroupRef = useRef<any | null>(null);

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

    useEffect(() => {
        if (locations.length === 0 || !mapContainerRef.current) {
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
            
            let popupContent = `<div class="p-1" style="max-height: 200px; overflow-y: auto;"><b class="text-base text-gray-800 dark:text-gray-100">${location.name} (Day ${location.day})</b>`;
            
            if (matchingActivities.length > 0) {
                matchingActivities.forEach(act => {
                    const actIconSvg = iconStrings[act.type as keyof typeof iconStrings] || iconStrings.Default;
                    popupContent += `
                        <div class="mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
                            <div class="flex items-center gap-2 mb-1">
                                <div class="w-5 h-5 text-gray-600 dark:text-gray-300 flex-shrink-0">${actIconSvg}</div>
                                <p class="m-0 font-semibold text-sm text-gray-700 dark:text-gray-200">${act.time} - ${act.type}</p>
                            </div>
                            <p class="m-0 text-sm text-gray-600 dark:text-gray-400 pl-7">${act.description}</p>
                            <p class="m-0 text-xs text-gray-500 dark:text-gray-400 pl-7 font-medium">Est. Cost: ${formatCurrency(act.estimated_cost)}</p>
                        </div>`;
                });
            } else {
                // Fallback content if specific activity isn't matched
                popupContent += `<p class="m-0 text-sm text-gray-600 dark:text-gray-400 mt-2">Location identified by AI planner.</p>`;
            }
            popupContent += '</div>';

            marker.bindPopup(popupContent);
            markers.addLayer(marker);
            bounds.extend([location.lat, location.lng]);
        });

        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else {
             map.setView([20.5937, 78.9629], 5); // Fallback to India
        }
        
    }, [locations, dayColors, schedule]);

    if (locations.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Could not identify specific locations to plot on the map.</p>
            </div>
        );
    }

    return (
        <div>
             <div ref={mapContainerRef} style={{ height: '60vh', borderRadius: '12px' }} aria-label="Interactive map of trip locations"></div>
             <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {Array.from(new Set(locations.map(l => l.day))).sort((a, b) => Number(a) - Number(b)).map(dayNum => (
                     <div key={String(dayNum)} className="flex items-center">
                        <span className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: dayColors[(Number(dayNum) - 1) % dayColors.length] || dayColors[0] }}></span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Day {String(dayNum)}</span>
                    </div>
                ))}
             </div>
        </div>
    );
};

export default MapView;