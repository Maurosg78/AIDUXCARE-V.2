import RealAudioCaptureService from './RealAudioCaptureService';

/**
 * Servicio de audio mock para demostración
 */
class MockAudioCaptureService {
  private isRecording: boolean = false;
  private currentTranscript: string = '';
  private callback: ((text: string, isFinal: boolean) => void) | null = null;
  private timer: NodeJS.Timeout | null = null;

  private sampleTexts = [
    "El paciente presenta dolor en el hombro derecho desde hace una semana.",
    "Refiere molestias que aumentan con el movimiento y mejoran con el reposo.",
    "No hay antecedentes de trauma previo.",
    "Examen físico muestra limitación en la abducción del brazo.",
    "Se observa dolor a la palpación en el área del tendón supraespinoso.",
    "Recomiendo radiografía de hombro y tratamiento con antiinflamatorios.",
    "Control en una semana para evaluar evolución."
  ];

  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.callback = callback;
    this.currentTranscript = '';
    
    console.log('🎭 Iniciando grabación simulada...');
    
    // Simular transcripción gradual
    let sentenceIndex = 0;
    this.timer = setInterval(() => {
      if (!this.isRecording || sentenceIndex >= this.sampleTexts.length) {
        return;
      }
      
      const sentence = this.sampleTexts[sentenceIndex];
      this.currentTranscript += sentence + ' ';
      
      if (this.callback) {
        this.callback(this.currentTranscript, true);
      }
      
      sentenceIndex++;
    }, 2000);
  }

  stopRecording(): string {
    this.isRecording = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.callback = null;
    console.log('🎭 Grabación simulada detenida');
    return this.currentTranscript.trim();
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isServiceSupported(): boolean {
    return true;
  }
}

/**
 * Servicio híbrido que detecta automáticamente entre audio real y mock
 */
export default class HybridAudioService {
  private realAudioService: RealAudioCaptureService;
  private mockAudioService: MockAudioCaptureService;
  private currentService: RealAudioCaptureService | MockAudioCaptureService;
  private isUsingReal: boolean = false;
  private preferredService: 'real' | 'mock' = 'mock';

  constructor() {
    this.realAudioService = new RealAudioCaptureService();
    this.mockAudioService = new MockAudioCaptureService();
    
    // Inicializar siempre con el servicio mock por defecto
    this.currentService = this.mockAudioService;
    this.isUsingReal = false;
    
    console.log('🔧 HybridAudioService inicializado en modo seguro (mock)');
  }

  // Método para determinar qué servicio usar basado en preferencia del usuario
  private determineService(): RealAudioCaptureService | MockAudioCaptureService {
    // Solo usar real si el usuario lo ha solicitado explícitamente
    if (this.preferredService === 'real' && this.realAudioService.isServiceSupported()) {
      return this.realAudioService;
    }
    
    // Por defecto, usar mock
    return this.mockAudioService;
  }

  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    try {
      // Si estamos usando el servicio real, intentar iniciar
      if (this.isUsingReal) {
        await this.realAudioService.startRecording(callback);
        console.log('✅ Grabación real iniciada exitosamente');
      } else {
        // Usar servicio mock
        await this.mockAudioService.startRecording(callback);
        console.log('✅ Grabación simulada iniciada');
      }
    } catch (error) {
      console.warn('Error con servicio principal, cambiando a fallback:', error);
      
      // Si el servicio real falla, cambiar a mock automáticamente
      if (this.isUsingReal) {
        console.log('🔄 Cambiando automáticamente a modo demostración...');
        this.currentService = this.mockAudioService;
        this.isUsingReal = false;
        
        try {
          await this.mockAudioService.startRecording(callback);
          console.log('✅ Fallback a grabación simulada exitoso');
        } catch (fallbackError) {
          throw new Error('No se pudo iniciar ningún servicio de audio');
        }
      } else {
        throw error;
      }
    }
  }

  stopRecording(): string {
    if (this.isUsingReal) {
      return this.realAudioService.stopRecording();
    } else {
      return this.mockAudioService.stopRecording();
    }
  }

  isCurrentlyRecording(): boolean {
    return this.currentService.isCurrentlyRecording();
  }

  isServiceSupported(): boolean {
    return this.currentService.isServiceSupported();
  }

  // Métodos de información
  getCurrentServiceType(): 'real' | 'mock' {
    return this.isUsingReal ? 'real' : 'mock';
  }

  getServiceDisplayName(): string {
    const activeService = this.getActiveService();
    if (activeService === 'real') {
      return '🎙️ Reconocimiento de Voz Real';
    } else {
      return '🎭 Modo Demostración';
    }
  }

  // Método mejorado para obtener información detallada del servicio
  getDetailedServiceInfo(): string {
    const activeService = this.getActiveService();
    const isRealSupported = this.realAudioService.isServiceSupported();
    
    if (activeService === 'real') {
      return `🎙️ Usando audio real del ambiente (Activo)`;
    } else {
      return `🎭 Usando transcripción simulada médica ${!isRealSupported ? '(Audio real no disponible)' : '(Modo seguro - sin errores)'}`;
    }
  }

  // Método para cambiar manualmente entre servicios
  toggleService(): string {
    if (this.isCurrentlyRecording()) {
      return 'No se puede cambiar de servicio mientras se está grabando';
    }

    if (this.preferredService === 'real') {
      this.preferredService = 'mock';
      this.currentService = this.mockAudioService;
      this.isUsingReal = false;
      console.log('🔄 Cambiado a modo demostración');
      return 'Cambiado a modo demostración (más estable)';
    } else {
      if (this.realAudioService.isServiceSupported()) {
        this.preferredService = 'real';
        this.currentService = this.realAudioService;
        this.isUsingReal = true;
        console.log('🔄 Cambiado a audio real');
        return 'Cambiado a audio real (puede generar errores de red)';
      } else {
        return 'Audio real no disponible en este navegador';
      }
    }
  }

  // Método para forzar cambio de servicio
  async switchToMock(): Promise<void> {
    if (this.isCurrentlyRecording()) {
      throw new Error('No se puede cambiar de servicio mientras se está grabando');
    }
    
    this.currentService = this.mockAudioService;
    this.isUsingReal = false;
    console.log('🔄 Cambiado manualmente a modo demostración');
  }

  async switchToReal(): Promise<void> {
    if (this.isCurrentlyRecording()) {
      throw new Error('No se puede cambiar de servicio mientras se está grabando');
    }

    if (!this.realAudioService.isServiceSupported()) {
      throw new Error('Servicio de audio real no soportado en este navegador');
    }

    this.currentService = this.realAudioService;
    this.isUsingReal = true;
    console.log('🔄 Cambiado manualmente a audio real');
  }

  // Diagnóstico completo
  getDiagnosticInfo(): any {
    return {
      currentService: this.getCurrentServiceType(),
      displayName: this.getServiceDisplayName(),
      realServiceSupported: this.realAudioService.isServiceSupported(),
      isSecureContext: window.isSecureContext,
      protocol: location.protocol,
      hostname: location.hostname,
      recording: this.isCurrentlyRecording(),
      realServiceDiagnostic: this.isUsingReal ? this.realAudioService.getDiagnosticInfo() : null
    };
  }

  private getActiveService(): 'real' | 'mock' {
    return this.isUsingReal ? 'real' : 'mock';
  }
} 