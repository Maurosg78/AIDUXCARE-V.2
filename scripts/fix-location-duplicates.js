import fs from "fs";
const file = "src/components/wizard/LocationDataStep.tsx";
let src = fs.readFileSync(file, "utf8");

function commentAllButLast(key) {
  const re = new RegExp(`^\\s*${key}\\s*:`, "m");
  // Encuentra TODAS las posiciones
  const lines = src.split("\n");
  const idxs = [];
  for (let i = 0; i < lines.length; i++) {
    if (new RegExp(`^\\s*${key}\\s*:`).test(lines[i])) idxs.push(i);
  }
  // Comenta todas excepto la última
  for (let i = 0; i < idxs.length - 1; i++) {
    const li = idxs[i];
    if (!lines[li].trimStart().startsWith("//")) {
      lines[li] = "// DUPLICATE_REMOVED: " + lines[li];
    }
  }
  src = lines.join("\n");
}

commentAllButLast("nl");
commentAllButLast("bc");

fs.writeFileSync(file, src, "utf8");
console.log("✅ Duplicates comentados (conservada la última ocurrencia) en LocationDataStep.tsx");
