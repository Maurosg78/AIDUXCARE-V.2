import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SOAPEditor } from '../SOAPEditor';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      displayName: 'Physio Test',
      uid: 'physio-test',
    },
  }),
}));

vi.mock('../../core/pilotDetection', () => ({
  isSpainPilot: () => false,
}));

vi.mock('../../services/analyticsService', () => ({
  AnalyticsService: {
    trackEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../session/FinalizedSessionActions', () => ({
  FinalizedSessionActions: () => (
    <div data-testid="new-finalized-session-actions">
      New finalized actions panel
    </div>
  ),
}));

const soap = {
  subjective: 'Paciente refiere mejoría.',
  objective: 'Movilidad reevaluada.',
  assessment: 'Evolución favorable.',
  plan: 'TRATAMIENTO EN CLÍNICA:\n- Movilización articular',
};

const renderFinalizedEditor = () => {
  render(
    <SOAPEditor
      soap={soap}
      status="finalized"
      visitType="follow-up"
      patientId="patient-test"
      sessionId="session-test"
      onSave={vi.fn()}
      onBackToCommandCenter={vi.fn()}
      finalizedActionContext={{
        sessionDateKey: '2026-07-07',
        patientName: 'Synthetic Patient',
        patientEmail: 'synthetic@example.test',
        professionalName: 'Physio Test',
        professionalLicense: 'TEST-001',
      }}
    />
  );
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('SOAPEditor finalized actions feature flag', () => {
  it('keeps the legacy finalized actions when the flag is off', () => {
    vi.stubEnv('VITE_USE_NEW_ACTIONS_PANEL', 'false');

    renderFinalizedEditor();

    expect(screen.queryByTestId('new-finalized-session-actions')).not.toBeInTheDocument();
    expect(screen.getByText('shell.nav.backToCommandCenter')).toBeInTheDocument();
  });

  it('uses FinalizedSessionActions only when the flag is enabled in dev/test', () => {
    vi.stubEnv('VITE_USE_NEW_ACTIONS_PANEL', 'true');

    renderFinalizedEditor();

    expect(screen.getByTestId('new-finalized-session-actions')).toBeInTheDocument();
    expect(screen.queryByText('shell.nav.backToCommandCenter')).not.toBeInTheDocument();
  });
});
