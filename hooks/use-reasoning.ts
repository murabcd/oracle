import { atom, useAtom } from "jotai";

const reasoningAtom = atom({
  isReasoning: false,
  isGenerating: false,
});

export const useReasoning = () => useAtom(reasoningAtom);
