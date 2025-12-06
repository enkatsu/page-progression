"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChordProgressionContextType {
  chordSequence: string[];
  addChord: (chord: string) => void;
  resetChords: () => void;
}

const ChordProgressionContext = createContext<ChordProgressionContextType | undefined>(undefined);

export function ChordProgressionProvider({ children }: { children: ReactNode }) {
  const [chordSequence, setChordSequence] = useState<string[]>([]);

  const addChord = (chord: string) => {
    setChordSequence((prev) => [...prev, chord]);
  };

  const resetChords = () => {
    setChordSequence([]);
  };

  return (
    <ChordProgressionContext.Provider value={{ chordSequence, addChord, resetChords }}>
      {children}
    </ChordProgressionContext.Provider>
  );
}

export function useChordProgression() {
  const context = useContext(ChordProgressionContext);
  if (!context) {
    throw new Error("useChordProgression must be used within ChordProgressionProvider");
  }
  return context;
}
