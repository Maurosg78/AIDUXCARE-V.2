/**
 * CryptoService - Servicio de cifrado para cumplimiento HIPAA
 * Utiliza Web Crypto API con AES-256-GCM para cifrado de datos médicos PHI
 */

export class CryptoService {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly TAG_LENGTH = 128;

  /**
   * Cifra datos usando AES-256-GCM
   * @param plaintext - Texto plano a cifrar
   * @param passphrase - Frase de paso para derivar la clave
   * @returns Promise<string> - Datos cifrados en formato base64
   */
  static async encrypt(plaintext: string, passphrase: string): Promise<string> {
    try {
      // Derivar clave desde la frase de paso
      const key = await this.deriveKey(passphrase);

      // Generar IV aleatorio
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Cifrar datos
      const encodedText = new TextEncoder().encode(plaintext);
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
          tagLength: this.TAG_LENGTH,
        },
        key,
        encodedText,
      );

      // Combinar IV + datos cifrados
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(encryptedBuffer), iv.length);

      // Convertir a base64
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error("Error en cifrado:", error);
      throw new Error("Error al cifrar datos médicos");
    }
  }

  /**
   * Descifra datos usando AES-256-GCM
   * @param encryptedData - Datos cifrados en formato base64
   * @param passphrase - Frase de paso para derivar la clave
   * @returns Promise<string> - Texto plano descifrado
   */
  static async decrypt(
    encryptedData: string,
    passphrase: string,
  ): Promise<string> {
    try {
      // Derivar clave desde la frase de paso
      const key = await this.deriveKey(passphrase);

      // Decodificar base64
      const encryptedBytes = new Uint8Array(
        atob(encryptedData)
          .split("")
          .map((char) => char.charCodeAt(0)),
      );

      // Extraer IV y datos cifrados
      const iv = encryptedBytes.slice(0, this.IV_LENGTH);
      const ciphertext = encryptedBytes.slice(this.IV_LENGTH);

      // Descifrar datos
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
          tagLength: this.TAG_LENGTH,
        },
        key,
        ciphertext,
      );

      // Convertir a texto
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error("Error en descifrado:", error);
      throw new Error("Error al descifrar datos médicos");
    }
  }

  /**
   * Deriva una clave criptográfica desde una frase de paso
   * @param passphrase - Frase de paso
   * @returns Promise<CryptoKey> - Clave derivada
   */
  private static async deriveKey(passphrase: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const salt = encoder.encode("AIDUXCARE_SALT_2025");

    // Derivar clave usando PBKDF2
    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      false,
      ["encrypt", "decrypt"],
    );
  }

  /**
   * Genera un hash seguro para verificación de integridad
   * @param data - Datos a hashear
   * @returns Promise<string> - Hash en formato hex
   */
  static async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);

    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}
