# Flujo de verificación de email – dónde se genera cada enlace

**Idioma canónico:** en-CA (English).  
**Objetivo:** Trazar quién genera el enlace del email, qué URL se abre y qué muestra nuestra app al hacer clic en CONTINUE.

---

## 1. Dónde se envía el email de verificación

| Origen | Archivo | Cuándo |
|--------|---------|--------|
| **Onboarding (registro)** | `src/pages/ProfessionalOnboardingPage.tsx` | Tras guardar el perfil: `firebaseAuthService.sendEmailVerification(authUser)`. Un solo envío por registro. |
| **Resend en Login** | `src/pages/LoginPage.tsx` | Si la cuenta está “pending activation”: botón “Resend verification email” llama a `firebaseAuthService.sendEmailVerification(currentUser)`. |
| **Legacy (no usado en piloto)** | `src/services/emailActivationService.ts` | `sendEmailVerification` con `url: baseUrl + "/email-verified"` – no es el flujo actual de Firebase Auth. |

---

## 2. Dónde se construye el `continueUrl` (nuestra app)

**Archivo:** `src/services/firebaseAuthService.ts`

```ts
public static async sendEmailVerification(user: FirebaseUser): Promise<AuthResult> {
  const baseUrl = getPublicBaseUrl();  // e.g. https://aiduxcare-v2-uat-dev.web.app
  const actionCodeSettings: ActionCodeSettings = {
    url: baseUrl + "/auth/action",   // ← continueUrl que recibirá el usuario al hacer clic en CONTINUE
    handleCodeInApp: true,
  };
  await sendEmailVerification(user, actionCodeSettings);
  // ...
}
```

**Base URL:** `src/utils/urlHelpers.ts` → `getPublicBaseUrl()`.  
Para el proyecto UAT: `https://aiduxcare-v2-uat-dev.web.app`.  
Resultado: **continueUrl = `https://aiduxcare-v2-uat-dev.web.app/auth/action`**.

---

## 3. Quién genera el enlace que va en el email

El enlace **no lo construimos nosotros**. Lo genera **Firebase Auth** al llamar a `sendEmailVerification(user, actionCodeSettings)`.

- Firebase envía un email con un enlace como:
  `https://aiduxcare-v2-uat-dev.firebaseapp.com/__/auth/action?apiKey=...&mode=verifyEmail&oobCode=...&continueUrl=https%3A%2F%2Faiduxcare-v2-uat-dev.web.app%2Fauth%2Faction&lang=en`
- Ese enlace apunta primero a **Firebase** (`firebaseapp.com/__/auth/action`).
- La página que ves (“Your email has been verified”, “You can now sign in with your new account”, botón “CONTINUE”) es la **página de Firebase**; no podemos cambiar su texto ni su botón.

---

## 4. Qué pasa al hacer clic en CONTINUE (Firebase)

- Firebase ya aplicó la verificación (consumió el `oobCode`).
- Redirige al usuario a **continueUrl**.
- La redirección es a la URL exacta que pasamos:  
  `https://aiduxcare-v2-uat-dev.web.app/auth/action`  
  **Sin** query params (`mode` y `oobCode` no se reenvían en esa redirección).

---

## 5. Qué hace nuestra app en `/auth/action`

**Archivo:** `src/pages/AuthActionPage.tsx`  
**Ruta:** `src/router/router.tsx` → `{ path: '/auth/action', element: <AuthActionPage /> }`

- Si la petición llega **con** `mode` y `oobCode` (usuario abrió el enlace del email directamente en nuestra app):
  - Llamamos a `applyActionCode(auth, oobCode)` y mostramos la pantalla de éxito en nuestra app.
- Si la petición llega **sin** `mode`/`oobCode` (usuario vino desde la página de Firebase tras hacer clic en CONTINUE):
  - Tratamos el caso como **éxito** y mostramos la misma pantalla de éxito (no mostramos “Invalid action link”).
- Pantalla de éxito (en-CA):
  - “Email verified”
  - “Your email has been verified successfully.”
  - “You can close this window and return to the app, or continue to sign in.”
  - Botón “Continue to sign in” → navega a `/login`.

El texto “Invalid action link. Missing required parameters.” y “Ir al Login” **ya no existen** en el código actual. Si los ves, es por **caché**: el navegador (o la CDN) está sirviendo un `index.html` antiguo que carga un JS viejo (p. ej. `index-C1qESv4E.js` en lugar de `index-Du9RUJVH.js`).

---

## 6. Caché y deploy

- En cada build, Vite genera `index.html` con nombres de chunk nuevos (p. ej. `index-Du9RUJVH.js`).
- Si `index.html` se cachea, el usuario sigue cargando el JS antiguo y puede ver la pantalla de error vieja.
- En `firebase.json` se añadió para **`/index.html`**:
  - `Cache-Control: no-cache, no-store, must-revalidate`
- Tras hacer **deploy** de hosting, conviene:
  - Probar en ventana de incógnito, o
  - Recarga forzada (Ctrl+Shift+R / Cmd+Shift+R) en `https://aiduxcare-v2-uat-dev.web.app/auth/action`.

---

## 7. Resumen del flujo

1. **Registro (onboarding)** → `ProfessionalOnboardingPage` guarda perfil → `firebaseAuthService.sendEmailVerification(authUser)` → un solo email.
2. **Enlace del email** → generado por Firebase; apunta a `firebaseapp.com/__/auth/action?...&continueUrl=.../auth/action`.
3. **Usuario abre el enlace** → ve la página de Firebase (“Your email has been verified”, CONTINUE).
4. **Usuario hace clic en CONTINUE** → redirección a `https://aiduxcare-v2-uat-dev.web.app/auth/action` (sin query params).
5. **Nuestra app** → `AuthActionPage` detecta “sin params” → muestra éxito + “You can close this window” + “Continue to sign in”.

Si tras un deploy reciente sigues viendo el mensaje de error antiguo, forzar recarga o usar incógnito para cargar el nuevo `index.html` y el JS actual.
