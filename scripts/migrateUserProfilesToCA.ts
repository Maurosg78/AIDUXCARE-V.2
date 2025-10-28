import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Load service account
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

(async () => {
  console.log("🇨🇦 Starting user migration to Canada (CA/en-CA)...");

  const usersSnap = await db.collection("users").get();
  const batch = db.batch();

  usersSnap.forEach((doc) => {
    const data = doc.data();

    // Skip if already migrated
    if (data.market === "CA" && data.language === "en-CA") return;

    const migrated = {
      ...data,
      market: "CA",
      language: "en-CA",
      compliance: ["CPO", "PHIPA", "PIPEDA"],
      migratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Normalize fields
    if (data.country && data.country !== "Canada") migrated.country = "Canada";
    if (!data.role) migrated.role = "physiotherapist";
    if (!data.displayName && data.email)
      migrated.displayName = data.email.split("@")[0];
    if (!data.emailVerified) migrated.emailVerified = true;

    batch.set(db.collection("users").doc(doc.id), migrated, { merge: true });
    console.log(`✅ Migrated ${doc.id} (${data.email})`);
  });

  await batch.commit();
  console.log("🎯 Migration complete.");
})();

