# 🔧 Solución DNS para Error 502 - dev.aiduxcare.com

## 🔴 Problema Identificado

Firebase está mostrando un error porque hay **registros DNS conflictivos** que están causando el 502 Bad Gateway. Los registros A y AAAA existentes están apuntando a Cloudflare, pero Firebase necesita un registro CNAME.

## ✅ Solución: Configurar DNS Correctamente

### Paso 1: Acceder a tu Proveedor DNS

Necesitas ir a donde está configurado el dominio `aiduxcare.com`. Los IPs mostrados (104.21.11.188, 172.67.192.98) sugieren que está en **Cloudflare**.

1. Ve a tu proveedor DNS (Cloudflare, Google Domains, Namecheap, etc.)
2. Busca la configuración DNS para `aiduxcare.com`
3. Encuentra los registros para el subdominio `dev.aiduxcare.com`

### Paso 2: ELIMINAR Registros Existentes

**DEBES ELIMINAR estos registros** (están causando el conflicto):

#### Registros A (IPv4):
- **Nombre:** `dev` o `dev.aiduxcare.com`
- **Tipo:** A
- **Valor:** `104.21.11.188` ❌ **ELIMINAR**
- **Valor:** `172.67.192.98` ❌ **ELIMINAR**

#### Registros AAAA (IPv6):
- **Nombre:** `dev` o `dev.aiduxcare.com`
- **Tipo:** AAAA
- **Valor:** `2606:4700:3032::ac43:c062` ❌ **ELIMINAR**
- **Valor:** `2606:4700:3035::6815:bbc` ❌ **ELIMINAR**

### Paso 3: AGREGAR Registro CNAME

**AGREGA este nuevo registro:**

- **Nombre:** `dev` o `dev.aiduxcare.com`
- **Tipo:** CNAME
- **Valor/Destino:** `aiduxcare-v2-uat-dev.web.app` ✅ **AGREGAR**
- **Proxy/CDN:** Desactivado (si estás en Cloudflare, ponlo en "DNS only" / "Gris")

### Paso 4: Verificar en Firebase

1. Después de hacer los cambios DNS, vuelve a Firebase Console
2. Firebase verificará automáticamente los cambios (puede tardar unos minutos)
3. El error 502 debería desaparecer una vez que DNS se propague

## 📋 Resumen de Cambios DNS

### ❌ ELIMINAR (4 registros):
```
Tipo: A      | Nombre: dev | Valor: 104.21.11.188
Tipo: A      | Nombre: dev | Valor: 172.67.192.98
Tipo: AAAA   | Nombre: dev | Valor: 2606:4700:3032::ac43:c062
Tipo: AAAA   | Nombre: dev | Valor: 2606:4700:3035::6815:bbc
```

### ✅ AGREGAR (1 registro):
```
Tipo: CNAME  | Nombre: dev | Valor: aiduxcare-v2-uat-dev.web.app
```

## ⏱️ Tiempo de Propagación

- **Cambios DNS:** 5-30 minutos normalmente
- **Verificación Firebase:** Puede tardar hasta 24 horas (pero generalmente es más rápido)
- **Total:** Espera 1-2 horas para verificar

## 🔍 Cómo Verificar que Funcionó

### Opción 1: Verificar DNS desde Terminal

```bash
# Verificar que el CNAME está configurado
dig dev.aiduxcare.com CNAME

# O con nslookup
nslookup -type=CNAME dev.aiduxcare.com
```

Deberías ver algo como:
```
dev.aiduxcare.com.    CNAME   aiduxcare-v2-uat-dev.web.app.
```

### Opción 2: Verificar en Firebase Console

1. Ve a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/hosting/sites/aiduxcare-v2-uat-dev/domains
2. El estado del dominio debería cambiar de "Pendiente" a "Conectado"
3. El banner de error debería desaparecer

### Opción 3: Probar el Dominio

```bash
curl -I https://dev.aiduxcare.com
```

Debería devolver `200 OK` en lugar de `502 Bad Gateway`.

## 🆘 Si Estás en Cloudflare

Si tu dominio está en Cloudflare:

1. **Ve a Cloudflare Dashboard:** https://dash.cloudflare.com
2. **Selecciona el dominio:** `aiduxcare.com`
3. **Ve a DNS → Records**
4. **Busca registros para `dev`:**
   - Elimina todos los registros A y AAAA para `dev`
   - Agrega un nuevo registro:
     - **Type:** CNAME
     - **Name:** `dev`
     - **Target:** `aiduxcare-v2-uat-dev.web.app`
     - **Proxy status:** 🟠 DNS only (gris, NO naranja)
5. **Guarda los cambios**

⚠️ **IMPORTANTE:** En Cloudflare, asegúrate de que el proxy esté **DESACTIVADO** (gris, no naranja) para el registro CNAME. Firebase necesita acceso directo al DNS.

## 📝 Notas Importantes

- **NO puedes tener registros A/AAAA y CNAME al mismo tiempo** para el mismo nombre
- Firebase **requiere CNAME**, no A/AAAA
- Los cambios DNS pueden tardar en propagarse
- Una vez configurado correctamente, el 502 desaparecerá automáticamente

## 🚀 Después de Configurar DNS

Una vez que Firebase verifique el dominio:

1. El dominio `dev.aiduxcare.com` funcionará correctamente
2. Apuntará a tu sitio Firebase Hosting
3. El error 502 desaparecerá

Si después de 2 horas sigue dando 502, verifica:
- Que los registros DNS se hayan eliminado correctamente
- Que el CNAME esté configurado correctamente
- Que el proxy de Cloudflare esté desactivado (si aplica)

