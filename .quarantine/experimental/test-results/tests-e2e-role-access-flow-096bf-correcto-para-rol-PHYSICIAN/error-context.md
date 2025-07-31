# Page snapshot

```yaml
- heading "AiDuxCare" [level=1]
- heading "Iniciar sesión" [level=2]
- paragraph: Accede a tu cuenta para gestionar pacientes y consultas
- paragraph: Error de conexión. Verifica tu internet
- text: Correo electrónico
- textbox "Correo electrónico": testuser_physician_1753399034162@example.com
- text: Contraseña
- textbox "Contraseña": TestUser2025!
- button "Iniciar sesión"
- link "¿Olvidaste tu contraseña?":
  - /url: /forgot-password
- link "Configurar MFA":
  - /url: /mfa-guide
- button "Probar demo (válido 14 días)"
- paragraph:
  - text: ¿No tienes cuenta?
  - link "Regístrate":
    - /url: /register
- button "🗑️ Limpiar Sesión"
```