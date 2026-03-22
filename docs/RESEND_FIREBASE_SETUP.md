# Resend + Firebase Functions (Secret Manager)

## 1. API key

1. Crea una API key en [Resend](https://resend.com/api-keys) (empieza por `re_`).
2. **No la subas al repositorio.** Sustituye mentalmente `re_xxxxxxxxx` por tu clave real solo al configurar el secret (paso 2).

> Si la clave se ha compartido en un chat o issue, **rótala** en Resend y vuelve a guardar el secret.

## 2. Guardar el secret con Firebase CLI

Desde la raíz del proyecto (donde está `firebase.json`):

```bash
firebase functions:secrets:set RESEND_API_KEY
```

Pegar la clave cuando el CLI lo pida (no se mostrará en pantalla al guardar).

Para comprobar que existe (sin ver el valor):

```bash
firebase functions:secrets:access RESEND_API_KEY
```

## 3. Instalar dependencias en `functions/`

```bash
cd functions && npm install
```

## 4. Desplegar la función

```bash
firebase deploy --only functions:sendResendHelloWorld
```

La primera vez que una función usa un secret, Firebase enlaza el secret al runtime (puede pedir confirmación).

## 5. Llamar desde el cliente (Callable)

La función exportada es **`sendResendHelloWorld`** (2nd gen, misma región que el resto: `northamerica-northeast1`).

- Requiere **usuario autenticado** con Firebase Auth.
- Payload opcional:

```ts
import { getFunctions, httpsCallable } from 'firebase/functions';

const fn = httpsCallable(getFunctions(app, 'northamerica-northeast1'), 'sendResendHelloWorld');
const result = await fn({
  to: 'tu@email.com',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
});
console.log(result.data); // { ok: true, id: '...' }
```

Si omites `to` / `subject` / `html`, se usan los valores de ejemplo del código (incl. `mauricio@aiduxcare.com` como `to` por defecto — cámbialo en producción).

## 6. Producción (Resend)

- `from: onboarding@resend.dev` solo sirve para pruebas.
- Verifica tu **dominio** en Resend y usa `from: 'Equipo <noreply@tudominio.com>'`.

## 7. Emulador local

Para probar con emulador, puedes:

- Definir el secret y usar `firebase emulators:start` con funciones que declaran `secrets` (Firebase inyecta en emulador si está configurado), **o**
- Temporalmente usar variable de entorno en código solo en dev (no recomendado en repo); la vía oficial es [secrets en emulador](https://firebase.google.com/docs/functions/config-env#secret-manager).

---

**Implementación en código:** `functions/index.js` → `sendResendHelloWorld` + dependencia `resend` en `functions/package.json`.
