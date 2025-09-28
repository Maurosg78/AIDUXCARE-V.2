// @ts-nocheck
export class SessionStorage {
  private static readonly KEY_PREFIX = 'aidux_';
  
  static saveSession(patientId: string, data: any): void {
    try {
      const key = `${this.KEY_PREFIX}${patientId}`;
      const sessionData = {
        ...data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Error guardando sesión:', e);
    }
  }

  static getSession(patientId: string): any {
    try {
      const key = `${this.KEY_PREFIX}${patientId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error recuperando sesión:', e);
      return null;
    }
  }

  static clearSession(patientId: string): void {
    const key = `${this.KEY_PREFIX}${patientId}`;
    localStorage.removeItem(key);
  }
}