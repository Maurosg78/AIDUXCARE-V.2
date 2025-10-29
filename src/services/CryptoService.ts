export class CryptoService {
  private key: CryptoKey | null = null

  async init() {
    // Clave AES de 256 bits
    const keyBytes = new TextEncoder().encode('12345678901234567890123456789012')
    this.key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

  async encrypt(plainText: string): Promise<{ iv: string; ciphertext: string }> {
    if (!this.key) throw new Error('CryptoService not initialized')

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(plainText)
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      encoded
    )

    return {
      iv: Buffer.from(iv).toString('base64'),
      ciphertext: Buffer.from(encrypted).toString('base64'),
    }
  }

  // ✅ Acepta ambos formatos: decrypt({ iv, ciphertext }) o decrypt(iv, ciphertext)
  async decrypt(
    arg1: { iv: string; ciphertext: string } | string,
    arg2?: string
  ): Promise<string> {
    if (!this.key) throw new Error('CryptoService not initialized')

    let iv: string
    let ciphertext: string

    if (typeof arg1 === 'object') {
      iv = arg1.iv
      ciphertext = arg1.ciphertext
    } else {
      iv = arg1
      ciphertext = arg2 as string
    }

    if (!iv || !ciphertext) throw new Error('Invalid encrypted data format')

    const ivBytes = Buffer.from(iv, 'base64')
    const dataBytes = Buffer.from(ciphertext, 'base64')
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      this.key,
      dataBytes
    )

    return new TextDecoder().decode(decrypted)
  }
}

export default CryptoService

