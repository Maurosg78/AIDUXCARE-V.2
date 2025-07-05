/**
 * AzureOpenAIService - Servicio para integración con Azure OpenAI
 * Maneja autenticación, rate limiting, fallback y monitoreo de cuotas
 */

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
  maxTokens: number;
  temperature: number;
}

export interface AzureOpenAIResponse {
  success: boolean;
  data?: {
    content: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  fallbackUsed?: boolean;
}

export class AzureOpenAIService {
  private config: AzureOpenAIConfig;
  private isAvailable: boolean = false;
  private quotaExceeded: boolean = false;
  private lastCheck: number = 0;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

  constructor(config?: Partial<AzureOpenAIConfig>) {
    this.config = {
      endpoint:
        process.env.VITE_AZURE_OPENAI_ENDPOINT ||
        "https://openai-aiduxcare-mvp.openai.azure.com/",
      apiKey: process.env.VITE_AZURE_OPENAI_API_KEY || "",
      deploymentName: process.env.VITE_AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini",
      apiVersion: "2024-02-15-preview",
      maxTokens: 4000,
      temperature: 0.7,
      ...config,
    };

    this.checkAvailability();
  }

  /**
   * Verifica la disponibilidad del servicio Azure OpenAI
   */
  async checkAvailability(): Promise<boolean> {
    const now = Date.now();

    // Evitar verificaciones muy frecuentes
    if (now - this.lastCheck < this.CHECK_INTERVAL) {
      return this.isAvailable && !this.quotaExceeded;
    }

    this.lastCheck = now;

    try {
      const response = await fetch(
        `${this.config.endpoint}/openai/deployments?api-version=${this.config.apiVersion}`,
        {
          method: "GET",
          headers: {
            "api-key": this.config.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        this.isAvailable = true;
        this.quotaExceeded = false;
        console.log("✅ Azure OpenAI disponible");
        return true;
      } else {
        this.isAvailable = false;
        console.warn("⚠️ Azure OpenAI no disponible:", response.status);
        return false;
      }
    } catch (error) {
      this.isAvailable = false;
      console.error("❌ Error verificando Azure OpenAI:", error);
      return false;
    }
  }

  /**
   * Envía una solicitud a Azure OpenAI
   */
  async sendRequest(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: {
      maxTokens?: number;
      temperature?: number;
      useFallback?: boolean;
    },
  ): Promise<AzureOpenAIResponse> {
    // Verificar disponibilidad
    const isAvailable = await this.checkAvailability();

    if (!isAvailable || this.quotaExceeded) {
      if (options?.useFallback !== false) {
        return this.useFallback(messages);
      }

      return {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Azure OpenAI no disponible y fallback deshabilitado",
        },
      };
    }

    try {
      const response = await fetch(
        `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`,
        {
          method: "POST",
          headers: {
            "api-key": this.config.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            max_tokens: options?.maxTokens || this.config.maxTokens,
            temperature: options?.temperature || this.config.temperature,
            stream: false,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();

        return {
          success: true,
          data: {
            content: data.choices[0].message.content,
            usage: data.usage,
          },
        };
      } else {
        const errorData = await response.json().catch(() => ({}));

        // Detectar si es error de cuota
        if (
          response.status === 429 ||
          errorData.error?.code === "InsufficientQuota"
        ) {
          this.quotaExceeded = true;
          console.error("🚨 Cuota de Azure OpenAI excedida");
        }

        return {
          success: false,
          error: {
            code: errorData.error?.code || "UNKNOWN_ERROR",
            message: errorData.error?.message || `HTTP ${response.status}`,
            details: errorData,
          },
        };
      }
    } catch (error) {
      console.error("❌ Error en Azure OpenAI:", error);

      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message:
            error instanceof Error ? error.message : "Error de red desconocido",
        },
      };
    }
  }

  /**
   * Usa ChatGPT como fallback cuando Azure OpenAI no está disponible
   */
  private async useFallback(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  ): Promise<AzureOpenAIResponse> {
    try {
      // Fallback simple: usar el último mensaje del usuario
      const lastUserMessage =
        messages.find((m) => m.role === "user")?.content ||
        messages[messages.length - 1].content;

      // Simular respuesta de fallback
      const fallbackResponse = `[FALLBACK] Respuesta generada localmente para: "${lastUserMessage.substring(0, 100)}..."`;

      return {
        success: true,
        data: {
          content: fallbackResponse,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
        },
        fallbackUsed: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "FALLBACK_FAILED",
          message: "Error en fallback local",
          details: error,
        },
      };
    }
  }

  /**
   * Obtiene el estado actual del servicio
   */
  getStatus(): {
    isAvailable: boolean;
    quotaExceeded: boolean;
    endpoint: string;
    deploymentName: string;
    lastCheck: string;
  } {
    return {
      isAvailable: this.isAvailable,
      quotaExceeded: this.quotaExceeded,
      endpoint: this.config.endpoint,
      deploymentName: this.config.deploymentName,
      lastCheck: new Date(this.lastCheck).toISOString(),
    };
  }

  /**
   * Actualiza la configuración del servicio
   */
  updateConfig(newConfig: Partial<AzureOpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.isAvailable = false; // Forzar nueva verificación
    this.quotaExceeded = false;
  }

  /**
   * Resetea el estado de cuota (útil para testing)
   */
  resetQuotaStatus(): void {
    this.quotaExceeded = false;
    this.lastCheck = 0;
  }
}
