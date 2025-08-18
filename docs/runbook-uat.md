# Runbook UAT - AiDuxCare V.2

## 🎯 **OBJETIVO**
Ejecutar AiDuxCare V.2 contra infraestructura Firebase Cloud UAT, sin emuladores, con flujo completo Login → Command Centre → Dashboard.

## 🚀 **CONFIGURACIÓN INMEDIATA**

### **1. Variables de Entorno (.env.local)**
```bash
VITE_ENV_TARGET=UAT
VITE_USE_EMULATORS=false
VITE_FIREBASE_PROJECT_ID=aiduxcare-v2-uat-dev
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=aiduxcare-v2-uat-dev.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=aiduxcare-v2-uat-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### **2. Verificar Configuración Firebase**
```bash
npm run check:env
```
**Resultado esperado**: ✅ Sistema preparado para arquitectura Firebase

## 🔧 **SECUENCIA DE VERIFICACIÓN LOCAL**

### **Paso 1: Limpieza y Reinstalación**
```bash
npm run clean
npm install
```

### **Paso 2: Iniciar Servidor de Desarrollo**
```bash
npm run dev
```
**Verificar**: Servidor en `http://localhost:5174/`

### **Paso 3: Verificar WelcomePage**
- **URL**: `http://localhost:5174/`
- **Elementos esperados**:
  - Logo AiDuxCare
  - Título "Bienvenido a AiDuxCare"
  - 3 características (Seguridad, IA, Eficiencia)
  - Botón "Iniciar Sesión" (azul)

### **Paso 4: Verificar Login**
- **URL**: `http://localhost:5174/login`
- **Elementos esperados**:
  - Formulario de login
  - Campos: Email, Contraseña
  - Botón "Iniciar Sesión"
  - **Consola limpia**: 0 errores/0 warnings

### **Paso 5: Verificar Command Centre**
- **URL**: `http://localhost:5174/command-center`
- **Elementos esperados**:
  - Header con "AiDuxCare"
  - Contadores: Citas de hoy, Notas pendientes, Pacientes activos
  - Botones: Crear Paciente, Nueva Cita, Notas Pendientes
  - **Consola limpia**: 0 errores/0 warnings

## 🧪 **TESTS Y VALIDACIÓN**

### **Tests Unitarios**
```bash
npm run test
```

### **Verificación de Tipos**
```bash
npm run typecheck
```

### **Tests E2E (Playwright)**
```bash
npm run test:e2e
```

### **Build de Producción**
```bash
npm run build
```

## 🚨 **TROUBLESHOOTING**

### **Problema: Consola con errores de Firebase**
**Solución**: Verificar que `.env.local` no contenga variables de emuladores

### **Problema: AuthGuard bloquea acceso**
**Solución**: Verificar que Firebase Auth esté habilitado en UAT

### **Problema: Firestore PERMISSION_DENIED**
**Solución**: Verificar que las reglas estén desplegadas en UAT

### **Problema: Functions no responde**
**Solución**: Verificar región europe-west1 en configuración

## 📊 **CRITERIOS DE ACEPTACIÓN**

### **✅ Funcionalidad Core**
- [ ] `/login` autentica contra Firebase Cloud UAT
- [ ] Redirección a `/command-center` después de login
- [ ] Command Centre muestra contadores en tiempo real
- [ ] Modales funcionan (crear paciente, cita, nota)

### **✅ Calidad del Código**
- [ ] `npm run lint` pasa sin warnings
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run build` genera build exitoso
- [ ] `npm run test` pasa todos los tests
- [ ] `npm run test:e2e` pasa flujo completo

### **✅ Consola Limpia**
- [ ] 0 errores en `/login`
- [ ] 0 errores en `/command-center`
- [ ] 0 warnings visibles
- [ ] Solo logs informativos

## 🔄 **FLUJO COMPLETO DE VALIDACIÓN**

1. **Inicio**: `npm run dev`
2. **WelcomePage**: Verificar diseño institucional
3. **Login**: Completar autenticación UAT
4. **Command Centre**: Verificar contadores y modales
5. **Crear Datos**: Paciente → Cita → Nota
6. **Verificar**: Contadores se actualizan
7. **Cerrar Sesión**: Volver a login
8. **Tests**: Ejecutar suite completa

## 📝 **NOTAS IMPORTANTES**

- **No usar emuladores**: Sistema configurado solo para Cloud
- **Credenciales UAT**: Usar usuario de prueba válido
- **Región Functions**: europe-west1 (configurado)
- **Puerto**: 5174 fijo (strictPort: true)
- **TypeScript**: 5.9.2 (compatible con Vite)

## 🎉 **ÉXITO DEFINIDO**

AiDuxCare V.2 está **estable** cuando:
- ✅ Pipeline Cloud funciona sin emuladores
- ✅ Login → Command Centre → Dashboard operativo
- ✅ Consola del navegador 100% limpia
- ✅ Todos los tests pasan (lint, typecheck, build, test, e2e)
- ✅ Contadores en tiempo real funcionando
- ✅ Modales de creación operativos

---
**Última actualización**: 2025-08-17  
**Versión**: 2.0.0  
**Estado**: Pipeline Cloud Estable
