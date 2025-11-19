import React, { useState, useEffect } from 'react';
import type { Activity } from '../types';
import { getBookingDetails } from '../services/bookingService';
import { CloseIcon, BedIcon, UserIcon, CalendarIcon, PlaneIcon, CarIcon } from './icons';

interface BookingDetailsModalProps {
    activity: Activity;
    onClose: () => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ activity, onClose }) => {
    const [bookingDetails, setBookingDetails] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const details = getBookingDetails(activity);
        setBookingDetails(details);
        setIsLoading(false);
    }, [activity]);
    
    const getIcon = () => {
        if (bookingDetails?.passengers) return <PlaneIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mr-3" />;
        if (bookingDetails?.guests) return <BedIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mr-3" />;
        return <CarIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mr-3" />;
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:border dark:border-gray-700 p-6 max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 z-10">
                    <CloseIcon className="h-6 w-6" />
                </button>
                 <div className="flex items-center mb-4">
                    {getIcon()}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Booking Details</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                    </div>
                </div>

                {isLoading ? (
                    <p>Loading details...</p>
                ) : bookingDetails ? (
                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">Booking ID:</p>
                            <p className="font-mono bg-gray-100 dark:bg-gray-700 p-1.5 rounded-md text-sm">{bookingDetails.bookingId}</p>
                        </div>
                         <div className="flex items-center pt-2">
                            <CalendarIcon className="h-5 w-5 mr-3 text-gray-500"/>
                            <div>
                                <span className="font-semibold">Booked On:</span> {new Date(bookingDetails.bookingTime).toLocaleString()}
                            </div>
                        </div>
                        {(bookingDetails.guests || bookingDetails.passengers) && (bookingDetails.guests?.length > 0 || bookingDetails.passengers?.length > 0) && (
                            <div className="flex items-start pt-2">
                                <UserIcon className="h-5 w-5 mr-3 mt-1 text-gray-500"/>
                                <div>
                                    <p className="font-semibold">{bookingDetails.guests ? 'Guests:' : 'Passengers:'}</p>
                                    <ul className="list-disc list-inside">
                                        {(bookingDetails.guests || bookingDetails.passengers).map((person: string, index: number) => (
                                            <li key={index}>{person}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                        <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-lg text-center mt-4">
                            <p className="font-bold text-lg text-green-800 dark:text-green-300">Status: {bookingDetails.status}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">Could not load booking details. The booking may have been made in a different session.</p>
                )}
                 <div className="mt-6 flex justify-center">
                    <button onClick={onClose} className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-700 transition duration-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsModal;