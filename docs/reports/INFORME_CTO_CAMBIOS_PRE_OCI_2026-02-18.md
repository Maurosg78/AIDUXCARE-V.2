# Informe CTO — Cambios pendientes de aprobación (pre-reunión OCI)

**Fecha:** 18 de febrero de 2026  
**Contexto:** Reunión con OCI hoy — minimizar riesgo de regresiones  
**Estado del pilot:** https://pilot.aiduxcare.com — **estable** (último deploy sin estos cambios)

---

## Resumen ejecutivo

| Categoría | Archivos | Riesgo | Recomendación |
|-----------|----------|--------|---------------|
| **Scripts / DevOps** | deploy-pilot-vps.sh, export-user-feedback.cjs | Bajo | Aprobar — no afecta app en producción |
| **Docs** | ESTRATEGIA_TRABAJO_FEEDBACK_CTO.md, INFORME_FEEDBACK_* | Nulo | Aprobar — solo documentación |
| **Fix PDF (WO-PDF-002)** | pdfTextExtractor.ts | Medio | **HOLD** hasta post-OCI — afecta adjuntos clínicos |
| **Fix attachment path** | ProfessionalWorkflowPage.tsx (1 línea) | Bajo | **HOLD** — parte del flujo de adjuntos |
| **Otros cambios** | Varios (analytics, consent, etc.) | Variable | Revisar por CTO |

---

## 1. Cambios de scripts / DevOps (riesgo bajo)

### 1.1 `scripts/deploy-pilot-vps.sh`

**Qué cambió:** Conexión vía `gcloud compute ssh` en lugar de `ssh` directo.

**Motivo:** SSH directo fallaba con "Permission denied (publickey)". GCP requiere `gcloud compute ssh` para inyectar claves.

**Riesgo:** Bajo — solo afecta el proceso de deploy desde la máquina del desarrollador. No toca la app.

**Recomendación:** ✅ **Aprobar** — ya se usó con éxito en el último deploy.

---

### 1.2 `scripts/export-user-feedback.cjs`

**Qué cambió:**
- Flag `--report` para generar informe CTO en `docs/reports/`
- Sección "Estrategia de trabajo" en el informe
- Fix de formato de fechas (timestamp)
- Función `generateCtoReport()`

**Motivo:** Rescatar feedback pendientes de Firestore y generar informe para CTO.

**Riesgo:** Nulo — script de línea de comandos, no se ejecuta en producción.

**Recomendación:** ✅ **Aprobar**.

---

## 2. Documentación nueva (riesgo nulo)

| Archivo | Descripción |
|---------|-------------|
| `docs/reports/ESTRATEGIA_TRABAJO_FEEDBACK_CTO.md` | Guía de trabajo para resolver feedback pendiente |
| `docs/reports/INFORME_FEEDBACK_PENDIENTES_20260217.md` | Export de 6 ítems pendientes (generado por script) |

**Recomendación:** ✅ **Aprobar** — solo documentación.

---

## 3. Fix PDF — WO-PDF-002 (riesgo medio)

**Archivo:** `src/services/pdfTextExtractor.ts`

**Qué cambió:**
1. **Worker de pdfjs-dist:** Uso de `import("pdfjs-dist/build/pdf.worker.min.mjs?url")` para que Vite resuelva correctamente en producción. Fallback a CDN (unpkg) si falla.
2. **Timeout 30s:** `Promise.race` para evitar que la extracción cuelgue indefinidamente.
3. **Mensaje de error:** Si hay timeout, se devuelve error claro en lugar de quedar cargando.

**Motivo:** Los PDFs se quedaban cargando y nunca se subían como parte de la historia clínica para el primer llamado a Vertex.

**Riesgo:** Medio — afecta el flujo de adjuntos clínicos (PDFs, informes de imagen). Si algo falla, el usuario podría no poder adjuntar documentos.

**Recomendación:** ⏸️ **HOLD hasta después de la reunión OCI**. Probar en local/staging primero. Desplegar en ventana de bajo riesgo.

---

## 4. Fix attachment path (riesgo bajo)

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx` (línea ~2732)

**Qué cambió:**
```diff
- const uploaded = await ClinicalAttachmentService.upload(file, TEMP_USER_ID);
+ const uploaded = await ClinicalAttachmentService.upload(file, user?.uid || TEMP_USER_ID);
```

**Motivo:** Los adjuntos se guardaban bajo `clinical_attachments/temp-user/` en lugar de `clinical_attachments/{userId}/`. Mejor trazabilidad y alineación con reglas de Storage.

**Riesgo:** Bajo — cambio de path en Storage. Los adjuntos siguen funcionando; solo cambia la organización.

**Recomendación:** ⏸️ **HOLD** — va junto con el fix de PDF. Desplegar ambos juntos post-OCI.

---

## 5. Otros cambios en working tree

Hay más archivos modificados que no se detallan aquí (analytics, consent, SOAP, etc.). El CTO debe revisar el `git status` completo antes de aprobar un merge.

```bash
git status
git diff --stat
```

---

## 6. Estado actual del pilot

| Aspecto | Estado |
|---------|--------|
| **URL** | https://pilot.aiduxcare.com |
| **Branch desplegado** | `release/pilot-cmdctr-searchbar-20260209` |
| **Último deploy** | 18 feb 2026 — "Already up to date" |
| **¿Incluye estos cambios?** | **NO** — los cambios están solo en local, no pusheados |

El pilot está estable. Los cambios de este informe **no están en producción**.

---

## 7. Recomendación para hoy (reunión OCI)

1. **No hacer push** de ningún cambio hasta después de la reunión.
2. **No desplegar** el fix de PDF ni el de attachment path hoy.
3. **Sí se puede** commitear y pushar solo:
   - `scripts/deploy-pilot-vps.sh`
   - `scripts/export-user-feedback.cjs`
   - `docs/reports/ESTRATEGIA_TRABAJO_FEEDBACK_CTO.md`
   - `docs/reports/INFORME_FEEDBACK_PENDIENTES_*.md`
   
   Estos no afectan la app en producción.

4. **Post-OCI:** Planificar ventana para desplegar WO-PDF-002 + attachment path, con pruebas previas en local.

---

## 8. Comandos de verificación

```bash
# Ver qué está en el pilot (remoto)
git log origin/release/pilot-cmdctr-searchbar-20260209 -1 --oneline

# Ver cambios locales no commiteados
git status
git diff --stat
```

---

*Generado para aprobación CTO pre-reunión OCI. No desplegar cambios de app hasta aprobación.*
