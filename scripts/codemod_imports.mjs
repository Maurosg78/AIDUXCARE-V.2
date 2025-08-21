import fs from "fs";

const RULES = [
  // WelcomePage → canónico
  { from: /from\s+['"](\/?src\/|@\/|\.\.\/|\.\/)?pages\/WelcomePage['"]/g,
    to:   `from "@/features/welcome/WelcomePage"` },
  // LoginPage → canónico
  { from: /from\s+['"](\/?src\/|@\/|\.\.\/|\.\/)?pages\/LoginPage['"]/g,
    to:   `from "@/features/auth/LoginPage"` },
  // Router duplicado → único
  { from: /from\s+['"](\/?src\/|@\/|\.\.\/|\.\/)?router\/router['"]/g,
    to:   `from "@/router"` },
];

let changed = 0;
for (const file of process.argv.slice(2)) {
  if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
  const old = fs.readFileSync(file, "utf8");
  let next = old;
  for (const r of RULES) next = next.replace(r.from, r.to);
  if (next !== old) {
    fs.writeFileSync(file, next, "utf8");
    console.log("★ rewrote:", file);
    changed++;
  }
}
if (!changed) console.log("No import changes.");
