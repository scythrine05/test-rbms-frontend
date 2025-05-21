import React from 'react';

interface ShowAllToggleProps {
  showAll: boolean;
  onToggle: () => void;
  isUrgentMode: boolean;
}

export const ShowAllToggle: React.FC<ShowAllToggleProps> = ({ showAll, onToggle, isUrgentMode }) => {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 ${
        showAll 
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
          : 'bg-white/10 hover:bg-white/20 text-white'
      }`}
      style={{
        backgroundColor: showAll ? 'white' : isUrgentMode ? '#dc2626' : '#3277BC',
        color: showAll ? '#374151' : 'white'
      }}
    >
      {showAll ? "Show Filtered" : "Show All"}
    </button>
  );
}; 