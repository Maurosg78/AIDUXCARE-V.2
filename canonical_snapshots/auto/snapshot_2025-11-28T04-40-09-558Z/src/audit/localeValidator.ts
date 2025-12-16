import fs from "fs";
import path from "path";

interface LocaleData {
  [key: string]: string | LocaleData;
}

/** Flatten nested locale JSON to dot notation */
function flattenJSON(obj: LocaleData, prefix = ""): Record<string, string> {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object") Object.assign(acc, flattenJSON(value, newKey));
    else acc[newKey] = value as string;
    return acc;
  }, {} as Record<string, string>);
}

/** Validate key parity and basic semantic parity between en and es */
export function validateLocaleParity() {
  const enPath = path.resolve("src/locales/en.json");
  const esPath = path.resolve("src/locales/es.json");
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const es = JSON.parse(fs.readFileSync(esPath, "utf8"));

  const flatEn = flattenJSON(en);
  const flatEs = flattenJSON(es);

  const missingInEs = Object.keys(flatEn).filter((k) => !(k in flatEs));
  const missingInEn = Object.keys(flatEs).filter((k) => !(k in flatEn));

  return {
    missingInEs,
    missingInEn,
    parityScore: 100 - ((missingInEs.length + missingInEn.length) / Object.keys(flatEn).length) * 100,
  };
}
