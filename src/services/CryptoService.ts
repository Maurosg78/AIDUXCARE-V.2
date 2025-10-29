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
  async exportKey(): Promise<JsonWebKey> {
    if (!this.key) throw new Error('CryptoService not initialized');
    return await crypto.subtle.exportKey('jwk', this.key);
  }
  
  async importKey(jwk: JsonWebKey): Promise<void> {
    this.key = await crypto.subtle.importKey('jwk', jwk, { name: this.algorithm }, true, ['encrypt', 'decrypt']);
  }
  
  async encrypt(data: string): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
    if (!this.key) throw new Error('CryptoService not initialized');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: this.algorithm, iv: iv as unknown as BufferSource },
      this.key,
      encoder.encode(data)
    );
    return { iv, ciphertext };
  }

  async decrypt(iv: BufferSource, ciphertext: ArrayBuffer): Promise<string> {
    if (!this.key) throw new Error('CryptoService not initialized');
    const decrypted = await crypto.subtle.decrypt(
      { name: this.algorithm, iv },
      this.key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  }
}
