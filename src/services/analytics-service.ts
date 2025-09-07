// @ts-nocheck
class AnalyticsService {
  private enabled = false;
  private sessionData: any = {};
  private events: any[] = [];
  private startTime: number = 0;
  
  // Activar solo cuando comience evaluación MVP
  enable() {
    this.enabled = localStorage.getItem('MVP_EVALUATION') === 'true';
    if (this.enabled) {
      this.startTime = Date.now();
      this.initializeTracking();
    }
  }

  private initializeTracking() {
    // Capturar TODA interacción
    document.addEventListener('click', this.trackClick);
    document.addEventListener('input', this.trackInput);
    
    // Métricas de rendimiento
    this.trackPerformance();
    
    // Errores y reintentos
    window.addEventListener('error', this.trackError);
    
    // Tiempo en cada sección
    this.trackPageTime();
    
    // Flujos abandonados
    window.addEventListener('beforeunload', this.trackAbandonment);
  }

  track(eventName: string, data: any) {
    if (!this.enabled) return;
    
    const event = {
      name: eventName,
      timestamp: Date.now(),
      timeFromStart: Date.now() - this.startTime,
      data,
      // Contexto
      currentTab: document.querySelector('.border-blue-500')?.textContent,
      hasPatient: !!document.querySelector('[data-patient-id]'),
      transcriptLength: document.querySelector('textarea')?.value.length || 0
    };
    
    this.events.push(event);
    
    // Eventos críticos para Niagara
    if (eventName === 'WORKFLOW_COMPLETE') {
      this.calculateBusinessMetrics();
    }
  }

  private calculateBusinessMetrics() {
    const metrics = {
      // MÉTRICAS DE NEGOCIO
      timeToComplete: this.events.find(e => e.name === 'SOAP_GENERATED')?.timeFromStart,
      timeVsTraditional: {
        traditional: 1200000, // 20 minutos en ms
        withAidux: this.events.find(e => e.name === 'SOAP_GENERATED')?.timeFromStart,
        reduction: 0
      },
      
      // MÉTRICAS DE PRODUCTO
      featuresUsed: {
        transcription: this.events.filter(e => e.name === 'TRANSCRIPTION_USED').length > 0,
        aiAnalysis: this.events.filter(e => e.name === 'AI_ANALYSIS').length > 0,
        dictation: this.events.filter(e => e.name === 'DICTATION_USED').length > 0,
        testLinks: this.events.filter(e => e.name === 'TEST_LINK_CLICKED').length
      },
      
      // MÉTRICAS DE CALIDAD
      dataCompleteness: {
        patientData: this.checkDataCompleteness('patient'),
        evaluation: this.checkDataCompleteness('evaluation'),
        soapSections: this.checkDataCompleteness('soap')
      },
      
      // MÉTRICAS DE EFICIENCIA
      clicksTotal: this.events.filter(e => e.name === 'CLICK').length,
      clicksVsOptimal: {
        actual: this.events.filter(e => e.name === 'CLICK').length,
        optimal: 15, // Flujo perfecto
        efficiency: 0
      },
      
      // MÉTRICAS DE IA
      aiMetrics: {
        vertexCalls: this.events.filter(e => e.name === 'VERTEX_CALL').length,
        vertexLatency: this.events.filter(e => e.name === 'VERTEX_RESPONSE').map(e => e.data.latency),
        vertexErrors: this.events.filter(e => e.name === 'VERTEX_ERROR').length,
        fallbacksUsed: this.events.filter(e => e.name === 'FALLBACK_USED').length
      },
      
      // MÉTRICAS DE ADOPCIÓN
      userBehavior: {
        testsProposed: this.events.find(e => e.name === 'TESTS_PROPOSED')?.data.count || 0,
        testsCompleted: this.events.filter(e => e.name === 'TEST_COMPLETED').length,
        testsSkipped: this.events.filter(e => e.name === 'TEST_SKIPPED').length,
        customTestsAdded: this.events.filter(e => e.name === 'CUSTOM_TEST_ADDED').length
      },
      
      // PUNTOS DE FRICCIÓN
      friction: {
        retries: this.events.filter(e => e.name.includes('RETRY')).length,
        corrections: this.events.filter(e => e.name === 'TEXT_CORRECTED').length,
        backNavigation: this.events.filter(e => e.name === 'BACK_NAVIGATION').length,
        timeStuck: this.findLongPauses()
      }
    };
    
    // Calcular porcentajes
    metrics.timeVsTraditional.reduction = 
      ((metrics.timeVsTraditional.traditional - metrics.timeVsTraditional.withAidux) / 
       metrics.timeVsTraditional.traditional * 100).toFixed(1);
    
    metrics.clicksVsOptimal.efficiency = 
      (metrics.clicksVsOptimal.optimal / metrics.clicksVsOptimal.actual * 100).toFixed(1);
    
    // Enviar a Firebase
    this.sendToFirebase(metrics);
    
    // Mostrar resumen para demo
    console.log('📊 MÉTRICAS PARA NIAGARA:', metrics);
    
    return metrics;
  }
  
  private checkDataCompleteness(section: string): number {
    // Verificar qué porcentaje de campos fueron completados
    const fields = {
      patient: ['name', 'age', 'diagnosis', 'medications'],
      evaluation: ['pain', 'strength', 'range', 'tests'],
      soap: ['subjective', 'objective', 'assessment', 'plan']
    };
    
    const completed = this.events.filter(e => 
      e.name === `${section.toUpperCase()}_FIELD_COMPLETED`
    ).length;
    
    return (completed / fields[section].length * 100);
  }
  
  private findLongPauses(): any[] {
    const pauses = [];
    for (let i = 1; i < this.events.length; i++) {
      const timeDiff = this.events[i].timestamp - this.events[i-1].timestamp;
      if (timeDiff > 10000) { // Más de 10 segundos
        pauses.push({
          duration: timeDiff,
          afterEvent: this.events[i-1].name,
          beforeEvent: this.events[i].name
        });
      }
    }
    return pauses;
  }
  
  private sendToFirebase(metrics: any) {
    // Aquí enviarías a Firebase Analytics
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: this.sessionData.id,
        metrics,
        events: this.events,
        timestamp: new Date().toISOString()
      })
    });
  }
  
  // Métodos de tracking específicos
  trackClick = (e: MouseEvent) => {
    this.track('CLICK', {
      element: (e.target as HTMLElement).tagName,
      text: (e.target as HTMLElement).textContent?.slice(0, 20),
      position: { x: e.clientX, y: e.clientY }
    });
  };
  
  trackInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.track('INPUT', {
      field: target.name || target.placeholder,
      length: target.value.length,
      type: target.type
    });
  };
  
  trackError = (e: ErrorEvent) => {
    this.track('ERROR', {
      message: e.message,
      stack: e.error?.stack,
      url: e.filename
    });
  };
  
  trackPageTime() {
    let lastTab = '';
    setInterval(() => {
      const currentTab = document.querySelector('.border-blue-500')?.textContent || '';
      if (currentTab !== lastTab) {
        this.track('TAB_CHANGE', {
          from: lastTab,
          to: currentTab,
          timeInPrevious: Date.now() - this.startTime
        });
        lastTab = currentTab;
      }
    }, 1000);
  }
  
  trackAbandonment = () => {
    this.track('SESSION_ABANDONED', {
      lastAction: this.events[this.events.length - 1],
      completed: !!this.events.find(e => e.name === 'SOAP_GENERATED')
    });
  };
}

export const Analytics = new AnalyticsService();

// Comando para activar evaluación MVP
(window as any).startMVPEvaluation = () => {
  localStorage.setItem('MVP_EVALUATION', 'true');
  Analytics.enable();
  console.log('🚀 Evaluación MVP activada - Capturando todas las métricas');
};
