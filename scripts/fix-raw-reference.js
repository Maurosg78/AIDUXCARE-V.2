import fs from "fs";

const file = "src/utils/responseParser.ts";
let code = fs.readFileSync(file, "utf8");

// Solo arregla si detecta la línea problemática
if (code.includes('console.error("[Parser] Failed input:", raw)')) {
  code = code.replace(
    /console\.error\("\[Parser\] Failed input:", raw\)/g,
    'console.error("[Parser] Failed input:", input || text || "<undefined>")'
  );
  fs.writeFileSync(file, code, "utf8");
  console.log("✅ Fixed reference to undefined variable 'raw' in responseParser.ts");
} else {
  console.log("⚠️ No 'raw' reference found — nothing changed.");
}
