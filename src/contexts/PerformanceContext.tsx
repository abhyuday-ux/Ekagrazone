import React, { createContext, useContext, useState, useEffect } from 'react';

type GraphicsQuality = 'High' | 'Low';

interface PerformanceContextType {
  graphicsQuality: GraphicsQuality;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  isHighQuality: boolean;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(() => {
    const saved = localStorage.getItem('ekagrazone_graphics_quality');
    return (saved === 'Low' ? 'Low' : 'High'); // Default to High
  });

  useEffect(() => {
    localStorage.setItem('ekagrazone_graphics_quality', graphicsQuality);
    
    // Toggle global class on body
    if (graphicsQuality === 'Low') {
      document.body.classList.add('low-spec');
    } else {
      document.body.classList.remove('low-spec');
    }
  }, [graphicsQuality]);

  const value = {
    graphicsQuality,
    setGraphicsQuality,
    isHighQuality: graphicsQuality === 'High',
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};
