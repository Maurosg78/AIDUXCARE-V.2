import { describe, it, expect } from 'vitest';
import { CryptoService } from '../../src/services/CryptoService';

describe('CryptoService', () => {
  it('encrypts and decrypts medical data', async () => {
    const crypto = new CryptoService();
    await crypto.init();
    const text = 'Test medical record';
    const { iv, ciphertext } = await crypto.encrypt(text);
    const result = await crypto.decrypt(iv, ciphertext);
    expect(result).toBe(text);
  });
});
