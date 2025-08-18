x # 🔧 Git Hooks para AiDuxCare V.2

## **Resumen Ejecutivo**

Sistema automatizado de validación que ejecuta **ambos smoke tests** antes de cada commit y push, garantizando calidad de código y funcionalidad operativa.

---

## **🏗️ Hooks Configurados**

### **1. Pre-commit Hook**
- **Ubicación**: `.git/hooks/pre-commit`
- **Trigger**: Antes de cada `git commit`
- **Validaciones**:
  - ✅ Guardrails de naming (no sufijos *Function)
  - ✅ Project ID correcto (aiduxcare-v2-uat-dev)
  - ✅ Lint + TypeScript
  - ✅ Smoke tests (condicionales)

### **2. Pre-push Hook**
- **Ubicación**: `.git/hooks/pre-push`
- **Trigger**: Antes de cada `git push`
- **Validaciones**:
  - 🔒 **Obligatorias** para ramas críticas (main, release/*)
  - 🟡 **Opcionales** para ramas de desarrollo

---

## **⚡ Configuración Rápida**

### **Opción 1: Script Automático (Recomendado)**
```bash
./tools/setup-hooks.sh
```

### **Opción 2: Configuración Manual**
```bash
# Crear directorios
mkdir -p .git/hooks

# Copiar hooks
cp .git/hooks/pre-commit .git/hooks/
cp .git/hooks/pre-push .git/hooks/

# Hacer ejecutables
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push
```

---

## **🎯 Funcionalidades de los Hooks**

### **Pre-commit: Validación Inteligente**

#### **1. Guardrails Rápidos**
```bash
# ❌ Bloquea commits con naming incorrecto
assistantQueryFunction    # Sufijo *Function
assistantDataLookupFunction

# ❌ Bloquea commits con Project ID incorrecto
aiduxcare-stt-2025       # Debe ser aiduxcare-v2-uat-dev
```

#### **2. Calidad de Código**
```bash
npm run lint              # ESLint
npx tsc --noEmit         # TypeScript types
```

#### **3. Smoke Tests Condicionales**
```bash
# 🟢 Si emuladores están corriendo
./tools/smoke-functions.sh      # Functions base
./tools/smoke-ai-light.sh      # AI Light + Offline Mode

# 🟡 Si emuladores no están corriendo
# Omite smokes por velocidad (modo rápido)
```

### **Pre-push: Validación Obligatoria**

#### **Ramas Críticas (main, release/*)**
```bash
# 🔒 Validación COMPLETA obligatoria
npm run lint
npx tsc --noEmit
./tools/smoke-functions.sh
./tools/smoke-ai-light.sh
```

#### **Ramas de Desarrollo**
```bash
# 🟡 Push permitido sin validación
# Para commits rápidos y experimentación
```

---

## **⚙️ Configuración Avanzada**

### **Modo Estricto (Obligatorio)**
```bash
# Hacer que TODOS los commits requieran emuladores
export AIDUX_STRICT_SMOKE=1

# Hacer commit (fallará si emuladores down)
git commit -m "test strict mode"
```

### **Modo Rápido (Por Defecto)**
```bash
# Permitir commits sin emuladores (solo lint + types)
export AIDUX_STRICT_SMOKE=0

# Hacer commit (pasará sin emuladores)
git commit -m "test fast mode"
```

### **Configuración Permanente**
```bash
# Agregar a ~/.bashrc o ~/.zshrc
echo 'export AIDUX_STRICT_SMOKE=1' >> ~/.bashrc
source ~/.bashrc
```

---

## **🧪 Flujo de Trabajo Recomendado**

### **Desarrollo Diario**
```bash
# 1. Arrancar emuladores (opcional)
firebase emulators:start --only auth,firestore,functions

# 2. Hacer cambios en código
# 3. Stage cambios
git add .

# 4. Commit (ejecuta hooks automáticamente)
git commit -m "feat: implement AI Light offline mode"

# 5. Push (ejecuta hooks si es rama crítica)
git push origin feature/ai-light
```

### **Antes de Merge a Main**
```bash
# 1. Asegurar emuladores corriendo
firebase emulators:start --only auth,firestore,functions

# 2. Verificar hooks manualmente
./tools/smoke-functions.sh
./tools/smoke-ai-light.sh

# 3. Merge y push (hooks se ejecutan automáticamente)
git checkout main
git merge feature/ai-light
git push origin main
```

---

## **📊 Métricas y Monitoreo**

### **Tiempos de Ejecución**
- **Guardrails**: < 100ms
- **Lint + TypeScript**: 2-5 segundos
- **Smoke Functions**: 3-5 segundos
- **Smoke AI Light**: 5-10 segundos
- **Total (con emuladores)**: 10-20 segundos
- **Total (sin emuladores)**: 2-5 segundos

### **Cobertura de Validación**
- **Pre-commit**: 100% de commits
- **Pre-push crítico**: 100% de pushes a main/release
- **Pre-push desarrollo**: 0% (velocidad prioritaria)

---

## **🚨 Troubleshooting**

### **Hook No Se Ejecuta**
```bash
# Verificar permisos
ls -la .git/hooks/pre-commit
ls -la .git/hooks/pre-push

# Debe mostrar: -rwxr-xr-x
# Si no: chmod +x .git/hooks/pre-commit
```

### **Smoke Tests Fallan**
```bash
# 1. Verificar emuladores
lsof -i :5001  # Functions
lsof -i :8080  # Firestore
lsof -i :9099  # Auth

# 2. Arrancar emuladores
firebase emulators:start --only auth,firestore,functions

# 3. Probar manualmente
./tools/smoke-functions.sh
./tools/smoke-ai-light.sh
```

### **Lint o TypeScript Fallan**
```bash
# 1. Verificar dependencias
npm install

# 2. Verificar configuración
cat .eslintrc.js
cat tsconfig.json

# 3. Ejecutar manualmente
npm run lint
npx tsc --noEmit
```

### **Bypass Temporal (Emergencias)**
```bash
# ⚠️ SOLO PARA EMERGENCIAS
git commit --no-verify -m "emergency fix"

# ⚠️ SOLO PARA EMERGENCIAS
git push --no-verify origin main
```

---

## **🔮 Personalización Avanzada**

### **Agregar Nuevos Smoke Tests**
```bash
# 1. Crear script en tools/
touch tools/smoke-new-feature.sh
chmod +x tools/smoke-new-feature.sh

# 2. Agregar al hook pre-commit
echo "./tools/smoke-new-feature.sh" >> .git/hooks/pre-commit

# 3. Agregar al hook pre-push
echo "./tools/smoke-new-feature.sh" >> .git/hooks/pre-push
```

### **Modificar Validaciones**
```bash
# Editar hooks directamente
nano .git/hooks/pre-commit
nano .git/hooks/pre-push

# O usar el script de setup
./tools/setup-hooks.sh
```

### **Integración con CI/CD**
```bash
# Los hooks se pueden ejecutar en CI
# Agregar a .github/workflows/ci.yml
- name: Run Git Hooks
  run: |
    chmod +x .git/hooks/pre-commit
    chmod +x .git/hooks/pre-push
    .git/hooks/pre-commit
```

---

## **📋 Checklist de Configuración**

### **✅ Configuración Básica**
- [ ] Script `setup-hooks.sh` ejecutable
- [ ] Hooks creados en `.git/hooks/`
- [ ] Permisos de ejecución correctos
- [ ] Scripts de smoke test existentes

### **✅ Verificación de Funcionamiento**
- [ ] Hook pre-commit se ejecuta en commits
- [ ] Hook pre-push se ejecuta en pushes críticos
- [ ] Smoke tests funcionan con emuladores
- [ ] Validaciones fallan apropiadamente

### **✅ Configuración de Equipo**
- [ ] Documentación compartida
- [ ] Configuración en rama main
- [ ] Instrucciones para nuevos desarrolladores
- [ ] Proceso de bypass para emergencias

---

## **🎯 Beneficios del Sistema**

### **Para Desarrolladores**
- ✅ **Validación automática** en cada commit
- ✅ **Detección temprana** de errores
- ✅ **Consistencia** en calidad de código
- ✅ **Velocidad** en desarrollo (modo rápido)

### **Para el Proyecto**
- ✅ **Calidad garantizada** en ramas críticas
- ✅ **Smoke tests** siempre actualizados
- ✅ **Compliance** con estándares de código
- ✅ **Reducción** de bugs en producción

### **Para el Equipo**
- ✅ **Estándares uniformes** de calidad
- ✅ **Onboarding** más rápido para nuevos devs
- ✅ **Confianza** en el código que se mergea
- ✅ **Documentación** automática de cambios

---

*Documentación de Git Hooks para AiDuxCare V.2*
*Fecha: 15 de Agosto, 2025*
*Estado: ✅ CONFIGURADO Y OPERATIVO*
