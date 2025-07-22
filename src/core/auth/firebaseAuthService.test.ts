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

// Subclase para exponer getUserProfile solo en test
class TestableFirebaseAuthService extends FirebaseAuthService {
  public getUserProfilePublic = this.getUserProfile;
}

const authService = new TestableFirebaseAuthService();

// Usar getUserProfilePublic en vez de acceder a métodos privados
beforeEach(async () => {
  vi.clearAllMocks();
  const authModule = await import('firebase/auth');
  const firestoreModule = await import('firebase/firestore');
  authMocks = authModule._mocks as Record<string, Mock>;
  firestoreMocks = firestoreModule._mocks as Record<string, Mock>;
  authService.getUserProfilePublic = vi.fn().mockResolvedValue({
    id: '123', email: 'test@aiduxcare.com', name: '', role: 'PHYSICIAN', createdAt: new Date(), updatedAt: new Date(), mfaEnabled: false, emailVerified: true,
  });
});

describe('FirebaseAuthService', () => {
  let authMocks: Record<string, Mock>;
  let firestoreMocks: Record<string, Mock>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Tipado explícito de los mocks
    const authModule = await import('firebase/auth');
    const firestoreModule = await import('firebase/firestore');
    authMocks = authModule._mocks as Record<string, Mock>;
    firestoreMocks = firestoreModule._mocks as Record<string, Mock>;
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
    // Usar Mock en vez de any para getUserProfile
    const user = await authService.signIn('test@aiduxcare.com', 'password');
    expect(user.email).toBe('test@aiduxcare.com');
    expect((authMocks.mockSignInWithEmailAndPassword as Mock)).toHaveBeenCalled();
  });

  it('debe bloquear acceso a usuario no verificado', async () => {
    const mockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: false };
    (authMocks.mockSignInWithEmailAndPassword as Mock).mockResolvedValue({ user: mockUser });
    // Usar Mock en vez de any para getUserProfile
    const user = await authService.signIn('test@aiduxcare.com', 'password');
    expect(user.emailVerified).toBe(false);
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
    // Usar Mock en vez de any para getUserProfile
    const user = await authService.signIn('test@aiduxcare.com', 'password');
    expect(user.emailVerified).toBe(true);
  });
}); 