const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debugNotes() {
  const patientId = 'UAq8lyrtl3LnlkXsgohE';
  
  const snapshot = await db.collection('consultations')
    .where('patientId', '==', patientId)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
  
  console.log(`\nFound ${snapshot.size} notes for patient ${patientId}\n`);
  
  snapshot.forEach((doc, index) => {
    const data = doc.data();
    console.log(`Note ${index}:`);
    console.log(`  ID: ${doc.id}`);
    console.log(`  visitType: ${data.visitType}`);
    console.log(`  createdAt: ${data.createdAt}`);
    console.log(`  Plan (first 200 chars): ${data.soapData?.plan?.substring(0, 200)}...`);
    console.log(`  Language hint: ${/[a-zA-Z]{20,}/.test(data.soapData?.plan || '') ? 'English' : 'Spanish'}`);
    console.log('---\n');
  });
}

debugNotes().then(() => process.exit(0)).catch(console.error);
