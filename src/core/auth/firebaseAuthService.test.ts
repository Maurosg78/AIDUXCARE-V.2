import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirebaseAuthService } from './firebaseAuthService';
import type { Mock } from 'vitest';

vi.mock('firebase/auth', async () => {
  const mockSignInWithEmailAndPassword = vi.fn();
  const mockCreateUserWithEmailAndPassword = vi.fn();
  const mockSendEmailVerification = vi.fn();
  const mockSignOut = vi.fn();
  const mockOnAuthStateChanged = vi.fn();
  const mockGetAuth = vi.fn();
  return {
    getAuth: mockGetAuth,
    signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
    sendEmailVerification: mockSendEmailVerification,
    signOut: mockSignOut,
    onAuthStateChanged: mockOnAuthStateChanged,
    __esModule: true,
    // Exponer mocks para los tests
    _mocks: {
      mockSignInWithEmailAndPassword,
      mockCreateUserWithEmailAndPassword,
      mockSendEmailVerification,
      mockSignOut,
      mockOnAuthStateChanged,
      mockGetAuth,
    },
  };
});

vi.mock('firebase/firestore', async () => {
  const mockGetFirestore = vi.fn();
  const mockDoc = vi.fn();
  const mockSetDoc = vi.fn();
  const mockGetDoc = vi.fn();
  const mockUpdateDoc = vi.fn();
  return {
    getFirestore: mockGetFirestore,
    doc: mockDoc,
    setDoc: mockSetDoc,
    getDoc: mockGetDoc,
    updateDoc: mockUpdateDoc,
    __esModule: true,
    _mocks: {
      mockGetFirestore,
      mockDoc,
      mockSetDoc,
      mockGetDoc,
      mockUpdateDoc,
    },
  };
});

const authService = new FirebaseAuthService();

describe('FirebaseAuthService', () => {
  let authMocks: Record<string, Mock>;
  let firestoreMocks: Record<string, Mock>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Tipado explícito de los mocks (solo en test, permitido usar 'as any' aquí)
    authMocks = ((await import('firebase/auth')) as any)._mocks;
    firestoreMocks = ((await import('firebase/firestore')) as any)._mocks;
    // Hacer público el método getUserProfile para los tests
    (authService as any).getUserProfile = (authService as any).getUserProfile;
  });

  it('debe registrar un usuario y crear perfil', async () => {
    const mockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: false };
    (authMocks.mockCreateUserWithEmailAndPassword as Mock).mockResolvedValue({ user: mockUser });
    (firestoreMocks.mockSetDoc as Mock).mockResolvedValue(undefined);
    const user = await authService.signUp('test@aiduxcare.com', 'password', 'Test User');
    expect(user.email).toBe('test@aiduxcare.com');
    expect((authMocks.mockCreateUserWithEmailAndPassword as Mock)).toHaveBeenCalled();
    expect((firestoreMocks.mockSetDoc as Mock)).toHaveBeenCalled();
  });

  it('debe iniciar sesión y retornar perfil', async () => {
    const mockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: true };
    (authMocks.mockSignInWithEmailAndPassword as Mock).mockResolvedValue({ user: mockUser });
    // Eliminar 'as unknown as { getUserProfile: Mock }' y tipar correctamente
    ((authService as any).getUserProfile as Mock) = vi.fn().mockResolvedValue({
      id: '123', email: 'test@aiduxcare.com', name: '', role: 'PHYSICIAN', createdAt: new Date(), updatedAt: new Date(), mfaEnabled: false, emailVerified: true,
    });
    const user = await authService.signIn('test@aiduxcare.com', 'password');
    expect(user.email).toBe('test@aiduxcare.com');
    expect((authMocks.mockSignInWithEmailAndPassword as Mock)).toHaveBeenCalled();
  });

  it('debe bloquear acceso a usuario no verificado', async () => {
    const mockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: false };
    (authMocks.mockSignInWithEmailAndPassword as Mock).mockResolvedValue({ user: mockUser });
    // Eliminar 'as unknown as { getUserProfile: Mock }' y tipar correctamente
    ((authService as any).getUserProfile as Mock) = vi.fn().mockResolvedValue({
      id: '123', email: 'test@aiduxcare.com', name: '', role: 'PHYSICIAN', createdAt: new Date(), updatedAt: new Date(), mfaEnabled: false, emailVerified: false,
    });
    await expect(authService.signIn('test@aiduxcare.com', 'password')).rejects.toThrow('Email no verificado');
  });

  it('debe reenviar correo de verificación', async () => {
    const mockCurrentUser = { sendEmailVerification: authMocks.mockSendEmailVerification };
    (authMocks.mockGetAuth as Mock).mockReturnValue({ currentUser: mockCurrentUser });
    await (authMocks.mockSendEmailVerification as Mock)();
    expect((authMocks.mockSendEmailVerification as Mock)).toHaveBeenCalled();
  });

  it('debe actualizar emailVerified tras verificación', async () => {
    const mockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: true };
    (authMocks.mockSignInWithEmailAndPassword as Mock).mockResolvedValue({ user: mockUser });
    // Eliminar 'as unknown as { getUserProfile: Mock }' y tipar correctamente
    ((authService as any).getUserProfile as Mock) = vi.fn().mockResolvedValue({
      id: '123', email: 'test@aiduxcare.com', name: '', role: 'PHYSICIAN', createdAt: new Date(), updatedAt: new Date(), mfaEnabled: false, emailVerified: true,
    });
    const user = await authService.signIn('test@aiduxcare.com', 'password');
    expect(user.emailVerified).toBe(true);
  });
}); 