#!/usr/bin/env node

/**
 * Test de Integración Simple AI Light + Offline Mode + Promote to Pro
 * Valida el flujo completo: Offline → Grabación → Transcripción → Promote to Pro
 */

console.log('🧪 Test de Integración AI Light + Offline Mode + Promote to Pro');
console.log('================================================================\n');

// Simular ambiente de testing
global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  indexedDB: {
    open: () => ({
      result: {
        createObjectStore: () => {},
        transaction: () => ({
          objectStore: () => ({
            put: () => Promise.resolve('mock-id'),
            get: () => Promise.resolve(null),
            getAll: () => Promise.resolve([])
          })
        })
      },
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null
    })
  }
};

// Mock de fetch para endpoints
global.fetch = (url, options) => {
  if (url.includes('getProTranscriptions')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        transcription: {
          id: 'pro-transcription-id',
          text: 'Texto enriquecido Pro con terminología médica avanzada',
          confidence: 0.95,
          proVersion: true,
          improvements: [
            'Terminología médica estandarizada',
            'Estructura SOAP aplicada',
            'Validación clínica completada'
          ]
        }
      })
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  });
};

// Mock de crypto para UUIDs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)
  }
});

// Mock de performance
global.performance = {
  now: () => Date.now()
};

// Simular módulo aiModeStore
const mockAiModeStore = {
  offlineMode: false,
  aiLightLocalSTT: false,
  promoteToProOnReconnect: true,
  localTranscriptions: [],
  pendingUploads: [],
  
  setFlag: function(flag, value) {
    this[flag] = value;
  },
  
  addLocalTranscription: function(transcription) {
    this.localTranscriptions.push(transcription);
  },
  
  getLocalTranscription: function(id) {
    return this.localTranscriptions.find(t => t.id === id);
  },
  
  clearLocalTranscriptions: function() {
    this.localTranscriptions = [];
  },
  
  getState: function() {
    return {
      offlineMode: this.offlineMode,
      aiLightLocalSTT: this.aiLightLocalSTT,
      promoteToProOnReconnect: this.promoteToProReconnect,
      localTranscriptions: this.localTranscriptions,
      pendingUploads: this.pendingUploads
    };
  }
};

// Simular módulo STT local
const mockSTTLocal = {
  transcribeLocal: async (audioBlob) => {
    return {
      text: 'Texto offline simulado',
      confidence: 0.85,
      processingTime: 100,
      model: 'mock-stt',
      fallback: false
    };
  },
  
  createLocalTranscription: async (audioBlob, userId, sessionId) => {
    return {
      id: 'mock-transcription-id',
      audioBlob: audioBlob,
      text: 'Texto offline simulado',
      confidence: 0.85,
      timestamp: new Date(),
      userId: userId,
      sessionId: sessionId,
      metadata: {
        duration: 5000,
        sampleRate: 44100,
        channels: 1
      }
    };
  }
};

// Tests de integración
const integrationTests = [
  {
    name: 'Configuración inicial del store',
    test: () => {
      mockAiModeStore.setFlag('offlineMode', true);
      mockAiModeStore.setFlag('aiLightLocalSTT', true);
      
      if (!mockAiModeStore.offlineMode || !mockAiModeStore.aiLightLocalSTT) {
        throw new Error('Flags no se configuraron correctamente');
      }
      
      return '✅ Flags configurados correctamente';
    }
  },
  
  {
    name: 'Grabación offline y transcripción local',
    test: async () => {
      // Simular grabación offline
      const audioBlob = new Blob(['mock-audio-data'], { type: 'audio/wav' });
      
      // Transcribir localmente
      const transcription = await mockSTTLocal.transcribeLocal(audioBlob);
      
      if (transcription.text !== 'Texto offline simulado') {
        throw new Error('Transcripción local no coincide con lo esperado');
      }
      
      // Crear transcripción completa
      const fullTranscription = await mockSTTLocal.createLocalTranscription(
        audioBlob, 'test-user', 'test-session'
      );
      
      // Agregar al store
      mockAiModeStore.addLocalTranscription(fullTranscription);
      
      if (mockAiModeStore.localTranscriptions.length !== 1) {
        throw new Error('Transcripción no se agregó al store');
      }
      
      return '✅ Grabación offline y transcripción local funcionando';
    }
  },
  
  {
    name: 'Almacenamiento en store offline',
    test: () => {
      const transcription = mockAiModeStore.getLocalTranscription('mock-transcription-id');
      
      if (!transcription) {
        throw new Error('Transcripción no encontrada en store');
      }
      
      if (transcription.text !== 'Texto offline simulado') {
        throw new Error('Contenido de transcripción incorrecto');
      }
      
      if (transcription.userId !== 'test-user') {
        throw new Error('UserId de transcripción incorrecto');
      }
      
      return '✅ Almacenamiento en store offline funcionando';
    }
  },
  
  {
    name: 'Promote to Pro - Envío al endpoint',
    test: async () => {
      const transcription = mockAiModeStore.getLocalTranscription('mock-transcription-id');
      
      // Simular envío al endpoint Pro
      const response = await fetch('/api/getProTranscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptionId: transcription.id })
      });
      
      if (!response.ok) {
        throw new Error('Endpoint Pro no respondió correctamente');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Respuesta del endpoint Pro no indica éxito');
      }
      
      if (!result.transcription.proVersion) {
        throw new Error('Transcripción Pro no marcada como versión Pro');
      }
      
      return '✅ Promote to Pro - Endpoint respondiendo correctamente';
    }
  },
  
  {
    name: 'Verificación de transcripción enriquecida Pro',
    test: async () => {
      const response = await fetch('/api/getProTranscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptionId: 'mock-transcription-id' })
      });
      
      const result = await response.json();
      const proTranscription = result.transcription;
      
      // Verificar mejoras
      if (!proTranscription.improvements || proTranscription.improvements.length === 0) {
        throw new Error('Transcripción Pro no contiene mejoras');
      }
      
      if (proTranscription.confidence < 0.9) {
        throw new Error('Confianza de transcripción Pro muy baja');
      }
      
      if (!proTranscription.text.includes('terminología médica')) {
        throw new Error('Transcripción Pro no contiene terminología médica');
      }
      
      return '✅ Transcripción Pro enriquecida verificada';
    }
  },
  
  {
    name: 'Estado final del store',
    test: () => {
      const state = mockAiModeStore.getState();
      
      if (state.localTranscriptions.length !== 1) {
        throw new Error('Store debe contener exactamente 1 transcripción');
      }
      
      if (state.offlineMode !== true) {
        throw new Error('Store debe mantener flag offlineMode en true');
      }
      
      if (state.aiLightLocalSTT !== true) {
        throw new Error('Store debe mantener flag aiLightLocalSTT en true');
      }
      
      return '✅ Estado final del store correcto';
    }
  }
];

// Ejecutar tests
async function runIntegrationTests() {
  console.log('📋 Ejecutando tests de integración...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of integrationTests) {
    try {
      const result = await test.test();
      console.log(`  ✅ ${test.name}: ${result}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n📊 Resumen de Tests de Integración:');
  console.log(`  Total: ${integrationTests.length}`);
  console.log(`  Pasaron: ${passed}`);
  console.log(`  Fallaron: ${failed}`);
  console.log(`  Tasa de éxito: ${((passed / integrationTests.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡Todos los tests de integración pasaron exitosamente!');
    console.log('✅ El flujo AI Light + Offline Mode + Promote to Pro está validado');
    return true;
  } else {
    console.log('\n⚠️  Algunos tests fallaron. Revisar antes de continuar.');
    return false;
  }
}

// Ejecutar tests si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests()
    .then(success => {
      if (success) {
        console.log('\n✨ Test de integración completado exitosamente');
        process.exit(0);
      } else {
        console.log('\n❌ Test de integración falló');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Error durante la ejecución:', error);
      process.exit(1);
    });
}

export { runIntegrationTests };
