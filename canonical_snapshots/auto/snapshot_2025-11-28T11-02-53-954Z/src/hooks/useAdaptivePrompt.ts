import { useTranslation } from "react-i18next";
import { adaptivePrompt, PromptContext } from "../ai/promptAdapter";

export const useAdaptivePrompt = (ctx: PromptContext) => {
  const { t } = useTranslation();
  return (baseKey: string) => adaptivePrompt(t, baseKey, ctx);
};
