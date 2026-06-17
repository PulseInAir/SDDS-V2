"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AssessmentYearOption = {
  id: string;
  label: string;
  is_current: boolean;
  is_open: boolean;
};

interface AppContextType {
  assessmentYears: AssessmentYearOption[];
  assessmentYearId: string | null;
  setAssessmentYearId: (assessmentYearId: string | null) => void;
  isPrivacyMode: boolean;
  setIsPrivacyMode: (isPrivacyMode: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({
  children,
  assessmentYears,
  initialAssessmentYearId,
  initialPrivacyMode,
}: {
  children: ReactNode;
  assessmentYears: AssessmentYearOption[];
  initialAssessmentYearId: string | null;
  initialPrivacyMode: boolean;
}) {
  const [assessmentYearId, setAssessmentYearId] = useState<string | null>(initialAssessmentYearId);
  const [isPrivacyMode, setIsPrivacyMode] = useState(initialPrivacyMode);

  return (
    <AppContext.Provider
      value={{
        assessmentYears,
        assessmentYearId,
        setAssessmentYearId,
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
