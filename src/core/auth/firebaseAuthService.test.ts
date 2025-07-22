import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { FirebaseAuthService } from './firebaseAuthService';

// Subclase para exponer getUserProfile solo en test
class TestableFirebaseAuthService extends FirebaseAuthService {
  public getUserProfilePublic(...args: Parameters<FirebaseAuthService['getUserProfile']>) {
    // @ts-expect-error: Acceso solo para test
    return this.getUserProfile(...args);
  }
}

// Declarar los mocks como variables globales de tipo Mock
let mockSignInWithEmailAndPassword: Mock;
let mockCreateUserWithEmailAndPassword: Mock;
let mockSendEmailVerification: Mock;
let mockSignOut: Mock;
let mockOnAuthStateChanged: Mock;
let mockGetAuth: Mock;
let mockGetFirestore: Mock;
let mockDoc: Mock;
let mockSetDoc: Mock;
let mockGetDoc: Mock;
let mockUpdateDoc: Mock;

vi.mock('firebase/auth', async () => {
  mockSignInWithEmailAndPassword = vi.fn();
  mockCreateUserWithEmailAndPassword = vi.fn();
  mockSendEmailVerification = vi.fn();
  mockSignOut = vi.fn();
  mockOnAuthStateChanged = vi.fn();
  mockGetAuth = vi.fn();
  return {
    getAuth: mockGetAuth,
    signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
    sendEmailVerification: mockSendEmailVerification,
    signOut: mockSignOut,
    onAuthStateChanged: mockOnAuthStateChanged,
    __esModule: true,
  };
});

vi.mock('firebase/firestore', async () => {
  mockGetFirestore = vi.fn();
  mockDoc = vi.fn();
  mockSetDoc = vi.fn();
  mockGetDoc = vi.fn();
  mockUpdateDoc = vi.fn();
  return {
    getFirestore: mockGetFirestore,
    doc: mockDoc,
    setDoc: mockSetDoc,
    getDoc: mockGetDoc,
    updateDoc: mockUpdateDoc,
    __esModule: true,
  };
});

const authService = new TestableFirebaseAuthService();

describe('FirebaseAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe registrar un usuario y crear perfil', async () => {
    const mockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: false };
    mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    mockSetDoc.mockResolvedValue(undefined);
    const user = await authService.signUp('test@aiduxcare.com', 'password', 'Test User');
    expect(user.email).toBe('test@aiduxcare.com');
    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalled();
  });

  it('debe iniciar sesión y retornar perfil', async () => {
    const mockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: true };
    mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    authService.getUserProfilePublic = vi.fn().mockResolvedValue({
      id: '123', email: 'test@aiduxcare.com', name: '', role: 'PHYSICIAN', createdAt: new Date(), updatedAt: new Date(), mfaEnabled: false, emailVerified: true,
    });
    const user = await authService.signIn('test@aiduxcare.com', 'password');
    expect(user.email).toBe('test@aiduxcare.com');
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalled();
  });

  it('debe bloquear acceso a usuario no verificado', async () => {
    const mockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: false };
    mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    authService.getUserProfilePublic = vi.fn().mockResolvedValue({
      id: '123', email: 'test@aiduxcare.com', name: '', role: 'PHYSICIAN', createdAt: new Date(), updatedAt: new Date(), mfaEnabled: false, emailVerified: false,
    });
    await expect(authService.signIn('test@aiduxcare.com', 'password')).rejects.toThrow('Email no verificado');
  });

  it('debe reenviar correo de verificación', async () => {
    const mockCurrentUser = { sendEmailVerification: mockSendEmailVerification };
    mockGetAuth.mockReturnValue({ currentUser: mockCurrentUser });
    await mockSendEmailVerification();
    expect(mockSendEmailVerification).toHaveBeenCalled();
  });

  it('debe actualizar emailVerified tras verificación', async () => {
    const mockUser = { uid: '123', email: 'test@aiduxcare.com', displayName: 'Test User', emailVerified: true };
    mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    authService.getUserProfilePublic = vi.fn().mockResolvedValue({
      id: '123', email: 'test@aiduxcare.com', name: '', role: 'PHYSICIAN', createdAt: new Date(), updatedAt: new Date(), mfaEnabled: false, emailVerified: true,
    });
    const user = await authService.signIn('test@aiduxcare.com', 'password');
    expect(user.emailVerified).toBe(true);
  });
}); 