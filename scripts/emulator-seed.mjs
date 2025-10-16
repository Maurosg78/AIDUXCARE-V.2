import { Firestore } from '@google-cloud/firestore';
import fs from 'node:fs';

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 'aiduxcare-v2-uat-dev';
const firestore = new Firestore({ projectId: PROJECT_ID });

const data = JSON.parse(fs.readFileSync('test-data/seed.json', 'utf-8'));

async function seed() {
  let count = 0;
  for (const [coll, docs] of Object.entries(data)) {
    for (const d of docs) {
      await firestore.collection(coll).add(d);
      count++;
    }
  }
  console.log(`✅ Seeded ${count} docs into ${PROJECT_ID} (emulator @ ${process.env.FIRESTORE_EMULATOR_HOST}).`);
}
seed().catch(e => { console.error(e); process.exit(1); });
