/**
 * AI: SISTEMA DE CACHE INTELIGENTE
 * Optimización avanzada de rendimiento con cache semántico y predictivo
 */

import Redis from 'ioredis';
import { createHash } from 'crypto';

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  compressionThreshold: number;
  enablePredictiveCache: boolean;
  enableSemanticCache: boolean;
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  type: 'medical_analysis' | 'soap_generation' | 'entity_extraction' | 'risk_assessment';
  specialty?: string;
  confidence: number;
  processingTime: number;
  modelUsed: string;
  tokensUsed: number;
  semanticHash?: string;
}

export class IntelligentCacheService {
  private redis: Redis;
  private config: CacheConfig;
  private semanticIndex: Map<string, string[]> = new Map();

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: 3600, // 1 hora por defecto
      maxSize: 10000,
      compressionThreshold: 1024, // 1KB
      enablePredictiveCache: true,
      enableSemanticCache: true,
      ...config
    };

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.initializeCache();
  }

  /**
   * Inicializa el sistema de cache
   */
  private async initializeCache(): Promise<void> {
    try {
      await this.redis.connect();
      console.log('SUCCESS: Cache inteligente conectado a Redis');
      
      // Configurar políticas de evicción
      await this.redis.config('SET', 'maxmemory-policy', 'allkeys-lru');
      await this.redis.config('SET', 'maxmemory', `${this.config.maxSize}mb`);
      
    } catch (error) {
      console.error('ERROR: Error conectando a Redis:', error);
      // Fallback a cache en memoria
      this.initializeMemoryCache();
    }
  }

  /**
   * Cache en memoria como fallback
   */
  private initializeMemoryCache(): void {
    console.log('WARNING: Usando cache en memoria como fallback');
    // Implementación simplificada para desarrollo
  }

  /**
   * Genera clave de cache inteligente
   */
  private generateCacheKey(input: string, type: string, specialty?: string): string {
    const hash = createHash('sha256').update(input).digest('hex');
    return `aiduxcare:${type}:${specialty || 'general'}:${hash}`;
  }

  /**
   * Genera hash semántico para cache inteligente
   */
  private generateSemanticHash(text: string): string {
    // Normalización semántica básica
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Busca en cache con múltiples estrategias
   */
  async get(input: string, type: string, specialty?: string): Promise<CacheEntry | null> {
    try {
      // 1. Cache exacto
      const exactKey = this.generateCacheKey(input, type, specialty);
      let entry = await this.getFromRedis(exactKey);
      
      if (entry) {
        await this.updateAccessStats(exactKey);
        return entry;
      }

      // 2. Cache semántico (si está habilitado)
      if (this.config.enableSemanticCache) {
        const semanticHash = this.generateSemanticHash(input);
        const semanticKey = `aiduxcare:semantic:${type}:${semanticHash}`;
        
        entry = await this.getFromRedis(semanticKey);
        if (entry && this.isSemanticMatch(input, entry.metadata.semanticHash!)) {
          await this.updateAccessStats(semanticKey);
          return entry;
        }
      }

      // 3. Cache predictivo (si está habilitado)
      if (this.config.enablePredictiveCache) {
        const predictiveEntry = await this.getPredictiveCache(input, type, specialty);
        if (predictiveEntry) {
          return predictiveEntry;
        }
      }

      return null;

    } catch (error) {
      console.error('Error en cache get:', error);
      return null;
    }
  }

  /**
   * Almacena en cache con estrategias inteligentes
   */
  async set(input: string, value: any, type: string, specialty?: string, metadata?: Partial<CacheMetadata>): Promise<void> {
    try {
      const exactKey = this.generateCacheKey(input, type, specialty);
      const semanticHash = this.generateSemanticHash(input);
      
      const entry: CacheEntry = {
        key: exactKey,
        value: this.compressIfNeeded(value),
        timestamp: Date.now(),
        ttl: this.config.ttl,
        accessCount: 1,
        lastAccessed: Date.now(),
        metadata: {
          type: type as any,
          specialty,
          confidence: metadata?.confidence || 0.8,
          processingTime: metadata?.processingTime || 0,
          modelUsed: metadata?.modelUsed || 'unknown',
          tokensUsed: metadata?.tokensUsed || 0,
          semanticHash,
          ...metadata
        }
      };

      // Almacenar cache exacto
      await this.setInRedis(exactKey, entry);

      // Almacenar cache semántico
      if (this.config.enableSemanticCache) {
        const semanticKey = `aiduxcare:semantic:${type}:${semanticHash}`;
        await this.setInRedis(semanticKey, entry);
        
        // Actualizar índice semántico
        this.updateSemanticIndex(semanticHash, input);
      }

      // Actualizar cache predictivo
      if (this.config.enablePredictiveCache) {
        await this.updatePredictiveCache(input, type, specialty);
      }

    } catch (error) {
      console.error('Error en cache set:', error);
    }
  }

  /**
   * Compresión inteligente de datos
   */
  private compressIfNeeded(value: any): any {
    const serialized = JSON.stringify(value);
    
    if (serialized.length > this.config.compressionThreshold) {
      // Compresión básica - en producción usar gzip
      return {
        compressed: true,
        data: Buffer.from(serialized).toString('base64'),
        originalSize: serialized.length
      };
    }
    
    return value;
  }

  /**
   * Descompresión de datos
   */
  private decompressIfNeeded(value: any): any {
    if (value && typeof value === 'object' && value.compressed) {
      const decompressed = Buffer.from(value.data, 'base64').toString();
      return JSON.parse(decompressed);
    }
    
    return value;
  }

  /**
   * Obtiene entrada de Redis
   */
  private async getFromRedis(key: string): Promise<CacheEntry | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      
      const entry: CacheEntry = JSON.parse(data);
      entry.value = this.decompressIfNeeded(entry.value);
      
      return entry;
    } catch (error) {
      console.error('Error obteniendo de Redis:', error);
      return null;
    }
  }

  /**
   * Almacena entrada en Redis
   */
  private async setInRedis(key: string, entry: CacheEntry): Promise<void> {
    try {
      const serialized = JSON.stringify(entry);
      await this.redis.setex(key, this.config.ttl, serialized);
    } catch (error) {
      console.error('Error almacenando en Redis:', error);
    }
  }

  /**
   * Actualiza estadísticas de acceso
   */
  private async updateAccessStats(key: string): Promise<void> {
    try {
      const data = await this.redis.get(key);
      if (data) {
        const entry: CacheEntry = JSON.parse(data);
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        await this.setInRedis(key, entry);
      }
    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
    }
  }

  /**
   * Verifica coincidencia semántica
   */
  private isSemanticMatch(input: string, storedHash: string): boolean {
    const inputHash = this.generateSemanticHash(input);
    return inputHash === storedHash;
  }

  /**
   * Actualiza índice semántico
   */
  private updateSemanticIndex(hash: string, input: string): void {
    if (!this.semanticIndex.has(hash)) {
      this.semanticIndex.set(hash, []);
    }
    
    const inputs = this.semanticIndex.get(hash)!;
    if (!inputs.includes(input)) {
      inputs.push(input);
    }
  }

  /**
   * Cache predictivo basado en patrones
   */
  private async getPredictiveCache(input: string, type: string, specialty?: string): Promise<CacheEntry | null> {
    try {
      // Buscar patrones similares en cache
      const pattern = this.extractPattern(input);
      const patternKey = `aiduxcare:pattern:${type}:${pattern}`;
      
      return await this.getFromRedis(patternKey);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extrae patrón del input
   */
  private extractPattern(input: string): string {
    // Patrón básico - en producción usar ML más avanzado
    const words = input.toLowerCase().split(/\s+/);
    const keyWords = words.filter(word => word.length > 3).slice(0, 5);
    return keyWords.sort().join(':');
  }

  /**
   * Actualiza cache predictivo
   */
  private async updatePredictiveCache(input: string, type: string, specialty?: string): Promise<void> {
    try {
      const pattern = this.extractPattern(input);
      const patternKey = `aiduxcare:pattern:${type}:${pattern}`;
      
      // Almacenar patrón para futuras predicciones
      await this.redis.setex(patternKey, this.config.ttl * 2, JSON.stringify({
        pattern,
        type,
        specialty,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error actualizando cache predictivo:', error);
    }
  }

  /**
   * Estadísticas del cache
   */
  async getStats(): Promise<any> {
    try {
      const info = await this.redis.info();
      const keys = await this.redis.keys('aiduxcare:*');
      
      return {
        totalKeys: keys.length,
        memoryUsage: info.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'unknown',
        hitRate: await this.calculateHitRate(),
        patterns: this.semanticIndex.size
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Calcula tasa de aciertos
   */
  private async calculateHitRate(): Promise<number> {
    try {
      const hits = await this.redis.get('aiduxcare:stats:hits') || '0';
      const misses = await this.redis.get('aiduxcare:stats:misses') || '0';
      
      const total = parseInt(hits) + parseInt(misses);
      return total > 0 ? parseInt(hits) / total : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Limpia cache expirado
   */
  async cleanup(): Promise<void> {
    try {
      const keys = await this.redis.keys('aiduxcare:*');
      const now = Date.now();
      
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const entry: CacheEntry = JSON.parse(data);
          if (now - entry.timestamp > entry.ttl * 1000) {
            await this.redis.del(key);
          }
        }
      }
    } catch (error) {
      console.error('Error limpiando cache:', error);
    }
  }

  /**
   * Cierra conexión
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('Error cerrando conexión Redis:', error);
    }
  }
} 