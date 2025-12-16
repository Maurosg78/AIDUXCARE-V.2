import fs from "fs";
const file = "src/utils/responseParser.ts";
let code = fs.readFileSync(file, "utf8");

if (!code.includes("Safe Logger Patch")) {
  const safeBlock = `

  // 🩺 Safe Logger Patch — Gemini / Vertex unified fallback
  const _dump = (val) => {
    try {
      if (typeof val === "string") return val.slice(0, 1000);
      return JSON.stringify(val, null, 2).slice(0, 1000);
    } catch {
      return "<unserializable>";
    }
  };
  const _safeLog = (msg, val) => console.error(msg, _dump(val));
`;

  // Insert before last console.error block or before export
  code = code.replace(/(console\.error\(.*response\);)/, `$1\n${safeBlock}`);
  fs.writeFileSync(file, code, "utf8");
  console.log("✅ Safe Logger Patch aplicado a responseParser.ts");
} else {
  console.log("⚠️ Patch ya aplicado previamente.");
}
