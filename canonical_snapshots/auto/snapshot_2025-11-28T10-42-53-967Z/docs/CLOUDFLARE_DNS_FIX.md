# 🔧 Corrección DNS en Cloudflare - aiduxcare.com

## 🚨 Problema Identificado

Cloudflare está activo y tiene registros DNS incorrectos que interfieren con la verificación de Firebase.

### ❌ Problemas Detectados:

1. **Registros A con IPs incorrectas**:
   - `aiduxcare.com` → `52.33.207.7` (INCORRECTO - debe ser `199.36.158.100`)
   - `aiduxcare.com` → `44.230.85.241` (INCORRECTO - debe ser `199.36.158.100`)

2. **Registros en modo "Proxied" (nube naranja)**:
   - Firebase necesita ver las IPs reales, no las de Cloudflare
   - Los registros deben estar en modo "DNS only" (nube gris)

3. **Falta registro TXT de Firebase**:
   - No se ve el registro `hosting-site=aiduxcare-v2-uat-dev`

---

## ✅ Solución Paso a Paso

### Paso 1: Corregir Registros A de `aiduxcare.com`

En Cloudflare, para cada registro A de `aiduxcare.com`:

1. Haz clic en el botón **"Edit"** del registro
2. Cambia el **Content** a: `199.36.158.100`
3. Cambia el **Proxy status** de **"Proxied"** (nube naranja) a **"DNS only"** (nube gris)
4. Haz clic en **"Save"**

**Debes hacer esto para AMBOS registros A de `aiduxcare.com`**

**Resultado esperado:**
- Solo debe haber **UN** registro A para `aiduxcare.com` → `199.36.158.100` (DNS only)
- Elimina el registro duplicado si hay dos

---

### Paso 2: Verificar Registro A de `app`

El registro `app` → `199.36.158.100` está correcto, pero:

1. Haz clic en **"Edit"**
2. Cambia el **Proxy status** de **"Proxied"** a **"DNS only"** (nube gris)
3. Haz clic en **"Save"**

---

### Paso 3: Verificar Registro CNAME de `www`

El registro `www` → `app.aiduxcare.com` está correcto, pero:

1. Haz clic en **"Edit"**
2. Cambia el **Proxy status** de **"Proxied"** a **"DNS only"** (nube gris)
3. Haz clic en **"Save"**

---

### Paso 4: Agregar Registro TXT de Firebase

1. Haz clic en **"Add record"** o **"Agregar registro"**
2. Configura:
   - **Type**: `TXT`
   - **Name**: `aiduxcare.com` (o `@`)
   - **Content**: `hosting-site=aiduxcare-v2-uat-dev` (⚠️ **EXACTO**, sin espacios extra, sin comillas)
   - **Proxy status**: **DNS only** (nube gris)
   - **TTL**: Auto
3. Haz clic en **"Save"**

---

### Paso 5: Verificar Registro CNAME de `dev`

El registro `dev` → `aiduxcare-v2-uat-dev.web.app` ya está en modo **"DNS only"** (correcto) ✅

---

## 📋 Configuración Final Esperada en Cloudflare

Después de los cambios, deberías tener:

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| **A** | `aiduxcare.com` | `199.36.158.100` | **DNS only** (gris) | Auto |
| **A** | `app` | `199.36.158.100` | **DNS only** (gris) | Auto |
| **CNAME** | `dev` | `aiduxcare-v2-uat-dev.web.app` | **DNS only** (gris) | Auto |
| **CNAME** | `www` | `app.aiduxcare.com` | **DNS only** (gris) | Auto |
| **TXT** | `aiduxcare.com` | `hosting-site=aiduxcare-v2-uat-dev` | **DNS only** (gris) | Auto |
| **MX** | `aiduxcare.com` | `smtp.google.com` (Priority: 1) | **DNS only** (gris) | Auto |
| **TXT** | `aiduxcare.com` | `v=spf1 include:_spf.google.com ~all` | **DNS only** (gris) | Auto |

---

## ⚠️ Importante: Modo "DNS only" vs "Proxied"

### "Proxied" (Nube Naranja) ❌
- Cloudflare actúa como proxy
- Oculta las IPs reales
- Firebase no puede verificar el dominio
- **NO usar para registros de Firebase**

### "DNS only" (Nube Gris) ✅
- Cloudflare solo gestiona DNS
- Las IPs reales son visibles
- Firebase puede verificar el dominio
- **USAR para registros de Firebase**

---

## 🔍 Verificación Post-Corrección

Después de hacer los cambios:

1. **Espera 5-10 minutos** para que Cloudflare propague los cambios

2. **Verifica desde CLI**:
   ```bash
   ./scripts/verify-dns-firebase.sh
   ```

3. **Verifica registros específicos**:
   ```bash
   # Debe mostrar solo 199.36.158.100
   dig aiduxcare.com A +short
   
   # Debe mostrar el registro TXT de Firebase
   dig aiduxcare.com TXT +short | grep hosting-site
   ```

4. **Verifica propagación global**:
   - https://www.whatsmydns.net/#A/aiduxcare.com
   - Debe mostrar `199.36.158.100` globalmente

---

## 🎯 Re-verificación en Firebase

Después de verificar que DNS está correcto:

1. Ve a: **https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/hosting**
2. Haz clic en **"Domains"** o **"Dominios"**
3. Busca `aiduxcare.com` en la lista
4. Haz clic en **"Verify"** o **"Re-verify"**
5. Espera 5-10 minutos para que Firebase intente verificar nuevamente

---

## 📊 Resumen de Cambios Requeridos

### Cambios en Cloudflare:

1. ✅ **Eliminar** registros A duplicados de `aiduxcare.com` con IPs incorrectas
2. ✅ **Crear/Actualizar** registro A `aiduxcare.com` → `199.36.158.100` (DNS only)
3. ✅ **Cambiar** registro A `app` → `199.36.158.100` a modo "DNS only"
4. ✅ **Cambiar** registro CNAME `www` a modo "DNS only"
5. ✅ **Agregar** registro TXT `hosting-site=aiduxcare-v2-uat-dev` (DNS only)

### Tiempo estimado:
- **Cambios en Cloudflare**: 5-10 minutos
- **Propagación DNS**: 5-15 minutos (Cloudflare es rápido)
- **Verificación Firebase**: 5-10 minutos

---

## ✅ Checklist Final

Antes de re-verificar en Firebase:

- [ ] Registro A `aiduxcare.com` → `199.36.158.100` (DNS only)
- [ ] Registro A `app` → `199.36.158.100` (DNS only)
- [ ] Registro CNAME `www` → `app.aiduxcare.com` (DNS only)
- [ ] Registro TXT `hosting-site=aiduxcare-v2-uat-dev` existe (DNS only)
- [ ] NO hay registros A con IPs incorrectas (52.33.207.7, 44.230.85.241)
- [ ] Esperado 5-10 minutos para propagación Cloudflare
- [ ] Ejecutado `./scripts/verify-dns-firebase.sh` y verificado que está correcto
- [ ] Re-verificado en Firebase Console

---

**Estado**: 🔄 Esperando corrección en Cloudflare  
**Última actualización**: Día 1

