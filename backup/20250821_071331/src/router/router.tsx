import { createBrowserRouter, useParams, Navigate } from 'react-router-dom';
import { AuthGuard } from '../components/AuthGuard';
import { CommandCenterPage } from '../features/command-center/CommandCenterPage';
import LoginPage from '../pages/LoginPage'; // Tu LoginPage principal con diseño Apple-style
import { PatientListPage } from '../pages/PatientsPage';
import { PatientDetailPage } from '../pages/PatientDetailPage';
import { AppointmentListPage } from '../pages/AppointmentsPage';
import { AppointmentDetailPage } from '../pages/AppointmentsPage';
import { NotesListPage } from '../pages/NotesPage';
import { NoteDetailPage } from '../pages/NotesPage';

// LayoutWrapper simple
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-slate-900">AiDuxCare</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}

// Wrapper para NoteDetailPage que obtiene el id de los parámetros
function NoteDetailWrapper() {
  const { id } = useParams<{ id: string }>();
  return <NoteDetailPage id={id || ''} />;
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/test" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/command-center',
    element: <LayoutWrapper><CommandCenterPage /></LayoutWrapper>
  },
  {
    path: '/test',
    element: <div style={{padding: '20px', fontSize: '24px'}}>🎉 RESET MVP FUNCIONA - Command Center cargando...</div>
  },
  { path: '/patients', element: <AuthGuard><LayoutWrapper><PatientListPage /></LayoutWrapper></AuthGuard> },
  { path: '/patients/:id', element: <AuthGuard><LayoutWrapper><PatientDetailPage /></LayoutWrapper></AuthGuard> },
  { path: '/appointments', element: <AuthGuard><LayoutWrapper><AppointmentListPage /></LayoutWrapper></AuthGuard> },
  { path: '/appointments/:id', element: <AuthGuard><LayoutWrapper><AppointmentDetailPage /></LayoutWrapper></AuthGuard> },
  { path: '/notes', element: <AuthGuard><LayoutWrapper><NotesListPage /></LayoutWrapper></AuthGuard> },
  { path: '/notes/:id', element: <AuthGuard><LayoutWrapper><NoteDetailWrapper /></LayoutWrapper></AuthGuard> }
]);

export default router; 