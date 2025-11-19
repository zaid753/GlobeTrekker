import React from 'react';
import { CloseIcon } from './icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    onAlternative?: () => void;
    alternativeLabel?: string;
    isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    title, 
    message, 
    confirmLabel, 
    cancelLabel = "Cancel", 
    onConfirm, 
    onCancel, 
    onAlternative, 
    alternativeLabel, 
    isDestructive = false 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative transform transition-all scale-100 border dark:border-gray-700">
                <button onClick={onCancel} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                    <CloseIcon className="h-5 w-5" />
                </button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{message}</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <button 
                        onClick={onCancel} 
                        className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    {onAlternative && alternativeLabel && (
                         <button 
                            onClick={onAlternative} 
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                        >
                            {alternativeLabel}
                        </button>
                    )}
                    <button 
                        onClick={onConfirm} 
                        className={`px-4 py-2 text-white rounded-lg font-medium shadow-sm transition-colors ${
                            isDestructive 
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2' 
                                : 'bg-cyan-600 hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;