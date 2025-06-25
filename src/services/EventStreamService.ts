/**
 * RELOAD: SISTEMA DE EVENTOS DISTRIBUIDOS
 * Procesamiento asíncrono con Apache Kafka para escalabilidad masiva
 */

import { Kafka, Producer, Consumer, KafkaMessage } from 'kafkajs';

export interface MedicalEvent {
  id: string;
  type: 'MEDICAL_ANALYSIS_REQUEST' | 'SOAP_GENERATED' | 'ENTITY_EXTRACTED' | 'RISK_ASSESSED' | 'CONSULTATION_COMPLETED';
  timestamp: number;
  sessionId: string;
  userId: string;
  data: any;
  metadata: EventMetadata;
}

export interface EventMetadata {
  priority: 'low' | 'medium' | 'high' | 'critical';
  specialty?: string;
  processingTime?: number;
  modelUsed?: string;
  confidence?: number;
  retryCount?: number;
}

export interface EventHandler {
  handle(event: MedicalEvent): Promise<void>;
  canHandle(eventType: string): boolean;
}

export class EventStreamService {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private handlers: Map<string, EventHandler[]> = new Map();
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'aiduxcare-event-stream',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000
    });

    this.initializeEventHandlers();
  }

  /**
   * Inicializa manejadores de eventos
   */
  private initializeEventHandlers(): void {
    // Manejador para análisis médico
    this.registerHandler('MEDICAL_ANALYSIS_REQUEST', new MedicalAnalysisHandler());
    
    // Manejador para generación SOAP
    this.registerHandler('SOAP_GENERATED', new SOAPGenerationHandler());
    
    // Manejador para extracción de entidades
    this.registerHandler('ENTITY_EXTRACTED', new EntityExtractionHandler());
    
    // Manejador para evaluación de riesgo
    this.registerHandler('RISK_ASSESSED', new RiskAssessmentHandler());
    
    // Manejador para consultas completadas
    this.registerHandler('CONSULTATION_COMPLETED', new ConsultationCompletedHandler());
  }

  /**
   * Conecta al sistema de eventos
   */
  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('SUCCESS: Conectado a Kafka Event Stream');
      
      // Iniciar consumidores
      await this.startConsumers();
      
    } catch (error) {
      console.error('ERROR: Error conectando a Kafka:', error);
      throw error;
    }
  }

  /**
   * Publica evento médico
   */
  async publishEvent(event: MedicalEvent): Promise<void> {
    if (!this.isConnected) {
      throw new Error('EventStreamService no está conectado');
    }

    try {
      const topic = this.getTopicForEvent(event.type);
      
      await this.producer.send({
        topic,
        messages: [{
          key: event.id,
          value: JSON.stringify(event),
          headers: {
            eventType: event.type,
            priority: event.metadata.priority,
            sessionId: event.sessionId
          }
        }],
        timeout: 30000
      });

      console.log(`📤 Evento publicado: ${event.type} - ${event.id}`);

    } catch (error) {
      console.error('Error publicando evento:', error);
      throw error;
    }
  }

  /**
   * Obtiene topic para tipo de evento
   */
  private getTopicForEvent(eventType: string): string {
    const topicMap: Record<string, string> = {
      'MEDICAL_ANALYSIS_REQUEST': 'medical-analysis-requests',
      'SOAP_GENERATED': 'soap-generation',
      'ENTITY_EXTRACTED': 'entity-extraction',
      'RISK_ASSESSED': 'risk-assessment',
      'CONSULTATION_COMPLETED': 'consultation-completed'
    };

    return topicMap[eventType] || 'default-events';
  }

  /**
   * Registra manejador de eventos
   */
  registerHandler(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Inicia consumidores para cada topic
   */
  private async startConsumers(): Promise<void> {
    const topics = [
      'medical-analysis-requests',
      'soap-generation',
      'entity-extraction',
      'risk-assessment',
      'consultation-completed'
    ];

    for (const topic of topics) {
      await this.startConsumer(topic);
    }
  }

  /**
   * Inicia consumidor para topic específico
   */
  private async startConsumer(topic: string): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: `aiduxcare-${topic}-consumer`,
      retry: {
        initialRetryTime: 100,
        retries: 3
      }
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        await this.processMessage(topic, message);
      },
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
        for (const message of batch.messages) {
          if (!isRunning() || isStale()) break;
          
          await this.processMessage(batch.topic, message);
          resolveOffset(message.offset);
        }
        await heartbeat();
      }
    });

    this.consumers.set(topic, consumer);
    console.log(`🎧 Consumidor iniciado para topic: ${topic}`);
  }

  /**
   * Procesa mensaje recibido
   */
  private async processMessage(topic: string, message: KafkaMessage): Promise<void> {
    try {
      const event: MedicalEvent = JSON.parse(message.value!.toString());
      const handlers = this.handlers.get(event.type) || [];

      console.log(`📥 Procesando evento: ${event.type} - ${event.id}`);

      // Ejecutar manejadores en paralelo
      const promises = handlers.map(handler => 
        handler.handle(event).catch(error => {
          console.error(`Error en manejador para ${event.type}:`, error);
          return this.handleError(event, error);
        })
      );

      await Promise.allSettled(promises);

    } catch (error) {
      console.error('Error procesando mensaje:', error);
    }
  }

  /**
   * Maneja errores de procesamiento
   */
  private async handleError(event: MedicalEvent, error: Error): Promise<void> {
    const retryCount = (event.metadata.retryCount || 0) + 1;
    
    if (retryCount < 3) {
      // Reintentar con backoff exponencial
      const delay = Math.pow(2, retryCount) * 1000;
      
      setTimeout(async () => {
        event.metadata.retryCount = retryCount;
        await this.publishEvent(event);
      }, delay);
      
    } else {
      // Evento fallido - enviar a topic de errores
      await this.publishToDeadLetter(event, error);
    }
  }

  /**
   * Publica a dead letter queue
   */
  private async publishToDeadLetter(event: MedicalEvent, error: Error): Promise<void> {
    const deadLetterEvent: MedicalEvent = {
      ...event,
      type: 'EVENT_FAILED' as any,
      data: {
        originalEvent: event,
        error: error.message,
        timestamp: Date.now()
      }
    };

    await this.producer.send({
      topic: 'dead-letter-queue',
      messages: [{
        key: event.id,
        value: JSON.stringify(deadLetterEvent)
      }]
    });

    console.log(`💀 Evento enviado a dead letter queue: ${event.id}`);
  }

  /**
   * Desconecta del sistema de eventos
   */
  async disconnect(): Promise<void> {
    try {
      // Desconectar consumidores
      for (const [topic, consumer] of this.consumers) {
        await consumer.disconnect();
        console.log(`🔌 Consumidor desconectado: ${topic}`);
      }

      // Desconectar productor
      await this.producer.disconnect();
      
      this.isConnected = false;
      console.log('🔌 Desconectado de Kafka Event Stream');

    } catch (error) {
      console.error('Error desconectando:', error);
    }
  }
}

/**
 * Manejador de análisis médico
 */
class MedicalAnalysisHandler implements EventHandler {
  canHandle(eventType: string): boolean {
    return eventType === 'MEDICAL_ANALYSIS_REQUEST';
  }

  async handle(event: MedicalEvent): Promise<void> {
    console.log(`AI: Procesando análisis médico: ${event.id}`);
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Publicar evento de resultado
    const resultEvent: MedicalEvent = {
      id: `result-${event.id}`,
      type: 'SOAP_GENERATED',
      timestamp: Date.now(),
      sessionId: event.sessionId,
      userId: event.userId,
      data: {
        soapSections: [
          { type: 'SUBJECTIVE', content: 'Análisis completado' },
          { type: 'OBJECTIVE', content: 'Hallazgos objetivos' },
          { type: 'ASSESSMENT', content: 'Evaluación clínica' },
          { type: 'PLAN', content: 'Plan de tratamiento' }
        ]
      },
      metadata: {
        priority: event.metadata.priority,
        specialty: event.metadata.specialty,
        processingTime: 1000,
        modelUsed: 'gemini-1.5-pro',
        confidence: 0.95
      }
    };

    // Aquí se publicaría el evento de resultado
    console.log(`SUCCESS: Análisis médico completado: ${event.id}`);
  }
}

/**
 * Manejador de generación SOAP
 */
class SOAPGenerationHandler implements EventHandler {
  canHandle(eventType: string): boolean {
    return eventType === 'SOAP_GENERATED';
  }

  async handle(event: MedicalEvent): Promise<void> {
    console.log(`NOTES: Procesando generación SOAP: ${event.id}`);
    // Implementación específica para SOAP
  }
}

/**
 * Manejador de extracción de entidades
 */
class EntityExtractionHandler implements EventHandler {
  canHandle(eventType: string): boolean {
    return eventType === 'ENTITY_EXTRACTED';
  }

  async handle(event: MedicalEvent): Promise<void> {
    console.log(`🔍 Procesando extracción de entidades: ${event.id}`);
    // Implementación específica para entidades
  }
}

/**
 * Manejador de evaluación de riesgo
 */
class RiskAssessmentHandler implements EventHandler {
  canHandle(eventType: string): boolean {
    return eventType === 'RISK_ASSESSED';
  }

  async handle(event: MedicalEvent): Promise<void> {
    console.log(`WARNING: Procesando evaluación de riesgo: ${event.id}`);
    // Implementación específica para riesgo
  }
}

/**
 * Manejador de consultas completadas
 */
class ConsultationCompletedHandler implements EventHandler {
  canHandle(eventType: string): boolean {
    return eventType === 'CONSULTATION_COMPLETED';
  }

  async handle(event: MedicalEvent): Promise<void> {
    console.log(`SUCCESS: Procesando consulta completada: ${event.id}`);
    // Implementación específica para consultas completadas
  }
} 