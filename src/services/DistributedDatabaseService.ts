/**
 * DATA: SISTEMA DE BASE DE DATOS DISTRIBUIDA
 * PostgreSQL + Redis para escalabilidad y rendimiento óptimo
 */

import { Pool, PoolClient } from 'pg';
import Redis from 'ioredis';
import { createHash } from 'crypto';

export interface DatabaseConfig {
  postgres: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  sessionId: string;
  specialty: string;
  consultationDate: Date;
  soapData: SOAPData;
  entities: MedicalEntity[];
  riskAssessment: RiskAssessment;
  metadata: RecordMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SOAPData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence: number;
}

export interface MedicalEntity {
  text: string;
  type: string;
  confidence: number;
  startOffset: number;
  endOffset: number;
}

export interface RiskAssessment {
  overallRisk: string;
  riskFactors: string[];
  recommendations: string[];
}

export interface RecordMetadata {
  processingTime: number;
  modelUsed: string;
  tokensUsed: number;
  cacheHit: boolean;
  version: string;
}

export class DistributedDatabaseService {
  private postgresPool: Pool;
  private redisClient: Redis;
  private isConnected: boolean = false;

  constructor(config?: Partial<DatabaseConfig>) {
    const defaultConfig: DatabaseConfig = {
      postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'aiduxcare',
        user: process.env.POSTGRES_USER || 'aiduxcare',
        password: process.env.POSTGRES_PASSWORD || 'aiduxcare2025',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: 0
      }
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.postgresPool = new Pool(finalConfig.postgres);
    this.redisClient = new Redis(finalConfig.redis);

    this.setupEventHandlers();
  }

  /**
   * Configura manejadores de eventos
   */
  private setupEventHandlers(): void {
    this.postgresPool.on('error', (err) => {
      console.error('Error en pool PostgreSQL:', err);
    });

    this.redisClient.on('error', (err) => {
      console.error('Error en Redis:', err);
    });

    this.redisClient.on('connect', () => {
      console.log('SUCCESS: Redis conectado');
    });
  }

  /**
   * Inicializa la base de datos
   */
  async initialize(): Promise<void> {
    try {
      // Verificar conexión PostgreSQL
      const client = await this.postgresPool.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Verificar conexión Redis
      await this.redisClient.ping();

      // Crear tablas si no existen
      await this.createTables();

      this.isConnected = true;
      console.log('SUCCESS: Base de datos distribuida inicializada');

    } catch (error) {
      console.error('ERROR: Error inicializando base de datos:', error);
      throw error;
    }
  }

  /**
   * Crea tablas necesarias
   */
  private async createTables(): Promise<void> {
    const client = await this.postgresPool.connect();

    try {
      // Tabla de registros médicos
      await client.query(`
        CREATE TABLE IF NOT EXISTS medical_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          patient_id VARCHAR(255) NOT NULL,
          session_id VARCHAR(255) NOT NULL,
          specialty VARCHAR(100) NOT NULL,
          consultation_date TIMESTAMP NOT NULL,
          soap_data JSONB NOT NULL,
          entities JSONB NOT NULL,
          risk_assessment JSONB NOT NULL,
          metadata JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Índices para optimización
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
        CREATE INDEX IF NOT EXISTS idx_medical_records_session_id ON medical_records(session_id);
        CREATE INDEX IF NOT EXISTS idx_medical_records_specialty ON medical_records(specialty);
        CREATE INDEX IF NOT EXISTS idx_medical_records_consultation_date ON medical_records(consultation_date);
        CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON medical_records(created_at);
      `);

      // Tabla de sesiones
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          specialty VARCHAR(100),
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Tabla de análisis de rendimiento
      await client.query(`
        CREATE TABLE IF NOT EXISTS performance_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id VARCHAR(255),
          operation_type VARCHAR(100) NOT NULL,
          processing_time INTEGER NOT NULL,
          tokens_used INTEGER,
          cache_hit BOOLEAN DEFAULT FALSE,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('SUCCESS: Tablas creadas/verificadas');

    } finally {
      client.release();
    }
  }

  /**
   * Guarda registro médico con cache inteligente
   */
  async saveMedicalRecord(record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalRecord> {
    const client = await this.postgresPool.connect();

    try {
      // Generar ID único
      const id = createHash('sha256')
        .update(`${record.patientId}-${record.sessionId}-${Date.now()}`)
        .digest('hex');

      const medicalRecord: MedicalRecord = {
        ...record,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Guardar en PostgreSQL
      const query = `
        INSERT INTO medical_records (
          id, patient_id, session_id, specialty, consultation_date,
          soap_data, entities, risk_assessment, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        medicalRecord.id,
        medicalRecord.patientId,
        medicalRecord.sessionId,
        medicalRecord.specialty,
        medicalRecord.consultationDate,
        JSON.stringify(medicalRecord.soapData),
        JSON.stringify(medicalRecord.entities),
        JSON.stringify(medicalRecord.riskAssessment),
        JSON.stringify(medicalRecord.metadata)
      ];

      const result = await client.query(query, values);
      const savedRecord = result.rows[0];

      // Guardar en cache Redis
      await this.cacheMedicalRecord(medicalRecord);

      // Registrar métrica de rendimiento
      await this.recordPerformanceMetric({
        sessionId: record.sessionId,
        operationType: 'save_medical_record',
        processingTime: medicalRecord.metadata.processingTime,
        tokensUsed: medicalRecord.metadata.tokensUsed,
        cacheHit: medicalRecord.metadata.cacheHit
      });

      return this.mapDatabaseRecord(savedRecord);

    } finally {
      client.release();
    }
  }

  /**
   * Obtiene registro médico con cache
   */
  async getMedicalRecord(id: string): Promise<MedicalRecord | null> {
    // Intentar obtener de cache primero
    const cachedRecord = await this.getCachedMedicalRecord(id);
    if (cachedRecord) {
      return cachedRecord;
    }

    // Si no está en cache, obtener de PostgreSQL
    const client = await this.postgresPool.connect();

    try {
      const query = 'SELECT * FROM medical_records WHERE id = $1';
      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const record = this.mapDatabaseRecord(result.rows[0]);

      // Guardar en cache
      await this.cacheMedicalRecord(record);

      return record;

    } finally {
      client.release();
    }
  }

  /**
   * Busca registros médicos con filtros avanzados
   */
  async searchMedicalRecords(filters: {
    patientId?: string;
    specialty?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ records: MedicalRecord[]; total: number }> {
    const client = await this.postgresPool.connect();

    try {
      let whereConditions = [];
      let values = [];
      let valueIndex = 1;

      if (filters.patientId) {
        whereConditions.push(`patient_id = $${valueIndex++}`);
        values.push(filters.patientId);
      }

      if (filters.specialty) {
        whereConditions.push(`specialty = $${valueIndex++}`);
        values.push(filters.specialty);
      }

      if (filters.dateFrom) {
        whereConditions.push(`consultation_date >= $${valueIndex++}`);
        values.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        whereConditions.push(`consultation_date <= $${valueIndex++}`);
        values.push(filters.dateTo);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Contar total
      const countQuery = `SELECT COUNT(*) FROM medical_records ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Obtener registros
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      const query = `
        SELECT * FROM medical_records 
        ${whereClause}
        ORDER BY consultation_date DESC
        LIMIT $${valueIndex++} OFFSET $${valueIndex++}
      `;
      
      values.push(limit, offset);
      const result = await client.query(query, values);

      const records = result.rows.map(row => this.mapDatabaseRecord(row));

      return { records, total };

    } finally {
      client.release();
    }
  }

  /**
   * Cache de registro médico en Redis
   */
  private async cacheMedicalRecord(record: MedicalRecord): Promise<void> {
    try {
      const key = `medical_record:${record.id}`;
      const ttl = 3600; // 1 hora

      await this.redisClient.setex(key, ttl, JSON.stringify(record));
    } catch (error) {
      console.error('Error cacheando registro médico:', error);
    }
  }

  /**
   * Obtiene registro médico de cache
   */
  private async getCachedMedicalRecord(id: string): Promise<MedicalRecord | null> {
    try {
      const key = `medical_record:${id}`;
      const cached = await this.redisClient.get(key);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo de cache:', error);
      return null;
    }
  }

  /**
   * Mapea registro de base de datos a objeto
   */
  private mapDatabaseRecord(row: any): MedicalRecord {
    return {
      id: row.id,
      patientId: row.patient_id,
      sessionId: row.session_id,
      specialty: row.specialty,
      consultationDate: new Date(row.consultation_date),
      soapData: row.soap_data,
      entities: row.entities,
      riskAssessment: row.risk_assessment,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Registra métrica de rendimiento
   */
  private async recordPerformanceMetric(metric: {
    sessionId: string;
    operationType: string;
    processingTime: number;
    tokensUsed?: number;
    cacheHit?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const client = await this.postgresPool.connect();

    try {
      const query = `
        INSERT INTO performance_metrics (
          session_id, operation_type, processing_time, tokens_used, cache_hit, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await client.query(query, [
        metric.sessionId,
        metric.operationType,
        metric.processingTime,
        metric.tokensUsed,
        metric.cacheHit,
        metric.errorMessage
      ]);

    } finally {
      client.release();
    }
  }

  /**
   * Obtiene estadísticas de rendimiento
   */
  async getPerformanceStats(): Promise<any> {
    const client = await this.postgresPool.connect();

    try {
      // Estadísticas generales
      const generalStats = await client.query(`
        SELECT 
          COUNT(*) as total_operations,
          AVG(processing_time) as avg_processing_time,
          AVG(tokens_used) as avg_tokens_used,
          AVG(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hit_rate
        FROM performance_metrics
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);

      // Estadísticas por operación
      const operationStats = await client.query(`
        SELECT 
          operation_type,
          COUNT(*) as count,
          AVG(processing_time) as avg_time,
          AVG(tokens_used) as avg_tokens
        FROM performance_metrics
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY operation_type
        ORDER BY count DESC
      `);

      return {
        general: generalStats.rows[0],
        operations: operationStats.rows
      };

    } finally {
      client.release();
    }
  }

  /**
   * Cierra conexiones
   */
  async disconnect(): Promise<void> {
    try {
      await this.postgresPool.end();
      await this.redisClient.quit();
      this.isConnected = false;
      console.log('🔌 Conexiones de base de datos cerradas');
    } catch (error) {
      console.error('Error cerrando conexiones:', error);
    }
  }
} 