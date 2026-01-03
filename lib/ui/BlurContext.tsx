
// lib/ui/BlurContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface BlurContextType {
  isBlurred: boolean;
  setIsBlurred: (isBlurred: boolean) => void;
}

const BlurContext = createContext<BlurContextType | undefined>(undefined);

export const BlurProvider = ({ children }: { children: ReactNode }) => {
  const [isBlurred, setIsBlurred] = useState(false);

  return (
    <BlurContext.Provider value={{ isBlurred, setIsBlurred }}>
      {children}
    </BlurContext.Provider>
  );
};

export const useBlur = () => {
  const context = useContext(BlurContext);
  if (!context) {
    throw new Error('useBlur must be used within a BlurProvider');
  }
  return context;
};
