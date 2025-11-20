
import React, { useState, useEffect, useRef } from 'react';
import type { Itinerary, TripDetails, Activity, Hotel, FlightInfo, TravelAdvisory, LocationPoint, Restaurant, BookingType } from '../types';
import { 
    RouteIcon, BedIcon, CarIcon, UtensilsIcon, CloudSunIcon,
    FoodIcon, SightseeingIcon, ActivityIcon, TravelIcon, AccommodationIcon, InfoIcon, 
    CheckCircleIcon, SunIcon, TrainIcon, CloudIcon, CloudRainIcon, CloudLightningIcon, CloudSnowIcon,
    ScooterIcon, PlaneIcon, SparklesIcon, MapIcon, XCircleIcon, BriefcaseIcon, PieChartIcon, 
    ShareIcon, GlobeIcon, SpinnerIcon, EditIcon, GripVerticalIcon, FilterIcon, DownloadIcon,
    CalendarIcon, UserIcon
} from './icons';
import UniversalBookingModal from './UniversalBookingModal';
import BookingDetailsModal from './BookingDetailsModal';
import { checkBookingStatus } from '../services/bookingService';
import FlightSearchModal from './FlightSearchModal';
import MapView from './MapView';
import TravelAlerts from './TravelAlerts';
import MapWidget from './MapWidget';
import CurrencyConverter from './CurrencyConverter';

// Declaration for jspdf loaded via CDN
declare global {
    interface Window {
        jspdf: any;
    }
}

interface ItineraryReportProps {
  itinerary: Itinerary;
  details: TripDetails;
  setItinerary: React.Dispatch<React.SetStateAction<Itinerary | null>>;
  onSaveTrip: () => void;
  onShare: () => void;
  onEditTrip: () => void;
  onPlanNewTrip: () => void;
  travelAdvisories: TravelAdvisory[] | null;
  mapLocations: LocationPoint[] | null;
  guardWithAuth: (action: () => void) => void;
}

type Tab = 'Summary' | 'Itinerary' | 'Map' | 'Stay' | 'Transport' | 'Food' | 'Weather' | 'Budget';

const ImageWithFallback: React.FC<{src?: string | null; secondarySrc?: string | null; alt: string; fallback: React.ReactNode; className?: string}> = ({ src, secondarySrc, alt, fallback, className }) => {
    const [currentSrc, setCurrentSrc] = useState<string | null>(src || secondarySrc || null);
    const [hasError, setHasError] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        setCurrentSrc(src || secondarySrc || null);
        setHasError(false);
        setLoaded(false);
    }, [src, secondarySrc]);

    const handleError = () => {
        if (currentSrc === src && secondarySrc) {
            setCurrentSrc(secondarySrc);
            setLoaded(false);
        } else {
            setHasError(true);
        }
    };

    const handleLoad = () => {
        setLoaded(true);
    };

    if (!currentSrc || hasError) {
        return <>{fallback}</>;
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {!loaded && <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />}
            <img 
                ref={imgRef}
                src={currentSrc} 
                alt={alt} 
                loading="lazy" 
                className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} 
                onLoad={handleLoad}
                onError={handleError} 
            />
        </div>
    );
};

const getDummyImageUrl = (destination: string, keywords: string, seedExtra: number | string) => {
    const dest = destination || 'destination';
    const key = keywords || 'travel';
    const extra = seedExtra || '1';
    const seed = `${dest.slice(0, 5)}${key.slice(0, 5)}${extra}`.replace(/[^a-zA-Z0-9]/g, '');
    return `https://picsum.photos/seed/${seed}/800/600`;
};

// --- SKELETONS ---
const SkeletonPulse = ({ className }: { className: string }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${className}`} />
);
const CardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <SkeletonPulse className="h-48 w-full" />
        <div className="p-4">
            <SkeletonPulse className="h-6 w-3/4 mb-4" />
            <SkeletonPulse className="h-4 w-full mb-2" />
            <SkeletonPulse className="h-4 w-2/3 mt-4" />
        </div>
    </div>
);
const SectionError: React.FC<{ text: string }> = ({ text }) => (
     <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-800">
        <XCircleIcon className="h-12 w-12 text-red-500 dark:text-red-400" />
        <p className="mt-4 font-semibold text-red-700 dark:text-red-300">{text}</p>
    </div>
);

const ItineraryReport: React.FC<ItineraryReportProps> = ({ itinerary, details, setItinerary, onSaveTrip, onShare, onEditTrip, onPlanNewTrip, travelAdvisories, mapLocations, guardWithAuth }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Summary');
  const [bookingModal, setBookingModal] = useState<{activity: Activity, type: BookingType} | null>(null);
  const [flightSearchModalState, setFlightSearchModalState] = useState<{ activity: Activity; dayIndex: number; activityIndex: number } | null>(null);
  const [bookingDetailsModalActivity, setBookingDetailsModalActivity] = useState<Activity | null>(null);
  const [bookingUpdateKey, setBookingUpdateKey] = useState(0);
  const [filterType, setFilterType] = useState<Activity['type'] | 'All'>('All');
  const [isExporting, setIsExporting] = useState(false);
  
  // Drag and Drop Refs
  const dragItem = useRef<{dayIndex: number, index: number} | null>(null);
  const dragOverItem = useRef<{dayIndex: number, index: number} | null>(null);
  
  // Title Editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(itinerary.trip_title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
      if (isEditingTitle && titleInputRef.current) titleInputRef.current.focus();
  }, [isEditingTitle]);

  const handleTitleSave = () => {
      if (tempTitle.trim()) setItinerary(prev => prev ? ({ ...prev, trip_title: tempTitle }) : null);
      else setTempTitle(itinerary.trip_title);
      setIsEditingTitle(false);
  };

  const tabs: { name: Tab; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { name: 'Summary', icon: BriefcaseIcon },
    { name: 'Itinerary', icon: RouteIcon },
    { name: 'Map', icon: MapIcon },
    { name: 'Stay', icon: BedIcon },
    { name: 'Transport', icon: CarIcon },
    { name: 'Food', icon: UtensilsIcon },
    { name: 'Weather', icon: CloudSunIcon },
    { name: 'Budget', icon: PieChartIcon },
  ];

  const formatCurrency = (amount: number | undefined | null) => {
      if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };
  
  // Simplified currency format for PDF to avoid garbage characters with standard fonts
  const formatCurrencyPDF = (amount: number) => `Rs. ${amount.toLocaleString('en-IN')}`;

  const handleBookingComplete = () => {
    setBookingModal(null);
    setBookingDetailsModalActivity(null);
    setBookingUpdateKey(k => k + 1);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
        if (!window.jspdf) {
            throw new Error("PDF library not loaded");
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // -- Header --
        doc.setFontSize(22);
        doc.setTextColor(0, 139, 139); // Cyan-600ish
        doc.text(itinerary.trip_title, 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`${details.destination} • ${details.duration} Days • ${details.travellers} Travelers`, 14, 28);
        
        doc.line(14, 32, 196, 32);

        // -- Summary --
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("Trip Overview", 14, 42);
        
        doc.setFontSize(10);
        doc.setTextColor(80);
        const summaryLines = doc.splitTextToSize(itinerary.trip_summary.description, 180);
        doc.text(summaryLines, 14, 50);
        
        let currentY = 50 + (summaryLines.length * 5) + 10;

        // -- Itinerary --
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("Itinerary", 14, currentY);
        currentY += 8;

        const tableBody = [];
        itinerary.schedule.forEach(day => {
            tableBody.push([{ content: `Day ${day.day}: ${day.title}`, colSpan: 3, styles: { fillColor: [240, 249, 255], fontStyle: 'bold' } }]);
            day.activities.forEach(act => {
                tableBody.push([
                    act.time,
                    act.description,
                    act.estimated_cost > 0 ? formatCurrencyPDF(act.estimated_cost) : '-'
                ]);
            });
        });

        doc.autoTable({
            startY: currentY,
            head: [['Time', 'Activity', 'Cost']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [8, 145, 178] }, // Cyan-600
            styles: { fontSize: 9, cellPadding: 3 },
        });

        currentY = doc.lastAutoTable.finalY + 15;

        // -- Budget --
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(16);
        doc.text("Budget Breakdown", 14, currentY);
        currentY += 8;

        const budgetBody = [
            ['Accommodation', formatCurrencyPDF(itinerary.detailed_cost_breakdown.stay)],
            ['Travel', formatCurrencyPDF(itinerary.detailed_cost_breakdown.travel)],
            ['Food', formatCurrencyPDF(itinerary.detailed_cost_breakdown.food)],
            ['Activities', formatCurrencyPDF(itinerary.detailed_cost_breakdown.activities)],
            ['Miscellaneous', formatCurrencyPDF(itinerary.detailed_cost_breakdown.miscellaneous)],
            ['Total Estimated Cost', { content: formatCurrencyPDF(itinerary.total_estimated_cost), styles: { fontStyle: 'bold' } }]
        ];

        doc.autoTable({
            startY: currentY,
            body: budgetBody,
            theme: 'plain',
            styles: { fontSize: 10 },
        });

        doc.save(`GlobeTrekker_Itinerary_${details.destination.replace(/\s+/g, '_')}.pdf`);

    } catch (e) {
        console.error("Export failed", e);
        alert("Failed to generate PDF. Please try again.");
    } finally {
        setIsExporting(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'Food': return <FoodIcon className="h-5 w-5 text-white" />;
      case 'Sightseeing': return <SightseeingIcon className="h-5 w-5 text-white" />;
      case 'Activity': return <ActivityIcon className="h-5 w-5 text-white" />;
      case 'Travel': return <TravelIcon className="h-5 w-5 text-white" />;
      case 'Accommodation': return <AccommodationIcon className="h-5 w-5 text-white" />;
      default: return <InfoIcon className="h-5 w-5 text-white" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'Food': return 'bg-orange-500';
      case 'Sightseeing': return 'bg-blue-500';
      case 'Activity': return 'bg-emerald-500';
      case 'Travel': return 'bg-indigo-500';
      case 'Accommodation': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getWeatherIcon = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('thunder')) return <CloudLightningIcon className="h-8 w-8 text-yellow-500"/>;
    if (d.includes('rain') || d.includes('drizzle')) return <CloudRainIcon className="h-8 w-8 text-blue-400"/>;
    if (d.includes('snow')) return <CloudSnowIcon className="h-8 w-8 text-cyan-200"/>;
    if (d.includes('cloud')) return <CloudIcon className="h-8 w-8 text-gray-400"/>;
    return <SunIcon className="h-8 w-8 text-yellow-400"/>;
  };

  const handleFlightSelect = (selectedFlight: FlightInfo) => {
        if (!flightSearchModalState) return;
        const { dayIndex, activityIndex } = flightSearchModalState;
        const newItinerary = JSON.parse(JSON.stringify(itinerary));
        const activity = newItinerary.schedule[dayIndex].activities[activityIndex];
        activity.description = `${activity.description.split(' - Selected:')[0]} - Selected: ${selectedFlight.airline} (${selectedFlight.departureTime} - ${selectedFlight.arrivalTime})`;
        activity.estimated_cost = selectedFlight.price * details.travellers;
        setItinerary(newItinerary);
        setFlightSearchModalState(null);
  };

  const getFallbackUI = (type: 'accommodation' | 'food' | 'activity') => {
      let Icon = GlobeIcon;
      let label = "Explore";
      if(type === 'accommodation') { Icon = BedIcon; label = "Comfort Stay"; }
      else if(type === 'food') { Icon = UtensilsIcon; label = "Local Cuisine"; }
      else if(type === 'activity') { Icon = MapIcon; label = "Adventure"; }
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-center p-4">
          <div className="bg-white dark:bg-gray-700 p-3 rounded-full shadow-sm mb-3"><Icon className="h-6 w-6 text-gray-400" /></div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      );
  };

  const handleBookClick = (activity: Activity, dayIndex?: number, activityIndex?: number) => () => {
    guardWithAuth(() => {
        if (checkBookingStatus(activity)) {
            setBookingDetailsModalActivity(activity);
            return;
        }
        const desc = activity.description.toLowerCase();
        const isFlight = activity.type === 'Travel' && desc.includes('flight');
        
        if (isFlight && !desc.includes('selected:') && dayIndex !== undefined) {
             setFlightSearchModalState({ activity, dayIndex, activityIndex: activityIndex! });
             return;
        }

        let type: BookingType = 'Activity';
        if (activity.type === 'Accommodation') type = 'Hotel';
        else if (isFlight) type = 'Flight';
        else if (activity.type === 'Travel') type = desc.includes('train') ? 'Train' : 'Car';
        else if (activity.type === 'Food') type = 'Dining';

        setBookingModal({ activity, type });
    });
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, dayIndex: number, index: number) => {
      dragItem.current = { dayIndex, index };
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, dayIndex: number, index: number) => {
      e.preventDefault(); 
      dragOverItem.current = { dayIndex, index };
      
      if (!dragItem.current) return;
      // Only allow reordering if we are not filtering
      if (filterType !== 'All') return;
      
      // Only allow reordering within the same day
      if (dragItem.current.dayIndex !== dayIndex) return;
      
      if (dragItem.current.index === index) return;

      const newItinerary = { ...itinerary };
      const daySchedule = newItinerary.schedule[dayIndex];
      const updatedActivities = [...daySchedule.activities];
      
      const draggedItemContent = updatedActivities[dragItem.current.index];
      updatedActivities.splice(dragItem.current.index, 1);
      updatedActivities.splice(index, 0, draggedItemContent);
      
      daySchedule.activities = updatedActivities;
      setItinerary(newItinerary);
      dragItem.current.index = index;
  };

  const handleDragEnd = () => {
      dragItem.current = null;
      dragOverItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Summary':
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Trip Overview</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{itinerary.trip_summary.description}</p>
                </div>
                <div>
                    <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Key Highlights</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
                        {itinerary.trip_summary.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-500 flex-shrink-0"></span>
                                <span>{h}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700"><MapWidget destination={details.destination} /></div>
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                   {travelAdvisories ? <TravelAlerts tripDetails={details} advisories={travelAdvisories} /> : <SkeletonPulse className="h-32 w-full" />}
                </div>
            </div>
        );
      
      case 'Itinerary':
        const filteredSchedule = itinerary.schedule.map(day => ({
            ...day,
            activities: day.activities.filter(a => filterType === 'All' || a.type === filterType)
        }));

        return (
          <div className="space-y-8" key={bookingUpdateKey}>
            {/* Activity Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <FilterIcon className="h-5 w-5 text-gray-400 mr-1 flex-shrink-0" />
                {['All', 'Food', 'Sightseeing', 'Activity', 'Travel', 'Accommodation'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filterType === type ? 'bg-cyan-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {filteredSchedule.map((dayPlan, dayIndex) => (
                <div key={dayPlan.day} className="relative">
                    {/* Day Header */}
                    <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8 shadow-lg group">
                         {dayPlan.imageLoading ? (
                             <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700"><SparklesIcon className="h-12 w-12 text-gray-400 animate-pulse" /></div>
                        ) : (
                            <ImageWithFallback 
                                src={dayPlan.imageUrl}
                                secondarySrc={getDummyImageUrl(details.destination, dayPlan.title, dayPlan.day)}
                                alt={dayPlan.title} 
                                fallback={getFallbackUI('activity')}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-6 text-white">
                            <span className="bg-cyan-600 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide mb-2 inline-block">Day {dayPlan.day}</span>
                            <h3 className="text-3xl font-bold">{dayPlan.title}</h3>
                            <p className="text-gray-200 mt-1 opacity-90">{dayPlan.ai_tip}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="ml-4 md:ml-8 border-l-2 border-gray-200 dark:border-gray-700 space-y-4 pb-4">
                        {dayPlan.activities.length === 0 && (
                            <div className="pl-8 text-gray-500 italic">No {filterType !== 'All' ? filterType.toLowerCase() : ''} activities scheduled for this day.</div>
                        )}
                        {dayPlan.activities.map((activity, idx) => {
                            const booked = checkBookingStatus(activity);
                            const originalActivityIndex = itinerary.schedule[dayIndex].activities.findIndex(a => a === activity);
                            const key = `${dayIndex}-${activity.description}-${activity.time}`;
                            
                            // Only show booking options for relevant types
                            const showBookButton = booked || (activity.estimated_cost > 0 && activity.type !== 'Sightseeing');
                            const showCost = activity.estimated_cost > 0;
                            
                            const isDragging = dragItem.current?.dayIndex === dayIndex && dragItem.current?.index === idx;

                            return (
                                <div 
                                    key={key}
                                    draggable={filterType === 'All'}
                                    onDragStart={(e) => handleDragStart(e, dayIndex, idx)}
                                    onDragEnter={(e) => handleDragEnter(e, dayIndex, idx)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    className={`relative pl-8 group transition-all duration-200 ease-in-out ${
                                        isDragging ? 'opacity-50 scale-95 z-0' : 'opacity-100 scale-100 z-10'
                                    }`}
                                >
                                    {/* Drag Handle - Only visible when filtering is All */}
                                    {filterType === 'All' && (
                                        <div className="absolute left-2 top-10 transform -translate-y-1/2 text-gray-300 dark:text-gray-600 cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:text-cyan-500 dark:hover:text-cyan-400 hidden md:block">
                                            <GripVerticalIcon className="h-5 w-5" />
                                        </div>
                                    )}

                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[17px] top-6 p-2 rounded-full border-4 border-white dark:border-gray-800 shadow-sm ${getActivityColor(activity.type)} z-20`}>
                                        {getActivityIcon(activity.type)}
                                    </div>

                                    {/* Activity Card */}
                                    <div className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-5 hover:shadow-md transition-all cursor-default ${isDragging ? 'border-dashed border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-gray-800/50' : 'border-gray-100 dark:border-gray-700'}`}>
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                        <ActivityIcon className="h-3 w-3" /> {activity.time}
                                                    </span>
                                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                                    <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">{activity.type}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">{activity.description}</h4>
                                                    
                                                    {/* Explore Links */}
                                                    <div className="flex items-center gap-4 mt-2 mb-3">
                                                        <a 
                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.description + ' ' + details.destination)}`}
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-xs font-medium text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 flex items-center gap-1 transition-colors"
                                                            title="View on Google Maps"
                                                        >
                                                            <MapIcon className="h-3.5 w-3.5" /> Map
                                                        </a>
                                                        <a 
                                                            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(activity.description + ' ' + details.destination)}`}
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-xs font-medium text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 flex items-center gap-1 transition-colors"
                                                            title="View Images"
                                                        >
                                                            <SparklesIcon className="h-3.5 w-3.5" /> Images
                                                        </a>
                                                        <a 
                                                            href={`https://www.google.com/search?q=${encodeURIComponent(activity.description + ' ' + details.destination)}`}
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-xs font-medium text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 flex items-center gap-1 transition-colors"
                                                            title="Search on Google"
                                                        >
                                                            <GlobeIcon className="h-3.5 w-3.5" /> Info
                                                        </a>
                                                    </div>
                                                </div>
                                                
                                                {activity.travel_details && (
                                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg w-fit">
                                                        <span className="flex items-center gap-1"><RouteIcon className="h-3 w-3" /> {activity.travel_details.distance}</span>
                                                        <span className="flex items-center gap-1"><BriefcaseIcon className="h-3 w-3" /> {activity.travel_details.duration}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                                 {showCost && (
                                                    <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(activity.estimated_cost)}</span>
                                                 )}
                                                 
                                                 {showBookButton && (
                                                    <button 
                                                        onClick={handleBookClick(activity, dayIndex, originalActivityIndex)} 
                                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${booked ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50' : 'bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200'}`}
                                                        title={booked ? "View Booking Details" : "Book Activity"}
                                                    >
                                                        {booked ? (
                                                            <><CheckCircleIcon className="h-4 w-4"/> Booked</>
                                                        ) : (
                                                            activity.type === 'Travel' && activity.description.includes('Flight') && !activity.description.includes('Selected') ? 'Select Flight' : 'Book Now'
                                                        )}
                                                    </button>
                                                 )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
          </div>
        );

      case 'Stay':
        if (itinerary.accommodationLoading) return <div className="grid md:grid-cols-3 gap-6"><CardSkeleton/><CardSkeleton/><CardSkeleton/></div>;
        if (!itinerary.accommodation_recommendations) return <SectionError text="No hotels found." />;
        
        return (
            <div className="space-y-8">
                {itinerary.accommodation_recommendations.ai_stay_tip && (
                     <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-xl flex gap-3 items-start mb-6">
                        <BedIcon className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0"/>
                        <div>
                            <h4 className="font-bold text-purple-800 dark:text-purple-200 text-sm uppercase tracking-wide mb-1">Stay Tip</h4>
                            <p className="text-purple-900 dark:text-purple-100 leading-relaxed">{itinerary.accommodation_recommendations.ai_stay_tip}</p>
                        </div>
                     </div>
                )}
                
                {(['budget', 'standard', 'luxury'] as const).map(tier => (
                    <div key={tier}>
                        <div className="flex items-center gap-3 mb-6">
                            <h4 className="text-xl font-bold capitalize dark:text-white">{tier} Collection</h4>
                            <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {itinerary.accommodation_recommendations?.[tier]?.map((hotel: Hotel, i: number) => (
                                <div key={`${hotel.name}-${i}`} className="group bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                                    <div className="h-52 relative overflow-hidden bg-gray-200 dark:bg-gray-700">
                                        {hotel.imageLoading ? (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BedIcon className="h-12 w-12 text-gray-400 animate-pulse"/>
                                            </div>
                                        ) : (
                                            <ImageWithFallback 
                                                src={hotel.imageUrl}
                                                secondarySrc={getDummyImageUrl(details.destination, hotel.name + i, 'hotel')}
                                                alt={hotel.name} 
                                                fallback={getFallbackUI('accommodation')} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            />
                                        )}
                                        <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                            {formatCurrency(hotel.estimated_nightly_cost)} / night
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-bold text-lg dark:text-white leading-tight">{hotel.name}</h5>
                                            <span className="text-amber-500 font-bold text-xs flex items-center bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded">{hotel.rating} ★</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-start gap-1.5">
                                            <MapIcon className="h-4 w-4 flex-shrink-0 mt-0.5"/> {hotel.address}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-6 flex-grow content-start">
                                            {hotel.amenities.slice(0, 3).map((am, i) => (
                                                <span key={i} className="text-[10px] uppercase tracking-wider font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">{am}</span>
                                            ))}
                                        </div>
                                        <button onClick={handleBookClick({ description: `Stay at ${hotel.name}`, type: 'Accommodation', estimated_cost: hotel.estimated_nightly_cost, time: 'Check-in' })} 
                                            className={`w-full py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all ${checkBookingStatus({ description: `Stay at ${hotel.name}` } as any) ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}>
                                            {checkBookingStatus({ description: `Stay at ${hotel.name}` } as any) ? 'Reservation Confirmed' : 'Book Room'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );

      case 'Transport':
        if (itinerary.transportationLoading) return <div className="space-y-4"><CardSkeleton/><CardSkeleton/></div>;
        if (!itinerary.transportation_options) return <SectionError text="No transport options found." />;

        const { long_distance_options, local_suggestions } = itinerary.transportation_options;
        const hasLongDistance = long_distance_options && long_distance_options.length > 0;
        const hasLocal = local_suggestions && local_suggestions.length > 0;

        if (!hasLongDistance && !hasLocal) return <SectionError text="No specific transport details available." />;
        
        return (
            <div className="space-y-8">
                {hasLongDistance && (
                    <div>
                        <h4 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2"><PlaneIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400"/> Long Distance Travel</h4>
                        <div className="grid gap-6">
                        {long_distance_options.map((opt, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                                <div className="h-16 w-16 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0 text-cyan-600 dark:text-cyan-400 self-center md:self-start">
                                    <PlaneIcon className="h-8 w-8"/>
                                </div>
                                <div className="flex-grow text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:justify-between items-center gap-2 mb-2">
                                        <div>
                                            <h5 className="font-bold text-lg dark:text-white">{opt.mode}</h5>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{opt.details}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-xl text-cyan-700 dark:text-cyan-300">{formatCurrency(opt.estimated_cost)}</span>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">estimated per person</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <BriefcaseIcon className="h-4 w-4 text-gray-400"/> 
                                            <span>Duration: <span className="font-semibold text-gray-700 dark:text-gray-200">{opt.duration}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ActivityIcon className="h-4 w-4 text-gray-400"/> 
                                            <span>Comfort: <span className="font-semibold text-gray-700 dark:text-gray-200">{opt.comfort_level}</span></span>
                                        </div>
                                        {opt.frequency && (
                                            <div className="flex items-center gap-2">
                                                <RouteIcon className="h-4 w-4 text-gray-400"/> 
                                                <span>Freq: <span className="font-semibold text-gray-700 dark:text-gray-200">{opt.frequency}</span></span>
                                            </div>
                                        )}
                                        {opt.provider_examples && opt.provider_examples.length > 0 && (
                                            <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3 border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
                                                <PlaneIcon className="h-4 w-4 text-gray-400"/> 
                                                <span>Operators: <span className="font-semibold text-gray-700 dark:text-gray-200 italic">{opt.provider_examples.join(', ')}</span></span>
                                            </div>
                                        )}
                                    </div>

                                    {opt.travel_tip && (
                                        <div className="mt-4 flex gap-3 items-start text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800/50">
                                            <span className="mt-0.5 text-lg">💡</span>
                                            <p className="leading-relaxed">{opt.travel_tip}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-shrink-0 w-full md:w-auto flex flex-col justify-center">
                                    <button onClick={handleBookClick({ description: opt.details, type: 'Travel', estimated_cost: opt.estimated_cost, time: 'Travel' })} 
                                        className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${checkBookingStatus({ description: opt.details } as any) ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white'}`}>
                                        {checkBookingStatus({ description: opt.details } as any) ? 'Ticket Booked' : 'Book Ticket'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                
                {hasLocal && (
                    <div>
                        <h4 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2"><CarIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400"/> Local Commute</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {local_suggestions.map((loc, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl border dark:border-gray-700 shadow-sm hover:shadow-md hover:border-cyan-500 dark:hover:border-cyan-400 transition-all group">
                                    <div className="flex items-start justify-between mb-3">
                                        <h5 className="font-bold dark:text-white flex items-center gap-2 text-lg"><ScooterIcon className="h-5 w-5 text-gray-400 group-hover:text-cyan-500 transition-colors"/> {loc.mode}</h5>
                                        <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{loc.estimated_cost_range}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{loc.suggestion}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );

      case 'Food':
        if (itinerary.foodLoading) return <div className="grid md:grid-cols-3 gap-6"><CardSkeleton/><CardSkeleton/><CardSkeleton/></div>;
        if (!itinerary.food_recommendations) return <SectionError text="No food guide available." />;
        
        return (
            <div className="space-y-6">
                {itinerary.food_recommendations.ai_foodie_tip && (
                     <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-xl flex gap-3 items-start">
                        <UtensilsIcon className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0"/>
                        <div>
                            <h4 className="font-bold text-orange-800 dark:text-orange-200 text-sm uppercase tracking-wide mb-1">Foodie Tip</h4>
                            <p className="text-orange-900 dark:text-orange-100 leading-relaxed">{itinerary.food_recommendations.ai_foodie_tip}</p>
                        </div>
                     </div>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {itinerary.food_recommendations.restaurants.map((rest, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full hover:shadow-xl transition-all duration-300 group">
                            {/* Image Section */}
                            <div className="h-56 relative bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    {rest.imageLoading ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <UtensilsIcon className="h-10 w-10 text-gray-400 animate-pulse"/>
                                    </div>
                                    ) : (
                                    <ImageWithFallback 
                                        src={rest.imageUrl}
                                        secondarySrc={getDummyImageUrl(details.destination, rest.name + idx, 'food')}
                                        alt={rest.name} 
                                        fallback={getFallbackUI('food')}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                    />
                                    )}
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                                    
                                    {/* Price Badge */}
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        <span className="text-xs font-bold text-green-600 dark:text-green-400">{rest.price_range}</span>
                                    </div>
                                    
                                    {/* Rating Badge */}
                                    <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white">
                                         <span className="text-amber-400 text-lg">★</span>
                                         <span className="font-bold text-base">{rest.rating}</span>
                                    </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h5 className="font-bold text-xl text-gray-900 dark:text-white mb-1">{rest.name}</h5>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{rest.cuisine_type}</p>
                                    </div>
                                </div>
                                
                                <div className="my-4 space-y-3 flex-grow">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">{rest.notes}</p>
                                    
                                    {/* Must Try */}
                                    {rest.must_try_dishes.length > 0 && (
                                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/30">
                                            <p className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase mb-1 flex items-center gap-1"><SparklesIcon className="h-3 w-3"/> Must Try</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">{rest.must_try_dishes.join(', ')}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Footer Actions */}
                                <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
                                     <div className="flex flex-col">
                                         <span className="text-[10px] text-gray-400 uppercase font-bold">Est. Cost</span>
                                         <span className="font-bold text-gray-900 dark:text-white text-lg">{formatCurrency(rest.estimated_cost_per_person)}<span className="text-xs font-normal text-gray-500 ml-1">/person</span></span>
                                     </div>
                                     <button 
                                        onClick={handleBookClick({ description: `Dinner at ${rest.name}`, type: 'Food', estimated_cost: rest.estimated_cost_per_person, time: '19:00' })} 
                                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 ${checkBookingStatus({ description: `Dinner at ${rest.name}`, time: '19:00' } as any) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200'}`}>
                                        {checkBookingStatus({ description: `Dinner at ${rest.name}`, time: '19:00' } as any) ? 'Reserved' : 'Reserve'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

      case 'Weather':
        if (itinerary.weatherLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><SkeletonPulse className="h-32"/><SkeletonPulse className="h-32"/><SkeletonPulse className="h-32"/><SkeletonPulse className="h-32"/></div>;
        if (!itinerary.weather_forecast) return <SectionError text="No weather data available." />;
        
        return (
             <div className="space-y-8">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-8 rounded-2xl shadow-lg flex flex-col md:flex-row gap-6 items-center">
                    <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                        <CloudSunIcon className="h-12 w-12" />
                    </div>
                    <div className="text-center md:text-left">
                        <h4 className="text-2xl font-bold mb-2">Weekly Forecast</h4>
                        <p className="text-blue-50 leading-relaxed max-w-2xl">{itinerary.weather_forecast.weekly_summary}</p>
                    </div>
                </div>
                
                <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Daily Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {itinerary.weather_forecast.daily_forecasts.map(day => (
                            <div key={day.day} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                     <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Day {day.day}</span>
                                     <div className="transform group-hover:scale-110 transition-transform duration-300">
                                         {getWeatherIcon(day.description)}
                                     </div>
                                </div>

                                <div className="mb-6 text-center">
                                    <p className="text-4xl font-bold text-gray-800 dark:text-white mb-1">{day.high_temp_celsius}°<span className="text-2xl text-gray-400 font-normal">/{day.low_temp_celsius}°</span></p>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{day.description}</p>
                                    {day.feels_like_celsius !== undefined && (
                                        <p className="text-xs text-gray-400 mt-1">Feels like {day.feels_like_celsius}°</p>
                                    )}
                                </div>

                                <div className="mt-auto space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><CloudIcon className="h-4 w-4"/> Humidity</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{day.humidity_percent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-blue-400 h-full rounded-full" style={{ width: `${day.humidity_percent}%` }}></div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm mt-2">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><CloudRainIcon className="h-4 w-4"/> Rain</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{day.chance_of_rain_percent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${day.chance_of_rain_percent}%` }}></div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm mt-2 pt-2">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><SunIcon className="h-4 w-4"/> UV Index</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{day.uv_index}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {itinerary.weather_forecast.packing_recommendation && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
                        <h5 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2"><BriefcaseIcon className="h-5 w-5 text-indigo-500"/> Packing Tips</h5>
                        <p className="text-indigo-800 dark:text-indigo-200 text-sm leading-relaxed">{itinerary.weather_forecast.packing_recommendation}</p>
                    </div>
                )}
             </div>
        );

      case 'Budget':
        const total = itinerary.total_estimated_cost;
        const breakdown = itinerary.detailed_cost_breakdown;
        const budgetItems = [
            { label: 'Accommodation', value: breakdown.stay, color: '#3b82f6', tailwindColor: 'bg-blue-500' }, // blue-500
            { label: 'Travel', value: breakdown.travel, color: '#a855f7', tailwindColor: 'bg-purple-500' }, // purple-500
            { label: 'Food', value: breakdown.food, color: '#f97316', tailwindColor: 'bg-orange-500' }, // orange-500
            { label: 'Activities', value: breakdown.activities, color: '#10b981', tailwindColor: 'bg-emerald-500' }, // emerald-500
            { label: 'Misc', value: breakdown.miscellaneous, color: '#9ca3af', tailwindColor: 'bg-gray-400' }, // gray-400
        ].filter(item => item.value > 0);

        // Prepare Conic Gradient for Pie Chart
        let currentAngle = 0;
        const gradientParts = budgetItems.map(item => {
            const percentage = (item.value / total) * 100;
            const start = currentAngle;
            const end = currentAngle + percentage;
            currentAngle = end;
            return `${item.color} ${start}% ${end}%`;
        });
        const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

        return (
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-2xl text-center border border-cyan-100 dark:border-cyan-800 flex flex-col justify-center shadow-sm">
                        <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-2">Total Estimated Cost</p>
                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{formatCurrency(total)}</p>
                        {details.budget && (
                             <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold mx-auto ${total <= details.budget ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                                {total <= details.budget ? 'Within Budget' : `+${formatCurrency(total - details.budget)} Over`}
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Cost Per Person</p>
                        <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{formatCurrency(Math.round(total / details.travellers))}</p>
                        <p className="text-xs text-gray-400 mt-1">{details.travellers} Traveler{details.travellers > 1 ? 's' : ''}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Daily Average</p>
                        <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{formatCurrency(Math.round(total / details.duration))}</p>
                        <p className="text-xs text-gray-400 mt-1">{details.duration} Days</p>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-10 items-center bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    {/* Donut Chart */}
                    <div className="flex justify-center items-center relative">
                        <div 
                            className="w-64 h-64 rounded-full shadow-inner"
                            style={{ background: conicGradient }}
                        ></div>
                        <div className="absolute w-48 h-48 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                             <div className="text-center">
                                <span className="block text-sm text-gray-400 font-medium">Total</span>
                                <span className="block text-xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(total)}</span>
                             </div>
                        </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="space-y-6">
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Expense Breakdown</h4>
                        <div className="space-y-4">
                            {budgetItems.map((item) => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-sm font-medium mb-1.5">
                                        <span className="text-gray-600 dark:text-gray-300 flex items-center gap-3">
                                            <span className={`w-3 h-3 rounded-sm shadow-sm ${item.tailwindColor}`}></span>
                                            {item.label}
                                        </span>
                                        <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(item.value)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-400 pl-6">
                                        <span>{Math.round((item.value / total) * 100)}% of total</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Currency Converter Integration */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <CurrencyConverter amountINR={total} />
                </div>
            </div>
        );
      
      case 'Map':
        return mapLocations ? <MapView schedule={itinerary.schedule} details={details} locations={mapLocations} /> : <div className="flex justify-center h-64 items-center"><SpinnerIcon className="animate-spin h-10 w-10 text-cyan-600"/></div>;
      
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                {isEditingTitle ? (
                    <input ref={titleInputRef} value={tempTitle} onChange={e => setTempTitle(e.target.value)} onBlur={handleTitleSave} className="text-3xl font-bold bg-transparent border-b-2 border-cyan-500 focus:outline-none dark:text-white w-full"/>
                ) : (
                    <h2 className="text-3xl font-extrabold dark:text-white flex gap-2 items-center group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                        {itinerary.trip_title} 
                        <EditIcon className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </h2>
                )}
                <div className="flex items-center gap-3 mt-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                    <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4"/> {details.duration} Days</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><UserIcon className="h-4 w-4"/> {details.travellers} Travelers</span>
                </div>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <button onClick={handleExportPDF} disabled={isExporting} className="flex-1 md:flex-none bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-wait">
                    {isExporting ? <SpinnerIcon className="h-5 w-5 animate-spin"/> : <DownloadIcon className="h-5 w-5"/>} 
                    PDF
                </button>
                <button onClick={onSaveTrip} className="flex-1 md:flex-none bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                    <CheckCircleIcon className="h-5 w-5"/> Save
                </button>
                <button onClick={onShare} className="flex-1 md:flex-none bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-cyan-200 dark:shadow-none transition-all active:scale-95">
                    <ShareIcon className="h-5 w-5"/> Share
                </button>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <nav className="flex space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 min-w-max">
                {tabs.map(tab => (
                    <button key={tab.name} onClick={() => setActiveTab(tab.name)} 
                        className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.name ? 'bg-cyan-50 text-cyan-700 shadow-sm dark:bg-cyan-900/30 dark:text-cyan-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-400'}`}>
                        <tab.icon className={`mr-2 h-4 w-4 ${activeTab === tab.name ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-400'}`}/>
                        {tab.name}
                    </button>
                ))}
            </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 min-h-[60vh] animate-fade-in">
            {renderContent()}
        </div>
        
        {/* Modals */}
        {bookingModal && (
            <UniversalBookingModal 
                activity={bookingModal.activity}
                defaultType={bookingModal.type}
                travelersCount={details.travellers}
                onClose={() => setBookingModal(null)}
                onBookingComplete={handleBookingComplete}
            />
        )}
        {flightSearchModalState && (
            <FlightSearchModal
                activity={flightSearchModalState.activity}
                travelersCount={details.travellers}
                onClose={() => setFlightSearchModalState(null)}
                onFlightSelect={handleFlightSelect}
            />
        )}
        {bookingDetailsModalActivity && <BookingDetailsModal activity={bookingDetailsModalActivity} onClose={() => setBookingDetailsModalActivity(null)} />}
    </div>
  );
};

export default ItineraryReport;
