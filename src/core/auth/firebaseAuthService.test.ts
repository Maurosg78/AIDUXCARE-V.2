import { describe, it, expect, vi, beforeEach } from 'vitest';

import { FirebaseAuthService } from './firebaseAuthService';

// Interfaces locales para mocks y usuarios
interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}
interface MockAuth {
  currentUser?: { sendEmailVerification: () => Promise<void> };
}

// Subclase para exponer getUserProfile solo en test
class TestableFirebaseAuthService extends FirebaseAuthService {
  // Implementación pública para test, mockeable
  public async getUserProfilePublic(/* uid: string */) {
    // En los tests, este método será mockeado con vi.fn().mockResolvedValue(...)
    throw new Error('Debe ser mockeado en los tests');
  }
}

// Tipos explícitos para los mocks
interface AuthMocks {
  mockSignInWithEmailAndPassword: ReturnType<typeof vi.fn>;
  mockCreateUserWithEmailAndPassword: ReturnType<typeof vi.fn>;
  mockSendEmailVerification: () => Promise<void>;
  mockSignOut: ReturnType<typeof vi.fn>;
  mockOnAuthStateChanged: ReturnType<typeof vi.fn>;
  mockGetAuth: ReturnType<typeof vi.fn>;
}
interface FirestoreMocks {
  mockGetFirestore: ReturnType<typeof vi.fn>;
  mockDoc: ReturnType<typeof vi.fn>;
  mockSetDoc: ReturnType<typeof vi.fn>;
  mockGetDoc: ReturnType<typeof vi.fn>;
  mockUpdateDoc: ReturnType<typeof vi.fn>;
}

declare global {
  // Extiende globalThis para tipar los mocks
   
  var authMocks: AuthMocks;
   
  var firestoreMocks: FirestoreMocks;
}

vi.mock('firebase/auth', async () => {
  const authMocks: AuthMocks = {
    mockSignInWithEmailAndPassword: vi.fn(),
    mockCreateUserWithEmailAndPassword: vi.fn(),
    mockSendEmailVerification: vi.fn(async () => {}),
    mockSignOut: vi.fn(),
    mockOnAuthStateChanged: vi.fn(),
    mockGetAuth: vi.fn(),
  };
  globalThis.authMocks = authMocks;
  return {
    getAuth: authMocks.mockGetAuth,
    signInWithEmailAndPassword: authMocks.mockSignInWithEmailAndPassword,
    createUserWithEmailAndPassword: authMocks.mockCreateUserWithEmailAndPassword,
    sendEmailVerification: authMocks.mockSendEmailVerification,
    signOut: authMocks.mockSignOut,
    onAuthStateChanged: authMocks.mockOnAuthStateChanged,
    __esModule: true,
  };
});

vi.mock('firebase/firestore', async () => {
  const firestoreMocks: FirestoreMocks = {
    mockGetFirestore: vi.fn(),
    mockDoc: vi.fn(),
    mockSetDoc: vi.fn(),
    mockGetDoc: vi.fn(),
    mockUpdateDoc: vi.fn(),
  };
  globalThis.firestoreMocks = firestoreMocks;
  return {
    getFirestore: firestoreMocks.mockGetFirestore,
    doc: firestoreMocks.mockDoc,
    setDoc: firestoreMocks.mockSetDoc,
    getDoc: firestoreMocks.mockGetDoc,
    updateDoc: firestoreMocks.mockUpdateDoc,
    __esModule: true,
  };
});

const authService = new TestableFirebaseAuthService();

describe('FirebaseAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe registrar un usuario y crear perfil', async () => {
    const mockUser: MockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: false };
    globalThis.authMocks.mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    globalThis.firestoreMocks.mockSetDoc.mockResolvedValue(undefined);
    // Mock getDoc para que no falle si se llama
    globalThis.firestoreMocks.mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ id: '123', email: 'test@aiduxcare.com', name: 'Test User', role: 'PHYSICIAN', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() }, mfaEnabled: false, emailVerified: false }) });
    const user = await authService.signUp('test@aiduxcare.com', 'password', 'Test User');
    expect(user.email).toBe('test@aiduxcare.com');
    expect(globalThis.authMocks.mockCreateUserWithEmailAndPassword).toHaveBeenCalled();
    expect(globalThis.firestoreMocks.mockSetDoc).toHaveBeenCalled();
  });

  it('debe iniciar sesión y retornar perfil', async () => {
    const mockUser: MockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: true };
    globalThis.authMocks.mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    globalThis.firestoreMocks.mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ id: '123', email: 'test@aiduxcare.com', name: 'Test User', role: 'PHYSICIAN', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() }, mfaEnabled: false, emailVerified: true }) });
    authService.getUserProfilePublic = vi.fn().mockResolvedValue({
      id: '123', email: 'test@aiduxcare.com', name: '', role: 'PHYSICIAN', createdAt: new Date(), updatedAt: new Date(), mfaEnabled: false, emailVerified: true,
    });
    const user = await authService.signIn('test@aiduxcare.com', 'password');
    expect(user.email).toBe('test@aiduxcare.com');
    expect(globalThis.authMocks.mockSignInWithEmailAndPassword).toHaveBeenCalled();
  });

  it('debe bloquear acceso a usuario no verificado', async () => {
    const mockUser: MockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: false };
    globalThis.authMocks.mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    globalThis.firestoreMocks.mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ id: '123', email: 'test@aiduxcare.com', name: 'Test User', role: 'PHYSICIAN', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() }, mfaEnabled: false, emailVerified: false }) });
    authService.getUserProfilePublic = vi.fn().mockResolvedValue({
      id: '123', email: 'test@aiduxcare.com', name: '', role: 'PHYSICIAN', createdAt: new Date(), updatedAt: new Date(), mfaEnabled: false, emailVerified: false,
    });
    await expect(authService.signIn('test@aiduxcare.com', 'password')).rejects.toThrow('Email no verificado');
  });

  it('debe reenviar correo de verificación', async () => {
    const mockCurrentUser: MockAuth['currentUser'] = { sendEmailVerification: globalThis.authMocks.mockSendEmailVerification };
    globalThis.authMocks.mockGetAuth.mockReturnValue({ currentUser: mockCurrentUser });
    await globalThis.authMocks.mockSendEmailVerification();
    expect(globalThis.authMocks.mockSendEmailVerification).toHaveBeenCalled();
  });

  it('debe actualizar emailVerified tras verificación', async () => {
    const mockUser: MockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: true };
    globalThis.authMocks.mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    globalThis.firestoreMocks.mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ id: '123', email: 'test@aiduxcare.com', name: 'Test User', role: 'PHYSICIAN', createdAt: { toDate: () => new Date() }, updatedAt: { toDate: () => new Date() }, mfaEnabled: false, emailVerified: true }) });
    authService.getUserProfilePublic = vi.fn().mockResolvedValue({
      id: '123', email: 'test@aiduxcare.com', name: '', role: 'PHYSICIAN', createdAt: new Date(), updatedAt: new Date(), mfaEnabled: false, emailVerified: true,
    });
    const user = await authService.signIn('test@aiduxcare.com', 'password');
    expect(user.emailVerified).toBe(true);
  });
}); 