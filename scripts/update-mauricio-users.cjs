const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');
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
const db = getFirestore(app);

async function updateMauricioUsers() {
  try {
    console.log('🔍 Buscando usuarios de Mauricio...');
    
    // Buscar usuarios por email
    const mauricioEmails = ['mausobarzo@gmail.com', 'mauricio@aiduxcare.com'];
    
    for (const email of mauricioEmails) {
      console.log(`\n📧 Buscando usuarios con email: ${email}`);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`❌ No se encontraron usuarios con email: ${email}`);
        continue;
      }
      
      console.log(`✅ Encontrados ${querySnapshot.size} usuarios con email: ${email}`);
      
      for (const docSnap of querySnapshot.docs) {
        const currentData = docSnap.data();
        
        console.log(`📋 Actualizando usuario ID: ${docSnap.id}`);
        console.log(`   Nombre: ${currentData.fullName || 'N/A'}`);
        console.log(`   Título actual: ${currentData.professionalTitle || 'N/A'}`);
        
        // Actualizar el professionalTitle
        await updateDoc(docSnap.ref, {
          professionalTitle: 'FT',
          updatedAt: new Date()
        });
        
        console.log(`✅ Título actualizado a "FT"`);
        
        // Verificar el cambio
        const updatedSnap = await getDoc(docSnap.ref);
        const updatedData = updatedSnap.data();
        console.log(`   Título actualizado: ${updatedData.professionalTitle}`);
      }
    }
    
    console.log('\n✅ Proceso completado');
    
  } catch (error) {
    console.error('❌ Error al actualizar:', error);
  }
}

// Ejecutar el script
updateMauricioUsers(); 