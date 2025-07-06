import GoogleCloudAudioService from './GoogleCloudAudioService';

/**
 * Servicio de audio médico con Google Cloud Speech-to-Text
 * Optimizado para consultas médicas profesionales
 */
export default class HybridAudioService {
  private googleCloudService: GoogleCloudAudioService;

  constructor() {
    // Usar Google Cloud Speech-to-Text como servicio principal
    this.googleCloudService = new GoogleCloudAudioService();
    
    console.log('🎙️ HybridAudioService inicializado con Google Cloud');
  }

  // Información clara del servicio
  getDetailedServiceInfo(): string {
    const isSupported = this.googleCloudService.isServiceSupported();
    
    if (isSupported) {
      return `🎙️ Google Cloud Speech-to-Text (Transcripción profesional médica)`;
    } else {
      return `❌ Google Cloud Speech-to-Text no disponible en este navegador`;
    }
  }

  // Iniciar grabación
  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    try {
      console.log('🎙️ Iniciando grabación con Google Cloud...');
      await this.googleCloudService.startRecording(callback);
    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      throw error;
    }
  }

  // Detener grabación
  stopRecording(): void {
    try {
      console.log('🛑 Deteniendo grabación...');
      this.googleCloudService.stopRecording();
    } catch (error) {
      console.error('❌ Error al detener grabación:', error);
    }
  }

  // Verificar si está grabando
  isRecording(): boolean {
    return this.googleCloudService.getIsRecording();
  }

  // Verificar si el servicio está soportado
  isServiceSupported(): boolean {
    return this.googleCloudService.isServiceSupported();
  }

  // Obtener nombre del servicio
  getServiceDisplayName(): string {
    return '🎙️ Google Cloud Speech-to-Text';
  }

  // Limpiar recursos
  cleanup(): void {
    this.googleCloudService.cleanup();
  }
} 