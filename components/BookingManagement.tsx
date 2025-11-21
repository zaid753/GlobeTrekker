
import React, { useState, useEffect } from 'react';
import { getAllBookings, cancelBookingById } from '../services/bookingService';
import type { BookingConfirmation } from '../types';
import { PlaneIcon, BedIcon, CarIcon, UtensilsIcon, ActivityIcon, TrashIcon, CalendarIcon, UserIcon, CheckCircleIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

const BookingManagement: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
    const [bookings, setBookings] = useState<BookingConfirmation[]>([]);
    const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

    useEffect(() => {
        setBookings(getAllBookings());
    }, [refreshTrigger]);

    const handleCancelClick = (id: string) => {
        setBookingToCancel(id);
    };

    const confirmCancel = () => {
        if (bookingToCancel) {
            cancelBookingById(bookingToCancel);
            setBookings(prev => prev.filter(b => b.bookingId !== bookingToCancel));
            setBookingToCancel(null);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Flight': return <PlaneIcon className="h-6 w-6 text-blue-500" />;
            case 'Hotel': return <BedIcon className="h-6 w-6 text-purple-500" />;
            case 'Car': 
            case 'Train': return <CarIcon className="h-6 w-6 text-orange-500" />;
            case 'Dining': return <UtensilsIcon className="h-6 w-6 text-red-500" />;
            default: return <ActivityIcon className="h-6 w-6 text-green-500" />;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
    };

    if (bookings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-full mb-4 shadow-sm">
                    <CheckCircleIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">No Active Bookings</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-2">You haven't made any reservations yet. Start by exploring the itinerary and booking activities.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">My Reservations</h3>
            <div className="grid gap-4">
                {bookings.map((booking) => (
                    <div key={booking.bookingId} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-6 items-start md:items-center transition-all hover:shadow-md">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl flex-shrink-0">
                            {getIcon(booking.details?.type)}
                        </div>
                        
                        <div className="flex-grow space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    {booking.details?.type}
                                </span>
                                <span className="text-xs font-mono text-gray-400">#{booking.bookingId}</span>
                            </div>
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{booking.details?.activityName || 'Activity Booking'}</h4>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" />
                                    {new Date(booking.details?.bookedAt).toLocaleDateString()}
                                </span>
                                {booking.details?.partySize && (
                                    <span className="flex items-center gap-1">
                                        <UserIcon className="h-4 w-4" />
                                        {booking.details.partySize} People
                                    </span>
                                )}
                                {booking.details?.guests && (
                                    <span className="flex items-center gap-1">
                                        <UserIcon className="h-4 w-4" />
                                        {booking.details.guests.length} Guests
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 w-full md:w-auto justify-between md:justify-center border-t md:border-t-0 border-gray-100 dark:border-gray-700 pt-4 md:pt-0 mt-2 md:mt-0">
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase font-bold">Total Paid</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(booking.details?.cost)}</p>
                            </div>
                            <button 
                                onClick={() => handleCancelClick(booking.bookingId)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                                <TrashIcon className="h-4 w-4" /> Cancel
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmationModal
                isOpen={!!bookingToCancel}
                title="Cancel Booking"
                message="Are you sure you want to cancel this reservation? This action cannot be undone."
                confirmLabel="Yes, Cancel"
                cancelLabel="No, Keep"
                onConfirm={confirmCancel}
                onCancel={() => setBookingToCancel(null)}
                isDestructive={true}
            />
        </div>
    );
};

export default BookingManagement;
