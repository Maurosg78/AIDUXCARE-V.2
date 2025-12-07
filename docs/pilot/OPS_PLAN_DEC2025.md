# 🛡️ Plan de Soporte - Piloto CA-DEC2025

**Versión:** 1.0  
**Fecha:** Diciembre 2025  
**Para:** Equipo técnico y soporte

---

## 🎯 Objetivo

Si algo se rompe durante el piloto, que:
- Sepas dónde mirar
- Sepas qué decir al fisio
- Sepas cómo desactivar lo mínimo sin tumbar todo

---

## 📍 Dónde Mirar Logs

### Cloud Functions

**Firebase Console:**
```
https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/functions
```

**CLI:**
```bash
firebase functions:log --project aiduxcare-v2-uat-dev --limit 50
```

**Por función específica:**
```bash
# Imaging reports
firebase functions:log --only processImagingReport --limit 20

# Initial assessment
firebase functions:log --only processWithVertexAI --limit 20

# Follow-up
firebase functions:log --only processWithVertexAI --limit 20

# SMS consent
firebase functions:log --only sendConsentSMS --limit 20
```

---

### Firestore

**Firebase Console:**
```
https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore
```

**Colecciones críticas:**
- `patients` - Pacientes del piloto
- `episodes` - Episodios de atención
- `notes` / `clinicalNotes` - Notas clínicas generadas
- `imaging_reports` - Informes de imagen procesados
- `consentLogs` - Logs de consentimiento SMS

---

### Vertex AI

**Google Cloud Console:**
```
https://console.cloud.google.com/vertex-ai?project=aiduxcare-v2-uat-dev
```

**Métricas clave:**
- Request count
- Error rate
- Latency (p50, p95, p99)
- Token usage

---

## 🔍 Cómo Detectar Problemas

### Vertex AI está fallando

**Síntomas:**
- Muchos errores en `processWithVertexAI`
- Timeouts frecuentes
- Respuestas vacías o inválidas

**Logs a revisar:**
```bash
firebase functions:log --only processWithVertexAI --limit 50 | grep -i error
```

**Indicadores:**
- `Error: Vertex AI API error`
- `Error: Timeout after 30s`
- `Error: Invalid response format`

**Acción:**
1. Verificar cuota de Vertex AI en GCP Console
2. Verificar que región `northamerica-northeast1` está disponible
3. Verificar que modelo `gemini-2.5-flash` está disponible
4. Si persiste, activar modo degradado (notas manuales)

---

### Imaging está fallando

**Síntomas:**
- PDFs no se procesan
- `rawText` y `aiSummary` siempre `null`
- Errores en `processImagingReport`

**Logs a revisar:**
```bash
firebase functions:log --only processImagingReport --limit 50 | grep -i error
```

**Indicadores:**
- `PDF file does not exist in Storage`
- `PDF extraction failed`
- `Summary generation failed`

**Acción:**
1. Verificar que Storage está disponible
2. Verificar que PDF tiene texto extraíble (no escaneado)
3. Verificar que Vertex AI está disponible para resumen
4. Si persiste, decir a fisio que suba PDF pero documente resumen manualmente

---

### SMS está fallando

**Síntomas:**
- SMS no se envían
- Errores en `sendConsentSMS`
- Webhooks no se reciben

**Logs a revisar:**
```bash
firebase functions:log --only sendConsentSMS --limit 50 | grep -i error
```

**Indicadores:**
- `Vonage API error`
- `Invalid phone number`
- `Webhook timeout`

**Acción:**
1. Verificar credenciales de Vonage
2. Verificar que número es válido (formato E.164)
3. Verificar que webhook está configurado correctamente
4. Si persiste, usar consentimiento por email o papel

---

### Nota AI está fallando

**Síntomas:**
- Notas no se generan
- Errores 500 en generación
- Respuestas vacías

**Logs a revisar:**
```bash
firebase functions:log --only processWithVertexAI --limit 50 | grep -i error
```

**Indicadores:**
- `Error generating note`
- `Invalid prompt format`
- `Vertex AI timeout`

**Acción:**
1. Verificar que Vertex AI está disponible
2. Verificar que prompt no es demasiado largo
3. Verificar que transcript no está vacío
4. Si persiste, activar modo degradado (notas manuales)

---

## 🚨 Qué Hacer Si...

### Imaging falla

**Mensaje al fisio:**
> "El procesamiento automático de PDFs está temporalmente no disponible. Por favor, sube el PDF normalmente y documenta el resumen manualmente en la nota. El PDF seguirá disponible para referencia."

**Acción técnica:**
1. Verificar logs de `processImagingReport`
2. Identificar causa raíz
3. Si es temporal, esperar y reintentar
4. Si es persistente, documentar issue y escalar

**Impacto:**
- ⚠️ No bloquea el flujo
- ⚠️ Solo pierde automatización
- ✅ Sistema sigue funcionando

---

### SMS falla

**Mensaje al fisio:**
> "El envío de SMS está temporalmente no disponible. Por favor, usa consentimiento por email o papel. El sistema seguirá funcionando normalmente."

**Acción técnica:**
1. Verificar logs de `sendConsentSMS`
2. Verificar credenciales de Vonage
3. Si es temporal, esperar y reintentar
4. Si es persistente, documentar issue y escalar

**Impacto:**
- ⚠️ No bloquea el flujo
- ⚠️ Solo pierde automatización
- ✅ Sistema sigue funcionando

---

### Nota AI falla

**Mensaje al fisio:**
> "La generación automática de notas está temporalmente no disponible. Por favor, crea la nota manualmente. El sistema seguirá funcionando normalmente."

**Acción técnica:**
1. Verificar logs de `processWithVertexAI`
2. Verificar estado de Vertex AI
3. Si es temporal, esperar y reintentar
4. Si es persistente, activar modo degradado

**Impacto:**
- ❌ Bloquea funcionalidad core parcialmente
- ⚠️ Sistema no se cae, pero pierde valor principal
- ✅ Notas manuales siguen funcionando

---

### Vertex AI está caído

**Mensaje al fisio:**
> "El servicio de AI está temporalmente no disponible. Por favor, crea notas manualmente. El sistema seguirá funcionando normalmente."

**Acción técnica:**
1. Verificar estado de Vertex AI en GCP Console
2. Verificar región `northamerica-northeast1`
3. Verificar cuota y límites
4. Si es persistente, activar modo degradado completo

**Impacto:**
- ❌ Bloquea funcionalidad core completamente
- ⚠️ Sistema no se cae, pero pierde valor principal
- ✅ Notas manuales siguen funcionando

---

## 🔧 Modo Degradado

### Activación

**Para Imaging:**
- No requiere acción técnica
- Sistema automáticamente permite subir PDFs sin procesar

**Para SMS:**
- No requiere acción técnica
- Sistema automáticamente permite consentimiento alternativo

**Para Nota AI:**
- Requiere desactivar función `processWithVertexAI` temporalmente
- O redirigir llamadas a función stub que devuelve error controlado

### Desactivación

**Cuando problema se resuelve:**
1. Verificar que servicio está disponible
2. Reactivar función si fue desactivada
3. Notificar a fisios que servicio está disponible nuevamente

---

## 📞 Contacto de Soporte

**Durante piloto:**
- Email: [TBD]
- Slack: [TBD]
- Horario: [TBD]

**Escalación:**
1. Nivel 1: Equipo técnico (logs, troubleshooting básico)
2. Nivel 2: CTO / Tech Lead (decisiones arquitectónicas)
3. Nivel 3: Google Cloud Support (si es problema de infraestructura)

---

## 📊 Métricas de Monitoreo

### Durante piloto, monitorear:

**Técnicas:**
- Error rate por función (< 5% objetivo)
- Latency p95 (< 10s objetivo)
- Availability (> 95% objetivo)

**Clínicas:**
- Tasa de éxito de generación de notas (> 90% objetivo)
- Tasa de éxito de procesamiento de PDFs (> 95% objetivo)
- Tasa de éxito de envío de SMS (> 90% objetivo)

**Alertas:**
- Error rate > 10% → Alerta inmediata
- Latency p95 > 30s → Alerta inmediata
- Availability < 90% → Alerta inmediata

---

**Última actualización:** 2025-12-07  
**Versión:** 1.0  
**Estado:** ✅ Listo para uso durante piloto

