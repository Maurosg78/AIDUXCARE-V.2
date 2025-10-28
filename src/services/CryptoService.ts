import crypto from "crypto";

class CryptoService {
  constructor() {
    this.ready = false;
  }

  async init() {
    this.ready = true;
  }

  async encrypt(data: string): Promise<{ iv: string; ciphertext: string }> {
    if (!data) return { iv: "", ciphertext: "" };

    const iv = crypto.randomBytes(16);
    const key = crypto.createHash("sha256").update("aiduxcare-secret").digest();
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(data, "utf8", "base64");
    encrypted += cipher.final("base64");

    return {
      iv: iv.toString("base64"),
      ciphertext: encrypted,
    };
  }

  async decrypt(ivBase64: string, ciphertextBase64: string): Promise<string | null> {
    if (!ivBase64 || !ciphertextBase64) return null;

    try {
      const iv = Buffer.from(ivBase64, "base64");
      const key = crypto.createHash("sha256").update("aiduxcare-secret").digest();
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(ciphertextBase64, "base64", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      return null;
    }
  }

  // Static helpers for enterprise tests
  static async encrypt(data: string) {
    const instance = new CryptoService();
    await instance.init();
    return instance.encrypt(data);
  }

  static async decrypt(iv: string, ciphertext: string) {
    const instance = new CryptoService();
    await instance.init();
    return instance.decrypt(iv, ciphertext);
  }
}

export { CryptoService };
export default CryptoService;
