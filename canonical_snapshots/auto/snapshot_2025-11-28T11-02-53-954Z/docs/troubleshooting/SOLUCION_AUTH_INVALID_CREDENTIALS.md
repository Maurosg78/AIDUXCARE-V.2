# 🔐 Solución: Error auth/invalid-credential

## Problema

El error `auth/invalid-credential` de Firebase Authentication indica que las credenciales proporcionadas son incorrectas o el usuario no existe.

## Diagnóstico Realizado

✅ **Configuración Firebase:** Correcta
- Project ID: `aiduxcare-v2-uat-dev`
- Auth Domain: `aiduxcare-v2-uat-dev.firebaseapp.com`
- API Key: Configurado

## Posibles Causas

1. **Usuario no existe en Firebase Auth**
   - El email no está registrado en Firebase Authentication
   - Solución: Crear usuario en Firebase Console o registrarse

2. **Contraseña incorrecta**
   - La contraseña ingresada no coincide con la del usuario
   - Solución: Verificar contraseña o usar "Olvidé mi contraseña"

3. **Usuario no verificado**
   - El usuario existe pero el email no está verificado
   - Solución: Verificar email desde el correo de verificación

4. **Usuario deshabilitado**
   - El usuario fue deshabilitado en Firebase Console
   - Solución: Habilitar usuario en Firebase Console

## Soluciones

### Opción 1: Verificar Usuario en Firebase Console

1. Ve a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/authentication/users
2. Busca el email que estás intentando usar
3. Verifica:
   - Que el usuario existe
   - Que el email esté verificado
   - Que el usuario no esté deshabilitado

### Opción 2: Crear Usuario Manualmente

Si el usuario no existe, puedes crearlo desde Firebase Console:

1. Ve a Authentication > Users
2. Click en "Add user"
3. Ingresa email y contraseña temporal
4. El usuario recibirá un email para cambiar la contraseña

### Opción 3: Usar Registro desde la App

Si eres un profesional nuevo, usa el flujo de registro:

1. Ve a la página de registro/onboarding
2. Completa el formulario
3. Verifica tu email
4. Inicia sesión con las credenciales creadas

### Opción 4: Resetear Contraseña

Si el usuario existe pero olvidaste la contraseña:

1. Usa la función "Olvidé mi contraseña" en la página de login
2. Ingresa tu email
3. Sigue las instrucciones del correo

## Verificación de Configuración

Ejecuta el script de diagnóstico:

```bash
node scripts/diagnose-auth.cjs
```

## Próximos Pasos

1. Verifica que el usuario existe en Firebase Console
2. Si no existe, créalo o regístrate desde la app
3. Si existe, verifica la contraseña
4. Si el problema persiste, verifica que el proyecto Firebase sea el correcto

## Notas Importantes

- El proyecto actual es: `aiduxcare-v2-uat-dev` (UAT/Desarrollo)
- Asegúrate de estar usando las credenciales correctas para este proyecto
- Si cambiaste de proyecto Firebase, verifica las variables de entorno en `.env.local`

