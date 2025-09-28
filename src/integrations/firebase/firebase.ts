// @ts-nocheck
// Safe Firebase Bridge – único punto de acceso a Auth usando src/lib/firebase.ts

export type FirebaseAuth = {
  signInWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  currentUser: { uid: string; email: string } | null;
};

// Activación por entorno si alguna vez queremos deshabilitar (por ahora siempre true)
export const isFirebaseEnabled: boolean =
  (import.meta as any)?.env?.VITE_FIREBASE_ENABLED !== 'false';

import { signInWithEmailAndPassword as _login, signOut as _logout } from 'firebase/auth';

import { auth } from '@/lib/firebase';

const realImpl: FirebaseAuth = {
  signInWithEmailAndPassword: async (email: string, password: string) => {
    await _login(auth, email, password);
  },
  signOut: async () => {
    await _logout(auth);
  },
  get currentUser() {
    const u = auth.currentUser;
    return u ? { uid: u.uid, email: u.email || '' } : null;
  },
};

// Si en algún momento se deshabilita Firebase, devolvemos un stub seguro.
const stubImpl: FirebaseAuth = {
  signInWithEmailAndPassword: async () => { return; },
  signOut: async () => { return; },
  currentUser: null,
};

export async function getAuthBridge(): Promise<FirebaseAuth> {
  return isFirebaseEnabled ? realImpl : stubImpl;
}