/**
 * CryptoService — Phase 1A
 * PIPEDA-compliant AES-GCM encryption for medical data
 * Market: CA
 * Language: en-CA
 */
export class CryptoService {
  private algorithm = 'AES-GCM';
  private key: CryptoKey | null = null;

  async init(): Promise<void> {
    this.key = await crypto.subtle.generateKey(
      { name: this.algorithm, length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: string): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
    if (!this.key) throw new Error('CryptoService not initialized');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: this.algorithm, iv },
      this.key,
      encoder.encode(data)
    );
    return { iv, ciphertext };
  }

  async decrypt(iv: Uint8Array, ciphertext: ArrayBuffer): Promise<string> {
    if (!this.key) throw new Error('CryptoService not initialized');
    const decrypted = await crypto.subtle.decrypt({ name: this.algorithm, iv: iv as BufferSource }, this.key, ciphertext);
    return new TextDecoder().decode(decrypted);
  }

  // Static methods for medical data encryption (used by PersistenceService)
  static async encryptMedicalData(data: any): Promise<string> {
    const service = new CryptoService();
    await service.init();
    const encrypted = await service.encrypt(JSON.stringify(data));
    // Combine iv and ciphertext into a single string for storage
    const combined = new Uint8Array(encrypted.iv.length + encrypted.ciphertext.byteLength);
    combined.set(encrypted.iv, 0);
    combined.set(new Uint8Array(encrypted.ciphertext), encrypted.iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  static async decryptMedicalData(encryptedData: string): Promise<any> {
    const service = new CryptoService();
    await service.init();
    // Decode the combined data
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12).buffer;
    const decrypted = await service.decrypt(iv, ciphertext);
    return JSON.parse(decrypted);
  }
}
