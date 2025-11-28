import fs from "fs";

const file = "src/utils/responseParser.ts";
const content = fs.readFileSync(file, "utf8");

if (!content.includes("Gemini 2.0 Flash")) {
  const updated = content.replace(
    /Parse failed even after repair.*\n/,
    `$&    // 🧩 Gemini 2.0 Flash: intentar extracción completa de texto plano
    const asText = typeof raw === "object" ? JSON.stringify(raw) : String(raw);
    const partial = asText.match(/\\{[^{}]*motivo_consulta[^{}]*\\}/s);
    if (partial) {
      try {
        const fixed = partial[0]
          .replace(/([{,])([a-zA-Z0-9_]+):/g, '$1"$2":')
          .replace(/'/g, '"');
        return JSON.parse(fixed);
      } catch (e2) {
        console.warn("[Parser] Segunda reparación fallida");
      }
    }
`
  );

  fs.writeFileSync(file, updated, "utf8");
  console.log("✅ Patch Gemini 2.0 Flash aplicado a responseParser.ts");
} else {
  console.log("⚠️ Patch ya aplicado previamente, no se hicieron cambios.");
}
