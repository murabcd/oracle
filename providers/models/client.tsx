"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { imageModels, textModels, videoModels } from "@/lib/model-catalog";
import type { OracleModel } from "@/lib/providers";

type ModelMap = Record<string, OracleModel>;

interface ModelsProviderProps {
  children: ReactNode;
}

interface ModelsContextType {
  models: ModelMap;
  imageModels: ModelMap;
  videoModels: ModelMap;
}

const ModelsContext = createContext<ModelsContextType | undefined>(undefined);

export const useModels = () => {
  const context = useContext(ModelsContext);

  if (!context) {
    throw new Error("useModels must be used within a ModelsProviderClient");
  }

  return context;
};

export const ModelsProvider = ({ children }: ModelsProviderProps) => (
  <ModelsContext.Provider
    value={{
      models: textModels,
      imageModels,
      videoModels,
    }}
  >
    {children}
  </ModelsContext.Provider>
);
