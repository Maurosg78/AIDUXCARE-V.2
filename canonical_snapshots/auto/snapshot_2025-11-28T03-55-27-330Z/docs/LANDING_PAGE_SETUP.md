# 🏥 Configuración del Landing Page Hospitalario

## 📋 Resumen

El landing page para `aiduxcare.com/hospital` ya está **completamente implementado** y listo para usar. Solo necesitas configurar el dominio en Porkbun para que apunte a Firebase Hosting.

---

## ✅ Lo que ya está implementado

### 1. **Landing Page (`HospitalPortalLandingPage.tsx`)**
- ✅ Dos cards: **IN-PATIENT** y **OUT-PATIENT**
- ✅ Formulario para número de trazabilidad (IN-PATIENT)
- ✅ Validación de acceso
- ✅ Redirección automática a portal correspondiente
- ✅ Diseño responsive y moderno
- ✅ Cumplimiento PHIPA visible

### 2. **Routing Configurado**
- ✅ `/hospital` → Landing page con dos cards
- ✅ `/hospital/inpatient` → Portal inpatient (con trace number)
- ✅ `/hospital/note` → Portal legacy (con código de nota)
- ✅ `/login` → Login principal (OUT-PATIENT)

### 3. **Firebase Hosting**
- ✅ Configuración completa en `firebase.json`
- ✅ Rewrites configurados para SPA
- ✅ Headers de seguridad y cache configurados

---

## 🚀 Pasos para Activar el Dominio

### Paso 1: Verificar Firebase Hosting

```bash
# Ejecutar script de verificación
./scripts/verify-firebase-hosting.sh

# O manualmente:
firebase login
firebase projects:list
firebase use [tu-proyecto-id]
firebase hosting:sites:list
```

### Paso 2: Configurar Dominio en Firebase Console

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar tu proyecto (ej: `aiduxcare-v2-uat-dev`)
3. Ir a **Hosting** > **Configuración del sitio**
4. Click en **"Agregar dominio personalizado"**
5. Ingresar: `aiduxcare.com`
6. Firebase te mostrará los registros DNS específicos

### Paso 3: Configurar DNS en Porkbun

1. Iniciar sesión en [Porkbun](https://porkbun.com)
2. Ir a **Domains** > **aiduxcare.com** > **DNS**
3. Agregar los registros que Firebase proporcionó

**Ejemplo de registros (Firebase te dará los valores exactos):**

```
Tipo: A
Nombre: @ (o dejar vacío)
Valor: [IP que Firebase proporcione]
TTL: 3600

Tipo: A
Nombre: @
Valor: [Segunda IP que Firebase proporcione]
TTL: 3600

Tipo: CNAME
Nombre: www
Valor: [tu-sitio].web.app
TTL: 3600
```

### Paso 4: Desplegar a Firebase Hosting

```bash
# Build de producción
npm run build

# Desplegar
firebase deploy --only hosting

# Verificar despliegue
firebase hosting:channel:list
```

### Paso 5: Verificar Funcionamiento

Después de 24-48 horas (propagación DNS):

1. **Verificar dominio:**
   ```bash
   curl -I https://aiduxcare.com
   ```

2. **Verificar landing page:**
   - `https://aiduxcare.com/hospital` → Debe mostrar las dos cards
   - `https://aiduxcare.com/hospital/inpatient?trace=AUX-HSC-123456` → Portal inpatient
   - `https://aiduxcare.com/login` → Login principal

3. **Verificar SSL:**
   - Firebase configurará SSL automáticamente
   - Verificar en [SSL Labs](https://www.ssllabs.com/ssltest/)

---

## 🎯 Estructura de URLs

```
aiduxcare.com/
├── /                    → Login principal (OUT-PATIENT)
├── /login              → Login principal (alias)
├── /hospital           → Landing page con dos cards ⭐
│   ├── /hospital/inpatient?trace=AUX-XXX-XXX → Portal inpatient
│   └── /hospital/note → Portal legacy (código de nota)
└── /[otras rutas]      → Rutas protegidas con AuthGuard
```

---

## 📱 Flujo de Usuario

### Para Pacientes Hospitalizados (IN-PATIENT):

1. Usuario accede a `aiduxcare.com/hospital`
2. Ve dos cards: **IN-PATIENT** y **OUT-PATIENT**
3. Selecciona **IN-PATIENT**
4. Ingresa número de trazabilidad (ej: `AUX-HSC-789234`)
5. Click en "Acceder al Portal"
6. Sistema verifica acceso y redirige a `/hospital/inpatient?trace=...`
7. Usuario ve notas del episodio actual

### Para Pacientes Ambulatorios (OUT-PATIENT):

1. Usuario accede a `aiduxcare.com/hospital`
2. Ve dos cards: **IN-PATIENT** y **OUT-PATIENT**
3. Selecciona **OUT-PATIENT**
4. Click en "Iniciar Sesión"
5. Redirige a `/login` (portal principal)
6. Usuario inicia sesión normalmente
7. Ve historial completo incluyendo períodos hospitalarios transferidos

---

## 🔧 Configuración Opcional

### Opción 1: Hacer `/hospital` la página principal

Si quieres que `aiduxcare.com` muestre directamente el landing page:

**Modificar `src/router/router.tsx`:**

```typescript
const router = createBrowserRouter([
  { path: '/', element: <HospitalPortalLandingPage /> }, // Landing page como raíz
  { path: '/login', element: <LoginPage /> },
  { path: '/app', element: <AuthGuard><LayoutWrapper><CommandCenterPageSprint3 /></LayoutWrapper></AuthGuard> },
  // ... resto de rutas
]);
```

### Opción 2: Mantener estructura actual (Recomendado)

- `/` → Login principal (para usuarios existentes)
- `/hospital` → Landing page (para acceso hospitalario)

**Ventajas:**
- No rompe URLs existentes
- Separación clara entre acceso hospitalario y principal
- Más fácil de mantener

---

## 🆘 Troubleshooting

### Problema: Dominio no carga

**Solución:**
1. Verificar DNS en Porkbun (puede tardar 24-48h)
2. Verificar que Firebase tiene el dominio configurado
3. Usar `dig aiduxcare.com` para verificar propagación

### Problema: SSL no funciona

**Solución:**
1. Esperar 24-48 horas después de configurar DNS
2. Verificar en Firebase Console que el dominio está verificado
3. Verificar que los registros DNS son correctos

### Problema: `/hospital` muestra 404

**Solución:**
1. Verificar que `firebase.json` tiene `rewrites` configurado
2. Verificar que `dist/index.html` existe después del build
3. Verificar que React Router está configurado correctamente

### Problema: Routing no funciona

**Solución:**
1. Verificar `firebase.json`:
   ```json
   {
     "hosting": {
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```
2. Rebuild y redeploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 📞 Información Adicional

- **Documentación completa:** Ver `docs/DOMAIN_SETUP_PORKBUN.md`
- **Firebase Hosting Docs:** https://firebase.google.com/docs/hosting
- **Porkbun DNS Docs:** https://porkbun.com/support

---

## ✅ Checklist Final

- [ ] Firebase Hosting verificado
- [ ] Dominio configurado en Firebase Console
- [ ] DNS configurado en Porkbun
- [ ] Build de producción ejecutado (`npm run build`)
- [ ] Desplegado a Firebase Hosting (`firebase deploy --only hosting`)
- [ ] SSL activo (esperar 24-48h)
- [ ] `aiduxcare.com/hospital` funciona correctamente
- [ ] `aiduxcare.com/hospital/inpatient` funciona con trace number
- [ ] `aiduxcare.com/login` redirige correctamente

---

**¡Listo!** Una vez completados estos pasos, el landing page estará completamente funcional en `aiduxcare.com/hospital`.

