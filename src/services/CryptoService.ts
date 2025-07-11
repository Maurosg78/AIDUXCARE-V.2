/**
 * Servicio de Cifrado para AiDuxCare V.2
 * Proporciona cifrado AES-GCM usando Web Crypto API para datos médicos
 */

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
  timestamp: string;
}

export class CryptoService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly SALT_LENGTH = 16;

  /**
   * Cifra datos usando AES-GCM con una clave derivada de la contraseña
   */
  static async encrypt(plainText: string, passphrase: string): Promise<EncryptedData> {
    try {
      // Generar salt e IV aleatorios
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Derivar clave de la contraseña
      const key = await this.deriveKey(passphrase, salt);

      // Cifrar los datos
      const encodedText = new TextEncoder().encode(plainText);
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encodedText
      );

      // Convertir a base64 para almacenamiento
      const encryptedData = this.arrayBufferToBase64(encryptedBuffer);
      const ivBase64 = this.arrayBufferToBase64(iv.buffer);
      const saltBase64 = this.arrayBufferToBase64(salt.buffer);

      return {
        encryptedData,
        iv: ivBase64,
        salt: saltBase64,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error en cifrado:', error);
      throw new Error('Error al cifrar los datos');
    }
  }

  /**
   * Descifra datos usando AES-GCM
   */
  static async decrypt(encryptedData: EncryptedData, passphrase: string): Promise<string> {
    try {
      // Convertir de base64 a ArrayBuffer
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.encryptedData);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const salt = this.base64ToArrayBuffer(encryptedData.salt);

      // Derivar la misma clave usando el salt original
      const key = await this.deriveKey(passphrase, new Uint8Array(salt));

      // Descifrar los datos
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encryptedBuffer
      );

      // Convertir de ArrayBuffer a string
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('Error en descifrado:', error);
      throw new Error('Error al descifrar los datos - contraseña incorrecta o datos corruptos');
    }
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
        salt: salt,
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
  static async encryptMedicalData(data: unknown): Promise<EncryptedData> {
    const jsonData = JSON.stringify(data);
    const medicalKey = 'AIDUXCARE_MEDICAL_ENCRYPTION_KEY_2025';
    return this.encrypt(jsonData, medicalKey);
  }

  /**
   * Descifra datos médicos con la clave predeterminada
   */
  static async decryptMedicalData(encryptedData: EncryptedData): Promise<unknown> {
    const medicalKey = 'AIDUXCARE_MEDICAL_ENCRYPTION_KEY_2025';
    const decryptedJson = await this.decrypt(encryptedData, medicalKey);
    return JSON.parse(decryptedJson);
  }
}

export default CryptoService; 