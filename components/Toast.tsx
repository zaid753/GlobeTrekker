import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from './icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-24 right-4 z-[60] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all animate-slide-in-right
      ${type === 'success' 
        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/90 dark:border-green-800 dark:text-green-100' 
        : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-800 dark:text-red-100'
      }`}>
      {type === 'success' ? <CheckCircleIcon className="h-5 w-5" /> : <XCircleIcon className="h-5 w-5" />}
      <p className="font-medium text-sm">{message}</p>
    </div>
  );
};

export default Toast;