# 🔍 DEBUGGING: METHOD NOT ALLOWED

## 📋 **SITUACIÓN ACTUAL**

### **Error Reportado**
```json
{"success":false,"error":"Method not allowed","allowedMethods":["POST","OPTIONS"]}
```

### **Evidencia Contradictoria**
- ✅ **curl POST funciona**: `{"success":false,"error":"No se encontró datos de audio","expectedField":"audioData"}`
- ✅ **Health Check funciona**: `{"status":"healthy","service":"Google Cloud Speech-to-Text"}`
- ❌ **Navegador reporta**: "Method not allowed"

## 🔍 **HIPÓTESIS PRINCIPALES**

### **1. Problema de CORS/Preflight**
- El navegador puede estar enviando una petición OPTIONS primero
- La Cloud Function puede estar rechazando el preflight
- Posible configuración CORS incorrecta

### **2. Redirect/Proxy Intermedio**
- Algún proxy o CDN puede estar interceptando la petición
- La URL final puede ser diferente a la esperada
- Posible redirect que cambia el método

### **3. Headers Problemáticos**
- Algún header específico del navegador causa rechazo
- Content-Type o Accept pueden estar mal configurados
- User-Agent o cookies problemáticos

## 🛠️ **DEBUGGING IMPLEMENTADO**

### **1. Test Directo**
```javascript
// Nueva función testDirectTranscription()
const testPayload = {
    audioData: 'dGVzdCBhdWRpbyBkYXRh', // base64 de prueba
    mimeType: 'audio/webm',
    size: 1024,
    timestamp: Date.now()
};

// Logging detallado de request/response
log(`🌐 URL destino: ${TRANSCRIBE_URL}`);
log(`📡 Método: POST`);
log(`📋 Headers: Content-Type: application/json`);
```

### **2. Captura Completa de Response**
```javascript
log(`📡 Status de respuesta: ${response.status} ${response.statusText}`);
log(`🔗 URL final: ${response.url}`);
log(`📋 Headers de respuesta: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
```

### **3. Error Handling Mejorado**
- Captura de stack traces completos
- Logging de todos los headers de request y response
- Verificación de URL final vs URL inicial

## 🎯 **PASOS DE DEBUGGING**

### **Paso 1: Test Directo**
1. Abre `scripts/test-system-quick.html`
2. Haz clic en "🧪 Test Directo"
3. Observa los logs detallados

### **Paso 2: Análisis de Headers**
- Verifica si `response.url` es diferente a `TRANSCRIBE_URL`
- Revisa headers de respuesta para pistas de redirect
- Compara con curl que funciona

### **Paso 3: Comparación**
```bash
# Esto funciona:
curl -X POST "https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/transcribeAudio" \
  -H "Content-Type: application/json" \
  -d '{"audioData":"dGVzdA==","mimeType":"audio/webm","size":1024}'

# Pero el navegador reporta "Method not allowed"
```

## 🚨 **POSIBLES CAUSAS ESPECÍFICAS**

### **1. CORS Preflight Rejection**
- El navegador envía OPTIONS antes de POST
- La Cloud Function rechaza OPTIONS con "Method not allowed"
- Pero nuestra función SÍ maneja OPTIONS

### **2. URL Encoding/Redirect**
- Algún caracter en la URL causa redirect
- El redirect cambia POST a GET
- GET no está permitido en transcribeAudio

### **3. Browser Security Policy**
- Política de seguridad del navegador
- Mixed content (HTTP vs HTTPS)
- Restricciones de CORS específicas

## 📊 **DATOS PARA RECOPILAR**

Cuando ejecutes el "Test Directo", necesitamos ver:

1. **URL Final**: ¿Es igual a la URL inicial?
2. **Headers de Response**: ¿Hay algún redirect?
3. **Status Code**: ¿Es realmente 405 o algo diferente?
4. **Error Message**: ¿Es exactamente "Method not allowed"?
5. **Network Tab**: ¿Hay múltiples peticiones (preflight)?

## 🎯 **PRÓXIMO PASO**

**Mauricio**, ejecuta el "Test Directo" y comparte los logs completos. Esto nos dirá exactamente qué está pasando entre el navegador y la Cloud Function.

La discrepancia entre curl (funciona) y navegador (falla) sugiere un problema específico del navegador que podemos identificar con este debugging avanzado. 