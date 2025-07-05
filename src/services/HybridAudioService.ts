import RealAudioCaptureService from './RealAudioCaptureService';

/**
 * Servicio de audio médico para captura real del ambiente
 * Optimizado para consultas médicas profesionales
 */
export default class HybridAudioService {
  private realAudioService: RealAudioCaptureService;

  constructor() {
    // Solo crear y usar el servicio de audio real
    this.realAudioService = new RealAudioCaptureService();
    
    console.log('🎙️ Servicio de audio médico inicializado para captura real');
  }

  // Información clara del servicio
  getDetailedServiceInfo(): string {
    const isRealSupported = this.realAudioService.isServiceSupported();
    
    if (isRealSupported) {
      return `🎙️ Captura de audio real del ambiente (Listo para consultas médicas)`;
    } else {
      return `❌ Audio real no disponible en este navegador`;
    }
  }

  getServiceDisplayName(): string {
    return '🎙️ Audio Real Médico';
  }

  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    try {
      console.log('🎙️ Iniciando captura de audio real para consulta médica...');
      await this.realAudioService.startRecording(callback);
      console.log('✅ Grabación de consulta médica iniciada');
    } catch (error) {
      console.error('❌ Error al iniciar grabación médica:', error);
      throw error;
    }
  }

  stopRecording(): string {
    console.log('🛑 Deteniendo grabación de consulta médica...');
    const result = this.realAudioService.stopRecording();
    console.log('✅ Grabación médica detenida');
    return result;
  }

  isCurrentlyRecording(): boolean {
    return this.realAudioService.isCurrentlyRecording();
  }

  getCurrentServiceType(): 'real' {
    return 'real';
  }

  // Método de diagnóstico para verificar el estado del servicio
  getDiagnosticInfo(): any {
    return {
      serviceType: 'real-only',
      supported: this.realAudioService.isServiceSupported(),
      recording: this.isCurrentlyRecording(),
      isSecureContext: window.isSecureContext,
      protocol: location.protocol,
      hostname: location.hostname,
      realServiceDiagnostic: this.realAudioService.getDiagnosticInfo()
    };
  }
} 