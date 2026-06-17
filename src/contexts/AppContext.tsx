"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  assessmentYear: string;
  setAssessmentYear: (year: string) => void;
  isPrivacyMode: boolean;
  setIsPrivacyMode: (isPrivacyMode: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [assessmentYear, setAssessmentYear] = useState("2026-27");
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);

  return (
    <AppContext.Provider
      value={{
        assessmentYear,
        setAssessmentYear,
        isPrivacyMode,
        setIsPrivacyMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
