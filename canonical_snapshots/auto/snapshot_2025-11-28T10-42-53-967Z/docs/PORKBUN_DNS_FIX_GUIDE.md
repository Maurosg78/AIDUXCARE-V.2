# 🔧 Guía de Corrección DNS - Porkbun → Firebase

## 🚨 Problema Detectado

El script de verificación detectó que **aún se están resolviendo registros DNS antiguos de Cloudflare** que interfieren con la verificación de Firebase.

### ❌ Registros Problemáticos Detectados:

**Registros A (IPv4) - DEBEN ELIMINARSE:**
- `104.21.11.188` (Cloudflare)
- `172.67.192.98` (Cloudflare)

**Registros AAAA (IPv6) - DEBEN ELIMINARSE:**
- `2606:4700:3032::ac43:c062` (Cloudflare IPv6)
- `2606:4700:3035::6815:bbc` (Cloudflare IPv6)

**Registro TXT de Firebase - NO SE ENCUENTRA:**
- Debe existir: `hosting-site=aiduxcare-v2-uat-dev`

---

## ✅ Solución Paso a Paso

### Paso 1: Acceder a Porkbun DNS Management

1. Ve a: https://porkbun.com/account/domains
2. Inicia sesión con tus credenciales
3. Busca y selecciona el dominio `aiduxcare.com`
4. Haz clic en la pestaña **"DNS"** o **"DNS Records"**

---

### Paso 2: Buscar y Eliminar Registros Antiguos

#### 2.1 Buscar Registros A con IPs de Cloudflare

En la lista de registros DNS, busca **TODOS** los registros de tipo **A** que tengan:

- **Host**: `@` o `aiduxcare.com` (o cualquier otro host)
- **Value/IP**: `104.21.11.188` o `172.67.192.98`

**Acción**: ❌ **ELIMINA TODOS estos registros**

#### 2.2 Buscar Registros AAAA (IPv6) con IPs de Cloudflare

Busca **TODOS** los registros de tipo **AAAA** que tengan:

- **Host**: `@` o `aiduxcare.com` (o cualquier otro host)
- **Value/IP**: 
  - `2606:4700:3032::ac43:c062`
  - `2606:4700:3035::6815:bbc`
  - Cualquier otra IPv6 que empiece con `2606:4700:`

**Acción**: ❌ **ELIMINA TODOS estos registros**

---

### Paso 3: Verificar Registros Correctos

Después de eliminar los registros antiguos, **SOLO deben quedar estos registros**:

#### Registros A (IPv4):
| Tipo | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | **199.36.158.100** | 600 |
| A | app | **199.36.158.100** | 600 |

#### Registros CNAME:
| Tipo | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | dev | aiduxcare-v2-uat-dev.web.app | 600 |
| CNAME | www | app.aiduxcare.com | 600 |

#### Registros TXT:
| Tipo | Host | Value | TTL |
|------|------|-------|-----|
| TXT | @ | **hosting-site=aiduxcare-v2-uat-dev** | 600 |
| TXT | @ | v=spf1 include:_spf.google.com ~all | 600 |

#### Registros MX (Email):
| Tipo | Host | Value | Priority | TTL |
|------|------|-------|----------|-----|
| MX | @ | smtp.google.com | 1 | 600 |

---

### Paso 4: Agregar/Verificar Registro TXT de Firebase

Si el registro TXT de Firebase **NO existe** o está **mal escrito**, agrégalo o corrígelo:

1. En Porkbun DNS, busca el registro TXT con valor `hosting-site=...`
2. Si no existe, haz clic en **"Add Record"** o **"Agregar Registro"**
3. Configura:
   - **Tipo**: `TXT`
   - **Host**: `@` (o deja vacío para dominio raíz)
   - **Value**: `hosting-site=aiduxcare-v2-uat-dev` (⚠️ **EXACTO**, sin espacios)
   - **TTL**: `600`

---

### Paso 5: Verificar que NO Haya Registros Duplicados

Asegúrate de que:

- ✅ Solo hay **UN** registro A para `@` → `199.36.158.100`
- ✅ **NO** hay múltiples registros A para el mismo host
- ✅ **NO** hay registros A con otras IPs

---

### Paso 6: Esperar Propagación DNS

Después de hacer los cambios:

1. **Espera 1-2 horas** para que los cambios se propaguen globalmente
2. **NO** hagas más cambios durante este tiempo
3. Puedes verificar la propagación con:
   ```bash
   ./scripts/verify-dns-firebase.sh
   ```

---

### Paso 7: Re-verificar en Firebase Console

1. Ve a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/hosting
2. Haz clic en **"Domains"** o **"Dominios"**
3. Busca `aiduxcare.com` en la lista
4. Haz clic en **"Verify"** o **"Re-verify"** (si está disponible)
5. Espera 5-10 minutos para que Firebase intente verificar nuevamente

---

## 🔍 Verificación Post-Corrección

Después de hacer los cambios y esperar 1-2 horas, ejecuta:

```bash
./scripts/verify-dns-firebase.sh
```

**Resultado esperado:**
- ✅ Solo debe aparecer `199.36.158.100` en registros A
- ✅ NO debe aparecer ninguna IP de Cloudflare
- ✅ Debe aparecer el registro TXT `hosting-site=aiduxcare-v2-uat-dev`

---

## ⚠️ Notas Importantes

### 1. Cache DNS
- Los cambios DNS pueden tardar hasta **48 horas** en propagarse completamente
- Sin embargo, generalmente se propagan en **1-2 horas**
- Si después de 24 horas aún ves IPs antiguas, contacta soporte de Porkbun

### 2. Registros Ocultos
- Algunos registros pueden estar en secciones diferentes de Porkbun
- Busca en **TODAS** las secciones de DNS
- Verifica tanto registros "A" como "AAAA"

### 3. Registros en Cloudflare
- Si anteriormente usaste Cloudflare, asegúrate de que:
  - Cloudflare esté **desactivado** para este dominio
  - No haya registros DNS en Cloudflare que interfieran

### 4. Formato del Registro TXT
- El registro TXT debe ser **EXACTO**: `hosting-site=aiduxcare-v2-uat-dev`
- No debe tener espacios extra
- No debe tener comillas
- El host debe ser `@` o `aiduxcare.com` (sin www)

---

## 📞 Si el Problema Persiste

Si después de seguir estos pasos Firebase sigue reportando errores:

### 1. Contacta Soporte de Porkbun
- Email: support@porkbun.com
- Menciona que necesitas eliminar registros DNS antiguos de Cloudflare
- Proporciona screenshots de tus registros DNS actuales

### 2. Contacta Soporte de Firebase
- Ve a: https://firebase.google.com/support
- Menciona que los registros DNS están correctos pero Firebase no puede verificar
- Proporciona el output del script `verify-dns-firebase.sh`

### 3. Verifica con Herramientas Externas
- https://www.whatsmydns.net/#A/aiduxcare.com
- https://mxtoolbox.com/SuperTool.aspx?action=a%3aaiduxcare.com
- Verifica que globalmente se resuelva a `199.36.158.100`

---

## ✅ Checklist Final

Antes de re-verificar en Firebase, asegúrate de:

- [ ] Eliminados TODOS los registros A con IPs de Cloudflare (`104.21.11.188`, `172.67.192.98`)
- [ ] Eliminados TODOS los registros AAAA con IPv6 de Cloudflare
- [ ] Solo existe UN registro A `@` → `199.36.158.100`
- [ ] Existe el registro TXT `@` → `hosting-site=aiduxcare-v2-uat-dev`
- [ ] Esperado 1-2 horas para propagación DNS
- [ ] Ejecutado `./scripts/verify-dns-firebase.sh` y verificado que está correcto
- [ ] Re-verificado en Firebase Console

---

**Estado**: 🔄 En proceso de corrección  
**Última actualización**: Día 1


