import fs from "fs";
import path from "path";

console.log("🔍 Checking .env.local environment variables...\n");

const envPath = path.resolve(".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ No .env.local found in project root.");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  content
    .split("\n")
    .filter(line => line.trim() && !line.startsWith("#"))
    .map(line => line.split("=").map(v => v.trim()))
);

const required = [
  "VITE_ENV",
  "VITE_MARKET",
  "VITE_LANGUAGE",
  "VITE_VERTEX_PROJECT_ID",
  "VITE_VERTEX_LOCATION",
  "VITE_VERTEX_MODEL",
  "VITE_VERTEX_API_KEY",
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_APP_ID",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_OPENAI_API_KEY"
];

let missing = [];
for (const key of required) {
  if (!env[key] || env[key].includes("<<<") || env[key].includes("REPLACE")) {
    missing.push(key);
  }
}

if (missing.length) {
  console.error("⚠️  Missing or placeholder variables:");
  for (const key of missing) console.error(`  - ${key}`);
  console.error("\n❌ Environment validation failed.\n");
  process.exit(1);
} else {
  console.log("✅ All required environment variables present!\n");
}
