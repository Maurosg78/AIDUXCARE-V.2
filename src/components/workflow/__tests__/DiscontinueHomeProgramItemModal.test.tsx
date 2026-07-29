import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DiscontinueHomeProgramItemModal } from '../DiscontinueHomeProgramItemModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'workflow.homeProgram.removePermanentTitle': '¿Eliminar este ejercicio del plan?',
      'workflow.homeProgram.removePermanentDescription': 'Decisión distinta de desmarcar.',
      'workflow.homeProgram.removePermanentWarning': 'No se volverá a cargar.',
      'workflow.homeProgram.removalReasonLabel': 'Motivo (opcional)',
      'workflow.homeProgram.removalReasonPlaceholder': 'Motivo clínico',
      'workflow.homeProgram.keepInPlan': 'Mantener en el plan',
      'workflow.homeProgram.confirmPermanentRemoval': 'Eliminar del plan',
      'workflow.homeProgram.closeRemovalDialog': 'Cerrar',
    }[key] ?? key),
  }),
}));

describe('DiscontinueHomeProgramItemModal', () => {
  it('requiere una confirmación explícita y devuelve el motivo opcional', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DiscontinueHomeProgramItemModal
        isOpen
        itemLabel="Teclear con pulgar en móvil: Integrar función móvil"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Teclear con pulgar en móvil: Integrar función móvil')).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: /motivo/i }),
      'La pinza está recuperada al 100%.',
    );
    await user.click(screen.getByRole('button', { name: /eliminar del plan/i }));

    expect(onConfirm).toHaveBeenCalledWith('La pinza está recuperada al 100%.');
  });
});
