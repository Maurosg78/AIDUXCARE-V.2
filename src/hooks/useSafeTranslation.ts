import { useTranslation } from "react-i18next";

/**
 * Safe translation hook to avoid "t is not defined" errors in UI.
 */
export function useSafeTranslation() {
  try {
    return useTranslation();
  } catch {
    return { t: (key: string, fallback?: string) => fallback || key };
  }
}
