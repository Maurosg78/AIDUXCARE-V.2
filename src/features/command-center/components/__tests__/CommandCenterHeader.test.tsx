import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CommandCenterHeader } from '../CommandCenterHeader';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      displayName: 'Fallback Name',
    },
  }),
}));

vi.mock('../../../../hooks/useIsAdmin', () => ({
  useIsAdmin: () => false,
}));

vi.mock('@/core/pilotDetection', () => ({
  isSpainPilot: () => true,
}));

vi.mock('../../../../context/ProfessionalProfileContext', () => ({
  useProfessionalProfile: () => ({
    profile: {
      firstName: 'Joana',
      lastName: 'Clinician',
    },
  }),
}));

describe('CommandCenterHeader', () => {
  it('muestra saludo correcto según currentDate prop, no según Date() del momento de render', () => {
    const currentDate = new Date('2026-07-09T09:30:00');

    render(
      <MemoryRouter initialEntries={['/command-center']}>
        <CommandCenterHeader currentDate={currentDate} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Buenos días/)).toBeInTheDocument();
    expect(screen.getByText(/jueves, 9 de julio de 2026/)).toBeInTheDocument();
  });
});
