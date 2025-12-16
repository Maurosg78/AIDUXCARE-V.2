# ✅ Pasos Restantes - Cloudflare DNS

## ✅ Progreso Actual

### Completado:
- ✅ Registro A `aiduxcare.com` → `199.36.158.100` (DNS only)
- ✅ Eliminado registro duplicado

---

## ⏳ Pasos Restantes (3 acciones)

### Paso 1: Cambiar Registro A de `app` a "DNS only"

**Estado actual**: `app` → `199.36.158.100` está en modo **"Proxied"** (nube naranja)

**Acción**:
1. Haz clic en **"Edit"** del registro A `app`
2. Haz clic en la **nube naranja** (Proxied) para cambiarla a **nube gris** (DNS only)
3. Haz clic en **"Save"**

**Resultado esperado**:
- Name: `app`
- Content: `199.36.158.100`
- Proxy status: **DNS only** (nube gris) ✅

---

### Paso 2: Cambiar Registro CNAME de `www` a "DNS only"

**Estado actual**: `www` → `app.aiduxcare.com` está en modo **"Proxied"** (nube naranja)

**Acción**:
1. Haz clic en **"Edit"** del registro CNAME `www`
2. Haz clic en la **nube naranja** (Proxied) para cambiarla a **nube gris** (DNS only)
3. Haz clic en **"Save"**

**Resultado esperado**:
- Name: `www`
- Content: `app.aiduxcare.com`
- Proxy status: **DNS only** (nube gris) ✅

---

### Paso 3: Agregar Registro TXT de Firebase

**Estado actual**: No existe el registro TXT `hosting-site=aiduxcare-v2-uat-dev`

**Acción**:
1. Haz clic en el botón **"+ Add record"** (arriba a la derecha)
2. Configura:
   - **Type**: Selecciona `TXT`
   - **Name**: Escribe `aiduxcare.com` (o `@`)
   - **Content**: Escribe `hosting-site=aiduxcare-v2-uat-dev`
     - ⚠️ **IMPORTANTE**: Debe ser EXACTO, sin espacios extra, sin comillas
   - **Proxy status**: Asegúrate de que esté en **"DNS only"** (nube gris)
   - **TTL**: Deja en "Auto"
3. Haz clic en **"Save"**

**Resultado esperado**:
- Type: `TXT`
- Name: `aiduxcare.com`
- Content: `hosting-site=aiduxcare-v2-uat-dev`
- Proxy status: **DNS only** (nube gris) ✅

---

## 📋 Configuración Final Esperada

Después de completar los 3 pasos, deberías tener:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| **A** | `aiduxcare.com` | `199.36.158.100` | ✅ DNS only (gris) |
| **A** | `app` | `199.36.158.100` | ✅ DNS only (gris) |
| **CNAME** | `dev` | `aiduxcare-v2-uat-dev.web.app` | ✅ DNS only (gris) |
| **CNAME** | `www` | `app.aiduxcare.com` | ✅ DNS only (gris) |
| **TXT** | `aiduxcare.com` | `hosting-site=aiduxcare-v2-uat-dev` | ✅ DNS only (gris) |
| **MX** | `aiduxcare.com` | `smtp.google.com` | ✅ DNS only (gris) |
| **TXT** | `aiduxcare.com` | `v=spf1 include:_spf.google.com ~all` | ✅ DNS only (gris) |

---

## 🔍 Verificación Post-Corrección

Después de completar los 3 pasos:

1. **Espera 5-10 minutos** para que Cloudflare propague los cambios

2. **Verifica desde CLI**:
   ```bash
   ./scripts/verify-dns-firebase.sh
   ```

   **Resultado esperado**:
   - ✅ Solo debe aparecer `199.36.158.100` en registros A
   - ✅ NO debe aparecer ninguna IP de Cloudflare
   - ✅ Debe aparecer el registro TXT `hosting-site=aiduxcare-v2-uat-dev`

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

## ✅ Checklist Final

Antes de re-verificar en Firebase:

- [ ] Registro A `app` cambiado a "DNS only" (gris)
- [ ] Registro CNAME `www` cambiado a "DNS only" (gris)
- [ ] Registro TXT `hosting-site=aiduxcare-v2-uat-dev` agregado (DNS only)
- [ ] Esperado 5-10 minutos para propagación Cloudflare
- [ ] Ejecutado `./scripts/verify-dns-firebase.sh` y verificado que está correcto
- [ ] Re-verificado en Firebase Console

---

**Estado**: 🔄 1 de 4 pasos completados (25%)  
**Última actualización**: Día 1


