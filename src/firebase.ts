import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Credenciales proporcionadas por el CEO para el entorno de UAT
const firebaseConfig = {
  apiKey: "AIzaSyDMDl3Vj_0WSMhOtz6IbGiTXaWOtABeGyk",
  authDomain: "aiduxcare-mvp-uat.firebaseapp.com",
  projectId: "aiduxcare-mvp-uat",
  storageBucket: "aiduxcare-mvp-uat.firebasestorage.app",
  messagingSenderId: "438815206522",
  appId: "1:438815206522:web:4a3618eb72f42c73751fc3",
  measurementId: "G-TCXWV8L42M"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios que usaremos en la aplicación para asegurar que usamos una única instancia
export const auth = getAuth(app);
export const db = getFirestore(app); 