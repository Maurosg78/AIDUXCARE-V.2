import { createBrowserRouter } from 'react-router-dom';
import ConsultationPage from '../pages/ConsultationPage';
import { DebugAudioPage } from '../pages/DebugAudioPage';
import DebugCloudFunctionPage from '../pages/DebugCloudFunctionPage';

export const router = createBrowserRouter([
  {
    path: '/consultation',
    element: <ConsultationPage />
  },
  {
    path: '/debug-audio',
    element: <DebugAudioPage />
  },
  {
    path: '/debug-cloud',
    element: <DebugCloudFunctionPage />
  }
]);
