# Cierre feedback Ongoing Patient — Pasos a ejecutar

Tras merge del fix WO-ONGOING-FB a `main`, ejecutar estos pasos.

---

## 1. Push a `main` (si no se hizo desde el IDE)

```bash
git checkout main
git push origin main
```

(Si falla por credenciales, hacer push desde tu cliente Git o IDE.)

---

## 2. Cierre del feedback en Firebase (manual)

1. Desplegar o abrir la app (pilot/UAT) donde tengas **admin**.
2. Ir a **Revisión de feedback:**  
   `https://<tu-dominio>/feedback-review`  
   (o la ruta configurada para `FeedbackReviewPage`).
3. Iniciar sesión con usuario que tenga **claim admin**.
4. Localizar el/los ítems de feedback que hablen de:
   - "Ongoing patient", "no genera nota", "crear baseline", "campos vacíos", "volver a rellenar".
5. En cada ítem:
   - **Solución propuesta:** pegar exactamente el texto siguiente (o adaptar si hace falta):

```
CERRADO — WO-ONGOING-FB

Problema 1 — "No genera nota": Corregido. Al crear baseline desde "Ongoing patient, first time in AiDuxCare", el workflow de follow-up ahora prellena la nota SOAP con el contenido del baseline y abre la pestaña SOAP, de modo que el usuario ve la nota de inmediato.

Problema 2 — "Campos vacíos / volver a rellenar": Corregido. El formulario del modal ya no se resetea cuando cambian props del padre; solo se resetea al abrir el modal (false → true). Así no se pierde información si falla la validación o hay re-renders.

Commits / docs: PROPUESTA_CTO_ONGOING_PATIENT_FEEDBACK_FIX.md, OngoingPatientIntakeModal.tsx (reset solo al abrir), ProfessionalWorkflowPage.tsx (setLocalSoapNote + setActiveTab desde baselineFromOngoing).
```

   - Pulsar **"Marcar resuelto"** (el botón que llama a `FeedbackService.updateFeedbackAdmin` con `resolved: true`).

---

## 3. Actualizar VPS (deploy)

Desde la raíz del proyecto, con `main` actualizado y credenciales listas:

```bash
# Build local, subir dist al VPS, reemplazar y reiniciar PM2 (pilot-web)
./scripts/deploy-pilot-vps.sh
```

Requisitos:

- `gcloud` instalado y autenticado.
- Variables opcionales: `PILOT_VPS_INSTANCE`, `PILOT_VPS_ZONE`, `PILOT_VPS_PROJECT`, `PILOT_VPS_USER`.

Tras el script, comprobar: https://pilot.aiduxcare.com (o tu URL de pilot).

---

## 4. Checklist final

| Paso | Hecho |
|------|--------|
| Push `main` a `origin` | ☐ |
| Cerrar feedback(s) en `/feedback-review` con el texto de la sección 2 | ☐ |
| Ejecutar `./scripts/deploy-pilot-vps.sh` y verificar pilot | ☐ |
