import React, { useState } from 'react';
import { GlobeIcon, LogoutIcon, UserIcon, GripVerticalIcon, CloseIcon, ArrowLeftIcon } from './icons';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
    isAuthenticated: boolean;
    userEmail: string | null;
    onLoginClick: () => void;
    onSignUpClick: () => void;
    onLogout: () => void;
    onProfileClick: () => void;
    onNavigate: (sectionId: string) => void;
    currentView: 'hero' | 'form' | 'results' | 'profile';
}

const Navbar: React.FC<NavbarProps> = ({ 
    isAuthenticated, 
    userEmail, 
    onLoginClick, 
    onSignUpClick, 
    onLogout, 
    onProfileClick,
    onNavigate,
    currentView
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
      { name: 'Features', id: 'features' },
      { name: 'Inspiration', id: 'vibes' },
      { name: 'How it Works', id: 'how-it-works' },
      { name: 'Reviews', id: 'testimonials' },
      { name: 'About', id: 'about' },
      { name: 'Contact', id: 'contact' },
  ];

  const handleNavClick = (id: string) => {
      onNavigate(id);
      setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => handleNavClick('hero-top')}
          >
            <div className="relative">
                <GlobeIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
                <div className="absolute inset-0 bg-cyan-400/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 ml-2 tracking-tight font-serif">
              Globe<span className="text-cyan-600 dark:text-cyan-400">Trekker</span>
            </h1>
          </div>

          {/* Desktop Navigation - ONLY VISIBLE ON HERO */}
          {currentView === 'hero' ? (
              <div className="hidden lg:flex items-center gap-6">
                  {navLinks.map(link => (
                      <button 
                        key={link.name}
                        onClick={() => handleNavClick(link.id)}
                        className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors relative group"
                      >
                          {link.name}
                          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-600 dark:bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
                      </button>
                  ))}
              </div>
          ) : (
              // Show 'Home' button on other pages for easy return
              <div className="hidden md:flex items-center">
                  <button 
                    onClick={() => handleNavClick('hero-top')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  >
                      <ArrowLeftIcon className="h-4 w-4" /> Back to Home
                  </button>
              </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-4">
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium font-sans">{userEmail?.split('@')[0]}</span>
                    <button
                        onClick={onProfileClick}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-offset-gray-800"
                        aria-label="View profile"
                        title="My Profile"
                    >
                        <UserIcon className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={onLogout}
                        className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-semibold py-2 px-4 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all duration-300 active:scale-95 flex items-center gap-2 text-sm"
                    >
                        <LogoutIcon className="h-4 w-4" />
                        <span>Logout</span>
                    </button>
                </div>
            ) : (
                <div className="hidden md:flex items-center gap-3">
                    <button 
                        onClick={onLoginClick}
                        className="text-gray-600 dark:text-gray-300 font-semibold hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-sm"
                    >
                        Login
                    </button>
                    <button 
                        onClick={onSignUpClick}
                        className="bg-cyan-600 text-white font-semibold py-2 px-5 rounded-full shadow-lg shadow-cyan-200 dark:shadow-none hover:bg-cyan-700 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 text-sm"
                    >
                        Sign Up
                    </button>
                </div>
            )}

            {/* Mobile Menu Button */}
            <button 
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <GripVerticalIcon className="h-6 w-6 rotate-90" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
            <div className="lg:hidden pt-4 pb-2 space-y-3 border-t border-gray-100 dark:border-gray-800 mt-3 animate-fade-in bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-lg">
                {currentView === 'hero' ? navLinks.map(link => (
                    <button 
                        key={link.name}
                        onClick={() => handleNavClick(link.id)}
                        className="block w-full text-left px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                    >
                        {link.name}
                    </button>
                )) : (
                    <button 
                        onClick={() => handleNavClick('hero-top')}
                        className="block w-full text-left px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                    >
                        Back to Home
                    </button>
                )}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-2 space-y-3">
                    {isAuthenticated ? (
                        <>
                            <button onClick={() => { onProfileClick(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-2 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                                <UserIcon className="h-5 w-5" /> My Profile
                            </button>
                            <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                                <LogoutIcon className="h-5 w-5" /> Logout
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-2 px-4">
                            <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="w-full py-2 text-cyan-600 dark:text-cyan-400 font-semibold border border-cyan-600 dark:border-cyan-400 rounded-lg">Login</button>
                            <button onClick={() => { onSignUpClick(); setIsMobileMenuOpen(false); }} className="w-full py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-md">Sign Up</button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;