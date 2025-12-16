/**
 * Hospital Portal Encryption Service
 * 
 * AES-256-GCM encryption for hospital portal note content
 * Uses Web Crypto API for secure encryption/decryption
 * PHIPA/PIPEDA compliant
 */

/**
 * Encrypt note content using AES-256-GCM
 */
export async function encryptNoteContent(content: string): Promise<{ encrypted: string; iv: string }> {
  try {
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Import encryption key (using environment variable or default)
    const keyMaterial = import.meta.env.VITE_ENCRYPTION_KEY || 'aiduxcare-hospital-portal-key-material';
    const keyData = new TextEncoder().encode(keyMaterial);
    
    // Derive key using PBKDF2
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const salt = new TextEncoder().encode('aiduxcare-hospital-salt');
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Encrypt content
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      new TextEncoder().encode(content)
    );
    
    // Convert to base64 for storage
    const encryptedBase64 = arrayBufferToBase64(encrypted);
    const ivBase64 = arrayBufferToBase64(iv);
    
    return {
      encrypted: encryptedBase64,
      iv: ivBase64
    };
  } catch (error) {
    console.error('[HospitalPortalEncryption] Encryption error:', error);
    throw new Error('Failed to encrypt note content');
  }
}

/**
 * Decrypt note content using AES-256-GCM
 */
export async function decryptNoteContent(encrypted: string, iv: string): Promise<string> {
  try {
    // Decode base64
    const encryptedBuffer = base64ToArrayBuffer(encrypted);
    const ivBuffer = base64ToArrayBuffer(iv);
    
    // Import encryption key
    const keyMaterial = import.meta.env.VITE_ENCRYPTION_KEY || 'aiduxcare-hospital-portal-key-material';
    const keyData = new TextEncoder().encode(keyMaterial);
    
    // Derive key using PBKDF2
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const salt = new TextEncoder().encode('aiduxcare-hospital-salt');
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Decrypt content
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      derivedKey,
      encryptedBuffer
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('[HospitalPortalEncryption] Decryption error:', error);
    throw new Error('Failed to decrypt note content');
  }
}

/**
 * Convert ArrayBuffer to base64
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
 * Convert base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}


