# 📋 WO-IR-03 - Log de Ejecución

**Fecha inicio:** 2025-12-07  
**Estado:** 🟡 **EN PROGRESO**

---

## Paso 1: Confirmar configuración de Firebase

**Comando:**
```bash
node - << 'EOF'
const fs = require("fs");
const path = require("path");
const json = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase.json"), "utf8"));
console.log("functions:", JSON.stringify(json.functions, null, 2));
EOF
```

**Resultado:**
```json
{
  "source": "functions-min"
}
```

**Estado:** ✅ **COMPLETADO**

---

## Paso 2: Verificar función en UAT

**Comando:**
```bash
firebase functions:list --project aiduxcare-v2-uat-dev | grep processImagingReport
```

**Resultado:**
```
│ processImagingReport        │ v1      │ callable                       │ northamerica-northeast1 │ 256    │ nodejs20 │
│ processImagingReportStorage │ v1      │ google.storage.object.finalize │ northamerica-northeast1 │ 256    │ nodejs20 │
```

**Estado:** ✅ **COMPLETADO** - Función ya está desplegada en UAT

---

## Paso 3: Desplegar función a UAT

**Comando:**
```bash
firebase deploy --only functions:processImagingReport --project aiduxcare-v2-uat-dev
```

**Estado:** ⏳ Pendiente...

---

## Paso 4: Obtener token de autenticación

**Método:** Desde la app UAT (browser) o Firebase CLI

**Estado:** ⏳ Pendiente...

---

## Paso 5: Probar función en UAT con curl

**Comando:**
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -d "{...}" \
  "https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/processImagingReport"
```

**Estado:** ⏳ Pendiente...

---

## Paso 6: Verificar logs de UAT

**Comando:**
```bash
firebase functions:log \
  --project aiduxcare-v2-uat-dev \
  --only processImagingReport \
  --limit 20
```

**Estado:** ⏳ Pendiente...

---

## ✅ DoD Checklist

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

---

**Última actualización:** 2025-12-07

