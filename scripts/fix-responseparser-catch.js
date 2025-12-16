import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, "..", "src", "utils", "responseParser.ts");
const src = fs.readFileSync(file, "utf8");

const fnIdx = src.indexOf("function parseVertexResponse");
if (fnIdx === -1) {
  console.error("❌ No se encontró function parseVertexResponse en responseParser.ts");
  process.exit(1);
}

const catchIdx = src.indexOf("catch (", fnIdx);
if (catchIdx === -1) {
  console.error("❌ No se encontró bloque catch en parseVertexResponse");
  process.exit(1);
}

const catchBraceOpen = src.indexOf("{", catchIdx);
if (catchBraceOpen === -1) {
  console.error("❌ No se encontró apertura de { del catch");
  process.exit(1);
}

let depth = 0;
let i = catchBraceOpen;
for (; i < src.length; i++) {
  const ch = src[i];
  if (ch === "{") depth++;
  else if (ch === "}") {
    depth--;
    if (depth === 0) break;
  }
}
if (depth !== 0) {
  console.error("❌ No se pudo emparejar el cierre de } del catch");
  process.exit(1);
}
const catchBraceClose = i;

const safeCatchBody = `
  console.error('[Parser] Error:', (error && (error.message || error)) ?? '<unknown>');
  const safeDump = (val) => {
    try {
      if (val == null) return '<undefined>';
      if (typeof val === 'string') return val.slice(0, 2000);
      return JSON.stringify(val, null, 2).slice(0, 2000);
    } catch {
      return '<unserializable>';
    }
  };
  // Preferimos "response", si existe; nunca referenciar "raw" aquí
  const safeInput = (typeof response !== 'undefined') ? response : '<no response>';
  console.error('[Parser] Failed input:', safeDump(safeInput));
`;

const patched = src.slice(0, catchBraceOpen + 1) + safeCatchBody + "\n" + src.slice(catchBraceClose);

if (patched === src) {
  console.log("⚠️ El archivo ya parece estar parcheado; no hay cambios.");
} else {
  fs.writeFileSync(file + ".bak", src, "utf8");
  fs.writeFileSync(file, patched, "utf8");
  console.log("✅ Catch de parseVertexResponse parcheado sin referencias a 'raw'. Backup en responseParser.ts.bak");
}
