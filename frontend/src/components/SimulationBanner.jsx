import React from 'react';

const SimulationBanner = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black py-3 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-black text-yellow-400 px-2 py-1 rounded text-sm font-bold">
            SIMULATION MODE
          </div>
          <div className="text-sm font-medium">
            You are trading with virtual money. No real money is at risk.
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-black hover:text-gray-800 transition-colors"
          aria-label="Close simulation banner"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SimulationBanner;
