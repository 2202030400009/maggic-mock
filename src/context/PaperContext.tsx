
import React, { createContext, useContext, useState } from "react";

type PaperType = "GATE CS" | "GATE DA" | null;

interface PaperContextType {
  paperType: PaperType;
  setPaperType: (type: PaperType) => void;
}

const PaperContext = createContext<PaperContextType | null>(null);

export const PaperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paperType, setPaperType] = useState<PaperType>(null);

  const value = {
    paperType,
    setPaperType,
  };

  return <PaperContext.Provider value={value}>{children}</PaperContext.Provider>;
};

export const usePaper = () => {
  const context = useContext(PaperContext);
  if (!context) {
    throw new Error("usePaper must be used within a PaperProvider");
  }
  return context;
};
