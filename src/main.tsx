import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import logger from "@/shared/utils/logger";
import { AuthProvider } from "./context/AuthContext";
import { ProfessionalProfileProvider } from "./context/ProfessionalProfileContext";
import { SessionProvider } from "./context/SessionContext";
import { MobileViewportFix } from "./components/mobile/MobileViewportFix";
import { MobileTestHarness } from "./components/mobile/MobileTestHarness";
import App from "./App";

// Lazy load Analytics - solo se inicializa cuando se necesita
// Esto evita cargar el servicio completo al inicio
let analyticsInitialized = false;
const initAnalytics = async () => {
  if (!analyticsInitialized) {
    const { Analytics } = await import("./services/analytics-service");
Analytics.enable();
    analyticsInitialized = true;
  }
};

// Inicializar Analytics de forma asíncrona después de que la app esté lista
if (typeof window !== 'undefined') {
  // Usar requestIdleCallback si está disponible, sino setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      initAnalytics().catch(err => logger.error('Error inicializando Analytics:', err));
    });
  } else {
    setTimeout(() => {
      initAnalytics().catch(err => logger.error('Error inicializando Analytics:', err));
    }, 100);
  }
}

// Service Worker solo en PRODUCCIÓN
// Deshabilitado temporalmente hasta que se implemente completamente
// if ("serviceWorker" in navigator && import.meta.env.PROD) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/sw.js")
//       .then((registration) => {
//         logger.info("✅ SW registrado:", registration);
//       })
//       .catch((error) => {
//         logger.error("❌ Error al registrar SW:", error);
//       });
//   });
// }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MobileViewportFix />
    {import.meta.env.DEV && <MobileTestHarness />}
    <AuthProvider>
      <ProfessionalProfileProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </ProfessionalProfileProvider>
    </AuthProvider>
  </StrictMode>
);

