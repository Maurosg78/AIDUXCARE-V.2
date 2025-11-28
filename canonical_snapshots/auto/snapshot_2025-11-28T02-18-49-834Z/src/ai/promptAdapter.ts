import { TFunction } from "i18next";
import { UIContext } from "../i18n/contextAdapter";

export interface PromptContext extends UIContext {
  section: "soap" | "consent" | "audit" | "summary";
  tone?: "formal" | "friendly" | "neutral";
}

export function adaptivePrompt(t: TFunction, baseKey: string, ctx: PromptContext): string {
  const keyParts = [
    "prompts",
    ctx.section,
    ctx.tone && `tone.${ctx.tone}`,
    ctx.role && `role.${ctx.role}`,
    ctx.sessionType && `session.${ctx.sessionType}`,
  ].filter(Boolean);

  const fullKey = `${keyParts.join(".")}.${baseKey}`;
  return t(fullKey, { defaultValue: t(`prompts.${baseKey}`) });
}
