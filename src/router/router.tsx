import { Routes, Route } from 'react-router-dom';
import { WelcomePage } from '../pages/WelcomePage';
import { ProfessionalWorkflowPage } from '../pages/ProfessionalWorkflowPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { LegalConsentAdminPage } from '../pages/LegalConsentAdminPage';
import { AccountActivationPage } from '../pages/AccountActivationPage';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/professional-workflow" element={<ProfessionalWorkflowPage />} />
      <Route path="/legal-admin" element={<LegalConsentAdminPage />} />
      <Route path="/activate" element={<AccountActivationPage />} />
    </Routes>
  );
}; 