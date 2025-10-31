import React from "react";
import { useSafeTranslation } from "../hooks/useSafeTranslation";

const { t } = useSafeTranslation();

export default function PlaceholderComponent() {
  return <div>{t("ui.placeholder", "Component placeholder until sync")}</div>;
}
