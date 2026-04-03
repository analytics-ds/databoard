"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { DEMO_STUDIES, type Study } from "@/lib/constants";

interface StudyContextType {
  currentStudy: Study;
  setCurrentStudy: (study: Study) => void;
  studies: Study[];
}

const StudyContext = createContext<StudyContextType | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [currentStudy, setCurrentStudy] = useState<Study>(DEMO_STUDIES[0]);

  return (
    <StudyContext.Provider value={{ currentStudy, setCurrentStudy, studies: DEMO_STUDIES }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used within StudyProvider");
  return ctx;
}
