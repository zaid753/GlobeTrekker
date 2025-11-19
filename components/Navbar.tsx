import React from 'react';
import { GlobeIcon, LogoutIcon, UserIcon } from './icons';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
    isAuthenticated: boolean;
    userEmail: string | null;
    onLoginClick: () => void;
    onSignUpClick: () => void;
    onLogout: () => void;
    onProfileClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, userEmail, onLoginClick, onSignUpClick, onLogout, onProfileClick }) => {
  return (
    <nav className="fixed w-full top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <GlobeIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 ml-2">
              GlobeTrekker
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
                <div className="flex items-center gap-4">
                    <span className="text-gray-700 dark:text-gray-300 text-sm hidden md:block">{userEmail}</span>
                    <button
                        onClick={onProfileClick}
                        className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transform transition-transform duration-200 hover:scale-110 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-offset-gray-800"
                        aria-label="View profile"
                    >
                        <UserIcon className="h-6 w-6" />
                    </button>
                    <button 
                        onClick={onLogout}
                        className="bg-rose-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-px transform transition-all duration-300 ease-in-out active:scale-95 active:shadow-sm active:translate-y-0 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-600 dark:focus-visible:ring-offset-gray-800"
                    >
                        <LogoutIcon className="h-5 w-5 md:mr-2" />
                        <span className="hidden md:block">Logout</span>
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onLoginClick}
                        className="bg-transparent text-cyan-600 dark:text-cyan-400 font-semibold py-2 px-4 rounded-lg border border-cyan-600 dark:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/50 shadow-sm hover:shadow-md hover:-translate-y-px transform transition-all duration-300 ease-in-out active:scale-95 active:shadow-sm active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-600 dark:focus-visible:ring-offset-gray-800"
                    >
                        Login
                    </button>
                    <button 
                        onClick={onSignUpClick}
                        className="bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-px transform transition-all duration-300 ease-in-out active:scale-95 active:shadow-sm active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-700 dark:focus-visible:ring-offset-gray-800"
                    >
                        Sign Up
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;