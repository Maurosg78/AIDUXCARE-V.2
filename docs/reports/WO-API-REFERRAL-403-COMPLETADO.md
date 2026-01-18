# WO-API-REFERRAL-403 — COMPLETADO

## Contexto
Durante el piloto se detectaron errores `403` al realizar requests a `/api/referral`.
El endpoint era invocado desde el frontend aunque no existía o no estaba preparado
para manejar requests sin payload válido.

## Problema
- Requests fantasma a `/api/referral` devolvían `403`
- El endpoint no era null-safe
- Esto generaba ruido en logs y errores innecesarios durante el piloto

## Solución aplicada
- Se agregó el endpoint `apiReferral` en `functions/index.js`
- El endpoint es **null-safe**
- Retorna `404` cuando no hay payload válido
- CORS configurado correctamente
- No se procesa lógica clínica ni datos sensibles

## Resultado
- Eliminados errores `403` por requests fantasma
- Estabilización del flujo durante el piloto
- Comportamiento defensivo y predecible del backend

## Scope
- Pilot stabilization
- No introduce nuevas features
- No implica claims de compliance

## Commit asociado
- `4c8b321` — feat(consent): public consent portal + verify endpoint (pilot)
