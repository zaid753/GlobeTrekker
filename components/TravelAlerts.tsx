import React from 'react';
import type { TravelAdvisory, TripDetails } from '../types';
import { InfoIcon } from './icons';

interface TravelAlertsProps {
  tripDetails: TripDetails;
  advisories: TravelAdvisory[];
}

const TravelAlerts: React.FC<TravelAlertsProps> = ({ tripDetails, advisories }) => {

  const severityStyles = {
    Low: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
    High: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700',
    Critical: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  };

  const severityPillStyles: { [key in TravelAdvisory['severity']]: string } = {
    Low: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
    Medium: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
    High: 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
    Critical: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:border dark:border-gray-700 p-6 transition-colors duration-300 space-y-4">
      <div className="flex items-center">
        <InfoIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Travel Advisories</h2>
      </div>

      {advisories.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No specific travel advisories found for {tripDetails.destination}. Always exercise standard travel precautions.</p>
      )}

      {advisories.length > 0 && (
        <div className="space-y-4">
          {advisories.map((advisory, index) => (
            <div key={index} className={`p-4 border-l-4 rounded-r-lg ${severityStyles[advisory.severity] || severityStyles.Low}`}>
              <h3 className="font-bold text-lg mb-1 flex items-center gap-3">
                  <span>{advisory.title}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${severityPillStyles[advisory.severity] || severityPillStyles.Low}`}>
                    {advisory.severity}
                  </span>
              </h3>
              <p className="text-sm">{advisory.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TravelAlerts;