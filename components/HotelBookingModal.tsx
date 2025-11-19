
import React, { useState, useEffect } from 'react';
import type { Activity, HotelBookingDetails } from '../types';
import { bookHotel, checkHotelBookingStatus } from '../services/bookingService';
import { CloseIcon, UserIcon, LockIcon, CalendarIcon, BedIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface HotelBookingModalProps {
    activity: Activity;
    travelersCount: number;
    onClose: () => void;
    onBookingComplete: () => void;
}

const HotelBookingModal: React.FC<HotelBookingModalProps> = ({ activity, travelersCount, onClose, onBookingComplete }) => {
    const [guests, setGuests] = useState(Array(travelersCount).fill(0).map(() => ({ name: '' })));
    const [payment, setPayment] = useState({ cardNumber: '', expiryDate: '', cvc: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAlreadyBooked, setIsAlreadyBooked] = useState(false);
    const [confirmation, setConfirmation] = useState<{ message: string, id: string } | null>(null);

    useEffect(() => {
        setIsAlreadyBooked(checkHotelBookingStatus(activity));
    }, [activity]);

    const handleGuestChange = (index: number, value: string) => {
        const newGuests = [...guests];
        newGuests[index].name = value;
        setGuests(newGuests);
    };

    const formatCardNumber = (val: string) => val.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim().substring(0, 19);
    const formatExpiry = (val: string) => val.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/').substring(0, 5);

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === 'cardNumber') value = formatCardNumber(value);
        if (name === 'expiryDate') value = formatExpiry(value);
        setPayment({ ...payment, [name]: value });
    };

    const validateForm = () => {
        if (guests.some(p => !p.name.trim())) return "Please provide full names for all guests.";
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
        
        const bookingDetails: HotelBookingDetails = { guests, payment };
        
        try {
            const result = await bookHotel(activity, bookingDetails);
            setConfirmation({ message: result.confirmationMessage, id: result.bookingId });
            setTimeout(() => {
              onBookingComplete();
              onClose();
            }, 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Reservation failed. Please check payment details and try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputStyles = "form-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-purple-400/50 dark:focus:border-purple-400 transition-all shadow-sm";
    
    if (isAlreadyBooked) {
         return (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                      <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                         <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Reservation Confirmed</h2>
                      <p className="text-gray-600 dark:text-gray-400">Your stay is already booked.</p>
                      <button onClick={onClose} className="mt-6 bg-gray-100 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-200 transition">Close</button>
                 </div>
             </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 z-20 p-1 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <CloseIcon className="h-6 w-6" />
                </button>

                {/* Header Section with "Key Card" look */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-800 p-6 text-white relative overflow-hidden flex-shrink-0 shadow-lg z-10">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner">
                            <BedIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Hotel Reservation</h2>
                            <p className="text-purple-100 text-sm opacity-90">{activity.description}</p>
                        </div>
                    </div>
                     <div className="mt-6 flex justify-between items-end border-t border-white/20 pt-4">
                        <div>
                            <p className="text-xs uppercase text-purple-200 font-semibold tracking-wide">Total Amount</p>
                            <p className="text-2xl font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(activity.estimated_cost)}</p>
                        </div>
                         <div className="text-right">
                            <p className="text-xs uppercase text-purple-200 font-semibold tracking-wide">Guests</p>
                            <p className="text-lg font-medium">{travelersCount} Adult{travelersCount > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Form Section */}
                <div className="p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900 flex-grow">
                    {confirmation ? (
                         <div className="text-center py-8 animate-fade-in">
                            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6 mx-auto shadow-sm">
                                <CheckCircleIcon className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">You're All Set!</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto mb-6 leading-relaxed">{confirmation.message}</p>
                            <div className="inline-block bg-white dark:bg-gray-800 border-2 border-dashed border-purple-300 dark:border-purple-700 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 font-bold">Confirmation Number</p>
                                <p className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">{confirmation.id}</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <h3 className="text-gray-800 dark:text-gray-200 font-bold mb-4 border-b pb-2 dark:border-gray-700">Guest Information</h3>
                                <div className="grid gap-4">
                                    {guests.map((p, index) => (
                                        <div key={index}>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase ml-1">Guest {index + 1} Name</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Full Legal Name" 
                                                    value={p.name} 
                                                    onChange={(e) => handleGuestChange(index, e.target.value)} 
                                                    className={inputStyles} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-gray-800 dark:text-gray-200 font-bold mb-4 border-b pb-2 dark:border-gray-700">Payment Guarantee</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase ml-1">Card Number</label>
                                        <div className="relative">
                                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input type="text" name="cardNumber" placeholder="0000 0000 0000 0000" value={payment.cardNumber} onChange={handlePaymentChange} maxLength={19} className={inputStyles} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase ml-1">Expiry</label>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input type="text" name="expiryDate" placeholder="MM/YY" value={payment.expiryDate} onChange={handlePaymentChange} maxLength={5} className={inputStyles} />
                                            </div>
                                        </div>
                                         <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase ml-1">CVC</label>
                                            <div className="relative">
                                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input type="password" name="cvc" placeholder="123" value={payment.cvc} onChange={handlePaymentChange} maxLength={4} className={inputStyles} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center gap-3 animate-shake">
                                    <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                                    <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <button type="submit" disabled={isLoading} className="w-full py-3.5 font-bold text-white rounded-xl transition-all duration-300 flex items-center justify-center bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-wait active:scale-95">
                               {isLoading ? (
                                    <><span className="animate-spin mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Securing Room...</>
                                ) : 'Complete Reservation'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HotelBookingModal;
