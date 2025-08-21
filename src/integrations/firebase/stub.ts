export const isFirebaseEnabled = false as const;

// Si alguien intenta usar esto, fallará en runtime con mensaje claro.
export async function getFirebaseClient(): Promise<never> {
  throw new Error("Firebase está deshabilitado en este build (stub). Activa AIDUX_ENABLE_FIREBASE=1");
}

// Stubs para evitar errores de import
export const auth = {
  signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase deshabilitado")),
  signOut: () => Promise.reject(new Error("Firebase deshabilitado")),
  onAuthStateChanged: () => () => {},
  currentUser: null,
};

export const app = {
  name: "firebase-stub",
  options: {},
};

export const db = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.reject(new Error("Firebase deshabilitado")),
      set: () => Promise.reject(new Error("Firebase deshabilitado")),
      update: () => Promise.reject(new Error("Firebase deshabilitado")),
      delete: () => Promise.reject(new Error("Firebase deshabilitado")),
    }),
  }),
};
