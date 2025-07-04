import { createBrowserRouter } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import WelcomePage from "@/pages/WelcomePage";
import AudioProcessingPage from "@/pages/AudioProcessingPage";
import PatientCompletePage from "@/pages/PatientCompletePage";
import PatientDataPage from "@/pages/PatientDataPage";
import AuthenticationPage from "@/pages/AuthenticationPage";
import AuthGuard from "@/components/AuthGuard";

export const router = createBrowserRouter([
  { path: "/", element: (<AuthGuard><PatientCompletePage /></AuthGuard>) },
  { path: "/consulta", element: (<AuthGuard><PatientCompletePage /></AuthGuard>) },
  { path: "/auth", element: <AuthenticationPage /> },
  { path: "/patient-data", element: (<AuthGuard><PatientDataPage /></AuthGuard>) },
  { path: "/patient-complete", element: (<AuthGuard><PatientCompletePage /></AuthGuard>) },
  { path: "/home-original", element: <HomePage /> },
  { path: "/audio-processing", element: <AudioProcessingPage /> },
  { path: "*", element: <div>404 - Página no encontrada</div> }
]);
