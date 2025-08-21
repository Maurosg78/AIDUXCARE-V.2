/**
 * Servicio de Cifrado para AiDuxCare V.2
 * Proporciona cifrado AES-GCM usando Web Crypto API para datos médicos
 */

import { Buffer } from 'buffer';

interface EncryptedData {
  iv: string;
  encryptedData: string;
  salt?: string;
}

interface DecryptionResult {
  success: boolean;
  data?: string;
  error?: string;
}

interface CryptoConfig {
  algorithm: string;
  keyLength: number;
  saltLength: number;
}

interface MedicalData {
  [key: string]: string | number | boolean | object | null | undefined;
}

export class CryptoService {
  private static instance: CryptoService;
  private key: CryptoKey | null = null;
  private config: CryptoConfig = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    saltLength: 16
  };

  private constructor() {}

  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly TAG_LENGTH = 128;

  private static async generateKey(): Promise<CryptoKey> {
    const key = await window.crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
    return key;
  }

  private static async importKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
      'raw',
      rawKey,
      this.ALGORITHM,
      true,
      ['encrypt', 'decrypt']
    );
  }

  private static async exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return window.crypto.subtle.exportKey('raw', key);
  }

  private static generateIV(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH) as Uint8Array);
  }

  private static async encryptData(data: string, key: CryptoKey): Promise<EncryptedData> {
    try {
      const iv = this.generateIV();
      const encodedData = new TextEncoder().encode(data);

      const encryptedContent = await window.crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv as BufferSource,
          tagLength: this.TAG_LENGTH
        },
        key,
        encodedData
      );

      return {
        iv: Buffer.from(iv).toString('base64'),
        encryptedData: Buffer.from(encryptedContent).toString('base64')
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error de encriptación');
    }
  }

  private static async decryptData(encryptedData: EncryptedData, key: CryptoKey): Promise<DecryptionResult> {
    try {
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const content = Buffer.from(encryptedData.encryptedData, 'base64');

      const decryptedContent = await window.crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv as BufferSource,
          tagLength: this.TAG_LENGTH
        },
        key,
        content
      );

      return {
        success: true,
        data: new TextDecoder().decode(decryptedContent)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de desencriptación'
      };
    }
  }

  public async encrypt(data: string): Promise<EncryptedData> {
    if (!this.key) {
      await this.generateKey();
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: this.config.algorithm,
        iv
      },
      this.key!,
      encodedData
    );

    return {
      iv: Buffer.from(iv).toString('base64'),
      encryptedData: Buffer.from(encryptedBuffer).toString('base64')
    };
  }

  public async decrypt(encryptedData: EncryptedData): Promise<DecryptionResult> {
    try {
      if (!this.key) {
        await this.generateKey();
      }

      const iv = Buffer.from(encryptedData.iv, 'base64');
      const data = Buffer.from(encryptedData.encryptedData, 'base64');

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.config.algorithm,
          iv
        },
        this.key!,
        data
      );

      const decryptedText = new TextDecoder().decode(decryptedBuffer);

      return {
        success: true,
        data: decryptedText
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al descifrar'
      };
    }
  }

  private async generateKey(): Promise<void> {
    this.key = await crypto.subtle.generateKey(
      {
        name: this.config.algorithm,
        length: this.config.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Deriva una clave criptográfica de una contraseña usando PBKDF2
   */
  private static async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    // Importar la contraseña como material de clave
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derivar la clave usando PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000, // 100k iteraciones para seguridad
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Convierte ArrayBuffer a string base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convierte string base64 a ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Genera una clave de cifrado aleatoria para uso interno
   */
  static generateRandomKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array.buffer);
  }

  /**
   * Verifica si Web Crypto API está disponible
   */
  static isSupported(): boolean {
    return !!(crypto && crypto.subtle);
  }

  /**
   * Cifra datos médicos con una clave predeterminada segura
   */
  static async encryptMedicalData(data: MedicalData): Promise<EncryptedData> {
    const instance = CryptoService.getInstance();
    const jsonData = JSON.stringify(data);
    return await instance.encrypt(jsonData);
  }

  /**
   * Descifra datos médicos con la clave predeterminada
   */
  static async decryptMedicalData(encryptedData: EncryptedData): Promise<MedicalData> {
    const instance = CryptoService.getInstance();
    const result = await instance.decrypt(encryptedData);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Error al descifrar datos médicos');
    }
    return JSON.parse(result.data);
  }
}

export default CryptoService; 