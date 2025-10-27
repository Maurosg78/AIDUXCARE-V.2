import { useState } from "react";
import { useAdaptivePrompt } from "./useAdaptivePrompt";
import { PromptContext } from "../ai/promptAdapter";

export const useRephraseAI = (ctx: PromptContext) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const getPrompt = useAdaptivePrompt({ ...ctx, section: "soap" });

  const rephrase = async (text: string) => {
    setLoading(true);
    try {
      // Mock AI response (replace later with Vertex/Niagara endpoint)
      await new Promise((r) => setTimeout(r, 500));
      setSuggestion(`${text} (suggested improvement)`);
    } finally {
      setLoading(false);
    }
  };

  return { suggestion, loading, rephrase, getPrompt };
};
