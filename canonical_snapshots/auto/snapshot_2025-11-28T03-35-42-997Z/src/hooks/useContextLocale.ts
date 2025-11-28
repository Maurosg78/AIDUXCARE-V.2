import { useTranslation } from "react-i18next";
import { contextualT, UIContext } from "../i18n/contextAdapter";

export const useContextLocale = (ctx: UIContext) => {
  const { t } = useTranslation();
  return (key: string) => contextualT(t, key, ctx);
};
