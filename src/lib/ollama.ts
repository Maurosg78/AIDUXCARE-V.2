/**
 * 🤖 AiDuxCare - Cliente Ollama
 * Integración local LLM gratuita para procesamiento médico
 */

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

export class OllamaClient {
  private baseUrl: string;
  private model: string;
  private timeout: number;

  constructor(
    baseUrl = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434",
    model = import.meta.env.VITE_OLLAMA_MODEL || "llama3.2:3b",
    timeout = 30000,
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
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.warn("Ollama no disponible:", error);
      return false;
    }
  }

  /**
   * Lista modelos disponibles en Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data: { models?: Array<{ name: string }> } = await response.json();
      return data.models?.map((m) => m.name) || [];
    } catch (error) {
      console.error("Error listing models:", error);
      return [];
    }
  }

  /**
   * Genera completion simple
   */
  async generateCompletion(
    prompt: string,
    options?: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      stream?: boolean;
      timeout?: number;
    },
  ): Promise<OllamaResponse> {
    const requestBody = {
      model: this.model,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature || 0.3,
        top_p: options?.top_p || 0.9,
        num_predict: options?.max_tokens || 2000,
        stop: ["<|eot_id|>", "</s>"],
      },
    };

    try {
      const startTime = Date.now();
      const timeoutMs = options?.timeout || this.timeout;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: OllamaStreamResponse = await response.json();
      const duration = Date.now() - startTime;

      return {
        response: data.response || "",
        tokens: data.eval_count || 0,
        duration,
        model: data.model,
      };
    } catch (error) {
      console.error("Error en generateCompletion:", error);
      throw new Error(
        `Falló la generación: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  }

  /**
   * Chat completion compatible con formato OpenAI
   */
  async chatCompletion(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>,
    options?: {
      temperature?: number;
      max_tokens?: number;
    },
  ): Promise<string> {
    // Convertir mensajes a formato de prompt para Ollama
    const prompt = this.formatMessagesToPrompt(messages);

    const result = await this.generateCompletion(prompt, options);
    return result.response;
  }

  /**
   * Formatea mensajes al estilo de prompt de Llama
   */
  private formatMessagesToPrompt(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>,
  ): string {
    let prompt = "<|begin_of_text|>";

    for (const message of messages) {
      switch (message.role) {
        case "system":
          prompt += `<|start_header_id|>system<|end_header_id|>\n\n${message.content}<|eot_id|>`;
          break;
        case "user":
          prompt += `<|start_header_id|>user<|end_header_id|>\n\n${message.content}<|eot_id|>`;
          break;
        case "assistant":
          prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n${message.content}<|eot_id|>`;
          break;
      }
    }

    // Agregar inicio de respuesta del asistente
    prompt += "<|start_header_id|>assistant<|end_header_id|>\n\n";

    return prompt;
  }

  /**
   * Genera embedding (si el modelo lo soporta)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
      });

      const data = await response.json();
      return data.embedding || [];
    } catch (error) {
      console.warn("Embeddings no soportados en este modelo");
      return [];
    }
  }

  /**
   * Obtiene información del modelo actual
   */
  async getModelInfo(): Promise<{
    name: string;
    size: string;
    family: string;
    parameters: string;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: this.model }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          name: data.details?.family || this.model,
          size: data.details?.parameter_size || "Unknown",
          family: data.details?.format || "Unknown",
          parameters: data.details?.parameters || "Unknown",
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting model info:", error);
      return null;
    }
  }

  /**
   * Health check completo
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    model: string;
    version?: string;
    latency_ms?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      // Test básico de conectividad
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          status: "unhealthy",
          model: this.model,
          error: "Ollama server not responding",
        };
      }

      // Test de generación simple
      await this.generateCompletion("Test", { max_tokens: 1 });
      const latency = Date.now() - startTime;

      return {
        status: "healthy",
        model: this.model,
        latency_ms: latency,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        model: this.model,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Instancia global del cliente
export const ollamaClient = new OllamaClient();

// Función de utilidad para verificar si Ollama está configurado
export const isOllamaConfigured = (): boolean => {
  return (
    import.meta.env.VITE_LLM_PROVIDER === "ollama" &&
    Boolean(import.meta.env.VITE_OLLAMA_URL) &&
    Boolean(import.meta.env.VITE_OLLAMA_MODEL)
  );
};

// Función de utilidad para obtener configuración
export const getOllamaConfig = () => ({
  provider: import.meta.env.VITE_LLM_PROVIDER,
  url: import.meta.env.VITE_OLLAMA_URL,
  model: import.meta.env.VITE_OLLAMA_MODEL,
});
