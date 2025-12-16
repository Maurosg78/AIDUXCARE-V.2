import { TFunction } from "i18next";

export interface UIContext {
  role?: "physio" | "assistant" | "auditor";
  sessionType?: "initial" | "followup" | "discharge";
  status?: "open" | "closed" | "pending";
}

export function contextualT(t: TFunction, key: string, ctx: UIContext) {
  const contextKey = [
    key,
    ctx.role && `role.${ctx.role}`,
    ctx.sessionType && `session.${ctx.sessionType}`,
    ctx.status && `status.${ctx.status}`,
  ]
    .filter(Boolean)
    .join(".");

  return t(contextKey, { defaultValue: t(key) });
}
