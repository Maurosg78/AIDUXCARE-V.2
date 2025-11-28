# Configuración de support@aiduxcare.com en Google Workspace

## ✅ Estado Actual

Tu dominio `aiduxcare.com` está configurado con **Google Workspace**:
- ✅ MX Record: `smtp.google.com`
- ✅ SPF Record: `include:_spf.google.com`

Esto significa que puedes crear `support@aiduxcare.com` directamente en Google Workspace.

---

## 📧 ¿Dónde Llegará el Email?

Cuando alguien responda al email de verificación de Firebase (Reply To: `support@aiduxcare.com`):

1. **El email llegará a:** `support@aiduxcare.com` en Google Workspace
2. **Puedes acceder desde:**
   - Gmail (si tienes acceso a esa cuenta)
   - Google Admin Console
   - Puedes configurar forwarding a otro email

---

## ⚙️ Configuración Paso a Paso

### Opción 1: Crear Usuario/Email en Google Workspace

1. **Accede a Google Admin Console:**
   - Ve a [admin.google.com](https://admin.google.com)
   - Inicia sesión con tu cuenta de administrador

2. **Crea el usuario/email:**
   - Ve a **Users** → **Add new user**
   - **First name**: Support
   - **Last name**: AiDuxCare
   - **Primary email**: `support@aiduxcare.com`
   - **Password**: Genera una contraseña segura
   - Haz clic en **Add new user**

3. **Configura acceso (opcional):**
   - Puedes acceder directamente a `support@aiduxcare.com` desde Gmail
   - O configurar forwarding (ver Opción 2)

### Opción 2: Crear Alias/Group (Más Simple)

Si solo quieres que los emails se reenvíen a tu email personal:

1. **Accede a Google Admin Console:**
   - Ve a [admin.google.com](https://admin.google.com)

2. **Crea un Group:**
   - Ve a **Groups** → **Create group**
   - **Group name**: Support
   - **Group email**: `support@aiduxcare.com`
   - **Group type**: Email list
   - Haz clic en **Create group**

3. **Agrega miembros:**
   - Haz clic en el grupo creado
   - Ve a **Members**
   - Haz clic en **Add members**
   - Agrega tu email personal (ej: `tu-email@gmail.com`)
   - Guarda

4. **Configura permisos:**
   - En **Settings** del grupo
   - Permite que usuarios externos envíen emails al grupo
   - Guarda

**Resultado:** Todos los emails a `support@aiduxcare.com` llegarán a tu email personal.

### Opción 3: Email Forwarding (Más Rápido)

Si ya tienes un usuario en Google Workspace:

1. **Accede a Gmail:**
   - Inicia sesión en Gmail con tu cuenta de Google Workspace

2. **Configura Forwarding:**
   - Ve a **Settings** (⚙️) → **See all settings**
   - Ve a la pestaña **Forwarding and POP/IMAP**
   - Haz clic en **Add a forwarding address**
   - Ingresa tu email personal
   - Verifica el email
   - Selecciona **Forward a copy of incoming mail to**
   - Guarda

---

## 🔧 Configurar en Firebase

Una vez que `support@aiduxcare.com` esté configurado:

1. **Ve a Firebase Console:**
   - [Firebase Console](https://console.firebase.google.com/)
   - Proyecto: `aiduxcare-v2-uat-dev`
   - **Authentication** → **Templates**

2. **Edita "Email address verification":**
   - Haz clic en **Edit**
   - **Reply To**: `support@aiduxcare.com`
   - **Sender Name**: `AiDuxCare Team`
   - **Subject**: `Welcome to AiDuxCare - Verify Your Email 🍁`
   - Guarda

---

## ✅ Verificación

### Paso 1: Verificar que el email existe

```bash
# Verificar MX records (ya configurado ✅)
dig MX aiduxcare.com +short
# Debería mostrar: 1 smtp.google.com.
```

### Paso 2: Enviar email de prueba

1. Desde cualquier email, envía a: `support@aiduxcare.com`
2. Verifica que llegue a tu destino configurado

### Paso 3: Probar con Firebase

1. Registra un usuario de prueba
2. Recibe el email de verificación
3. Haz clic en "Reply" en el email
4. Verifica que el destinatario sea `support@aiduxcare.com`
5. Envía el reply
6. Verifica que llegue a tu email configurado

---

## 📋 Checklist

- [ ] Acceso a Google Admin Console para `aiduxcare.com`
- [ ] `support@aiduxcare.com` creado (usuario, grupo o alias)
- [ ] Forwarding configurado (si aplica)
- [ ] Reply To configurado en Firebase Console
- [ ] Prueba de recepción exitosa

---

## 🎯 Resumen

| Paso | Acción | Dónde |
|------|--------|-------|
| 1 | Crear `support@aiduxcare.com` | Google Admin Console |
| 2 | Configurar forwarding (opcional) | Google Admin Console o Gmail |
| 3 | Configurar Reply To en Firebase | Firebase Console → Auth → Templates |
| 4 | Probar | Registrar usuario y responder email |

---

## 💡 Recomendación

**Usa Opción 2 (Group)** porque:
- ✅ Más fácil de gestionar
- ✅ Puedes agregar/quitar miembros fácilmente
- ✅ No requiere crear un usuario completo
- ✅ Puedes agregar múltiples emails para recibir

**Pasos rápidos:**
1. Google Admin Console → Groups → Create group
2. Email: `support@aiduxcare.com`
3. Agrega tu email personal como miembro
4. Configura en Firebase Console
5. ¡Listo!

---

**¿No tienes acceso a Google Admin Console?** Necesitarás contactar al administrador del dominio `aiduxcare.com` para que cree el email o grupo.

