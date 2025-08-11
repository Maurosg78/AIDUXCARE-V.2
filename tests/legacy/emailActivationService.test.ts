import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailActivationService } from './emailActivationService';
import type { QuerySnapshot, DocumentReference } from 'firebase/firestore';

// Mock de Firebase
vi.mock('../lib/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock de Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn()
}));

// Mock de Firebase Auth
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  fetchSignInMethodsForEmail: vi.fn()
}));

describe('EmailActivationService - Recuperación de Contraseña', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe rechazar recuperación para email no registrado', async () => {
    // Mock: email no existe
    const { getDocs, query, where } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValue({
      empty: true,
      docs: []
    } as unknown as QuerySnapshot);

    const result = await emailActivationService.sendPasswordRecovery('noexiste@test.com');

    expect(result.success).toBe(false);
    expect(result.message).toContain('No se encontró una cuenta');
  });

  it('debe rechazar recuperación para email no verificado', async () => {
    // Mock: email existe pero no verificado
    const { getDocs, query, where } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValue({
      empty: false,
      docs: [{
        data: () => ({
          email: 'noverificado@test.com',
          displayName: 'Test User',
          emailVerified: false,
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }]
    } as unknown as QuerySnapshot);

    const result = await emailActivationService.sendPasswordRecovery('noverificado@test.com');

    expect(result.success).toBe(false);
    expect(result.message).toContain('no está verificada');
  });

  it('debe rechazar recuperación para cuenta inactiva', async () => {
    // Mock: email verificado pero cuenta inactiva
    const { getDocs, query, where } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValue({
      empty: false,
      docs: [{
        data: () => ({
          email: 'inactivo@test.com',
          displayName: 'Test User',
          emailVerified: true,
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }]
    } as unknown as QuerySnapshot);

    const result = await emailActivationService.sendPasswordRecovery('inactivo@test.com');

    expect(result.success).toBe(false);
    expect(result.message).toContain('no está activa');
  });

  it('debe permitir recuperación para usuario verificado y activo', async () => {
    // Mock: usuario verificado y activo
    const { getDocs, query, where, updateDoc } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValue({
      empty: false,
      docs: [{
        id: 'test-user-id',
        data: () => ({
          email: 'valido@test.com',
          displayName: 'Test User',
          emailVerified: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }]
    } as unknown as QuerySnapshot);

    vi.mocked(updateDoc).mockResolvedValue(undefined);

    const result = await emailActivationService.sendPasswordRecovery('valido@test.com');

    expect(result.success).toBe(true);
    expect(result.message).toContain('enviado un enlace de recuperación');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('debe generar token de recuperación único', async () => {
    // Mock: usuario válido
    const { getDocs, query, where, updateDoc, doc } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValue({
      empty: false,
      docs: [{
        id: 'test-user-id',
        data: () => ({
          email: 'valido@test.com',
          displayName: 'Test User',
          emailVerified: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }]
    } as unknown as QuerySnapshot);

    // Mock del documento
    vi.mocked(doc).mockReturnValue('test-doc-ref' as unknown as DocumentReference);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    const result = await emailActivationService.sendPasswordRecovery('valido@test.com');

    expect(result.success).toBe(true);
    // Verificar que se llamó updateDoc con recoveryToken
    expect(updateDoc).toHaveBeenCalledWith(
      'test-doc-ref',
      expect.objectContaining({
        recoveryToken: expect.stringMatching(/^rec_\d+_[a-z0-9]+$/),
        recoveryTokenExpiry: expect.any(String)
      })
    );
  });
});
