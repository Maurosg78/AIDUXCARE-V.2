# ⚡ QUICK START: PDF Testing (5 minutos)

## 🎯 Objetivo
Verificar que PDF processing funciona y AI detecta 5/5 hallazgos críticos.

---

## ⚡ PASOS RÁPIDOS

### 1️⃣ Crear PDF (1 min)
```bash
open test-data/matt-proctor-mri.txt
# TextEdit → File → Print → PDF → Save as PDF
# Guardar como: test-data/matt-proctor-mri.pdf
```

### 2️⃣ Iniciar servidor (30 seg)
```bash
pnpm dev
# Espera: Local: http://localhost:5176/
```

### 3️⃣ Abrir navegador (30 seg)
- Ir a: http://localhost:5176/
- DevTools: `Cmd + Option + J`
- Tab: **Console**

### 4️⃣ Upload PDF (2 min)
- Buscar botón "Upload" o "Attach"
- Seleccionar: `test-data/matt-proctor-mri.pdf`
- **VERIFICAR CONSOLE:**
  ```
  [PDFExtractor] ✅ Extraction complete
  [ClinicalAttachment] ✅ File processed
  ```
- **VERIFICAR UI:** Caja verde con preview

### 5️⃣ Generar SOAP (2 min)
- Agregar transcript:
  ```
  42-year-old male, severe low back pain radiating left leg, 
  numbness in left foot, progressive over 6 months
  ```
- Seleccionar tests: SLR, Neurological
- Click "Analyze"
- Esperar 20-30 segundos

### 6️⃣ Verificar 5/5 (2 min)
**Buscar en SOAP generado:**
- [ ] "canal stenosis" o "stenosis L4-L5"
- [ ] "disc extrusion" o "extruded disc"
- [ ] "thecal sac" o "dural sac"
- [ ] "foraminal stenosis"
- [ ] "mass effect" o "nerve compression"

**SCORE: ___/5**

---

## ✅ SI SCORE = 5/5

```bash
git add .
git commit -F COMMIT-MESSAGE.md
git log -1 --oneline
```

## ❌ SI SCORE < 5/5

**NO COMMIT** - Reporta:
- Score exacto
- Qué hallazgos se detectaron
- Console logs completos

---

## 📊 REPORTE RÁPIDO

```
SCORE: X/5
STATUS: PASS ✅ / FAIL ❌
COMMIT: [hash si hiciste commit]
```

---

**Total tiempo: ~5 minutos** ⚡
