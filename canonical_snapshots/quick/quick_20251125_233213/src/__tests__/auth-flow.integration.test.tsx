/* @ts-nocheck */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

import WelcomePage from '../pages/WelcomePage';
import LoginPage from '../pages/LoginPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';

import { renderWithRouter } from './test-utils';

// Mocks globales para firebase/auth y firestore
let mockEmailVerified = false;

vi.mock('firebase/auth', () => {
  const mockSendEmailVerification = vi.fn();
  const mockReload = vi.fn();
  return {
    getAuth: () => ({
      currentUser: {
        email: 'test@aiduxcare.com',
        get emailVerified() { return mockEmailVerified; },
        reload: mockReload,
        sendEmailVerification: mockSendEmailVerification,
      },
    }),
    signInWithEmailAndPassword: vi.fn(async (_auth, email) => {
      if (email === 'test@aiduxcare.com') {
        return {
          user: {
            email,
            get emailVerified() { return mockEmailVerified; },
            reload: mockReload,
            sendEmailVerification: mockSendEmailVerification,
          },
        };
      }
      throw new Error('Credenciales inválidas');
    }),
    createUserWithEmailAndPassword: vi.fn(async (_auth, email) => {
      mockEmailVerified = false;
      return {
        user: {
          email,
          get emailVerified() { return mockEmailVerified; },
          reload: mockReload,
          sendEmailVerification: mockSendEmailVerification,
        },
      };
    }),
    sendEmailVerification: mockSendEmailVerification,
  };
});
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(async () => ({ id: 'mocked-id' })), // Mock necesario para FirestoreAuditLogger
  collection: vi.fn(), // Mock necesario para FirestoreAuditLogger
  Timestamp: { now: () => 1234567890 }, // Mock para FirestoreAuditLogger
}));

// Test principal

describe('Flujo de autenticación y verificación (UI/UX)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailVerified = false;
  });

  it('registro exitoso muestra mensaje de verificación', async () => {
    renderWithRouter(<WelcomePage />);
    // Usar getAllByPlaceholderText para seleccionar el input de registro (panel derecho)
    const emailInputs = screen.getAllByPlaceholderText(/correo electrónico/i);
    const passwordInputs = screen.getAllByPlaceholderText(/contraseña/i);
    const nameInput = screen.getByPlaceholderText(/nombre/i);
    // Panel derecho: registro (asumimos el segundo input de email y password)
    fireEvent.change(emailInputs[1], { target: { value: 'test@aiduxcare.com' } });
    fireEvent.change(passwordInputs[1], { target: { value: '123456' } });
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    const registerButton = screen.getByRole('button', { name: /registrarse/i });
    fireEvent.click(registerButton);
    await waitFor(() => {
      // Usar matcher flexible
      const verificationMsg = screen.queryByText((content) =>
        /correo de verificación/i.test(content)
      );
      expect(verificationMsg).not.toBeNull();
    });
  });

  it('usuario no verificado es bloqueado en login', async () => {
    // Mock getDoc para simular usuario no verificado
    const { getDoc } = await import('firebase/firestore');
    vi.mocked(getDoc).mockImplementation(async () => ({
      id: 'mocked-user-id',
      exists: () => true,
      data: () => ({
        id: 'mocked-user-id',
        email: 'test@aiduxcare.com',
        emailVerified: false,
        name: 'Test User',
        role: 'PHYSICIAN',
        mfaEnabled: false,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      }),
      get: () => undefined,
      toJSON: () => ({}),
      ref: {},
      metadata: {},
    } as any));
    renderWithRouter(<LoginPage />);
    const emailInput = screen.getByPlaceholderText(/correo electrónico/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    fireEvent.change(emailInput, { target: { value: 'test@aiduxcare.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    await waitFor(() => {
      const errorMsg = screen.queryByText((content) =>
        /email no verificado/i.test(content)
      );
      expect(errorMsg).not.toBeNull();
    });
  });

  it('reenviar verificación en VerifyEmailPage muestra feedback', async () => {
    renderWithRouter(<VerifyEmailPage />);
    fireEvent.click(screen.getByRole('button', { name: /reenviar/i }));
    await waitFor(() => {
      const feedbackMsg = screen.queryByText((content) =>
        /correo de verificación reenviado/i.test(content)
      );
      expect(feedbackMsg).not.toBeNull();
    });
  });

  it('usuario verificado puede acceder tras login', async () => {
    // Simular verificación
    mockEmailVerified = true;
    renderWithRouter(<LoginPage />);
    const emailInput = screen.getByPlaceholderText(/correo electrónico/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    fireEvent.change(emailInput, { target: { value: 'test@aiduxcare.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    await waitFor(() => {
      const errorMsg = screen.queryByText((content) =>
        /email no verificado/i.test(content)
      );
      expect(errorMsg).toBeNull();
    });
  });
}); 