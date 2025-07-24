# 🎯 Guía Completa: Testing Pipeline de Bienvenida con Emuladores Firebase

## 📋 Resumen Ejecutivo

Esta guía te permite probar **completamente** el pipeline de bienvenida de AiDuxCare usando los emuladores de Firebase. El flujo completo es:

```
WelcomePage → [Register/Login] → VerifyEmailPage → ProfessionalOnboardingPage → ProfessionalWorkflowPage
```

## ✅ Estado Actual del Sistema

- **✅ Emuladores Firebase**: Auth (9099) + Firestore (8080) ACTIVOS
- **✅ Configuración**: Firebase client configurado para usar emuladores
- **✅ Pipeline**: Todas las páginas implementadas y funcionando
- **✅ Scripts**: Script de testing automatizado creado

---

## 🚀 Paso 1: Verificar Emuladores

### Verificar que están ejecutándose:
```bash
# Auth Emulator
curl -s http://localhost:9099
# Respuesta esperada: {"authEmulator":{"ready":true...}}

# Firestore Emulator  
curl -s http://localhost:8080
# Respuesta esperada: Ok
```

### Si no están ejecutándose:
```bash
firebase emulators:start --only auth,firestore --project demo-project
```

---

## 🚀 Paso 2: Iniciar Servidor de Desarrollo

```bash
# Instalar dependencias (si no está hecho)
npm install

# Iniciar servidor
npm run dev

# Verificar que funciona
curl -s http://localhost:5173
```

---

## 🚀 Paso 3: Ejecutar Script de Testing

```bash
node scripts/test-welcome-pipeline.js
```

**Salida esperada:**
```
🎯 Iniciando Test del Pipeline de Bienvenida
========================================

📋 Datos de Test:
- Email: mauricio.test@aiduxcare.com
- Nombre: Dr. Mauricio Test
- Profesión: Fisioterapeuta
- Especialidad: Fisioterapia Deportiva

1️⃣ Verificando emuladores Firebase...
   ✅ Auth Emulator (puerto 9099)
   ✅ Firestore Emulator (puerto 8080)
   ✅ Emuladores funcionando correctamente

2️⃣ Verificando servidor de desarrollo...
   ✅ Servidor de desarrollo funcionando (puerto 5173)

3️⃣ Pipeline de Testing Manual:
=============================

🎯 FLUJO COMPLETO:
WelcomePage → Register → VerifyEmail → Onboarding → Workflow
```

---

## 🧪 Paso 4: Testing Manual del Pipeline

### **PASO 1: WelcomePage**
🔗 **URL**: http://localhost:5173

**Qué hacer:**
1. Verificar que aparece la página de bienvenida
2. Verificar formularios de Login y Registro
3. Verificar logos y branding

**DevTools Check:**
- Console debe mostrar: `🔥 Firestore Emulator conectado: localhost:8080`
- Console debe mostrar: `🔥 Auth Emulator conectado: localhost:9099`

### **PASO 2: Registro de Usuario**
**Qué hacer:**
1. Hacer clic en tab "Registrarse"
2. Llenar datos:
   - **Email**: `mauricio.test@aiduxcare.com`
   - **Password**: `TestAidux2025!`
   - **Nombre**: `Dr. Mauricio Test`
3. Enviar formulario

**Resultado esperado:**
- Usuario se registra exitosamente
- Redirección a `/verify-email`
- En emulador: Email se marca automáticamente como verificado

### **PASO 3: Verificación de Email**
**Qué hacer:**
1. Verificar que llegaste a `/verify-email`
2. En emuladores (modo desarrollo): verificación automática
3. Debería detectar email verificado y redirigir

**Resultado esperado:**
- Mensaje: "¡Email verificado! Redirigiendo..."
- Redirección automática a `/login`

### **PASO 4: Login**
**Qué hacer:**
1. En WelcomePage, usar tab "Iniciar Sesión"
2. Usar las mismas credenciales:
   - **Email**: `mauricio.test@aiduxcare.com`
   - **Password**: `TestAidux2025!`
3. Enviar formulario

**Resultado esperado:**
- Login exitoso
- Redirección a `/professional-onboarding`

### **PASO 5: Professional Onboarding**
**Qué hacer:**
1. Completar "Información Personal":
   - Nombre, apellidos, email, teléfono
   - Número de licencia profesional
   - País, estado, ciudad
2. Completar "Información Profesional":
   - Profesión: `Fisioterapeuta`
   - Especialidad: `Fisioterapia Deportiva`
   - Años de experiencia: `5`
3. Completar "Compliance y Seguridad":
   - Aceptar todos los consentimientos HIPAA/GDPR
   - Habilitar MFA y notificaciones

**Resultado esperado:**
- Onboarding completado exitosamente
- Perfil profesional guardado en Firestore
- Redirección a `/professional-workflow`

### **PASO 6: Professional Workflow**
**Qué hacer:**
1. Verificar que llegaste a la página principal de trabajo
2. Verificar que hay opciones de grabación de audio
3. Verificar navegación entre tabs (Evaluación Clínica, SOAP, Resumen)

**Resultado esperado:**
- **¡PIPELINE COMPLETO FUNCIONANDO!**
- Usuario autenticado y con perfil completo
- Acceso a todas las funcionalidades profesionales

---

## 🔧 Debugging y Troubleshooting

### **URLs de Monitoreo:**
- **App Principal**: http://localhost:5173
- **Auth Emulator**: http://localhost:9099
- **Firestore Emulator**: http://localhost:8080

### **DevTools Essentials:**
1. **Console**: Verificar logs de Firebase y errores
2. **Network**: Verificar llamadas a emuladores
3. **Application → Storage**: Verificar datos locales
4. **Application → IndexedDB**: Datos de Firebase

### **Datos Esperados en Firestore:**
- **Colección**: `users`
- **Documento**: `[uid-del-usuario]`
- **Datos**:
  ```json
  {
    "email": "mauricio.test@aiduxcare.com",
    "name": "Dr. Mauricio Test",
    "role": "PHYSICIAN",
    "specialization": "Fisioterapia Deportiva",
    "emailVerified": true,
    "mfaEnabled": true,
    "createdAt": "2025-01-XX...",
    "updatedAt": "2025-01-XX..."
  }
  ```

### **Errores Comunes y Soluciones:**

| Error | Solución |
|-------|----------|
| "Auth Emulator not connected" | Reiniciar emuladores Firebase |
| "Network request failed" | Verificar puertos 9099 y 8080 |
| "Email not verified" | Normal en emulador, debería resolverse automáticamente |
| Redirección incorrecta | Verificar rutas en `src/router/router.tsx` |
| "Firebase not defined" | Verificar variables de entorno en `.env.local` |

---

## 🎯 Checklist de Éxito

### ✅ **Setup Técnico**
- [ ] Emuladores Firebase ejecutándose
- [ ] Servidor de desarrollo funcionando
- [ ] Script de testing ejecutado sin errores
- [ ] DevTools muestran logs de Firebase

### ✅ **Pipeline Funcional**
- [ ] WelcomePage carga correctamente
- [ ] Registro de usuario funciona
- [ ] Email se verifica automáticamente
- [ ] Login funciona con credenciales correctas
- [ ] Onboarding se completa sin errores
- [ ] Redirección a workflow exitosa

### ✅ **Datos Persistentes**
- [ ] Usuario aparece en Firestore emulator
- [ ] Perfil profesional guardado correctamente
- [ ] Autenticación persiste entre recargas
- [ ] Estado de onboarding se mantiene

---

## 🚀 Comandos Rápidos

```bash
# Setup completo en 3 comandos
firebase emulators:start --only auth,firestore --project demo-project &
npm run dev &
node scripts/test-welcome-pipeline.js

# Verificación rápida
curl -s http://localhost:9099 && echo "Auth OK"
curl -s http://localhost:8080 && echo "Firestore OK"  
curl -s http://localhost:5173 && echo "App OK"

# Reset completo (si algo falla)
pkill -f firebase
pkill -f vite
# ... reiniciar todo
```

---

## 🎯 Resultado Final

**Al completar esta guía tendrás:**

✅ **Pipeline de bienvenida 100% funcional**  
✅ **Emuladores Firebase integrados y funcionando**  
✅ **Autenticación completa con verificación de email**  
✅ **Onboarding profesional implementado**  
✅ **Acceso a flujo de trabajo principal**  
✅ **Datos persistiendo en Firestore (emulado)**  

**¡Tu sistema está listo para desarrollo y testing profesional!**