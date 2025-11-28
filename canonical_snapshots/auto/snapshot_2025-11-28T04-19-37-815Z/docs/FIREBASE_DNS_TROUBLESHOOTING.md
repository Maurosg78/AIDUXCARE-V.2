# 🔧 Firebase DNS Troubleshooting - aiduxcare.com

## 🚨 Problema Identificado

Firebase Hosting está reportando errores 404 en las solicitudes ACME challenge porque hay registros DNS antiguos de Cloudflare que están interfiriendo con la verificación del dominio.

---

## 📋 Estado Actual de DNS (Porkbun)

### Registros Actuales:
- ✅ **A Record** `@` → `199.36.158.100` (CORRECTO - Firebase IP)
- ✅ **A Record** `app` → `199.36.158.100` (CORRECTO - Firebase IP)
- ✅ **CNAME** `dev` → `aiduxcare-v2-uat-dev.web.app` (CORRECTO)
- ✅ **CNAME** `www` → `app.aiduxcare.com` (CORRECTO)
- ✅ **TXT** `@` → `hosting-site=aiduxcare-v2-uat-dev` (CORRECTO)
- ✅ **MX** → `smtp.google.com` (CORRECTO - Email)
- ✅ **TXT** → SPF record (CORRECTO - Email)

### ❌ Registros que Firebase Detecta (pero NO están en Porkbun):
- ❌ **A Record** `aiduxcare.com` → `104.21.11.188` (Cloudflare - DEBE ELIMINARSE)
- ❌ **A Record** `aiduxcare.com` → `172.67.192.98` (Cloudflare - DEBE ELIMINARSE)
- ❌ **AAAA Record** `aiduxcare.com` → `2606:4700:3032::ac43:c062` (Cloudflare IPv6 - DEBE ELIMINARSE)
- ❌ **AAAA Record** `aiduxcare.com` → `2606:4700:3035::6815:bbc` (Cloudflare IPv6 - DEBE ELIMINARSE)

---

## 🔍 Análisis del Problema

### Posibles Causas:

1. **Cache DNS**: Los registros antiguos de Cloudflare pueden estar en cache DNS
2. **Registros Ocultos**: Puede haber registros en Porkbun que no se muestran en la tabla principal
3. **Propagación DNS**: Los cambios pueden no haberse propagado completamente
4. **Registros Duplicados**: Puede haber múltiples registros A para el mismo dominio

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar Registros en Porkbun

1. **Accede a Porkbun DNS Management**:
   - Ve a: https://porkbun.com/account/domains
   - Selecciona `aiduxcare.com`
   - Ve a la sección "DNS Records"

2. **Busca TODOS los registros A y AAAA**:
   - Busca cualquier registro A que apunte a:
     - `104.21.11.188`
     - `172.67.192.98`
     - Cualquier otra IP que NO sea `199.36.158.100`
   - Busca cualquier registro AAAA (IPv6) que apunte a:
     - `2606:4700:3032::ac43:c062`
     - `2606:4700:3035::6815:bbc`
     - Cualquier otra IPv6

3. **Elimina los registros antiguos**:
   - Si encuentras registros con las IPs de Cloudflare, ELIMÍNALOS
   - Solo debe quedar el registro A `@` → `199.36.158.100`

### Paso 2: Verificar Registro TXT de Firebase

1. **Verifica el registro TXT**:
   - Debe existir: `@` → `hosting-site=aiduxcare-v2-uat-dev`
   - Si no existe o está mal escrito, corrígelo

2. **Formato correcto**:
   ```
   Tipo: TXT
   Host: @ (o aiduxcare.com)
   Value: hosting-site=aiduxcare-v2-uat-dev
   ```

### Paso 3: Limpiar Cache DNS

1. **Espera propagación** (puede tomar hasta 48 horas, pero generalmente es más rápido):
   ```bash
   # Verifica propagación DNS
   dig aiduxcare.com A +short
   dig aiduxcare.com TXT +short
   ```

2. **Verifica desde múltiples ubicaciones**:
   - Usa herramientas como: https://www.whatsmydns.net/
   - Verifica que `aiduxcare.com` resuelva a `199.36.158.100` globalmente

### Paso 4: Re-verificar en Firebase

1. **En Firebase Console**:
   - Ve a: Firebase Console → Hosting → Domains
   - Haz clic en "Verify" o "Re-verify" para `aiduxcare.com`
   - Espera 5-10 minutos para que Firebase intente verificar nuevamente

---

## 📝 Configuración DNS Correcta (Porkbun)

### Registros que DEBEN existir:

| Tipo | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 199.36.158.100 | 600 |
| A | app | 199.36.158.100 | 600 |
| CNAME | dev | aiduxcare-v2-uat-dev.web.app | 600 |
| CNAME | www | app.aiduxcare.com | 600 |
| TXT | @ | hosting-site=aiduxcare-v2-uat-dev | 600 |
| TXT | @ | v=spf1 include:_spf.google.com ~all | 600 |
| MX | @ | smtp.google.com | 600 (Priority: 1) |

### Registros que NO deben existir:

| Tipo | Host | Value | Acción |
|------|------|-------|--------|
| A | @ | 104.21.11.188 | ❌ ELIMINAR |
| A | @ | 172.67.192.98 | ❌ ELIMINAR |
| AAAA | @ | 2606:4700:3032::ac43:c062 | ❌ ELIMINAR |
| AAAA | @ | 2606:4700:3035::6815:bbc | ❌ ELIMINAR |
| Cualquier otro A | @ | Cualquier IP ≠ 199.36.158.100 | ❌ ELIMINAR |

---

## 🔧 Script de Verificación

Ejecuta este script para verificar el estado actual de DNS:

```bash
#!/bin/bash

echo "🔍 Verificando DNS para aiduxcare.com..."
echo ""

echo "📋 Registros A:"
dig aiduxcare.com A +short
echo ""

echo "📋 Registros AAAA (IPv6):"
dig aiduxcare.com AAAA +short
echo ""

echo "📋 Registros TXT:"
dig aiduxcare.com TXT +short
echo ""

echo "✅ Verificación completada"
echo ""
echo "Si ves IPs diferentes a 199.36.158.100, hay registros antiguos que deben eliminarse."
```

---

## ⚠️ Problemas Comunes

### Problema 1: Firebase sigue detectando IPs antiguas

**Solución**:
1. Verifica que los registros estén eliminados en Porkbun
2. Espera 24-48 horas para propagación completa
3. Limpia cache DNS local: `sudo dscacheutil -flushcache` (macOS)
4. Re-verifica en Firebase

### Problema 2: Registro TXT no se reconoce

**Solución**:
1. Verifica que el formato sea exacto: `hosting-site=aiduxcare-v2-uat-dev`
2. No debe tener espacios extra
3. El host debe ser `@` o `aiduxcare.com` (sin www)
4. Espera propagación DNS

### Problema 3: Múltiples registros A

**Solución**:
1. Solo debe haber UN registro A para `@` → `199.36.158.100`
2. Elimina cualquier registro A duplicado
3. Verifica que no haya registros A con otros hosts que apunten al dominio raíz

---

## 🚀 Pasos Inmediatos

1. ✅ **Verifica en Porkbun** que no haya registros con IPs de Cloudflare
2. ✅ **Elimina cualquier registro A/AAAA antiguo** que encuentres
3. ✅ **Verifica el registro TXT** de Firebase
4. ✅ **Espera 1-2 horas** para propagación DNS
5. ✅ **Re-verifica en Firebase Console**

---

## 📞 Si el Problema Persiste

Si después de seguir estos pasos Firebase sigue reportando errores:

1. **Contacta soporte de Porkbun**:
   - Pregunta si hay registros ocultos o en cache
   - Solicita que verifiquen todos los registros DNS

2. **Contacta soporte de Firebase**:
   - Proporciona screenshots de tus registros DNS en Porkbun
   - Menciona que los registros antiguos de Cloudflare ya fueron eliminados

3. **Verifica con herramientas externas**:
   - https://mxtoolbox.com/SuperTool.aspx
   - https://www.whatsmydns.net/
   - Verifica que globalmente se resuelva a `199.36.158.100`

---

## ✅ Checklist Final

- [ ] Verificado que NO hay registros A con IPs de Cloudflare en Porkbun
- [ ] Verificado que NO hay registros AAAA con IPv6 de Cloudflare en Porkbun
- [ ] Verificado que existe registro A `@` → `199.36.158.100`
- [ ] Verificado que existe registro TXT `@` → `hosting-site=aiduxcare-v2-uat-dev`
- [ ] Esperado 1-2 horas para propagación DNS
- [ ] Re-verificado en Firebase Console
- [ ] Verificado con herramientas externas (whatsmydns.net)

---

**Estado**: 🔄 En proceso de resolución  
**Última actualización**: Día 1

