# 🔧 Plan de Recuperación y Alineación Git

**Fecha:** 2025-12-07  
**Problema:** Carpeta `.git` existe pero Git no la reconoce

---

## 🔍 Diagnóstico

### Estado Actual

- ✅ Carpeta `.git` existe físicamente
- ❌ Git no reconoce el repositorio (`fatal: no es un repositorio git`)
- ⚠️ Posible corrupción o incompleto
- ⚠️ Timeout al leer `.git/config`

---

## 🛡️ Plan de Recuperación Seguro

### Opción A: Reparar Repositorio Existente (Recomendado primero)

```bash
cd ~/Dev/AIDUXCARE-V.2

# 1. Backup de .git actual
cp -r .git .git.backup.$(date +%Y%m%d-%H%M%S)

# 2. Intentar reparar
git fsck --full

# 3. Si falla, intentar recuperar
git gc --prune=now

# 4. Verificar estado
git status
```

### Opción B: Reinicializar Git (Si reparación falla)

```bash
cd ~/Dev/AIDUXCARE-V.2

# 1. Backup completo de .git
mv .git .git.backup.$(date +%Y%m%d-%H%M%S)

# 2. Inicializar nuevo repositorio
git init

# 3. Configurar usuario (si no está configurado globalmente)
git config user.name "Tu Nombre"
git config user.email "tu.email@example.com"

# 4. Verificar .gitignore existe y está completo
# (Ver sección de .gitignore abajo)

# 5. Agregar remoto de GitHub (si existe)
git remote add origin <URL_DEL_REPO_GITHUB>
# O si ya existe:
git remote set-url origin <URL_DEL_REPO_GITHUB>

# 6. Verificar remoto
git remote -v
```

---

## 📝 Crear/Verificar .gitignore

### Contenido Mínimo Requerido

```gitignore
# Environment variables
.env
.env.local
.env.*.local
.env.test
.env.test.local
*.env

# Dependencies
node_modules/
.pnpm-store/
.pnpm-debug.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
firebase-export-*/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Testing
coverage/
.nyc_output/
test-results/
playwright-report/

# Backups
backups/
canonical_snapshots_OLD*/
*.backup
*.bak

# Temporary files
*.tmp
*.temp
.tmp/
.temp/
```

---

## 📤 Estructura de Commits Profesional

### Commit 1: Documentación del Piloto
```bash
git add docs/pilot/CA_DEC2025_PILOT_SCOPE.md
git add docs/pilot/QA_CHECKLIST_DEC2025.md
git add docs/pilot/OPS_PLAN_DEC2025.md
git add docs/pilot/PILOT_WOS_INDEX.md
git add docs/pilot/PHASE0_VALIDATION.md
git add docs/pilot/PHASE0_EXECUTIVE_SUMMARY.md

git commit -m "feat(pilot): Add complete pilot documentation and scope

- Add pilot scope document (CA_DEC2025_PILOT_SCOPE.md)
- Add QA checklist for testers (QA_CHECKLIST_DEC2025.md)
- Add operations plan for technical support (OPS_PLAN_DEC2025.md)
- Add pilot WOs index and validation docs
- Add Phase 0 validation and executive summary

Related to: WO-PILOT-01, WO-PILOT-02, WO-OPS-01"
```

### Commit 2: Imaging Reports WOs
```bash
git add docs/WO_IR_02_PROCESS_IMAGING_REPORTS.md
git add docs/WO_IR_03_ALIGN_UAT.md
git add docs/WO_IR_03_EXECUTION_LOG.md

git commit -m "docs(imaging): Add imaging reports implementation WOs

- Add WO-IR-02: Process imaging reports (extraction + summary)
- Add WO-IR-03: Align UAT with local testing
- Add execution log for WO-IR-03

Related to: WO-IR-02, WO-IR-03"
```

### Commit 3: Clinical Pipeline WOs
```bash
git add docs/WO_CLIN_01_INITIAL_ASSESSMENT_SMOKE.md
git add docs/WO_CLIN_02_FOLLOWUP_SMOKE.md
git add docs/WO_CONSENT_01_SMS_TEST.md

git commit -m "docs(clinical): Add clinical pipeline smoke test WOs

- Add WO-CLIN-01: Initial assessment smoke test
- Add WO-CLIN-02: Follow-up smoke test
- Add WO-CONSENT-01: SMS consent test

Related to: WO-CLIN-01, WO-CLIN-02, WO-CONSENT-01"
```

### Commit 4: Test Scripts
```bash
git add functions/scripts/test-processImagingReport-wo-ir02.js
git add functions/scripts/test-processImagingReport-uat.sh
git add functions/scripts/list-storage-files.js
chmod +x functions/scripts/test-processImagingReport-uat.sh
git add functions/scripts/test-processImagingReport-uat.sh

git commit -m "feat(tests): Add imaging reports test scripts and utilities

- Add UAT test script for imaging reports (test-processImagingReport-uat.sh)
- Add local test script (test-processImagingReport-wo-ir02.js)
- Add storage file listing utility (list-storage-files.js)
- Update PDF extraction diagnostic script

Related to: WO-IR-02, WO-IR-03"
```

### Commit 5: Repository Documentation
```bash
git add docs/REPO_SYNC_STATUS.md
git add docs/REPO_ALIGNMENT_PLAN.md
git add docs/REPO_STATUS_REPORT.md
git add docs/GIT_RECOVERY_PLAN.md

git commit -m "docs(repo): Add repository alignment and sync documentation

- Add repository sync status report
- Add repository alignment plan
- Add repository status report
- Add Git recovery plan

Related to: Repository maintenance"
```

---

## ✅ Checklist Pre-Push

- [ ] Git funciona correctamente (`git status` funciona)
- [ ] `.gitignore` está completo y verificado
- [ ] No hay archivos sensibles en staging (`git status` limpio)
- [ ] Remoto de GitHub configurado (`git remote -v`)
- [ ] Commits agrupados lógicamente
- [ ] Mensajes de commit descriptivos
- [ ] Scripts tienen permisos correctos (`chmod +x`)

---

## 🚀 Comandos de Ejecución

### Paso 1: Verificar/Reparar Git

```bash
cd ~/Dev/AIDUXCARE-V.2

# Intentar reparar
git fsck --full

# Si falla, backup y reinicializar
mv .git .git.backup.$(date +%Y%m%d-%H%M%S)
git init
```

### Paso 2: Configurar .gitignore

```bash
# Verificar si existe
test -f .gitignore || echo "Necesita crear .gitignore"

# Si no existe, crear con contenido mínimo (ver arriba)
```

### Paso 3: Configurar Remoto

```bash
# Verificar remoto actual
git remote -v

# Si no existe, agregar
git remote add origin <URL_GITHUB>

# Si existe pero está mal, corregir
git remote set-url origin <URL_GITHUB>
```

### Paso 4: Hacer Commits

```bash
# Seguir estructura de commits arriba
# Un commit por grupo lógico
```

### Paso 5: Push a GitHub

```bash
# Verificar branch actual
git branch

# Push inicial (si es nuevo repo)
git push -u origin main

# O push a branch existente
git push origin <branch-name>
```

---

## 🚨 Notas Importantes

1. **NUNCA commitees:**
   - `.env.local`
   - `.env`
   - `node_modules/`
   - Tokens o credenciales

2. **Siempre verifica antes de push:**
   ```bash
   git status
   git diff --cached
   ```

3. **Si hay conflictos:**
   ```bash
   git pull origin <branch> --rebase
   # Resolver conflictos
   git push origin <branch>
   ```

---

**Última actualización:** 2025-12-07

