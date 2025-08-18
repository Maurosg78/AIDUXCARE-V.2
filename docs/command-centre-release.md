# 🚀 Command Centre Release Guide - AiDuxCare V.2

**Versión**: 2.0.0  
**Fecha**: Agosto 2025  
**Estado**: Ready for UAT/PROD  

---

## 📋 Prerequisitos

### **Requisitos del Sistema**
- **Node.js**: v20.19.3 o superior
- **npm**: v10.0.0 o superior
- **Firebase CLI**: v14.12.1 o superior
- **Git**: v2.40.0 o superior

### **Requisitos de Acceso**
- **Firebase Project**: Acceso a `aiduxcare-v2-uat-dev` (UAT) y `aiduxcare-v2-prod` (PROD)
- **GitHub**: Acceso al repositorio `AIDUXCARE-V.2`
- **Permisos**: Admin en Firebase y GitHub

---

## 🔧 Preparación Local

### **1. Verificación de Entorno**
```bash
# Verificar versiones
node --version          # Debe ser v20.19.3+
npm --version           # Debe ser v10.0.0+
firebase --version      # Debe ser v14.12.1+

# Verificar configuración Firebase
firebase projects:list
firebase use aiduxcare-v2-uat-dev  # Para UAT
firebase use aiduxcare-v2-prod     # Para PROD
```

### **2. Tests Locales Obligatorios**
```bash
# 1. Lint check (cero warnings)
npm run lint --max-warnings 0

# 2. TypeScript type check
npm run type-check

# 3. Build del proyecto
npm run build

# 4. Tests E2E con Playwright
npx playwright test tests/e2e/command-centre.spec.ts

# 5. Build de Firebase Functions
cd functions
npm ci
npm run build
cd ..
```

**⚠️ IMPORTANTE**: Todos los comandos deben pasar sin errores ni warnings.

---

## 🚀 Deploy a UAT

### **1. Preparación de UAT**
```bash
# Cambiar a proyecto UAT
firebase use aiduxcare-v2-uat-dev

# Verificar configuración
firebase projects:list
firebase target:list
```

### **2. Deploy de Functions**
```bash
# Deploy solo functions
firebase deploy --only functions

# Verificar deploy
firebase functions:list
```

### **3. Deploy de Hosting**
```bash
# Deploy hosting
firebase deploy --only hosting

# Verificar URL
firebase hosting:channel:list
```

### **4. Deploy de Firestore Rules e Indexes**
```bash
# Deploy reglas de seguridad
firebase deploy --only firestore:rules

# Deploy índices
firebase deploy --only firestore:indexes
```

### **5. Verificación Post-Deploy en UAT**
```bash
# URL de UAT
https://aiduxcare-v2-uat-dev.web.app

# Verificar funciones
curl -X POST https://europe-west1-aiduxcare-v2-uat-dev.cloudfunctions.net/assistantQuery \
  -H "Content-Type: application/json" \
  -d '{"input":"test","userId":"test-user"}'
```

---

## 🎯 Deploy a PROD

### **1. Checklist Pre-PROD**
- [ ] Tests E2E pasan en UAT
- [ ] Smoke tests exitosos en UAT
- [ ] Performance aceptable (<3s carga)
- [ ] No errores en consola
- [ ] Feature flags configurados correctamente

### **2. Deploy a PROD**
```bash
# Cambiar a proyecto PROD
firebase use aiduxcare-v2-prod

# Deploy completo
firebase deploy --only functions,hosting,firestore:rules,firestore:indexes

# Verificar deploy
firebase hosting:channel:list
firebase functions:list
```

### **3. Verificación Post-Deploy en PROD**
```bash
# URL de PROD
https://aiduxcare-v2-prod.web.app

# Verificar funciones
curl -X POST https://europe-west1-aiduxcare-v2-prod.cloudfunctions.net/assistantQuery \
  -H "Content-Type: application/json" \
  -d '{"input":"test","userId":"test-user"}'
```

---

## 🚨 Plan de Rollback

### **Rollback Rápido (Hosting)**
```bash
# Listar versiones disponibles
firebase hosting:releases:list

# Rollback a versión anterior
firebase hosting:rollback

# Verificar rollback
firebase hosting:releases:list
```

### **Rollback de Functions**
```bash
# Listar versiones de functions
firebase functions:list

# Rollback a versión anterior (si está disponible)
firebase functions:rollback --function assistantQuery
```

### **Rollback de Firestore**
```bash
# Restaurar reglas anteriores
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules

# Restaurar índices anteriores
git checkout HEAD~1 firestore.indexes.json
firebase deploy --only firestore:indexes
```

---

## 🔧 Feature Flags por Entorno

### **UAT (Desarrollo)**
```typescript
{
  aiDuxLight: true,      // ON - Para testing
  auditWidget: true,      // ON - Para debugging
  advancedAnalytics: true // ON - Para métricas
}
```

### **PROD (Producción)**
```typescript
{
  aiDuxLight: false,     // OFF - Por seguridad
  auditWidget: true,      // ON - Para compliance
  advancedAnalytics: true // ON - Para métricas
}
```

### **Cambiar Feature Flags**
```bash
# En Firebase Console
# 1. Ir a Firestore Database
# 2. Colección: settings/flags
# 3. Modificar documento correspondiente
# 4. Los cambios se aplican inmediatamente
```

---

## 📊 Mantenimiento

### **Actualización de Dependencias**
```bash
# Verificar dependencias desactualizadas
npm outdated

# Actualizar Firebase Functions
cd functions
npm update firebase-functions firebase-admin
cd ..

# Actualizar dependencias del frontend
npm update

# Verificar que todo funciona
npm run lint --max-warnings 0
npm run type-check
npm run build
```

### **Monitoreo de Performance**
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle analyzer
npm run build:analyze
```

### **Logs y Debugging**
```bash
# Ver logs de Firebase Functions
firebase functions:log --only assistantQuery

# Ver logs de hosting
firebase hosting:log

# Ver logs de Firestore
firebase firestore:log
```

---

## 🧪 Tests Post-Deploy

### **Smoke Tests Obligatorios**
```bash
# 1. Verificar carga de página
curl -I https://[PROJECT_ID].web.app

# 2. Verificar funciones
curl -X POST https://europe-west1-[PROJECT_ID].cloudfunctions.net/assistantQuery \
  -H "Content-Type: application/json" \
  -d '{"input":"test","userId":"test-user"}'

# 3. Verificar Firestore
firebase firestore:indexes
```

### **Tests E2E en Producción**
```bash
# Configurar Playwright para PROD
export BASE_URL=https://[PROJECT_ID].web.app

# Ejecutar tests críticos
npx playwright test tests/e2e/command-centre.spec.ts --grep "happy path"
```

---

## 📋 Checklist de Post-Deploy

### **UAT**
- [ ] Página principal carga en <3s
- [ ] Command Centre accesible
- [ ] Crear paciente funciona
- [ ] Crear cita funciona
- [ ] Notas pendientes funcionan
- [ ] Agente IA responde
- [ ] Widget de auditoría visible (admin)
- [ ] Feature flags funcionan

### **PROD**
- [ ] Todos los checks de UAT
- [ ] Performance aceptable
- [ ] No errores en consola
- [ ] Logs de auditoría funcionando
- [ ] Seguridad Firestore activa
- [ ] Backup automático configurado

---

## 🆘 Troubleshooting

### **Problemas Comunes**

#### **1. Functions no responden**
```bash
# Verificar logs
firebase functions:log

# Verificar deploy
firebase functions:list

# Verificar región
firebase functions:config:get
```

#### **2. Firestore Rules bloquean acceso**
```bash
# Verificar reglas activas
firebase firestore:rules:get

# Test de reglas
firebase emulators:exec --only firestore "npm test"
```

#### **3. Hosting no actualiza**
```bash
# Limpiar cache
firebase hosting:clear

# Forzar deploy
firebase deploy --only hosting --force
```

### **Contactos de Emergencia**
- **DevOps**: [Contacto del equipo]
- **Firebase Support**: [Ticket de soporte]
- **GitHub Issues**: [Repositorio de issues]

---

## 📚 Recursos Adicionales

### **Documentación Técnica**
- [Firebase Functions v5 Migration](https://firebase.google.com/docs/functions/migrate-v2)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Playwright Testing](https://playwright.dev/docs/intro)

### **Monitoreo**
- [Firebase Console](https://console.firebase.google.com)
- [GitHub Actions](https://github.com/[USER]/AIDUXCARE-V.2/actions)
- [Performance Dashboard](https://[PROJECT_ID].web.app/performance)

---

## ✅ Verificación Final

### **Comando de Verificación Completa**
```bash
# Script de verificación completa
npm run verify:deploy

# O manualmente:
npm run lint --max-warnings 0 && \
npm run type-check && \
npm run build && \
npx playwright test tests/e2e/command-centre.spec.ts && \
cd functions && npm run build && cd .. && \
echo "🎉 ¡Deploy verificado exitosamente!"
```

**🎯 El Command Centre está listo para UAT/PROD cuando todos los checks pasen sin errores.**
