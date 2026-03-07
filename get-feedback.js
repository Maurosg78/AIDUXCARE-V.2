const admin = require('./node_modules/firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}
async function getFeedback() {
  const db = admin.firestore();
  const collections = ['feedback', 'userFeedback', 'reports', 'issues'];
  for (const col of collections) {
    const snap = await db.collection(col).orderBy('createdAt', 'desc').limit(20).get().catch(() => null);
    if (!snap || snap.empty) continue;
    console.log(`\n=== ${col} (${snap.size} docs) ===`);
    snap.forEach(doc => {
      const d = doc.data();
      console.log(JSON.stringify({
        id: doc.id,
        type: d.type || d.category,
        status: d.status,
        message: (d.message || d.text || d.description || '').substring(0, 120),
        createdAt: d.createdAt?.toDate?.()?.toISOString?.() || d.createdAt,
        userId: d.userId || d.user,
      }));
    });
  }
  process.exit(0);
}
getFeedback().catch(console.error);
