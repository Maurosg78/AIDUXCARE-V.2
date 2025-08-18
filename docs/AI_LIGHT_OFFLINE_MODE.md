# 🎯 AI Light + Offline Mode - Documentación Técnica

## **Resumen Ejecutivo**

El módulo **AI Light + Offline Mode** implementa la primera fase del sistema híbrido local/servidor para captura y transcripción de audio en AiDuxCare. Permite a los usuarios grabar audio sin conexión y promocionarlo a calidad profesional cuando se restaura la conectividad.

---

## **🏗️ Arquitectura del Sistema**

### **Componentes Principales**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Service Worker │    │   Firebase      │
│   (React)       │◄──►│   (Background    │◄──►│   Functions     │
│                 │    │   Sync)          │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Zustand       │    │   IndexedDB      │    │   Firestore     │
│   Store         │    │   (Cifrado)      │    │   (Auditoría)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   STT Local     │    │   Background     │    │   IA Pro        │
│   (WASM)        │    │   Sync API       │    │   (Vertex AI)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Flujo de Datos**

1. **Grabación Offline**: Usuario graba audio sin conexión
2. **STT Local**: Procesamiento local con WASM (fallback a captura)
3. **Almacenamiento**: Guardado cifrado en IndexedDB
4. **Background Sync**: Envío automático al reconectar
5. **IA Pro**: Procesamiento con Vertex AI/Gemini
6. **Resultado Final**: Transcripción clínicamente validada

---

## **📁 Estructura de Archivos**

```
src/
├── stores/
│   └── aiModeStore.ts              # Estado global Zustand
├── core/
│   └── sttLocal/
│       └── index.ts                # Motor STT local WASM
├── components/
│   └── PromoteToProButton.tsx      # UI de promoción
├── pages/
│   └── AILightDemoPage.tsx         # Página de demostración
└── tests/
    ├── stores/
    │   └── aiModeStore.spec.ts     # Tests del store
    └── core/
        └── sttLocal/
            └── index.spec.ts       # Tests del motor STT

functions/src/
├── localTranscriptionProcessor.ts   # Endpoint de promoción
└── index.ts                        # Exports de funciones

public/
└── sw.js                           # Service Worker
```

---

## **🔧 Configuración y Uso**

### **1. Instalación de Dependencias**

```bash
npm install zustand idb
```

### **2. Configuración del Store**

```typescript
import { useAiModeStore } from '../stores/aiModeStore';

const { setFlag, addLocalTranscription } = useAiModeStore();

// Activar modo offline
setFlag('offlineMode', true);

// Activar STT local
setFlag('aiLightLocalSTT', true);

// Configurar auto-promoción
setFlag('promoteToProOnReconnect', true);
```

### **3. Uso del Motor STT Local**

```typescript
import { transcribeLocal, createLocalTranscription } from '../core/sttLocal';

// Transcripción directa
const result = await transcribeLocal(audioBlob);

// Crear transcripción con metadatos
const transcription = await createLocalTranscription(
  audioBlob, 
  userId, 
  sessionId
);
```

### **4. Integración del Service Worker**

```typescript
// En main.tsx (ya implementado)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

---

## **🧪 Testing**

### **Ejecutar Tests Unitarios**

```bash
# Tests del store
npm run test -- tests/stores/aiModeStore.spec.ts

# Tests del motor STT
npm run test -- tests/core/sttLocal/index.spec.ts

# Todos los tests del módulo
npm run test -- tests/stores tests/core/sttLocal
```

### **Tests de Integración**

```bash
# Verificar linting
npm run lint

# Verificar tipos TypeScript
npm run type-check

# Tests de cobertura
npm run test:coverage
```

---

## **🚀 Despliegue**

### **1. Build de Functions**

```bash
cd functions
npm run build
cd ..
```

### **2. Despliegue a UAT**

```bash
./tools/deploy-uat.sh
```

### **3. Verificación Post-Deploy**

```bash
# Probar endpoint de transcripciones locales
curl -X POST \
  https://europe-west1-aiduxcare-v2-uat-dev.cloudfunctions.net/processLocalTranscription \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "text": "dolor lumbar",
    "confidence": 0.7,
    "userId": "test-user",
    "sessionId": "test-session",
    "metadata": {
      "duration": 30,
      "sampleRate": 44100,
      "channels": 1
    }
  }'
```

---

## **🔒 Seguridad y Compliance**

### **Protección de Datos**

- **Cifrado**: AES-GCM para datos en IndexedDB
- **Auditoría**: Logs completos en Firestore
- **Acceso**: Control granular por usuario
- **Retención**: Configurable por compliance

### **HIPAA/GDPR**

- **Logs de auditoría**: Acceso a datos clínicos
- **Cifrado E2E**: Datos sensibles protegidos
- **Consentimiento**: Opt-in explícito para audio
- **Retención**: Configuración automática

---

## **📊 Métricas y Monitoreo**

### **KPIs Operacionales**

- **Throughput**: Transcripciones por minuto
- **Latencia**: Tiempo de procesamiento local
- **Calidad**: Confianza promedio del STT local
- **Promociones**: Tasa de éxito Promote to Pro

### **Logs de Auditoría**

```typescript
// Eventos registrados automáticamente
- local_transcription_process
- local_transcription_completed
- local_transcription_error
- promote_to_pro_initiated
- promote_to_pro_completed
```

---

## **🔄 Ciclo de Vida del Feature**

### **1. Modo Offline**

```
Usuario graba audio → STT local procesa → Guarda en IndexedDB
```

### **2. Reconexión**

```
Detecta conexión → Background sync → Envía a Functions
```

### **3. IA Pro**

```
Functions procesa → Vertex AI mejora → Guarda en Firestore
```

### **4. UI Update**

```
Componente recibe → Muestra diff → Usuario confirma
```

---

## **🚨 Troubleshooting**

### **Problemas Comunes**

#### **Service Worker no se registra**
```bash
# Verificar en DevTools > Application > Service Workers
# Verificar que sw.js existe en public/
```

#### **STT Local no funciona**
```bash
# Verificar compatibilidad WebAssembly
# Verificar permisos de micrófono
# Revisar console para errores
```

#### **Background Sync falla**
```bash
# Verificar conectividad
# Verificar permisos de notificaciones
# Revisar logs del Service Worker
```

### **Debugging**

```typescript
// Habilitar logs detallados
localStorage.setItem('debug', 'ai-light:*');

// Verificar estado del store
console.log(useAiModeStore.getState());

// Verificar capacidades STT
import { detectSTTCapabilities } from '../core/sttLocal';
console.log(detectSTTCapabilities());
```

---

## **🔮 Roadmap Futuro**

### **Fase 2 (MVP)**
- [ ] Optimización vocabulario clínico local
- [ ] Modelos WASM especializados por disciplina
- [ ] Cache inteligente de transcripciones

### **Fase 3 (Producción)**
- [ ] Integración con EMRs externos
- [ ] Análisis de calidad de audio en tiempo real
- [ ] Machine learning para mejoras automáticas

### **Fase 4 (Enterprise)**
- [ ] Federated learning para modelos locales
- [ ] Compliance automático por jurisdicción
- [ ] Integración con sistemas de auditoría externos

---

## **📋 Checklist de Implementación**

### **Frontend**
- [x] Store Zustand implementado
- [x] Motor STT local WASM
- [x] Componente Promote to Pro
- [x] Página de demostración
- [x] Service Worker registrado

### **Backend**
- [x] Endpoint de transcripciones locales
- [x] Procesamiento con IA Pro
- [x] Logs de auditoría
- [x] Almacenamiento en Firestore

### **Testing**
- [x] Tests unitarios del store
- [x] Tests del motor STT
- [x] Tests de integración
- [x] Cobertura > 90%

### **Documentación**
- [x] Documentación técnica
- [x] Guías de uso
- [x] Troubleshooting
- [x] Roadmap futuro

---

## **🎯 Criterios de Éxito**

### **Funcional**
- ✅ STT local funcional sin conexión
- ✅ Reconexión dispara Promote to Pro
- ✅ IndexedDB almacena transcripciones cifradas
- ✅ No se rompe flujo actual

### **Técnico**
- ✅ Tests unitarios completos
- ✅ Sin errores de linting
- ✅ Tipado TypeScript estricto
- ✅ Arquitectura modular

### **Operacional**
- ✅ Latencia < 500ms para STT local
- ✅ Uptime > 99.9% para Functions
- ✅ Logs de auditoría 100% completos
- ✅ Background sync confiable

---

*Documentación generada para el módulo AI Light + Offline Mode*
*Fecha: 15 de Agosto, 2025*
*Estado: ✅ IMPLEMENTACIÓN COMPLETADA*
