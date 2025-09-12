export class SafeLogger {
  static logAnalysis(label: string, data: any): void {
    try {
      console.log(`[${label}]`, this.sanitizeForLogging(data));
    } catch (error) {
      console.log(`[${label}] Error logging:`, error.message);
    }
  }
  
  private static sanitizeForLogging(data: any, depth = 0): any {
    if (depth > 5) return '[TOO DEEP]';
    
    if (data === null || data === undefined) return data;
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForLogging(item, depth + 1));
    }
    
    if (typeof data === 'object') {
      const result: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          result[key] = this.sanitizeForLogging(data[key], depth + 1);
        }
      }
      return result;
    }
    
    return '[UNKNOWN TYPE]';
  }
}
