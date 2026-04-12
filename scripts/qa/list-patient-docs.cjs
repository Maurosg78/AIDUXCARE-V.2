const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'aiduxcare-v2-uat-dev',
  });
}

const db = admin.firestore();
const patientId = process.argv[2];

if (!patientId) {
  console.error('Usage: node scripts/qa/list-patient-docs.cjs <patientId>');
  process.exit(1);
}

const toIso = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
};

async function listDocs() {
  const out = {};

  const sessionsSnap = await db.collection('sessions').where('patientId', '==', patientId).get();
  out.sessions = sessionsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      docId: doc.id,
      sessionId: data.sessionId ?? doc.id,
      createdAt: toIso(data.createdAt),
      status: data.status ?? null,
      visitType: data.visitType ?? data.sessionType ?? null,
    };
  });

  const encountersSnap = await db.collection('encounters').where('patientId', '==', patientId).get();
  out.encounters = encountersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      docId: doc.id,
      encounterId: data.encounterId ?? doc.id,
      encounterDate: toIso(data.encounterDate),
      visitType: data.visitType ?? null,
      sessionId: data.sessionId ?? null,
    };
  });

  const consultationsSnap = await db.collection('consultations').where('patientId', '==', patientId).get();
  out.consultations = consultationsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      docId: doc.id,
      createdAt: toIso(data.createdAt),
      visitType: data.visitType ?? null,
      sessionId: data.sessionId ?? null,
    };
  });

  console.log(JSON.stringify(out, null, 2));
}

listDocs().catch((error) => {
  console.error(error);
  process.exit(1);
});
