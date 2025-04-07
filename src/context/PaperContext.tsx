
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type PaperType = "GATE CS" | "GATE DA" | null;

interface PaperContextType {
  paperType: PaperType;
  setPaperType: (type: PaperType) => void;
  togglePaperType: () => void;
}

const PaperContext = createContext<PaperContextType | null>(null);

export const PaperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paperType, setPaperType] = useState<PaperType>(
    localStorage.getItem("paperType") as PaperType || null
  );
  
  const navigate = useNavigate();

  useEffect(() => {
    if (paperType) {
      localStorage.setItem("paperType", paperType);
    }
  }, [paperType]);

  const togglePaperType = () => {
    const newType: PaperType = paperType === "GATE CS" ? "GATE DA" : "GATE CS";
    setPaperType(newType);
    navigate("/dashboard");
  };

  const value = {
    paperType,
    setPaperType,
    togglePaperType,
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
