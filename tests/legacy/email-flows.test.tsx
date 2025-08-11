import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { firebaseAuthService } from '../../services/firebaseAuthService';

// Mock firebaseAuthService
vi.mock('../../services/firebaseAuthService', () => ({
  firebaseAuthService: {
    sendPasswordResetEmail: vi.fn()
  }
}));

const mockFirebaseAuthService = vi.mocked(firebaseAuthService);

describe('Email Flows - Tests de Integración', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ForgotPasswordPage', () => {
    it('debe enviar email de reset con email normalizado', async () => {
      mockFirebaseAuthService.sendPasswordResetEmail.mockResolvedValue({
        success: true,
        message: 'Email de recuperación enviado'
      });

      render(
        <BrowserRouter>
          <ForgotPasswordPage />
        </BrowserRouter>
      );

      const emailInput = screen.getByPlaceholderText('tu@email.com');
      const submitButton = screen.getByText('Enviar enlace de recuperación');

      fireEvent.change(emailInput, { target: { value: '  TEST@EXAMPLE.COM  ' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFirebaseAuthService.sendPasswordResetEmail).toHaveBeenCalledWith('TEST@EXAMPLE.COM');
      });
    });

    it('debe mostrar mensaje neutro independientemente del resultado', async () => {
      mockFirebaseAuthService.sendPasswordResetEmail.mockResolvedValue({
        success: true,
        message: 'Si el email está registrado, recibirás un enlace de recuperación'
      });

      render(
        <BrowserRouter>
          <ForgotPasswordPage />
        </BrowserRouter>
      );

      const emailInput = screen.getByPlaceholderText('tu@email.com');
      const submitButton = screen.getByText('Enviar enlace de recuperación');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Si el email está registrado, recibirás un enlace de recuperación')).toBeInTheDocument();
      });
    });
  });
});
