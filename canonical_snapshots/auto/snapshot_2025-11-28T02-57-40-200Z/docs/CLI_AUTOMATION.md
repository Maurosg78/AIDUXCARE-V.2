# 🖥️ Automatización por CLI

## 📋 Scripts Disponibles

Todos los scripts están en `scripts/` y están listos para usar.

---

## 🚀 Scripts Principales

### 1. **Configuración Completa del Dominio**

```bash
./scripts/setup-domain-aiduxcare.sh
```

**Qué hace:**
- ✅ Verifica Firebase CLI instalado
- ✅ Verifica autenticación Firebase
- ✅ Selecciona proyecto automáticamente
- ✅ Lista sitios de hosting disponibles
- ✅ Obtiene Site ID automáticamente
- ✅ Verifica configuración DNS actual
- ✅ Muestra próximos pasos manuales

**Ejemplo de uso:**
```bash
# Con proyecto por defecto
./scripts/setup-domain-aiduxcare.sh

# Con proyecto específico
FIREBASE_PROJECT_ID=aiduxcare-v2-prod ./scripts/setup-domain-aiduxcare.sh
```

---

### 2. **Verificación de Dominio**

```bash
./scripts/verify-domain.sh
```

**Qué hace:**
- ✅ Verifica registros DNS (A, AAAA, CNAME)
- ✅ Verifica respuesta HTTP/HTTPS
- ✅ Verifica certificado SSL
- ✅ Verifica rutas específicas (/hospital, /login)

**Ejemplo de uso:**
```bash
./scripts/verify-domain.sh
```

**Output esperado:**
```
✅ Registro A: 151.101.1.195
✅ HTTPS responde: 200
✅ SSL configurado
✅ /hospital → 200
```

---

### 3. **Deploy a Producción**

```bash
./scripts/deploy-to-production.sh
```

**Qué hace:**
- ✅ Verifica Firebase CLI
- ✅ Verifica autenticación
- ✅ Selecciona proyecto
- ✅ Ejecuta `npm run build`
- ✅ Despliega a Firebase Hosting
- ✅ Muestra URLs disponibles

**Ejemplo de uso:**
```bash
./scripts/deploy-to-production.sh
```

---

### 4. **Verificación de Firebase Hosting**

```bash
./scripts/verify-firebase-hosting.sh
```

**Qué hace:**
- ✅ Verifica Firebase CLI
- ✅ Lista proyectos disponibles
- ✅ Muestra proyecto actual
- ✅ Lista sitios de hosting
- ✅ Muestra información de canales

---

## 🔧 Comandos Firebase CLI Útiles

### Información de Hosting

```bash
# Listar sitios de hosting
firebase hosting:sites:list

# Obtener información de un sitio
firebase hosting:sites:get [SITE_ID]

# Listar canales
firebase hosting:channel:list

# Ver información de un canal
firebase hosting:channel:get [CHANNEL_ID] --site [SITE_ID]
```

### Deploy

```bash
# Deploy completo
firebase deploy

# Solo hosting
firebase deploy --only hosting

# Solo functions
firebase deploy --only functions

# Deploy a canal específico
firebase hosting:channel:deploy [CHANNEL_ID] --only hosting
```

### Proyectos

```bash
# Listar proyectos
firebase projects:list

# Seleccionar proyecto
firebase use [PROJECT_ID]

# Ver proyecto actual
firebase use
```

---

## 📝 Workflow Completo por CLI

### Paso 1: Configuración Inicial

```bash
# 1. Verificar y configurar Firebase
./scripts/setup-domain-aiduxcare.sh

# 2. Verificar que todo está listo
./scripts/verify-firebase-hosting.sh
```

### Paso 2: Configurar Dominio (Manual en Firebase Console)

**Nota:** La configuración del dominio personalizado requiere Firebase Console porque Firebase CLI no tiene comandos para agregar dominios personalizados directamente.

**Pasos manuales:**
1. Ir a Firebase Console
2. Hosting > Configuración del sitio
3. Agregar dominio personalizado: `aiduxcare.com`
4. Copiar registros DNS que Firebase proporciona

### Paso 3: Configurar DNS en Porkbun (Manual)

1. Iniciar sesión en Porkbun
2. Agregar registros DNS proporcionados por Firebase

### Paso 4: Build y Deploy

```bash
# Deploy completo
./scripts/deploy-to-production.sh

# O manualmente:
npm run build
firebase deploy --only hosting
```

### Paso 5: Verificación

```bash
# Esperar 24-48 horas para propagación DNS
# Luego verificar:
./scripts/verify-domain.sh
```

---

## 🎯 Comandos Rápidos

### Verificar Estado Actual

```bash
# Estado de Firebase
firebase use
firebase hosting:sites:list

# Estado de DNS
dig aiduxcare.com
dig www.aiduxcare.com

# Estado de SSL
curl -I https://aiduxcare.com
openssl s_client -connect aiduxcare.com:443
```

### Build y Deploy Rápido

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting

# Verificar deploy
firebase hosting:channel:list
```

### Verificar Rutas Específicas

```bash
# Landing page
curl -I https://aiduxcare.com/hospital

# Login
curl -I https://aiduxcare.com/login

# Portal inpatient (con trace)
curl -I "https://aiduxcare.com/hospital/inpatient?trace=AUX-HSC-123456"
```

---

## 🆘 Troubleshooting por CLI

### Problema: Firebase CLI no está instalado

```bash
npm install -g firebase-tools
firebase login
```

### Problema: No estás autenticado

```bash
firebase login
firebase projects:list  # Verificar
```

### Problema: Proyecto incorrecto

```bash
firebase projects:list
firebase use [PROJECT_ID_CORRECTO]
```

### Problema: Build falla

```bash
# Limpiar y rebuild
rm -rf dist node_modules/.vite
npm run build
```

### Problema: Deploy falla

```bash
# Verificar autenticación
firebase login --reauth

# Verificar proyecto
firebase use

# Intentar deploy con más información
firebase deploy --only hosting --debug
```

### Problema: DNS no resuelve

```bash
# Verificar propagación
dig aiduxcare.com
nslookup aiduxcare.com

# Verificar desde diferentes servidores DNS
dig @8.8.8.8 aiduxcare.com  # Google DNS
dig @1.1.1.1 aiduxcare.com  # Cloudflare DNS
```

---

## 📊 Monitoreo Continuo

### Script de Monitoreo (Opcional)

Crear `scripts/monitor-domain.sh`:

```bash
#!/bin/bash
DOMAIN="aiduxcare.com"

# Verificar DNS
dig +short $DOMAIN A | head -1

# Verificar HTTPS
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN

# Verificar SSL
echo | openssl s_client -connect $DOMAIN:443 2>/dev/null | grep "Verify return code"
```

Ejecutar periódicamente:
```bash
# Cada hora
watch -n 3600 ./scripts/monitor-domain.sh

# O con cron (cada 6 horas)
0 */6 * * * /path/to/scripts/monitor-domain.sh >> /var/log/domain-monitor.log 2>&1
```

---

## ✅ Checklist de Automatización

- [x] Script de configuración inicial (`setup-domain-aiduxcare.sh`)
- [x] Script de verificación de dominio (`verify-domain.sh`)
- [x] Script de deploy (`deploy-to-production.sh`)
- [x] Script de verificación Firebase (`verify-firebase-hosting.sh`)
- [ ] Script de monitoreo continuo (opcional)
- [ ] CI/CD pipeline (GitHub Actions, etc.)

---

## 🚀 Próximos Pasos

1. **Ejecutar configuración inicial:**
   ```bash
   ./scripts/setup-domain-aiduxcare.sh
   ```

2. **Configurar dominio en Firebase Console** (manual)

3. **Configurar DNS en Porkbun** (manual)

4. **Deploy:**
   ```bash
   ./scripts/deploy-to-production.sh
   ```

5. **Verificar después de 24-48h:**
   ```bash
   ./scripts/verify-domain.sh
   ```

---

**¡Todo listo!** Los scripts están preparados para automatizar todo lo posible por CLI. Solo los pasos de configuración de dominio en Firebase Console y DNS en Porkbun requieren acción manual.

