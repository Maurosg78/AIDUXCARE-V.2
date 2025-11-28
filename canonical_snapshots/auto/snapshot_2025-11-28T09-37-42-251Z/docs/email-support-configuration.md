# Configuración de support@aiduxcare.com

## 📧 ¿Dónde Llegará el Email?

Cuando alguien responda al email de verificación de Firebase (Reply To: `support@aiduxcare.com`), el email llegará al buzón configurado para ese dominio.

### Opciones Disponibles:

#### Opción 1: Google Workspace (Recomendado)
Si tienes Google Workspace configurado para `aiduxcare.com`:
- ✅ Los emails llegarán a: `support@aiduxcare.com` en Google Workspace
- ✅ Puedes acceder desde Gmail o Google Admin Console
- ✅ Puedes configurar forwarding a otros emails

**Configuración:**
1. Ve a Google Admin Console
2. Configura el dominio `aiduxcare.com`
3. Crea el alias `support@aiduxcare.com`
4. Configura forwarding si es necesario

#### Opción 2: Email Forwarding (Simple)
Si solo quieres que los emails se reenvíen a otro email:

**Ejemplo: Forwarding a Gmail personal:**
- `support@aiduxcare.com` → `tu-email-personal@gmail.com`

**Configuración:**
1. Ve a tu proveedor de dominio (Porkbun, Cloudflare, etc.)
2. Configura email forwarding
3. Crea regla: `support@aiduxcare.com` → `tu-email@gmail.com`

#### Opción 3: Cloudflare Email Routing (Gratis)
Si usas Cloudflare para el DNS:

1. Ve a Cloudflare Dashboard → Email → Email Routing
2. Activa Email Routing para `aiduxcare.com`
3. Crea regla:
   - **Dirección**: `support@aiduxcare.com`
   - **Destino**: Tu email personal (ej: `tu-email@gmail.com`)

**Ventajas:**
- ✅ Gratis
- ✅ Fácil de configurar
- ✅ No requiere servidor de email

---

## 🔍 Verificar Configuración Actual

### Paso 1: Verificar DNS Records

Ejecuta estos comandos para ver la configuración actual:

```bash
# Verificar MX records (servidores de email)
dig MX aiduxcare.com +short

# Verificar si hay configuración de email
dig TXT aiduxcare.com +short
```

### Paso 2: Verificar en Firebase Console

1. Ve a Firebase Console → Authentication → Templates
2. Edita "Email address verification"
3. Verifica el campo "Reply To"
4. Si está vacío o incorrecto, cámbialo a: `support@aiduxcare.com`

---

## ⚙️ Configuración Paso a Paso

### Si usas Cloudflare (Recomendado - Más Fácil):

1. **Accede a Cloudflare:**
   - Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Selecciona el dominio `aiduxcare.com`

2. **Activa Email Routing:**
   - Ve a **Email** → **Email Routing**
   - Haz clic en **Get Started**
   - Sigue las instrucciones para verificar el dominio

3. **Crea la Regla de Forwarding:**
   - Haz clic en **Create address**
   - **Email address**: `support`
   - **Destination**: Tu email personal (ej: `tu-email@gmail.com`)
   - Guarda

4. **Verifica:**
   - Envía un email de prueba a `support@aiduxcare.com`
   - Debería llegar a tu email personal

### Si usas otro proveedor de dominio:

**Porkbun, Namecheap, GoDaddy, etc.:**
1. Accede al panel de control de tu dominio
2. Busca "Email Forwarding" o "Email Management"
3. Crea regla: `support@aiduxcare.com` → `tu-email@gmail.com`
4. Guarda los cambios

---

## 📝 Configurar en Firebase

Una vez que tengas `support@aiduxcare.com` configurado:

1. **Ve a Firebase Console:**
   - [Firebase Console](https://console.firebase.google.com/)
   - Selecciona proyecto: `aiduxcare-v2-uat-dev`
   - Ve a **Authentication** → **Templates**

2. **Edita "Email address verification":**
   - Haz clic en **Edit**
   - **Reply To**: `support@aiduxcare.com`
   - **Sender Name**: `AiDuxCare Team`
   - **Subject**: `Welcome to AiDuxCare - Verify Your Email 🍁`
   - Guarda

3. **Prueba:**
   - Registra un usuario de prueba
   - Verifica que el email llegue
   - Responde al email (Reply)
   - Verifica que llegue a `support@aiduxcare.com` (y luego a tu email configurado)

---

## ✅ Verificación Final

### Checklist:

- [ ] `support@aiduxcare.com` configurado en tu proveedor de dominio
- [ ] Email forwarding funcionando (prueba enviando un email)
- [ ] Reply To configurado en Firebase Console
- [ ] Prueba completa: registro → email → reply → verificar recepción

### Comando de Prueba:

```bash
# Enviar email de prueba (requiere configuración SMTP o usar servicio externo)
# O simplemente responde a un email de verificación de Firebase
```

---

## 🎯 Resumen

| Configuración | Dónde | Dónde Llega |
|--------------|-------|-------------|
| **Reply To en Firebase** | Firebase Console → Auth → Templates | `support@aiduxcare.com` |
| **Email Forwarding** | Cloudflare/Dominio | Tu email personal configurado |
| **Resultado Final** | Usuario responde email | Tu email personal ✅ |

---

## 💡 Recomendación

**Usa Cloudflare Email Routing** porque:
- ✅ Es gratis
- ✅ Fácil de configurar
- ✅ No requiere servidor de email
- ✅ Funciona inmediatamente

**Pasos rápidos:**
1. Cloudflare Dashboard → Email → Email Routing
2. Crea `support@aiduxcare.com` → `tu-email@gmail.com`
3. Configura en Firebase Console
4. ¡Listo!

---

**¿Necesitas ayuda con la configuración?** Verifica primero dónde está alojado tu dominio `aiduxcare.com` y luego sigue las instrucciones correspondientes.

