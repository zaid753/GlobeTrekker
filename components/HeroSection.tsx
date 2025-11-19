

import React from 'react';
import { ArrowRightIcon, UndoIcon } from './icons';

interface HeroSectionProps {
    onPlanTripClick: () => void;
    onResumeClick?: () => void;
    hasResumableTrip?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onPlanTripClick, onResumeClick, hasResumableTrip }) => {
  return (
    <div className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
        {/* Background Video */}
        <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute z-0 w-auto min-w-full min-h-full max-w-none"
        >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-top-aerial-shot-of-seashore-with-rocks-1090-large.mp4" type="video/mp4" />
            Your browser does not support the video tag.
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-60"></div>
        
        <div className="relative z-10 p-4">
            <h1 
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4"
              style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
            >
                Your Next Adventure, Reimagined
            </h1>
            <p 
              className="text-lg md:text-xl max-w-3xl mx-auto mb-8"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
            >
                Stop wondering, start exploring. GlobeTrekker's AI crafts personalized travel itineraries in seconds. Tell us your dreams, and we'll map out the journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={onPlanTripClick}
                    className="bg-cyan-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-300 ease-in-out active:scale-95 active:shadow-xl active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-black"
                >
                    Plan My Trip <ArrowRightIcon className="inline-block ml-2 h-6 w-6" />
                </button>
                
                {hasResumableTrip && onResumeClick && (
                    <button
                        onClick={onResumeClick}
                        className="bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:bg-white/20 hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-300 ease-in-out active:scale-95 active:shadow-xl active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white focus-visible:ring-offset-black"
                    >
                        Resume Last Trip <UndoIcon className="inline-block ml-2 h-6 w-6" />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default HeroSection;