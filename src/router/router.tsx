import { createBrowserRouter } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import WelcomePage from '@/pages/WelcomePage';
import AudioProcessingPage from '@/pages/AudioProcessingPage';
import PatientCompletePage from '@/pages/PatientCompletePage';

export const router = createBrowserRouter([
  { path: "/", element: <WelcomePage /> },
  { path: "/patient-complete", element: <PatientCompletePage /> },
  { path: "/patient/:patientId", element: <PatientCompletePage /> },
  { path: "/audio-processing", element: <AudioProcessingPage /> },
  { path: "/home-original", element: <HomePage /> },
  { path: "*", element: <div>404 - Página no encontrada</div> }
]);
