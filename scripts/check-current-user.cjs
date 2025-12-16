const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
require('dotenv').config();

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function checkCurrentUser() {
  try {
    console.log('🔍 Verificando usuario autenticado...');
    
    // Intentar autenticar con diferentes emails de Mauricio
    const mauricioEmails = [
      'mausobarzo@gmail.com',
      'mauricio@aiduxcare.com'
    ];
    
    for (const email of mauricioEmails) {
      console.log(`\n📧 Probando con email: ${email}`);
      
      try {
        // Intentar autenticar (necesitarás la contraseña)
        // const userCredential = await signInWithEmailAndPassword(auth, email, 'password');
        // console.log('✅ Autenticación exitosa');
        
        // Por ahora, solo verificar si el usuario existe
        console.log('ℹ️ Para verificar completamente, necesitas proporcionar la contraseña');
        
      } catch (error) {
        console.log(`❌ Error con ${email}:`, error.message);
      }
    }
    
    // Verificar usuario actual si está autenticado
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('\n✅ Usuario actualmente autenticado:');
      console.log(`   UID: ${currentUser.uid}`);
      console.log(`   Email: ${currentUser.email}`);
      
      // Obtener datos del usuario
      const userDoc = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userDoc);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log('📋 Datos del usuario:');
        console.log(`   Nombre: ${userData.fullName || 'N/A'}`);
        console.log(`   ProfessionalTitle: ${userData.professionalTitle || 'N/A'}`);
        console.log(`   Specialty: ${userData.specialty || 'N/A'}`);
        console.log(`   Email: ${userData.email || 'N/A'}`);
      } else {
        console.log('❌ No se encontraron datos del usuario en Firestore');
      }
    } else {
      console.log('\n❌ No hay usuario autenticado actualmente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar el script
checkCurrentUser(); 