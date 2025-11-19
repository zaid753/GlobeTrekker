

import React, { useState, useEffect } from 'react';
import type { Activity, BookingDetails, BookingType } from '../types';
import { processBooking, checkBookingStatus } from '../services/bookingService';
import { CloseIcon, CheckCircleIcon, PlaneIcon, BedIcon, CarIcon, UtensilsIcon, ActivityIcon, UserIcon, CalendarIcon, LockIcon, TrainIcon, XCircleIcon } from './icons';

interface UniversalBookingModalProps {
    activity: Activity;
    defaultType: BookingType;
    travelersCount: number;
    onClose: () => void;
    onBookingComplete: () => void;
}

// Luhn Algorithm for Credit Card Validation
const luhnCheck = (val: string) => {
    let checksum = 0;
    let j = 1;
    for (let i = val.length - 1; i >= 0; i--) {
      let calc = 0;
      calc = Number(val.charAt(i)) * j;
      if (calc > 9) {
        checksum = checksum + 1;
        calc = calc - 10;
      }
      checksum = checksum + calc;
      if (j === 1) {j = 2} else {j = 1};
    }
    return (checksum % 10) === 0;
};

const UniversalBookingModal: React.FC<UniversalBookingModalProps> = ({ activity, defaultType, travelersCount, onClose, onBookingComplete }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<{ id: string, msg: string } | null>(null);
    
    // Form State
    const [details, setDetails] = useState<BookingDetails>({
        type: defaultType,
        passengers: Array(travelersCount).fill({ name: '', age: '' }),
        guests: Array(travelersCount).fill({ name: '' }),
        payment: { cardNumber: '', expiryDate: '', cvc: '' },
        flightClass: 'Economy',
        roomType: 'Standard',
        seatType: 'AC Chair',
        partySize: travelersCount,
        specialRequests: '',
        reservationTime: '19:00'
    });

    useEffect(() => {
        setError(null);
    }, [step]);

    const getIcon = () => {
        switch(details.type) {
            case 'Flight': return <PlaneIcon className="h-8 w-8" />;
            case 'Hotel': return <BedIcon className="h-8 w-8" />;
            case 'Train': return <TrainIcon className="h-8 w-8" />;
            case 'Dining': return <UtensilsIcon className="h-8 w-8" />;
            case 'Car': return <CarIcon className="h-8 w-8" />;
            default: return <ActivityIcon className="h-8 w-8" />;
        }
    };

    const handleDetailsChange = (key: keyof BookingDetails, value: any) => {
        setDetails(prev => ({ ...prev, [key]: value }));
    };

    const handlePassengerChange = (index: number, field: string, value: string) => {
        const newPax = [...(details.passengers || [])];
        newPax[index] = { ...newPax[index], [field]: value };
        setDetails(prev => ({ ...prev, passengers: newPax }));
    };
    
    const handleGuestChange = (index: number, value: string) => {
        const newGuests = [...(details.guests || [])];
        newGuests[index] = { name: value };
        setDetails(prev => ({ ...prev, guests: newGuests }));
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formatted = value;
        if (name === 'cardNumber') formatted = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim().substring(0, 19);
        if (name === 'expiryDate') formatted = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/').substring(0, 5);
        
        setDetails(prev => ({ ...prev, payment: { ...prev.payment!, [name]: formatted } }));
    };

    const validateStep = (currentStep: number) => {
        if (currentStep === 2) {
            const list = details.type === 'Hotel' ? details.guests : details.passengers;
            if (list?.some(p => !p.name || p.name.trim().length < 2)) {
                setError("Please enter full valid names for all travelers/guests.");
                return false;
            }
        }
        if (currentStep === 3) {
            const { cardNumber, expiryDate, cvc } = details.payment || {};
            if (!cardNumber || cardNumber.length < 19) {
                 setError("Please enter a complete 16-digit card number.");
                 return false;
            }
            if (!luhnCheck(cardNumber.replace(/\s/g, ''))) {
                 setError("Invalid card number. Please check and try again.");
                 return false;
            }
            if (!expiryDate || expiryDate.length < 5) {
                 setError("Invalid expiry date (MM/YY).");
                 return false;
            }
            // Simple expiry check
            const [month, year] = expiryDate.split('/').map(Number);
            const now = new Date();
            const currentYear = parseInt(now.getFullYear().toString().substr(-2));
            const currentMonth = now.getMonth() + 1;
            if (year < currentYear || (year === currentYear && month < currentMonth) || month > 12 || month < 1) {
                 setError("Card has expired.");
                 return false;
            }

            if (!cvc || cvc.length < 3) {
                 setError("Invalid CVC.");
                 return false;
            }
        }
        setError(null);
        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) setStep(s => s + 1);
    };
    
    const handleBack = () => {
        setError(null);
        setStep(s => s - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep(3)) return;

        setIsLoading(true);
        setError(null);
        try {
            const res = await processBooking(activity, details);
            setConfirmation({ id: res.bookingId, msg: res.confirmationMessage });
            setTimeout(() => {
                onBookingComplete();
                onClose();
            }, 4000);
        } catch (err: any) {
            setError(err.message || 'Booking failed. Please try again.');
            setIsLoading(false);
        }
    };
    
    // Render Steps
    const renderStep1Details = () => (
        <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Select Preferences</h3>
            {details.type === 'Flight' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cabin Class</label>
                    <div className="flex gap-3">
                        {['Economy', 'Business', 'First'].map(cls => (
                            <button key={cls} onClick={() => handleDetailsChange('flightClass', cls)}
                                className={`px-4 py-2 rounded-lg border transition-colors ${details.flightClass === cls ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                {cls}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {details.type === 'Hotel' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room Type</label>
                    <select value={details.roomType} onChange={(e) => handleDetailsChange('roomType', e.target.value)}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-cyan-500/50 outline-none">
                        <option>Standard</option>
                        <option>Deluxe</option>
                        <option>Suite</option>
                    </select>
                </div>
            )}
             {(details.type === 'Train' || details.type === 'Car') && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{details.type === 'Train' ? 'Coach Class' : 'Vehicle Type'}</label>
                    <select value={details.seatType} onChange={(e) => handleDetailsChange('seatType', e.target.value)}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-cyan-500/50 outline-none">
                         {details.type === 'Train' ? (
                             <>
                                <option>General</option>
                                <option>Sleeper</option>
                                <option>AC Chair</option>
                                <option>AC 1st Class</option>
                             </>
                         ) : (
                             <>
                                <option>Compact</option>
                                <option>Sedan</option>
                                <option>SUV</option>
                             </>
                         )}
                    </select>
                </div>
            )}
             {details.type === 'Dining' && (
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
                        <input type="time" value={details.reservationTime} onChange={(e) => handleDetailsChange('reservationTime', e.target.value)}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Party Size</label>
                         <input type="number" min="1" value={details.partySize} onChange={(e) => handleDetailsChange('partySize', parseInt(e.target.value))}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" />
                    </div>
                </div>
            )}
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Special Requests</label>
                 <textarea 
                    value={details.specialRequests} 
                    onChange={(e) => handleDetailsChange('specialRequests', e.target.value)}
                    placeholder="Dietary needs, accessibility, or other preferences..."
                    className="w-full p-2 border rounded-lg h-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none"
                 />
            </div>
        </div>
    );

    const renderStep2People = () => (
         <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Who is traveling?</h3>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                {(details.type === 'Hotel' ? details.guests : details.passengers)?.map((p, i) => (
                    <div key={i} className="flex gap-3">
                        <div className="relative flex-grow">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder={details.type === 'Hotel' ? `Guest ${i+1} Full Name` : `Passenger ${i+1} Full Name`}
                                value={p.name}
                                onChange={(e) => details.type === 'Hotel' ? handleGuestChange(i, e.target.value) : handlePassengerChange(i, 'name', e.target.value)}
                                className={`w-full pl-10 p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 outline-none transition-all ${error && !p.name ? 'border-red-500 ring-red-500/50 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 focus:ring-cyan-500/50'}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Please ensure names match government-issued IDs.</p>
        </div>
    );

    const renderStep3Payment = () => (
         <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Secure Payment</h3>
            <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" name="cardNumber" placeholder="Card Number (0000 0000 0000 0000)" value={details.payment?.cardNumber} onChange={handlePaymentChange}
                    className={`w-full pl-10 p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 outline-none transition-all ${error && (!details.payment?.cardNumber || details.payment.cardNumber.length < 19) ? 'border-red-500 ring-red-500/50 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 focus:ring-cyan-500/50'}`} maxLength={19} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" name="expiryDate" placeholder="MM/YY" value={details.payment?.expiryDate} onChange={handlePaymentChange}
                        className={`w-full pl-10 p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 outline-none transition-all ${error && (!details.payment?.expiryDate || details.payment.expiryDate.length < 5) ? 'border-red-500 ring-red-500/50 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 focus:ring-cyan-500/50'}`} maxLength={5} />
                </div>
                <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="password" name="cvc" placeholder="CVC" value={details.payment?.cvc} onChange={handlePaymentChange}
                        className={`w-full pl-10 p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 outline-none transition-all ${error && (!details.payment?.cvc || details.payment.cvc.length < 3) ? 'border-red-500 ring-red-500/50 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 focus:ring-cyan-500/50'}`} maxLength={4} />
                </div>
            </div>
             <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg flex justify-between items-center mt-2 border border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Amount</span>
                <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(activity.estimated_cost)}
                </span>
            </div>
        </div>
    );

    if (confirmation) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-pop-in">
                     <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white dark:border-gray-700 shadow-sm">
                         <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                     </div>
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Booking Confirmed!</h2>
                     <p className="text-gray-600 dark:text-gray-300 mb-6">{confirmation.msg}</p>
                     <div className="bg-gray-100 dark:bg-gray-700 py-3 px-5 rounded-xl inline-block border border-gray-200 dark:border-gray-600">
                         <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1 font-semibold">Booking ID</p>
                         <span className="font-mono font-bold text-lg text-gray-800 dark:text-gray-100 tracking-wide">{confirmation.id}</span>
                     </div>
                 </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-white relative shadow-lg z-10">
                     <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors hover:bg-white/10 p-1 rounded-full">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner">
                            {getIcon()}
                        </div>
                        <div className="flex-grow min-w-0">
                            <h2 className="text-2xl font-bold leading-tight">{details.type} Booking</h2>
                            <p className="text-cyan-100 text-sm opacity-90 truncate">{activity.description}</p>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="flex gap-2 mt-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/20'}`} />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow bg-gray-50 dark:bg-gray-900">
                    {step === 1 && renderStep1Details()}
                    {step === 2 && renderStep2People()}
                    {step === 3 && renderStep3Payment()}
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-lg text-sm flex items-start gap-2 animate-shake">
                            <XCircleIcon className="h-5 w-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center z-10">
                    {step > 1 ? (
                         <button onClick={handleBack} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                            Back
                        </button>
                    ) : (
                        <div></div> // Spacer
                    )}
                    
                    {step < 3 ? (
                         <button onClick={handleNext} className="px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm">
                            Next Step
                        </button>
                    ) : (
                         <button onClick={handleSubmit} disabled={isLoading} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait text-sm">
                            {isLoading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <CheckCircleIcon className="h-4 w-4" />}
                            {isLoading ? 'Processing...' : 'Confirm Payment'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UniversalBookingModal;