/**
 * CryptoService - Web Crypto API Implementation
 * 
 * Uses browser-native Web Crypto API for secure encryption/decryption
 * Compatible with HIPAA/GDPR requirements
 * 
 * ⚠️ IMPORTANT: This service uses Web Crypto API which is only available in:
 * - Modern browsers (Chrome 37+, Firefox 34+, Safari 11+, Edge 79+)
 * - HTTPS contexts (or localhost for development)
 */

// Encryption key derivation - using PBKDF2 for key derivation
const ENCRYPTION_KEY_MATERIAL = 'aiduxcare-secret-key-material';
const KEY_DERIVATION_ITERATIONS = 100000; // PBKDF2 iterations for security

/**
 * Derives a cryptographic key from the secret material
 */
async function deriveKey(): Promise<CryptoKey> {
  // Convert secret to ArrayBuffer
  const keyMaterial = new TextEncoder().encode(ENCRYPTION_KEY_MATERIAL);
  
  // Import key material
  const importedKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive AES key using PBKDF2
  const salt = new TextEncoder().encode('aiduxcare-salt'); // Fixed salt for consistency
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: KEY_DERIVATION_ITERATIONS,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return derivedKey;
}

/**
 * Converts ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts base64 string to ArrayBuffer
 * 
 * Uses Buffer in Node.js for compatibility with webcrypto API in test environment.
 * In browser, uses standard atob() which is available via polyfill in test/setup.ts.
 * This ensures the returned ArrayBuffer is compatible with both Node.js webcrypto
 * and browser Web Crypto API.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Use Buffer in Node.js for better compatibility with webcrypto
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  // Fallback for browser
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

class CryptoService {
  private keyCache: CryptoKey | null = null;
  private ready: boolean = false; // Bloque 6: Propiedad ready declarada

  constructor() {
    this.ready = false;
  }

  async init() {
    if (!this.keyCache) {
      this.keyCache = await deriveKey();
    }
    this.ready = true;
  }

  /**
   * Encrypts data using AES-GCM
   */
  async encrypt(data: string): Promise<{ iv: string; ciphertext: string }> {
    if (!data) return { iv: "", ciphertext: "" };

    try {
      // Ensure key is initialized
      if (!this.keyCache) {
        await this.init();
      }

      // Generate random IV (12 bytes for GCM)
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Convert data to ArrayBuffer
      const dataBuffer = new TextEncoder().encode(data);
      
      // Encrypt using AES-GCM
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.keyCache!,
        dataBuffer
      );
      
      // Bloque 2: Convertir Uint8Array (iv) a ArrayBuffer usando .buffer; encrypted ya es ArrayBuffer
      return {
        iv: arrayBufferToBase64(iv.buffer),
        ciphertext: arrayBufferToBase64(encrypted)
      };
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts data using AES-GCM
   */
  async decrypt(ivBase64: string, ciphertextBase64: string): Promise<string | null> {
    if (!ivBase64 || !ciphertextBase64) return null;

    try {
      // Ensure key is initialized
      if (!this.keyCache) {
        await this.init();
      }

      // Convert base64 to ArrayBuffer
      const iv = base64ToArrayBuffer(ivBase64);
      const encrypted = base64ToArrayBuffer(ciphertextBase64);
      
      // Decrypt using AES-GCM
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv)
        },
        this.keyCache!,
        encrypted
      );
      
      // Convert ArrayBuffer back to string
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      return null;
    }
  }

  // Static helpers for enterprise tests
  static async encrypt(data: string): Promise<{ iv: string; ciphertext: string }> {
    const instance = new CryptoService();
    await instance.init();
    return instance.encrypt(data);
  }

  static async decrypt(iv: string, ciphertext: string): Promise<string | null> {
    const instance = new CryptoService();
    await instance.init();
    return instance.decrypt(iv, ciphertext);
  }

  /**
   * Encrypts medical data (objects) by converting to JSON first
   */
  static async encryptMedicalData(data: any): Promise<{ iv: string; encryptedData: string }> {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = await CryptoService.encrypt(jsonString);
      return {
        iv: encrypted.iv,
        encryptedData: encrypted.ciphertext
      };
    } catch (error) {
      console.error('Error encrypting medical data:', error);
      throw new Error('Failed to encrypt medical data');
    }
  }

  /**
   * Decrypts medical data and parses JSON back to object
   */
  static async decryptMedicalData(encryptedData: { iv: string; encryptedData: string }): Promise<any> {
    try {
      const decrypted = await CryptoService.decrypt(encryptedData.iv, encryptedData.encryptedData);
      if (!decrypted) {
        throw new Error('Failed to decrypt medical data');
      }
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting medical data:', error);
      throw new Error('Failed to decrypt medical data');
    }
  }
}

export { CryptoService };
export default CryptoService;
