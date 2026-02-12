const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'aiduxcare-v2-uat-dev'
});

const db = admin.firestore();

async function checkUsers() {
  console.log('\n=== USUARIOS REGISTRADOS ===\n');
  
  // Get all users from Authentication
  const listUsersResult = await admin.auth().listUsers(1000);
  
  console.log(`Total usuarios en Auth: ${listUsersResult.users.length}\n`);
  
  for (const user of listUsersResult.users) {
    // Get professional profile
    const profDoc = await db.collection('usuarios').doc(user.uid).get();
    const profData = profDoc.exists ? profDoc.data() : {};
    
    console.log(`📧 ${user.email}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Creado: ${user.metadata.creationTime}`);
    console.log(`   Último login: ${user.metadata.lastSignInTime || 'Nunca'}`);
    console.log(`   Email veriado: ${user.emailVerified ? 'Sí' : 'No'}`);
    console.log(`   Nombre: ${profData.firstName || 'N/A'} ${profData.lastName || ''}`);
    console.log(`   Estado registro: ${profData.registrationStatus || 'N/A'}`);
    console.log('---');
  }
  
  // Get patients
  const patientsSnap = await db.collection('patients').get();
  console.log(`\n=== PACIENTES REGISTRADOS: ${patientsSnap.size} ===\n`);
  
  patientsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`👤 ${data.firstName} ${data.lastName}`);
    console.log(`   Email: ${data.email || 'N/A'}`);
    console.log(`   Teléfono: ${data.phone || 'N/A'}`);
    console.log(`   Creado: ${data.createdAt?.toDate() || 'N/A'}`);
    console.log('---');
  });
  
  process.exit(0);
}

checkUsers().catch(console.error);
