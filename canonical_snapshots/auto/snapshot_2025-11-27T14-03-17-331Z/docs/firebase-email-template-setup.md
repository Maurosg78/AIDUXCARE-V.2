# Configuración del Template de Email de Bienvenida en Firebase

## ⚠️ IMPORTANTE: Limitación de Firebase Auth

**Firebase Auth NO permite editar el HTML del email de verificación** desde la consola. El mensaje dice: "Para evitar el envío de spam, no se puede editar el mensaje en esta plantilla de correo."

## ✅ Soluciones Disponibles

### Opción 1: Personalizar Subject y Sender (LO QUE PUEDES HACER AHORA)

Aunque no puedes editar el HTML, puedes mejorar el email básico:

### Configurar Subject y Sender

1. Ve a Firebase Console → Authentication → Templates
2. Encuentra **Email address verification**
3. Haz clic en **Edit**

#### **Subject (Asunto):**
```
Welcome to AiDuxCare - Verify Your Email 🍁
```

#### **Sender Name (Nombre del remitente):**
```
AiDuxCare Team
```

#### **Reply To (Responder a):**
```
support@aiduxcare.com
```
⚠️ **IMPORTANTE:** Debe ser un email válido (no "noreplay" o similar)

---

### Opción 2: Firebase Extensions - Trigger Email (RECOMENDADO)

Para enviar un email completamente personalizado:

1. Ve a Firebase Console → Extensions
2. Busca "Trigger Email"
3. Instala la extensión
4. Configura el template HTML personalizado (ver `src/templates/firebase-email-template-simple.html`)

**Ventajas:**
- ✅ Email completamente personalizado
- ✅ Fácil de configurar
- ✅ No requiere código adicional

---

### Opción 3: Cloud Function Personalizada

Ver `docs/firebase-custom-welcome-email-solution.md` para instrucciones completas.

---

## 📝 Template HTML Personalizado (Para Opción 2 o 3)

Si usas Firebase Extensions o Cloud Functions, puedes usar este HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .link-box { padding: 12px; background: #f7fafc; border-radius: 6px; border-left: 3px solid #667eea; margin: 20px 0; }
    .footer { padding: 30px 40px; background: #f7fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #718096; }
  </style>
</head>
<body style="margin: 0; padding: 40px 20px; background-color: #f5f7fa;">
  <div class="container">
    <div class="header">
      <h1>Welcome to AiDuxCare 🍁</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for joining AiDuxCare! We're thrilled to have you as part of our community of healthcare professionals in Canada.</p>
      <p>To get started, please verify your email address by clicking the button below. This helps us ensure the security of your account and maintain compliance with PHIPA & PIPEDA regulations.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{action_url}}" class="button">Verify Your Email Address</a>
      </div>

      <p style="color: #718096; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <div class="link-box">
        <a href="{{action_url}}" style="color: #667eea; word-break: break-all;">{{action_url}}</a>
      </div>

      <div style="margin: 40px 0; padding: 24px; background-color: #f7fafc; border-radius: 8px;">
        <h2 style="margin: 0 0 16px; color: #1a202c; font-size: 18px;">What's Next?</h2>
        <ul style="color: #4a5568; line-height: 1.8;">
          <li>Complete your professional profile</li>
          <li>Explore our intelligent SOAP note generation</li>
          <li>Access medico-legal documentation support</li>
          <li>Start documenting patient encounters with confidence</li>
        </ul>
      </div>

      <p style="color: #718096; font-size: 14px;">This verification link will expire in 24 hours. If you didn't create an account with AiDuxCare, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p><strong>Need help?</strong><br>
      Our support team is here for you. Reach out at <a href="mailto:support@aiduxcare.com" style="color: #667eea;">support@aiduxcare.com</a></p>
      <p>© 2024 AiDuxCare. All rights reserved.<br>
      Protecting healthcare professionals across Canada.</p>
    </div>
  </div>
</body>
</html>
```

---

## 📋 Resumen de Opciones

| Opción | Dificultad | Personalización | Recomendación |
|--------|-----------|-----------------|---------------|
| **Subject/Sender** | ⭐ Fácil | ⭐⭐ Básica | ✅ Hazlo ahora |
| **Firebase Extensions** | ⭐⭐ Media | ⭐⭐⭐⭐ Completa | ✅ Mejor opción |
| **Cloud Function** | ⭐⭐⭐ Avanzada | ⭐⭐⭐⭐⭐ Total | Para casos específicos |

## 🎨 Características del Template

- ✅ Diseño moderno y profesional
- ✅ Botón de acción claro y destacado
- ✅ Link alternativo en caso de que el botón no funcione
- ✅ Información sobre qué esperar después de verificar
- ✅ Footer con información de contacto
- ✅ Responsive y compatible con clientes de email
- ✅ Colores de marca AiDuxCare (gradiente púrpura/azul)

## 📝 Notas Importantes

1. **Firebase Auth Limitation**: Firebase NO permite editar el HTML del email de verificación para prevenir spam. Solo puedes personalizar Subject y Sender Name.

2. **Solución Recomendada**: Usa Firebase Extensions "Trigger Email" para enviar un email de bienvenida completamente personalizado después del registro.

3. **Testing**: Después de configurar cualquier solución, prueba con un email real para verificar que se ve correctamente.

4. **Template HTML**: El template HTML proporcionado (`src/templates/firebase-email-template-simple.html`) está diseñado para ser compatible con la mayoría de clientes de email.

## 🔗 Recursos Adicionales

- Ver `docs/firebase-custom-welcome-email-solution.md` para instrucciones detalladas de Cloud Functions
- Ver `functions/sendWelcomeEmail.js` para ejemplo de Cloud Function
- Ver `src/templates/firebase-email-template-simple.html` para el template HTML completo

---

**Última actualización**: Diciembre 2024

