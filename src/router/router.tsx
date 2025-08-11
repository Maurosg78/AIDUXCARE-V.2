import { createBrowserRouter } from 'react-router-dom';
import { WelcomePage } from '../pages/WelcomePage';
import LoginPage from '../pages/LoginPage';
import { CommandCenterPage } from '../features/command-center/CommandCenterPage';
import { ProfessionalWorkflowPage } from '../pages/ProfessionalWorkflowPage';
import { RegistrationSuccessPage } from '../pages/RegistrationSuccessPage';
import DebugPage from '../pages/DebugPage';
import { TestGeolocation } from '../pages/TestGeolocation';
import { EmailVerifiedPage } from '../pages/EmailVerifiedPage';
import { AuthGuard } from '../components/AuthGuard';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Layout wrapper para manejar data-section
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Determinar la sección basada en la ruta
    const isAuthRoute = location.pathname.startsWith('/login') || 
                       location.pathname.startsWith('/register') || 
                       location.pathname.startsWith('/forgot-password') ||
                       location.pathname.startsWith('/verify') ||
                       location.pathname.startsWith('/activate');
    
    const isInternalRoute = location.pathname.startsWith('/command-center') || 
                           location.pathname.startsWith('/professional') ||
                           location.pathname.startsWith('/patient') ||
                           location.pathname.startsWith('/analytics');
    
    // Aplicar data-section al body
    if (isAuthRoute) {
      document.body.setAttribute('data-section', 'auth');
    } else if (isInternalRoute) {
      document.body.setAttribute('data-section', 'internal');
    } else {
      document.body.removeAttribute('data-section');
    }
  }, [location.pathname]);

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <LayoutWrapper>
        <LoginPage />
      </LayoutWrapper>
    )
  },
  {
    path: '/register',
    element: (
      <LayoutWrapper>
        <WelcomePage />
      </LayoutWrapper>
    )
  },
  {
    path: '/login',
    element: (
      <LayoutWrapper>
        <LoginPage />
      </LayoutWrapper>
    )
  },
  {
    path: '/debug',
    element: (
      <LayoutWrapper>
        <DebugPage />
      </LayoutWrapper>
    )
  },
  {
    path: '/registration-success',
    element: (
      <LayoutWrapper>
        <RegistrationSuccessPage />
      </LayoutWrapper>
    )
  },
  {
    path: '/command-center',
    element: (
      <LayoutWrapper>
        <AuthGuard>
          <CommandCenterPage />
        </AuthGuard>
      </LayoutWrapper>
    )
  },
  {
    path: '/professional-workflow',
    element: (
      <LayoutWrapper>
        <AuthGuard>
          <ProfessionalWorkflowPage />
        </AuthGuard>
      </LayoutWrapper>
    )
  },
  {
    path: '/test-geolocation',
    element: (
      <LayoutWrapper>
        <AuthGuard>
          <TestGeolocation />
        </AuthGuard>
      </LayoutWrapper>
    )
  },
  {
    path: '/email-verified',
    element: <EmailVerifiedPage />
  }
]);

export default router; 