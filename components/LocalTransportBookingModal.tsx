
import React, { useState, useEffect } from 'react';
import type { Activity, LocalTransportBookingDetails } from '../types';
import { bookLocalTransport, checkLocalTransportBookingStatus } from '../services/bookingService';
import { CloseIcon, LockIcon, CalendarIcon, CarIcon, CheckCircleIcon, MapPinIcon, XCircleIcon } from './icons';

interface LocalTransportBookingModalProps {
    activity: Activity;
    onClose: () => void;
    onBookingComplete: () => void;
}

const LocalTransportBookingModal: React.FC<LocalTransportBookingModalProps> = ({ activity, onClose, onBookingComplete }) => {
    const [payment, setPayment] = useState({ cardNumber: '', expiryDate: '', cvc: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<{ message: string, id: string } | null>(null);
    const [isAlreadyBooked, setIsAlreadyBooked] = useState(false);

    useEffect(() => {
        setIsAlreadyBooked(checkLocalTransportBookingStatus(activity));
    }, [activity]);

    const formatCardNumber = (val: string) => val.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim().substring(0, 19);
    const formatExpiry = (val: string) => val.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/').substring(0, 5);

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === 'cardNumber') value = formatCardNumber(value);
        if (name === 'expiryDate') value = formatExpiry(value);
        setPayment({ ...payment, [name]: value });
    };

    const validateForm = () => {
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
        
        const bookingDetails: LocalTransportBookingDetails = { payment };
        
        try {
            const result = await bookLocalTransport(activity, bookingDetails);
            setConfirmation({ message: result.confirmationMessage, id: result.bookingId });
            setTimeout(() => {
              onBookingComplete();
              onClose();
            }, 5000);
        } catch (err) {
             setError(err instanceof Error ? err.message : 'Failed to request ride. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputStyles = "form-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all shadow-sm";
    
    if (isAlreadyBooked) {
         return (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                      <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                         <CheckCircleIcon className="w-10 h-10 text-black dark:text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ride Scheduled</h2>
                      <p className="text-gray-500 dark:text-gray-400">Your local transport is confirmed.</p>
                      <button onClick={onClose} className="mt-6 bg-black dark:bg-white dark:text-black text-white font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition">Close</button>
                 </div>
             </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden border border-gray-100 dark:border-gray-700">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black dark:hover:text-white z-20 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <CloseIcon className="h-6 w-6" />
                </button>

                <div className="p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-14 h-14 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg">
                            <CarIcon className="h-8 w-8" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-1">Confirm Ride</h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2">{activity.description}</p>

                    {confirmation ? (
                         <div className="text-center py-6 bg-green-50 dark:bg-green-900/20 rounded-xl animate-fade-in">
                            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600 mb-2" />
                            <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Driver Confirmed</h3>
                            <p className="text-sm text-green-600 dark:text-green-300 mt-1">Your ride is scheduled.</p>
                            <p className="text-xs font-mono mt-3 bg-white/50 dark:bg-black/20 inline-block px-2 py-1 rounded">Ref: {confirmation.id}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                                 <div className="flex items-center gap-3">
                                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase">Est. Cost</p>
                                        <p className="font-bold text-lg text-gray-900 dark:text-white">~{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(activity.estimated_cost || 500)}</p>
                                    </div>
                                 </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Payment Method</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input type="text" name="cardNumber" placeholder="Card Number" value={payment.cardNumber} onChange={handlePaymentChange} maxLength={19} className={inputStyles} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input type="text" name="expiryDate" placeholder="MM/YY" value={payment.expiryDate} onChange={handlePaymentChange} maxLength={5} className={inputStyles} />
                                        </div>
                                        <div className="relative">
                                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input type="password" name="cvc" placeholder="CVC" value={payment.cvc} onChange={handlePaymentChange} maxLength={4} className={inputStyles} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm text-center font-medium border border-red-200 dark:border-red-800 flex items-center justify-center gap-2 animate-shake">
                                    <XCircleIcon className="h-4 w-4" /> {error}
                                </div>
                            )}

                            <button type="submit" disabled={isLoading} className="w-full py-4 font-bold text-white bg-black dark:bg-white dark:text-black rounded-xl hover:opacity-90 transition-all shadow-xl disabled:opacity-50 flex justify-center items-center active:scale-95">
                                {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></span> : 'Request Ride'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocalTransportBookingModal;
