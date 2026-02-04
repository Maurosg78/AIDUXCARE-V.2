# SMS de consentimiento no llega – qué revisar

Si la app muestra **"SMS sent successfully"** pero el destinatario **no recibe el SMS**, la petición a la Cloud Function y a Vonage está funcionando; el fallo suele ser la **entrega** (Vonage / operador / número).

## 1. Revisar logs de la Cloud Function

En **Google Cloud Console** → **Cloud Functions** → `sendConsentSMS` → pestaña **Logs**:

- Busca `[SMS Function] Vonage API response`. Si aparece `status: '0'`, Vonage **aceptó** el envío (no implica que llegue al móvil).
- Si el número es internacional (ej. +34), verás:  
  `[SMS Function] SMS accepted by Vonage for international number`.  
  En esos casos la entrega depende de que tu cuenta Vonage tenga **SMS internacional** habilitado y que el número "from" pueda enviar a ese país.

## 2. Número de destino +34 (España)

Con un número **from** canadiense o estadounidense (+1), muchos planes Vonage **no incluyen** envío a Europa. Resultado: Vonage devuelve "accepted" pero el operador no entrega.

Opciones:

- **Vonage dashboard**: comprobar si el producto/plan permite envío a +34 y si hay restricciones o errores de entrega.
- **Habilitar SMS internacional** en la cuenta Vonage (si aplica).
- **Probar con un número +1** (Canadá/EE.UU.) para validar que el flujo y la función sí envían; si con +1 llega y con +34 no, el límite es de cuenta/operador.

## 3. Credenciales y configuración

- **Firebase (Cloud Functions):**  
  `firebase functions:config:get vonage`  
  Debe tener `vonage.api_key`, `vonage.api_secret` y `vonage.from_number`. Si falta algo, la función devuelve 500 y la app no mostraría "SMS sent".
- **Vonage:** en el dashboard, revisar que la API key esté activa, sin restricciones por IP que bloqueen las peticiones de Cloud Functions.

## 4. Resumen

| Síntoma                         | Causa probable                          |
|---------------------------------|-----------------------------------------|
| App dice "SMS sent"             | Función y Vonage responden OK           |
| No llega a +34                  | Límites SMS internacional / plan Vonage |
| No llega a +1                   | Revisar número, formato E.164 y logs    |

Para ver el mensaje exacto que devuelve Vonage en cada envío, usar siempre los **logs de la Cloud Function** `sendConsentSMS` en GCP.
