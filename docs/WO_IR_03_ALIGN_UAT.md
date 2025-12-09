# WO-IR-03 – Alinear UAT con lo probado en local

**Estado:** 🟡 **EN PROGRESO**

**Fecha:** 2025-12-07

**Owner:** Equipo Implementador (backend / Cloud Functions)

---

## 🎯 Objetivo

Asegurar que lo que ya funciona con scripts locales (`diagnose-pdf-extraction`, `test-processImagingReport-wo-ir02`) está realmente operativo en UAT real.

**Contexto:**
- ✅ WO-IR-02 completado: función funciona en local
- ✅ Scripts de diagnóstico validan extracción de PDFs
- ⏳ Necesitamos validar que UAT funciona igual que local

---

## 📋 Pasos

### Paso 1: Confirmar configuración de Firebase

Verificar que `firebase.json` apunta a `functions-min`:

```bash
cd ~/Dev/AIDUXCARE-V.2
node - << 'EOF'
const fs = require("fs");
const path = require("path");
const json = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase.json"), "utf8"));
console.log("functions:", JSON.stringify(json.functions, null, 2));
EOF
```

**Esperado:**
```json
{
  "source": "functions-min"
}
```

---

### Paso 2: Desplegar función a UAT

```bash
cd ~/Dev/AIDUXCARE-V.2
firebase deploy --only functions:processImagingReport --project aiduxcare-v2-uat-dev
```

**Verificar despliegue:**
```bash
firebase functions:list --project aiduxcare-v2-uat-dev | grep processImagingReport
```

**Esperado:**
```
processImagingReport  ACTIVE  northamerica-northeast1  https://...
```

---

### Paso 3: Obtener token de autenticación

**Opción A: Desde la app UAT (browser)**

1. Abrir `https://aiduxcare-v2-uat-dev.web.app`
2. Iniciar sesión
3. Abrir DevTools → Console
4. Ejecutar:
```javascript
firebase.auth().currentUser.getIdToken().then(token => console.log(token));
```
5. Copiar el token

**Opción B: Desde Firebase CLI**

```bash
firebase login:ci --project aiduxcare-v2-uat-dev
```

---

### Paso 4: Probar función en UAT con curl

```bash
cd ~/Dev/AIDUXCARE-V.2

STORAGE_PATH="imaging-reports/EFNbuCh9WQXBvJaaAUTC/unassigned/1765012740473-3d34548a-c261-4c30-8a97-b94a7e2ad1c5-2019-greisman-MRI_Results.pdf"
ID_TOKEN="PEGAR_TOKEN_REAL_AQUI"

curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -d "{
    \"data\": {
      \"patientId\": \"EFNbuCh9WQXBvJaaAUTC\",
      \"episodeId\": null,
      \"fileStoragePath\": \"$STORAGE_PATH\",
      \"modality\": \"MRI\",
      \"bodyRegion\": \"lumbar\",
      \"userId\": \"EFNbuCh9WQXBvJaaAUTC\",
      \"source\": \"upload\"
    }
  }" \
  "https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/processImagingReport" \
  | python3 -m json.tool
```

**Esperado (ejemplo):**
```json
{
  "result": {
    "success": true,
    "report": {
      "id": "...",
      "patientId": "EFNbuCh9WQXBvJaaAUTC",
      "rawText": "... (≥200 chars)",
      "aiSummary": "... (non-empty)",
      "modality": "MRI",
      "bodyRegion": "Lumbar spine",
      ...
    }
  }
}
```

---

### Paso 5: Verificar logs de UAT

```bash
firebase functions:log \
  --project aiduxcare-v2-uat-dev \
  --only processImagingReport \
  --limit 20
```

**Esperado en logs:**
```
[processImagingReport] PDF file exists, downloading...
[processImagingReport] PDF downloaded, buffer size: ... bytes
[processImagingReport] PDF extraction successful, text length: ...
[processImagingReport] Summary generation completed: { ... hasSummary: true }
[processImagingReport] Saved imaging report: { ... hasAiSummary: true }
```

---

## ✅ Definition of Done (DoD)

- [ ] `firebase.json` apunta a `functions-min`
- [ ] Función desplegada en UAT y aparece en `functions:list`
- [ ] Test con curl devuelve respuesta JSON con:
  - [ ] `success: true`
  - [ ] `report.rawText` (≥ 200 chars)
  - [ ] `report.aiSummary` no vacío
  - [ ] `modality: "MRI"`
  - [ ] `bodyRegion: "Lumbar spine"`
- [ ] Logs de UAT muestran:
  - [ ] `PDF downloaded, buffer size: ...`
  - [ ] `PDF extraction successful, text length: ...`
  - [ ] `Summary generation completed: { ... hasSummary: true }`
  - [ ] `Saved imaging report: { ... hasAiSummary: true }`

**Si todo esto se cumple, imaging está listo para demo.**

---

## 🚨 Troubleshooting

### Error: "User must be authenticated"
- Verificar que el token es válido
- Verificar que el token no ha expirado
- Regenerar token si es necesario

### Error: "PDF file does not exist in Storage"
- Verificar que el path es correcto
- Verificar que el archivo existe en Storage
- Usar `list-storage-files.js` para encontrar el path correcto

### Error: "PDF extraction failed"
- Verificar logs para ver el error específico
- Verificar que el PDF tiene texto extraíble (no es escaneado)
- Probar con otro PDF conocido que funcione

### Error: "Summary generation failed"
- Verificar que Vertex AI está disponible
- Verificar logs de Vertex AI
- Verificar que el proyecto tiene cuota disponible

---

**Última actualización:** 2025-12-07  
**Estado:** 🟡 **EN PROGRESO** - Listo para ejecución

