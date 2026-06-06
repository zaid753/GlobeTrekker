import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToComments, addComment, deleteComment } from '../services/dbService';
import { TrashIcon, SendIcon, SpinnerIcon } from './icons';

interface CommentsSectionProps {
    tripId: string;
    activityId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ tripId, activityId }) => {
    const { currentUser } = useAuth();
    const [comments, setComments] = useState<any[]>([]);
    const [newText, setNewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tripId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsubscribe = subscribeToComments(tripId, activityId, (data) => {
            setComments(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [tripId, activityId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim() || !currentUser) return;
        setIsSubmitting(true);
        try {
            await addComment(tripId, activityId, newText.trim());
            setNewText('');
        } catch (e) {
            console.error("Failed to add comment", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(tripId, commentId);
        } catch (e) {
            console.error("Failed to delete comment", e);
        }
    };

    if (!tripId) {
        return <div className="p-4 bg-gray-50 border rounded-xl text-sm text-gray-500">Save this trip to the cloud to enable community comments on activities.</div>;
    }

    return (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                Discussion <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{comments.length}</span>
            </h4>
            
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                {loading ? (
                    <div className="flex justify-center p-4"><SpinnerIcon className="animate-spin h-5 w-5 text-gray-400" /></div>
                ) : comments.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No comments yet. Start the discussion!</p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-sm flex gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center text-cyan-700 dark:text-cyan-300 font-bold shrink-0">
                                {c.userEmail ? c.userEmail.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-xs text-gray-700 dark:text-gray-300">{c.userEmail?.split('@')[0]}</span>
                                    {currentUser?.uid === c.userId && (
                                        <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <TrashIcon className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">{c.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {currentUser ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Share your thoughts or tips..."
                        className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                    />
                    <button 
                        type="submit" 
                        disabled={!newText.trim() || isSubmitting}
                        className="bg-cyan-600 text-white rounded-lg px-3 py-2 disabled:opacity-50 hover:bg-cyan-700 transition-colors"
                    >
                        {isSubmitting ? <SpinnerIcon className="animate-spin h-4 w-4" /> : <SendIcon className="h-4 w-4" />}
                    </button>
                </form>
            ) : (
                <div className="text-xs text-center text-gray-500 bg-gray-50 dark:bg-gray-800/30 p-2 rounded-lg">
                    Log in to join the discussion
                </div>
            )}
        </div>
    );
};

export default CommentsSection;
