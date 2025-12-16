# 📋 Siguientes Pasos - Corrección DNS Firebase

## ✅ Lo que ya se hizo desde CLI

1. ✅ **Verificación DNS actual** - Se detectaron registros problemáticos
2. ✅ **Scripts de verificación creados**:
   - `scripts/verify-dns-firebase.sh` - Verificación completa
   - `scripts/firebase-dns-setup.sh` - Reporte de configuración
   - `scripts/monitor-dns-propagation.sh` - Monitor de propagación
3. ✅ **Documentación creada**:
   - `docs/FIREBASE_DNS_TROUBLESHOOTING.md` - Análisis del problema
   - `docs/PORKBUN_DNS_FIX_GUIDE.md` - Guía paso a paso
   - `docs/NEXT_STEPS_DNS_FIX.md` - Este documento

---

## 🎯 Pasos Manuales Requeridos (en Porkbun)

### Paso 1: Acceder a Porkbun DNS Management

1. Ve a: **https://porkbun.com/account/domains**
2. Inicia sesión con tus credenciales
3. Busca y selecciona el dominio **`aiduxcare.com`**
4. Haz clic en la pestaña **"DNS"** o **"DNS Records"**

---

### Paso 2: Eliminar Registros Problemáticos

#### ❌ ELIMINA estos registros si existen:

**Registros A (IPv4):**
- Tipo: **A**, Host: **@** (o `aiduxcare.com`), Value: **104.21.11.188**
- Tipo: **A**, Host: **@** (o `aiduxcare.com`), Value: **172.67.192.98**
- Cualquier otro registro A que NO sea `199.36.158.100`

**Registros AAAA (IPv6):**
- Tipo: **AAAA**, Host: **@**, Value: **2606:4700:3032::ac43:c062**
- Tipo: **AAAA**, Host: **@**, Value: **2606:4700:3035::6815:bbc**
- Cualquier otro registro AAAA (Firebase no requiere IPv6)

---

### Paso 3: Verificar/Agregar Registros Correctos

#### ✅ VERIFICA que existan estos registros:

| Tipo | Host | Value | TTL |
|------|------|-------|-----|
| **A** | @ | **199.36.158.100** | 600 |
| **A** | app | **199.36.158.100** | 600 |
| **CNAME** | dev | aiduxcare-v2-uat-dev.web.app | 600 |
| **CNAME** | www | app.aiduxcare.com | 600 |
| **TXT** | @ | **hosting-site=aiduxcare-v2-uat-dev** | 600 |
| **TXT** | @ | v=spf1 include:_spf.google.com ~all | 600 |
| **MX** | @ | smtp.google.com (Priority: 1) | 600 |

**⚠️ IMPORTANTE sobre el registro TXT:**
- Debe ser **EXACTO**: `hosting-site=aiduxcare-v2-uat-dev`
- **NO** debe tener espacios extra
- **NO** debe tener comillas
- El host debe ser `@` o `aiduxcare.com` (sin www)

---

### Paso 4: Guardar Cambios

1. Después de hacer todos los cambios, haz clic en **"Save"** o **"Guardar"**
2. Confirma que los cambios se guardaron correctamente

---

## 🔍 Verificación Post-Corrección

### Opción 1: Verificación Rápida (CLI)

```bash
# Ejecutar script de verificación
./scripts/verify-dns-firebase.sh
```

**Resultado esperado:**
- ✅ Solo debe aparecer `199.36.158.100` en registros A
- ✅ NO debe aparecer ninguna IP de Cloudflare
- ✅ Debe aparecer el registro TXT `hosting-site=aiduxcare-v2-uat-dev`

### Opción 2: Monitor de Propagación (CLI)

```bash
# Ejecutar monitor (verifica cada 5 minutos)
./scripts/monitor-dns-propagation.sh
```

Este script verificará automáticamente cada 5 minutos hasta que todos los cambios se propaguen.

**Para detener el monitor:** Presiona `Ctrl+C`

### Opción 3: Verificación Manual

```bash
# Verificar registros A
dig aiduxcare.com A +short

# Verificar registros AAAA
dig aiduxcare.com AAAA +short

# Verificar registros TXT
dig aiduxcare.com TXT +short
```

---

## ⏱️ Tiempo de Propagación

- **Mínimo**: 15-30 minutos
- **Típico**: 1-2 horas
- **Máximo**: 24-48 horas (raro)

**Recomendación**: Espera **1-2 horas** después de hacer los cambios antes de verificar en Firebase.

---

## 🔄 Re-verificación en Firebase Console

Después de esperar 1-2 horas y verificar que DNS está correcto:

1. Ve a: **https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/hosting**
2. Haz clic en **"Domains"** o **"Dominios"**
3. Busca `aiduxcare.com` en la lista
4. Haz clic en **"Verify"** o **"Re-verify"** (si está disponible)
5. Espera 5-10 minutos para que Firebase intente verificar nuevamente

---

## 📊 Checklist de Verificación

Antes de re-verificar en Firebase, asegúrate de:

- [ ] Eliminados TODOS los registros A con IPs de Cloudflare
- [ ] Eliminados TODOS los registros AAAA con IPv6 de Cloudflare
- [ ] Solo existe UN registro A `@` → `199.36.158.100`
- [ ] Existe el registro A `app` → `199.36.158.100`
- [ ] Existe el registro TXT `@` → `hosting-site=aiduxcare-v2-uat-dev`
- [ ] Esperado 1-2 horas para propagación DNS
- [ ] Ejecutado `./scripts/verify-dns-firebase.sh` y verificado que está correcto
- [ ] Re-verificado en Firebase Console

---

## 🆘 Si el Problema Persiste

### Después de 24 horas:

1. **Verifica con herramientas externas**:
   - https://www.whatsmydns.net/#A/aiduxcare.com
   - https://mxtoolbox.com/SuperTool.aspx?action=a%3aaiduxcare.com
   - Verifica que globalmente se resuelva a `199.36.158.100`

2. **Contacta Soporte de Porkbun**:
   - Email: support@porkbun.com
   - Menciona que necesitas eliminar registros DNS antiguos de Cloudflare
   - Proporciona screenshots de tus registros DNS actuales

3. **Contacta Soporte de Firebase**:
   - Ve a: https://firebase.google.com/support
   - Menciona que los registros DNS están correctos pero Firebase no puede verificar
   - Proporciona el output del script `verify-dns-firebase.sh`

---

## 📁 Archivos Creados

### Scripts:
- `scripts/verify-dns-firebase.sh` - Verificación completa de DNS
- `scripts/firebase-dns-setup.sh` - Reporte de configuración requerida
- `scripts/monitor-dns-propagation.sh` - Monitor de propagación

### Documentación:
- `docs/FIREBASE_DNS_TROUBLESHOOTING.md` - Análisis técnico del problema
- `docs/PORKBUN_DNS_FIX_GUIDE.md` - Guía detallada paso a paso
- `docs/NEXT_STEPS_DNS_FIX.md` - Este documento

---

## ✅ Resumen Ejecutivo

**Problema**: Registros DNS antiguos de Cloudflare interfieren con verificación de Firebase

**Solución**:
1. Eliminar registros antiguos en Porkbun (manual)
2. Verificar/agregar registros correctos (manual)
3. Esperar propagación DNS (1-2 horas)
4. Verificar con scripts CLI (automático)
5. Re-verificar en Firebase Console (manual)

**Estado**: 🔄 Esperando corrección manual en Porkbun

---

**Última actualización**: Día 1


