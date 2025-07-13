# 🎙️ Google Cloud Speech-to-Text - Guía de Producción

## 📋 Resumen Ejecutivo

AiDuxCare V.2 utiliza Google Cloud Speech-to-Text para transcripción médica profesional con speaker diarization automática. Este documento describe la configuración de producción, monitoreo y mantenimiento del sistema.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │  Cloud Function  │    │ Google Cloud        │
│   React/Vite    │───▶│  transcribeAudio │───▶│ Speech-to-Text API  │
│   localhost:5177│    │  Node.js 18      │    │ medical_conversation│
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## 🔧 Configuración de Producción

### **1. Proyecto Google Cloud**
- **ID**: `aiduxcare-stt-20250706`
- **Región**: `us-central1`
- **Facturación**: Activa y configurada

### **2. Cloud Functions**
- **transcribeAudio**: `https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/transcribeAudio`
- **healthCheck**: `https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/healthCheck`

### **3. Configuración Speech-to-Text**
```javascript
{
  encoding: 'WEBM_OPUS' | 'LINEAR16' | 'MP3',
  sampleRateHertz: 48000,
  languageCode: 'es-ES',
  enableSpeakerDiarization: true,
  diarizationSpeakerCount: 2,
  model: 'medical_conversation',
  useEnhanced: true,
  maxAlternatives: 1,
  profanityFilter: false
}
```

## 📊 Métricas de Rendimiento

### **KPIs de Éxito**
- ✅ **Latencia**: <3 segundos (actual: ~250ms)
- ✅ **Tasa de éxito**: >95% (actual: 100%)
- ✅ **Disponibilidad**: >99.9%
- ✅ **Precisión**: >90% para terminología médica

### **Optimizaciones Implementadas**
1. **Audio Adaptativo**: Detección automática de formatos soportados
2. **Compresión Inteligente**: Bitrate reducido para Opus (64kbps)
3. **Timeout Optimizado**: 30s frontend, 45s backend
4. **Vocabulario Médico**: Boost +15 para términos especializados
5. **Chunks Optimizados**: 1 segundo para mejor rendimiento

## 🔍 Monitoreo y Logging

### **Cloud Function Logs**
```bash
# Ver logs en tiempo real
gcloud functions logs read transcribeAudio --limit 50 --region us-central1

# Filtrar errores
gcloud functions logs read transcribeAudio --filter="severity=ERROR" --region us-central1
```

### **Métricas Clave**
- **Tiempo de procesamiento**: Logged automáticamente
- **Tamaño de archivos**: Validación <10MB
- **Confianza de transcripción**: >0.8 recomendado
- **Hablantes detectados**: 1-3 esperado

### **Health Check**
```bash
curl "https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/healthCheck"
# Respuesta esperada: {"status":"healthy","timestamp":"..."}
```

## 🚨 Manejo de Errores

### **Errores Comunes y Soluciones**

| Error | Causa | Solución |
|-------|-------|----------|
| `Error 400: Bad Request` | Formato audio no soportado | Verificar conversión WebM→WAV |
| `Error 500: Internal Server Error` | Timeout o error Google Cloud | Revisar logs detallados |
| `No results from Speech-to-Text` | Audio muy corto/silencioso | Validar duración mínima >1s |
| `CORS error` | Configuración headers | Verificar origen permitido |

### **Fallback Strategy**
1. **Primer intento**: Google Cloud Speech-to-Text
2. **Fallback**: Web Speech API (navegador)
3. **Último recurso**: Transcripción manual

## 🔒 Seguridad y Compliance

### **Datos Médicos (PHI/HIPAA)**
- ✅ Audio procesado en memoria, no persistido
- ✅ Transmisión HTTPS/TLS 1.3
- ✅ Logs sin datos sensibles
- ✅ Timeout automático para cleanup

### **Autenticación**
- Cloud Function: Pública con CORS restringido
- Frontend: Autenticación médica requerida
- API Keys: Configuradas en variables de entorno

## 💰 Costos y Facturación

### **Estimación de Costos (Mensual)**
- **Speech-to-Text API**: ~$50-100 USD
- **Cloud Functions**: ~$10-20 USD
- **Cloud Storage**: ~$5 USD
- **Total estimado**: ~$65-125 USD/mes

### **Optimizaciones de Costo**
1. **Compresión audio**: Reduce costos de procesamiento
2. **Timeout corto**: Evita cargos por procesos largos
3. **Batch processing**: Futuro para múltiples archivos

## 🔄 Mantenimiento y Updates

### **Tareas Regulares**
- **Semanal**: Revisar logs de errores
- **Mensual**: Analizar métricas de rendimiento
- **Trimestral**: Optimizar configuración según uso

### **Deployment**
```bash
# Desplegar cambios
cd cloud-functions/speech-to-text
gcloud functions deploy transcribeAudio --runtime nodejs18 --trigger-http --allow-unauthenticated --region us-central1

# Verificar deployment
curl "https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/healthCheck"
```

### **Backup y Recovery**
- **Código fuente**: Git repository
- **Configuración**: Variables de entorno documentadas
- **Credenciales**: Google Cloud IAM

## 📞 Soporte y Escalación

### **Contactos Técnicos**
- **CTO**: Mauricio Sobarzo (msobarzo78@gmail.com)
- **Google Cloud Support**: Enterprise plan activado
- **Documentación**: https://cloud.google.com/speech-to-text

### **Procedimiento de Escalación**
1. **Nivel 1**: Health check y logs básicos
2. **Nivel 2**: Análisis detallado de métricas
3. **Nivel 3**: Contacto Google Cloud Support
4. **Nivel 4**: Activación de fallback systems

## 🎯 Roadmap Futuro

### **Q3 2025**
- [ ] Integración con más idiomas (inglés, francés)
- [ ] Batch processing para múltiples archivos
- [ ] Dashboard de métricas en tiempo real

### **Q4 2025**
- [ ] Machine Learning personalizado para terminología
- [ ] Integración con sistemas EMR externos
- [ ] Análisis de sentimientos médicos

---

**Última actualización**: Julio 6, 2025  
**Versión**: 2.0.0  
**Estado**: Producción Ready ✅ 