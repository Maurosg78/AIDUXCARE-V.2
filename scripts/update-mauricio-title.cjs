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

async function updateMauricioTitle() {
  try {
    console.log('🔍 Buscando perfil de Mauricio Sobarzo...');
    console.log('📋 Configuración Firebase:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    });
    
    // Buscar por email de Mauricio
    const mauricioEmail = 'msobarzo78@gmail.com';
    
    // Buscar el documento por email
    const professionalsRef = collection(db, 'professionals');
    const q = query(professionalsRef, where('email', '==', mauricioEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No se encontró el perfil de Mauricio');
      return;
    }
    
    // Obtener el primer documento (debería ser único)
    const docSnap = querySnapshot.docs[0];
    const currentData = docSnap.data();
    
    console.log('📋 Datos actuales:', {
      id: docSnap.id,
      fullName: currentData.fullName,
      professionalTitle: currentData.professionalTitle,
      specialty: currentData.specialty
    });
    
    // Actualizar el professionalTitle
    await updateDoc(docSnap.ref, {
      professionalTitle: 'FT',
      updatedAt: new Date()
    });
    
    console.log('✅ ProfessionalTitle actualizado exitosamente a "FT"');
    
    // Verificar el cambio
    const updatedSnap = await getDoc(docSnap.ref);
    const updatedData = updatedSnap.data();
    console.log('📋 Datos actualizados:', {
      fullName: updatedData.fullName,
      professionalTitle: updatedData.professionalTitle,
      specialty: updatedData.specialty
    });
    
  } catch (error) {
    console.error('❌ Error al actualizar:', error);
  }
}

// Ejecutar el script
updateMauricioTitle(); 