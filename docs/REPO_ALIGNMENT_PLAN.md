# 🔧 Plan de Alineación del Repositorio

**Fecha:** 2025-12-07  
**Problema:** Directorio actual no es repositorio Git, necesidad de alinear con GitHub

---

## 🔍 Diagnóstico

### Estado Actual

- ❌ **No es repositorio Git:** `/Users/mauriciosobarzo/Dev/AIDUXCARE-V.2` no tiene `.git`
- ✅ **Archivos presentes:** Documentación, funciones, scripts están presentes
- ✅ **`.env.local` existe:** Token de Firebase disponible localmente
- ⚠️ **Sincronización:** No hay conexión con GitHub

### Archivos Críticos Verificados

- ✅ `.env.local` - Existe (1793 bytes, 5 dic)
- ✅ `docs/pilot/` - 6 archivos presentes
- ✅ `functions/scripts/` - Scripts creados
- ✅ `functions-min/src/` - Código fuente presente

---

## 📋 Plan de Acción

### Opción A: Inicializar Git en Directorio Actual (Recomendado)

Si este es el directorio de trabajo principal:

```bash
cd ~/Dev/AIDUXCARE-V.2

# 1. Inicializar Git
git init

# 2. Verificar .gitignore existe y está completo
cat .gitignore | grep -E "\.env|node_modules|dist|\.firebase"

# 3. Agregar remoto de GitHub (si existe)
git remote add origin <URL_DEL_REPO_GITHUB>

# 4. Verificar estado
git status
```

### Opción B: Conectar con Repositorio Existente

Si hay otro directorio que SÍ es el repo Git:

```bash
# 1. Identificar repositorio Git real
find ~ -maxdepth 3 -name ".git" -type d | grep -i aidux

# 2. Comparar archivos entre directorios
# 3. Sincronizar cambios necesarios
```

---

## 🛡️ Checklist de Seguridad Pre-Git

### Antes de inicializar Git, verificar:

- [ ] `.env.local` está en `.gitignore`
- [ ] `.env` está en `.gitignore`
- [ ] `functions/.env` está en `.gitignore`
- [ ] `node_modules/` está en `.gitignore`
- [ ] `dist/` está en `.gitignore`
- [ ] `.firebase/` está en `.gitignore`
- [ ] No hay tokens hardcodeados en código
- [ ] No hay credenciales en archivos de configuración

---

## 📝 Estructura de Commits Profesional

### Agrupación de Cambios

**Grupo 1: Documentación del Piloto**
```
docs/pilot/CA_DEC2025_PILOT_SCOPE.md
docs/pilot/QA_CHECKLIST_DEC2025.md
docs/pilot/OPS_PLAN_DEC2025.md
docs/pilot/PILOT_WOS_INDEX.md
docs/pilot/PHASE0_VALIDATION.md
docs/pilot/PHASE0_EXECUTIVE_SUMMARY.md
```

**Grupo 2: WOs de Implementación**
```
docs/WO_IR_02_PROCESS_IMAGING_REPORTS.md
docs/WO_IR_03_ALIGN_UAT.md
docs/WO_CLIN_01_INITIAL_ASSESSMENT_SMOKE.md
docs/WO_CLIN_02_FOLLOWUP_SMOKE.md
docs/WO_CONSENT_01_SMS_TEST.md
```

**Grupo 3: Scripts y Funciones**
```
functions/scripts/test-processImagingReport-wo-ir02.js
functions/scripts/test-processImagingReport-uat.sh
functions/scripts/list-storage-files.js
functions/scripts/diagnose-pdf-extraction.js
functions-min/src/processImagingReport.js
```

**Grupo 4: Configuración**
```
firebase.json
functions-min/package.json
```

---

## 📤 Mensajes de Commit Sugeridos

### Commit 1: Documentación del Piloto
```
feat(pilot): Add complete pilot documentation and scope

- Add pilot scope document (CA_DEC2025_PILOT_SCOPE.md)
- Add QA checklist for testers
- Add operations plan for technical support
- Add pilot WOs index and validation docs

Related to: WO-PILOT-01, WO-PILOT-02, WO-OPS-01
```

### Commit 2: Imaging Reports Implementation
```
feat(imaging): Implement PDF extraction and AI summarization

- Add processImagingReport Cloud Function
- Add PDF text extraction with pdf-parse v1.1.1
- Add AI summary generation with Vertex AI
- Add metadata inference (modality, bodyRegion, etc.)
- Add diagnostic and test scripts

Related to: WO-IR-02, WO-IR-03
```

### Commit 3: Test Scripts and Utilities
```
feat(tests): Add smoke test scripts for pilot validation

- Add UAT test script for imaging reports
- Add storage file listing utility
- Add PDF extraction diagnostic script
- Update test scripts with DoD checks

Related to: WO-IR-03
```

---

## ✅ Checklist Final Pre-Push

- [ ] Git inicializado o conectado a remoto
- [ ] `.gitignore` completo y verificado
- [ ] No hay archivos sensibles en staging
- [ ] Commits agrupados lógicamente
- [ ] Mensajes de commit descriptivos
- [ ] Documentación completa
- [ ] Scripts tienen permisos correctos (chmod +x)
- [ ] README actualizado (si aplica)

---

## 🚀 Próximos Pasos

1. **Decidir estrategia:**
   - ¿Inicializar Git aquí?
   - ¿Conectar con repo existente?
   - ¿Crear nuevo repo en GitHub?

2. **Ejecutar plan de alineación:**
   - Seguir checklist de seguridad
   - Hacer commits agrupados
   - Push a GitHub

3. **Documentar en README:**
   - Estado del proyecto
   - Cómo obtener tokens
   - Cómo ejecutar tests

---

**Última actualización:** 2025-12-07

