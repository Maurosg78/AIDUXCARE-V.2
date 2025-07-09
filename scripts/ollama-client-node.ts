/**
 * 🤖 Cliente Ollama para Node.js Scripts
 * Compatible con TSX y variables de entorno de Node.js
 */

import { config } from 'dotenv';

// Cargar variables de entorno
config();

export interface OllamaResponse {
  response: string;
  tokens: number;
  duration: number;
  model: string;
}

export interface OllamaStreamResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaNodeClient {
  private baseUrl: string;
  private model: string;
  private timeout: number;

  constructor(
    baseUrl = process.env.VITE_OLLAMA_URL || 'http://127.0.0.1:11434',
    model = process.env.VITE_OLLAMA_MODEL || 'llama3.2:3b',
    timeout = 30000
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.timeout = timeout;
  }

  /**
   * Verifica si Ollama está disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.warn('Ollama no disponible:', error);
      return false;
    }
  }

  /**
   * Lista modelos disponibles
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Genera completion simple
   */
  async generateCompletion(prompt: string, options?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
  }): Promise<OllamaResponse> {
    const requestBody = {
      model: this.model,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature || 0.3,
        top_p: options?.top_p || 0.9,
        num_predict: options?.max_tokens || 2000,
        stop: ['<|eot_id|>', '</s>']
      }
    };

    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaStreamResponse = await response.json();
      const duration = Date.now() - startTime;

      return {
        response: data.response || '',
        tokens: data.eval_count || 0,
        duration,
        model: data.model
      };
    } catch (error) {
      console.error('Error en generateCompletion:', error);
      throw new Error(`Falló la generación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Chat completion compatible con formato OpenAI
   */
  async chatCompletion(messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>, options?: {
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    // Convertir mensajes a formato de prompt para Ollama
    const prompt = this.formatMessagesToPrompt(messages);
    
    const result = await this.generateCompletion(prompt, options);
    return result.response;
  }

  /**
   * Formatea mensajes al estilo de prompt de Llama
   */
  private formatMessagesToPrompt(messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>): string {
    let prompt = '<|begin_of_text|>';
    
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          prompt += `<|start_header_id|>system<|end_header_id|>\n\n${message.content}<|eot_id|>`;
          break;
        case 'user':
          prompt += `<|start_header_id|>user<|end_header_id|>\n\n${message.content}<|eot_id|>`;
          break;
        case 'assistant':
          prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n${message.content}<|eot_id|>`;
          break;
      }
    }
    
    // Agregar inicio de respuesta del asistente
    prompt += '<|start_header_id|>assistant<|end_header_id|>\n\n';
    
    return prompt;
  }

  /**
   * Health check completo
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    model: string;
    version?: string;
    latency_ms?: number;
  }> {
    const startTime = Date.now();
    
    try {
      const available = await this.isAvailable();
      if (!available) {
        return { status: 'unhealthy', model: this.model };
      }

      const models = await this.listModels();
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        model: this.model,
        latency_ms: latency,
        version: models.length > 0 ? 'Available' : 'Unknown'
      };
    } catch (error) {
      return { status: 'unhealthy', model: this.model };
    }
  }
}

// Instancia global para scripts
export const ollamaNode = new OllamaNodeClient(); 