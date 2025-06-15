const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: applicationDefault()
  // projectId eliminado para usar el del entorno
});

const db = getFirestore();

async function main() {
  try {
    const ref = await db.collection('test_collection').add({ test: 'data' });
    console.log('PASS: Documento creado con ID:', ref.id);
    const doc = await ref.get();
    if (doc.exists && doc.data().test === 'data') {
      console.log('PASS: Documento leído correctamente:', doc.data());
      process.exit(0);
    } else {
      console.error('FAIL: Error al leer el documento');
      process.exit(1);
    }
  } catch (e) {
    console.error('FAIL:', e);
    process.exit(1);
  }
}
main(); 