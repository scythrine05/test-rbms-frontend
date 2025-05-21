import React, { createContext, useContext, useState, useEffect } from 'react';

type UrgentModeContextType = {
  isUrgentMode: boolean;
  toggleUrgentMode: () => void;
};

const UrgentModeContext = createContext<UrgentModeContextType | undefined>(undefined);

export function UrgentModeProvider({ children }: { children: React.ReactNode }) {
  const [isUrgentMode, setIsUrgentMode] = useState(false);

  // Load the mode from localStorage on initial render
  useEffect(() => {
    const savedMode = localStorage.getItem('urgentMode');
    if (savedMode) {
      setIsUrgentMode(savedMode === 'true');
    }
  }, []);

  const toggleUrgentMode = () => {
    const newMode = !isUrgentMode;
    setIsUrgentMode(newMode);
    localStorage.setItem('urgentMode', String(newMode));
  };

  return (
    <UrgentModeContext.Provider value={{ isUrgentMode, toggleUrgentMode }}>
      {children}
    </UrgentModeContext.Provider>
  );
}

export function useUrgentMode() {
  const context = useContext(UrgentModeContext);
  if (context === undefined) {
    throw new Error('useUrgentMode must be used within a UrgentModeProvider');
  }
  return context;
} 