import fs from "fs";
import path from "path";

interface LocalePair {
  key: string;
  en: string;
  es: string;
}

/**
 * Simple AI-inspired reviewer: detects tone mismatches or missing phrasing.
 * (Real implementation would call internal LLM reviewer.)
 */
export function reviewTranslations(): { warnings: string[]; score: number } {
  const en = JSON.parse(fs.readFileSync(path.resolve("src/locales/en.json"), "utf8"));
  const es = JSON.parse(fs.readFileSync(path.resolve("src/locales/es.json"), "utf8"));

  const flatten = (obj: any, prefix = "") =>
    Object.keys(obj).reduce((acc, k) => {
      const val = obj[k];
      const newKey = prefix ? `${prefix}.${k}` : k;
      if (typeof val === "object") Object.assign(acc, flatten(val, newKey));
      else acc[newKey] = val;
      return acc;
    }, {} as Record<string, string>);

  const flatEn = flatten(en);
  const flatEs = flatten(es);

  const warnings: string[] = [];
  let checked = 0;
  for (const key in flatEn) {
    if (!flatEs[key]) warnings.push(`Missing in es: ${key}`);
    else {
      checked++;
      const enText = flatEn[key].toLowerCase();
      const esText = flatEs[key].toLowerCase();
      if (enText.includes("plan") && !esText.includes("plan")) {
        warnings.push(`Tone mismatch likely (missing "plan") in: ${key}`);
      }
    }
  }

  const score = Math.max(0, 100 - warnings.length * 2);
  return { warnings, score };
}
