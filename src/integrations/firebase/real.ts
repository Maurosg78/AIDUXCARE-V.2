// Puente hacia tu cliente real. No importes esto nunca desde páginas directas.
export * from "@/core/firebase/firebaseClient";
export const isFirebaseEnabled = true as const;
