# 🌐 Configuración de Dominio aiduxcare.com en Porkbun

## 📋 Información Necesaria

Para configurar el landing page en `aiduxcare.com`, necesitamos:

### 1. **Información de Firebase Hosting**

Necesitamos obtener:
- **Site ID de Firebase Hosting** (ej: `aiduxcare-v2-uat-dev`)
- **URL de Firebase Hosting** (ej: `aiduxcare-v2-uat-dev.web.app`)

**Cómo obtenerlo:**
```bash
# Verificar configuración actual de Firebase
firebase projects:list
firebase hosting:sites:list
```

### 2. **Configuración DNS en Porkbun**

Necesitamos configurar los siguientes registros DNS:

#### Opción A: Usando Firebase Hosting (Recomendado)

**Registros DNS necesarios:**

1. **Registro A (IPv4)** - Para el dominio raíz:
   ```
   Tipo: A
   Nombre: @ (o dejar vacío para dominio raíz)
   Valor: [IP de Firebase Hosting - obtener con: firebase hosting:channel:list]
   TTL: 3600
   ```

2. **Registro CNAME** - Para www:
   ```
   Tipo: CNAME
   Nombre: www
   Valor: [tu-sitio].web.app
   TTL: 3600
   ```

**Nota:** Firebase Hosting proporciona IPs estáticas. Necesitamos ejecutar:
```bash
firebase hosting:channel:list
# O verificar en Firebase Console > Hosting > Configuración del sitio
```

#### Opción B: Usando Cloudflare (Recomendado para mejor rendimiento)

Si prefieres usar Cloudflare como CDN (recomendado):
1. Configurar Cloudflare para `aiduxcare.com`
2. Apuntar Cloudflare a Firebase Hosting
3. Configurar SSL automático en Cloudflare

### 3. **Configuración SSL**

Firebase Hosting proporciona SSL automático, pero necesitamos:
- Verificar dominio en Firebase Console
- Configurar certificado SSL personalizado si es necesario

---

## 🚀 Pasos de Configuración

### Paso 1: Verificar Firebase Hosting

```bash
# 1. Verificar que Firebase CLI está instalado
firebase --version

# 2. Iniciar sesión en Firebase
firebase login

# 3. Seleccionar proyecto
firebase use [tu-proyecto-id]

# 4. Verificar configuración de hosting
firebase hosting:sites:list

# 5. Obtener información del sitio
firebase hosting:channel:list
```

### Paso 2: Configurar Dominio en Firebase Console

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar tu proyecto
3. Ir a **Hosting** > **Configuración del sitio**
4. Click en **"Agregar dominio personalizado"**
5. Ingresar `aiduxcare.com`
6. Firebase te dará instrucciones específicas de DNS

### Paso 3: Configurar DNS en Porkbun

1. Iniciar sesión en [Porkbun](https://porkbun.com)
2. Ir a **Domains** > **aiduxcare.com** > **DNS**
3. Agregar los registros que Firebase proporcionó:

**Ejemplo de registros (Firebase te dará los valores exactos):**

```
Tipo: A
Nombre: @
Valor: 151.101.1.195 (ejemplo - usar el que Firebase proporcione)
TTL: 3600

Tipo: A
Nombre: @
Valor: 151.101.65.195 (ejemplo - usar el que Firebase proporcione)
TTL: 3600

Tipo: CNAME
Nombre: www
Valor: [tu-sitio].web.app
TTL: 3600
```

### Paso 4: Verificar Routing

Asegurarse de que el routing funcione correctamente:

1. **Verificar `firebase.json`:**
   ```json
   {
     "hosting": {
       "public": "dist",
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

2. **Verificar que `/hospital` está configurado en el router:**
   - Ya está configurado en `src/router/router.tsx`
   - Ruta: `/hospital` → `HospitalPortalLandingPage`

### Paso 5: Desplegar a Firebase Hosting

```bash
# 1. Build de producción
npm run build

# 2. Desplegar a Firebase Hosting
firebase deploy --only hosting

# 3. Verificar despliegue
firebase hosting:channel:list
```

### Paso 6: Verificar SSL

1. Esperar 24-48 horas para propagación DNS
2. Firebase configurará SSL automáticamente
3. Verificar en Firebase Console > Hosting > Dominios personalizados

---

## 📝 Configuración Adicional Recomendada

### 1. Redirección de www a dominio raíz

En `firebase.json`, agregar:

```json
{
  "hosting": {
    "redirects": [
      {
        "source": "/www",
        "destination": "/",
        "type": 301
      }
    ]
  }
}
```

### 2. Headers de Seguridad

Ya configurados en `firebase.json`:
- Content-Type para assets
- Headers de seguridad (agregar si es necesario)

### 3. Configuración de Cache

```json
{
  "hosting": {
    "headers": [
      {
        "source": "/assets/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

---

## 🔍 Verificación Post-Configuración

### Checklist:

- [ ] DNS configurado en Porkbun
- [ ] Dominio verificado en Firebase Console
- [ ] SSL activo (esperar 24-48h)
- [ ] `aiduxcare.com` carga correctamente
- [ ] `aiduxcare.com/hospital` muestra landing page
- [ ] `aiduxcare.com/hospital/inpatient` funciona con trace number
- [ ] `aiduxcare.com/login` redirige correctamente
- [ ] Certificado SSL válido (verificar con SSL Labs)

### Comandos de Verificación:

```bash
# Verificar DNS
dig aiduxcare.com
nslookup aiduxcare.com

# Verificar SSL
curl -I https://aiduxcare.com
openssl s_client -connect aiduxcare.com:443

# Verificar Firebase Hosting
firebase hosting:channel:list
```

---

## 🆘 Troubleshooting

### Problema: Dominio no resuelve

**Solución:**
1. Verificar DNS en Porkbun (puede tardar hasta 48h)
2. Verificar que los registros A/CNAME son correctos
3. Usar `dig` o `nslookup` para verificar propagación

### Problema: SSL no funciona

**Solución:**
1. Esperar 24-48 horas después de configurar DNS
2. Verificar en Firebase Console que el dominio está verificado
3. Verificar que los registros DNS son correctos

### Problema: Routing no funciona

**Solución:**
1. Verificar `firebase.json` tiene `rewrites` configurado
2. Verificar que `dist/index.html` existe después del build
3. Verificar que React Router está configurado correctamente

---

## 📞 Información de Contacto

Si necesitas ayuda adicional:
- Firebase Support: https://firebase.google.com/support
- Porkbun Support: https://porkbun.com/support

---

## ✅ Próximos Pasos

Una vez configurado el dominio:

1. **Actualizar URLs en el código:**
   - Cambiar referencias de `localhost` a `aiduxcare.com`
   - Actualizar URLs de redirección en servicios

2. **Configurar Analytics:**
   - Google Analytics para `aiduxcare.com`
   - Firebase Analytics

3. **Configurar Monitoring:**
   - Uptime monitoring
   - Error tracking (Sentry, etc.)

4. **SEO:**
   - Meta tags
   - Sitemap
   - robots.txt

