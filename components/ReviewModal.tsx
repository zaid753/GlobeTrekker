
import React, { useState } from 'react';
import { CloseIcon, SparklesIcon, SendIcon } from './icons';
import type { Review } from '../types';

interface ReviewModalProps {
    itemName: string;
    onClose: () => void;
    onSubmit: (review: Omit<Review, 'id' | 'date'>) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ itemName, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [name, setName] = useState('You');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return; // Force a rating
        onSubmit({
            author: name || 'Anonymous',
            rating,
            comment
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold">Write a Review</h3>
                        <p className="text-cyan-100 text-sm mt-1 opacity-90">Share your experience at {itemName}</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Rate your experience</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <span className={`text-3xl ${star <= (hoverRating || rating) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}>★</span>
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-1">
                                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Terrible'}
                            </p>
                        )}
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Your Name (Optional)</label>
                         <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Your Review</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What did you like or dislike? (Optional)"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all h-24 resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={rating === 0}
                        className="w-full py-3 bg-cyan-600 text-white font-bold rounded-xl shadow-md hover:bg-cyan-700 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <SendIcon className="h-5 w-5" /> Submit Review
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
