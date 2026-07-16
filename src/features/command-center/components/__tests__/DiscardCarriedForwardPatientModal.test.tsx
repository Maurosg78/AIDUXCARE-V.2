import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DiscardCarriedForwardPatientModal } from '../DiscardCarriedForwardPatientModal';

describe('DiscardCarriedForwardPatientModal', () => {
  it('confirma una razón seleccionada', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DiscardCarriedForwardPatientModal
        isOpen
        patientName="Paciente de prueba"
        isSubmitting={false}
        errorMessage={null}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const noShowOption = screen.getByRole('radio', { name: 'No se presentó' });
    const confirmButton = screen.getByRole('button', { name: 'Confirmar' });

    await user.click(noShowOption);
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith({
      discardedReason: 'no_show',
      discardedReasonText: null,
    });
  });

  it('permite confirmar sin seleccionar ninguna razón', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DiscardCarriedForwardPatientModal
        isOpen
        patientName="Paciente de prueba"
        isSubmitting={false}
        errorMessage={null}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    const selectedOptions = screen.getAllByRole('radio').filter((option) => {
      const radioOption = option as HTMLInputElement;
      return radioOption.checked;
    });
    const confirmButton = screen.getByRole('button', { name: 'Confirmar' });

    expect(selectedOptions).toHaveLength(0);

    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith({
      discardedReason: null,
      discardedReasonText: null,
    });
  });

  it('habilita el texto libre únicamente al seleccionar Otro', async () => {
    const user = userEvent.setup();

    render(
      <DiscardCarriedForwardPatientModal
        isOpen
        patientName="Paciente de prueba"
        isSubmitting={false}
        errorMessage={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const otherOption = screen.getByRole('radio', { name: 'Otro' });
    const otherReasonText = screen.getByRole('textbox', { name: 'Otro' });

    expect(otherReasonText).toBeDisabled();

    await user.click(otherOption);

    expect(otherReasonText).toBeEnabled();
  });
});
