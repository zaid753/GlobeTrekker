
import React, { useState, useEffect } from 'react';
import type { Activity, FlightBookingDetails } from '../types';
import { bookFlightTicket, checkFlightBookingStatus } from '../services/bookingService';
import { CloseIcon, UserIcon, LockIcon, CalendarIcon, PlaneIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface FlightBookingModalProps {
    activity: Activity;
    travelersCount: number;
    onClose: () => void;
    onBookingComplete: () => void;
}

const CreditCardVisual = ({ number, name, expiry }: { number: string, name: string, expiry: string }) => (
    <div className="w-full aspect-[1.586] bg-gradient-to-br from-gray-800 to-black rounded-xl p-6 text-white shadow-2xl relative overflow-hidden mb-6 transform transition-all hover:scale-105 group">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 group-hover:opacity-30 transition-opacity">
            <svg viewBox="0 0 100 100" className="w-full h-full"><path d="M0 100 L100 0" stroke="white" strokeWidth="0.5"/><path d="M20 100 L100 20" stroke="white" strokeWidth="0.5"/><path d="M40 100 L100 40" stroke="white" strokeWidth="0.5"/></svg>
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-center">
                <div className="w-12 h-8 bg-yellow-500/80 rounded-md shadow-sm backdrop-blur-sm"></div> {/* Chip */}
                <div className="font-mono italic text-lg">VISA</div>
            </div>
            <div className="font-mono text-xl tracking-widest mt-4 shadow-black drop-shadow-md">
                {number || '•••• •••• •••• ••••'}
            </div>
            <div className="flex justify-between items-end mt-4">
                <div>
                    <div className="text-xs text-gray-400 uppercase font-medium">Card Holder</div>
                    <div className="font-medium uppercase tracking-wide text-sm">{name || 'YOUR NAME'}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-400 uppercase font-medium">Expires</div>
                    <div className="font-mono text-sm">{expiry || 'MM/YY'}</div>
                </div>
            </div>
        </div>
    </div>
);

const FlightBookingModal: React.FC<FlightBookingModalProps> = ({ activity, travelersCount, onClose, onBookingComplete }) => {
    const [passengers, setPassengers] = useState(Array(travelersCount).fill(0).map(() => ({ name: '' })));
    const [payment, setPayment] = useState({ cardNumber: '', expiryDate: '', cvc: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAlreadyBooked, setIsAlreadyBooked] = useState(false);
    const [confirmation, setConfirmation] = useState<{ message: string, id: string } | null>(null);

    useEffect(() => {
        setIsAlreadyBooked(checkFlightBookingStatus(activity));
    }, [activity]);

    const handlePassengerChange = (index: number, value: string) => {
        const newPassengers = [...passengers];
        newPassengers[index].name = value;
        setPassengers(newPassengers);
    };

    const formatCardNumber = (val: string) => {
        return val.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim().substring(0, 19);
    };

    const formatExpiry = (val: string) => {
        return val.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/').substring(0, 5);
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === 'cardNumber') value = formatCardNumber(value);
        if (name === 'expiryDate') value = formatExpiry(value);
        setPayment({ ...payment, [name]: value });
    };

    const validateForm = () => {
        if (passengers.some(p => !p.name.trim())) return "Please provide full names for all passengers.";
        if (!payment.cardNumber || payment.cardNumber.length < 19) return "Please enter a valid 16-digit card number.";
        if (!payment.expiryDate || payment.expiryDate.length < 5) return "Invalid expiry date.";
        if (!payment.cvc || payment.cvc.length < 3) return "Invalid CVC.";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const bookingDetails: FlightBookingDetails = { passengers, payment };
        
        try {
            const result = await bookFlightTicket(activity, bookingDetails);
            setConfirmation({ message: result.confirmationMessage, id: result.bookingId });
            setTimeout(() => {
              onBookingComplete();
              onClose();
            }, 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Booking failed. Please verify your details and try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputStyles = "form-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-cyan-400/50 dark:focus:border-cyan-400 transition-all shadow-sm";
    
    if (isAlreadyBooked) {
         return (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:border dark:border-gray-700 p-8 max-w-md w-full relative text-center">
                      <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                         <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Flight Already Booked</h2>
                      <p className="text-gray-600 dark:text-gray-400">This flight has already been confirmed. Check your itinerary details.</p>
                      <div className="mt-8">
                          <button onClick={onClose} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-300">
                             Close
                          </button>
                      </div>
                 </div>
             </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 z-20 p-1 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <CloseIcon className="h-6 w-6" />
                </button>

                {/* Left Panel - Flight Info */}
                <div className="md:w-1/3 bg-gradient-to-br from-cyan-600 to-blue-800 p-8 text-white relative overflow-hidden flex flex-col justify-between">
                     <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <svg viewBox="0 0 100 100" className="w-full h-full rotate-12 scale-150"><path d="M0 50 L100 50" stroke="white" strokeWidth="1"/></svg>
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md shadow-inner">
                                <PlaneIcon className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-bold">Flight Summary</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
                                <p className="text-cyan-200 text-xs uppercase tracking-wider font-semibold mb-1">Flight Details</p>
                                <p className="text-sm leading-relaxed font-medium">{activity.description}</p>
                            </div>
                            <div>
                                <p className="text-cyan-200 text-xs uppercase tracking-wider font-semibold mb-1">Total Cost</p>
                                <p className="text-4xl font-bold tracking-tight">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(activity.estimated_cost)}</p>
                                <p className="text-sm text-cyan-100 mt-1 opacity-80">for {travelersCount} passenger(s)</p>
                            </div>
                        </div>
                     </div>
                     <div className="relative z-10 mt-8">
                         <div className="flex items-center gap-2 text-sm text-cyan-100/80 bg-black/20 p-2 rounded-lg w-fit">
                             <CheckCircleIcon className="h-4 w-4" /> SSL Encrypted Payment
                         </div>
                     </div>
                </div>

                {/* Right Panel - Form */}
                <div className="md:w-2/3 p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    {confirmation ? (
                         <div className="text-center h-full flex flex-col items-center justify-center py-12 animate-fade-in">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Booking Confirmed!</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto mb-8 leading-relaxed">{confirmation.message}</p>
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm inline-block">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2 font-bold tracking-wider">Booking Reference</p>
                                <p className="text-3xl font-mono font-bold text-cyan-600 dark:text-cyan-400 tracking-wider">{confirmation.id}</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <UserIcon className="h-5 w-5 text-cyan-600" /> Passenger Details
                                </h3>
                                <div className="grid gap-4">
                                    {passengers.map((p, index) => (
                                        <div key={index}>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">Passenger {index + 1}</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Full Legal Name (as on ID)" 
                                                    value={p.name} 
                                                    onChange={(e) => handlePassengerChange(index, e.target.value)} 
                                                    className={inputStyles} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <LockIcon className="h-5 w-5 text-cyan-600" /> Payment Method
                                </h3>
                                
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="hidden md:block">
                                        <CreditCardVisual 
                                            number={payment.cardNumber} 
                                            name={passengers[0]?.name || ''} 
                                            expiry={payment.expiryDate} 
                                        />
                                        <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1"><LockIcon className="h-3 w-3"/> Secure Transaction</p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">Card Number</label>
                                            <div className="relative">
                                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input type="text" name="cardNumber" placeholder="0000 0000 0000 0000" value={payment.cardNumber} onChange={handlePaymentChange} maxLength={19} className={inputStyles} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">Expiry</label>
                                                <div className="relative">
                                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input type="text" name="expiryDate" placeholder="MM/YY" value={payment.expiryDate} onChange={handlePaymentChange} maxLength={5} className={inputStyles} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase">CVC</label>
                                                <div className="relative">
                                                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input type="password" name="cvc" placeholder="123" value={payment.cvc} onChange={handlePaymentChange} maxLength={4} className={inputStyles} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-center gap-3 animate-shake">
                                    <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                                    <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <button type="submit" disabled={isLoading} className="w-full py-4 font-bold text-white rounded-xl transition-all duration-300 flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-wait disabled:transform-none disabled:shadow-none">
                                {isLoading ? (
                                    <><span className="animate-spin mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Processing...</>
                                ) : 'Confirm & Pay'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlightBookingModal;
