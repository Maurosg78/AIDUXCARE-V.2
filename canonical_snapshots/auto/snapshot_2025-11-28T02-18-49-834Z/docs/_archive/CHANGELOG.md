# 📋 CHANGELOG - AiDuxCare V.2

## [HOTFIX] - 2025-01-XX

### 🚨 **CRÍTICO: Eliminación completa de SeedPage de PROD**

#### **Cambios de Seguridad**
- ❌ **ELIMINADO**: `src/pages/SeedPage.tsx` - Archivo de seed en PROD
- ❌ **ELIMINADO**: `src/dev/seedDemo.ts` - Lógica de seed oculta
- ✅ **RESTAURADO**: `src/pages/WelcomePage.tsx` - Solo botón de login institucional

#### **Blindaje del Pipeline**
- 🔒 **Firebase.ts**: Bloqueo de seguridad anti-emuladores en PROD
- 🔒 **Variables**: `VITE_ALLOW_SEED=false` por defecto
- 🔒 **Service Worker**: Solo en PROD, no interfiere desarrollo
- 🔒 **Documentación**: `docs/PIPELINE-PROD-NO-SEED.md` con políticas

#### **Archivos Modificados**
- `src/lib/firebase.ts` - Guardrails de seguridad
- `src/pages/WelcomePage.tsx` - Limpieza completa
- `docs/PIPELINE-PROD-NO-SEED.md` - Documentación de blindaje

#### **Verificación**
- ✅ No hay rutas `/seed` en router
- ✅ No hay imports de `seedDemo`
- ✅ No hay botones de seed en UI
- ✅ Firebase apunta solo a cloud (no emuladores)

---

## [v1.1.0] - 2025-01-XX

### 🔧 **Estabilización del Pipeline PROD**

#### **Cambios Principales**
- ✅ **Pipeline PROD**: Restaurado sin emuladores
- ✅ **Firebase Cloud**: Conectividad UAT operativa
- ✅ **Auth**: Login real contra Firebase Cloud
- ✅ **Command Centre**: Contadores en tiempo real

#### **Archivos Modificados**
- `.env.local` - Configuración PROD
- `src/lib/firebase.ts` - Inicialización cloud
- `firestore.rules` - Reglas de producción
- `src/router/router.tsx` - Routing limpio
- `src/main.tsx` - Service Worker solo en PROD

#### **Tests E2E**
- `tests/e2e/flow-uat.spec.ts` - Flujo completo contra UAT
- Verificación: Login → Command Centre → Dashboard

---

## [v1.0.0] - 2025-01-XX

### 🎉 **Lanzamiento Inicial**

#### **Características**
- WelcomePage institucional
- Sistema de autenticación
- Command Centre con métricas
- Gestión de pacientes y citas
- Integración con Firebase Cloud

#### **Tecnologías**
- React 18 + TypeScript
- Vite + SWC
- Tailwind CSS
- Firebase (Auth, Firestore, Functions)
- Playwright E2E
