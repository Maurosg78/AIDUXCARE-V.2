/**
 * Vitest Test Setup
 * 
 * Global setup for all tests
 */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<any>('firebase/firestore');
  return {
    ...actual,
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn((...args) => args),
    where: vi.fn((...args) => args),
    orderBy: vi.fn((...args) => args),
    limit: vi.fn((n) => n),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
  };
});

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

