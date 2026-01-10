# 🚀 GUÍA DE DEPLOYMENT - Whisper Cloud Function

## TIEMPO ESTIMADO: 2-3 horas

---

## 📋 CHECKLIST PRE-DEPLOYMENT

```
[ ] Node.js 18+ instalado
[ ] Firebase CLI instalado (`npm install -g firebase-tools`)
[ ] Logged in Firebase (`firebase login`)
[ ] OpenAI API Key disponible
[ ] Proyecto Firebase activo
```

---

## PARTE 1: INSTALAR DEPENDENCIAS (5 min)

### 1.1 Navegar a functions

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean/functions
```

### 1.2 Instalar dependencias

```bash
npm install form-data node-fetch@2
```

**Verificar package.json tiene:**
```json
{
  "dependencies": {
    "form-data": "^4.0.0",
    "node-fetch": "^2.7.0"
  }
}
```

---

## PARTE 2: CONFIGURAR API KEY (10 min)

### 2.1 Obtener tu OpenAI API Key

**Ya la tienes en `.env.local`:**
```
VITE_OPENAI_API_KEY=sk-proj-6a...YfcA
```

**Copia el valor completo (empieza con `sk-proj-`)**

### 2.2 Configurar en Firebase Functions

**Desde la carpeta raíz del proyecto:**

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
firebase functions:config:set openai.key="TU-API-KEY-AQUI"
```

**Ejemplo:**
```bash
firebase functions:config:set openai.key="sk-proj-6axxxxxxxxxxxxxxxxYfcA"
```

**Verificar configuración:**
```bash
firebase functions:config:get
```

**Debe mostrar:**
```json
{
  "openai": {
    "key": "sk-proj-6a..."
  }
}
```

---

## PARTE 3: DEPLOY CLOUD FUNCTION (20 min)

### 3.1 Deploy solo la función whisperProxy

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
firebase deploy --only functions:whisperProxy
```

**Proceso esperado:**
```
✔ functions[whisperProxy(northamerica-northeast1)] Successful create operation.
Function URL: https://northamerica-northeast1-PROJECT-ID.cloudfunctions.net/whisperProxy
```

**Copia la URL de la función** (la necesitarás después)

---

### 3.2 Verificar deployment

```bash
firebase functions:list
```

**Debe mostrar:**
```
✔ whisperProxy (northamerica-northeast1)
```

---

### 3.3 Verificar logs (opcional)

```bash
firebase functions:log --only whisperProxy
```

---

## PARTE 4: TESTING (30 min)

### 4.1 Rebuild frontend

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
npm run dev
```

---

### 4.2 Test en navegador

1. Abrir http://localhost:5173
2. Login
3. Ir a Professional Workflow
4. Click "Start Recording"
5. Hablar 10 segundos
6. Click "Stop Recording"

**Verificar logs en consola del navegador:**
```
[FirebaseWhisper] Starting transcription...
[FirebaseWhisper] ✅ Transcription completed in XXXms
```

---

### 4.3 Verificar Cloud Function logs

**Mientras haces el test, en otra terminal:**

```bash
firebase functions:log --only whisperProxy --limit 50
```

**Debe mostrar:**
```
[whisperProxy] Request from user: gWalAiGUBdZkUncE8judja67lez2
[whisperProxy] Audio buffer size: 90015 bytes
[whisperProxy] Whisper API response: 200
[whisperProxy] ✅ Transcription successful: 45 chars
```

---

### 4.4 Verificar costos en OpenAI

1. Ir a https://platform.openai.com/usage
2. Ver uso reciente
3. Verificar cargos (debe ser ~$0.06 por test)

---

## PARTE 5: TROUBLESHOOTING

### Error: "OpenAI API key not configured"

**Solución:**
```bash
firebase functions:config:set openai.key="TU-API-KEY"
firebase deploy --only functions:whisperProxy
```

---

### Error: "User must be authenticated"

**Causa:** Usuario no está logged in

**Solución:**
- Verificar login en frontend
- Verificar que `context.auth` está disponible

---

### Error: "CORS policy"

**Causa:** Esto significa que FUNCIONA - ahora pasa por Cloud Function

**Antes:** Frontend → OpenAI (❌ CORS)
**Ahora:** Frontend → Cloud Function → OpenAI (✅)

---

### Error 401 en Cloud Function logs

**Causa:** API key inválida o mal configurada

**Solución:**
1. Verificar API key en OpenAI dashboard
2. Re-configurar: `firebase functions:config:set openai.key="..."`
3. Re-deploy: `firebase deploy --only functions:whisperProxy`

---

## PARTE 6: VERIFICACIÓN FINAL

### ✅ Checklist de Éxito:

```
[ ] Cloud Function deployed exitosamente
[ ] Frontend usa FirebaseWhisperService
[ ] Test recording funciona
[ ] Transcript aparece correctamente
[ ] No hay errores CORS
[ ] Logs de Cloud Function muestran transcripciones exitosas
[ ] Costos en OpenAI dashboard razonables (~$0.06/test)
```

---

## 📊 COSTOS ESPERADOS

**Por transcripción:**
- Audio 10 seg: ~$0.06 USD
- Audio 2 min: ~$0.12 USD

**Pilot (10 fisios × 6 semanas):**
- ~26,400 minutos audio
- ~$158 USD total

**Cloud Function costs:**
- FREE (dentro del plan gratuito de Firebase)
- Invocaciones: 2M gratis/mes
- Compute time: 400K GB-sec gratis/mes

---

## 🎉 RESULTADO FINAL

**Arquitectura implementada:**
```
Frontend (localhost:5173)
    ↓
Firebase Cloud Function (whisperProxy)
    ↓
OpenAI Whisper API
    ↓
Transcripción ✅
```

**Ventajas:**
- ✅ Seguro (API key en backend)
- ✅ Sin CORS issues
- ✅ Escalable (Firebase auto-scale)
- ✅ Monitoreado (Firebase logs)
- ✅ Canadian region (Montreal)

---

## 📞 SIGUIENTE PASO

Una vez completado todo:
1. ✅ Hacer commit de los cambios
2. ✅ Documentar la implementación
3. ✅ Invitar beta testers
4. ✅ Comenzar pilot testing

---

**Documento creado:** 2026-01-09  
**Autor:** AiduxCare Team  
**Tiempo estimado:** 2-3 horas  
**Dificultad:** Media

