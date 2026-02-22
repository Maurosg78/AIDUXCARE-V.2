# 🔒 BRANCH `stable` — BASE CANÓNICA DE DESARROLLO

**Creado:** 2026-02-22  
**Commit base:** `ff111721`  
**Mensaje commit:** `chore: pre-feedback-53jMoePB rollback point — WOs, header, español→EN, informe CTO`  
**Estado:** ✅ Verificado funcional en producción y local

---

## ¿POR QUÉ EXISTE ESTE BRANCH?

El 2026-02-22 se implementaron 6 Work Orders simultáneamente sin testing individual.
Esto introdujo bugs críticos: tokens visibles en UI, renderizado roto, sistema inestable.

El rollback fue necesario. Se identificó `ff111721` como último estado confiable.
Para evitar que esto vuelva a ocurrir, `stable` es ahora la base de todo desarrollo.

**El branch `main` de GitHub quedó divergido y NO debe usarse como base de desarrollo.**

---

## REGLAS DE ORO

### ✅ SIEMPRE:
- Crear branches nuevos desde `stable`: `git checkout stable && git checkout -b fix/nombre`
- Implementar UN Work Order por branch
- Verificar en `localhost` antes de hacer merge a `stable`
- Correr prueba de corroboración después de cada cambio
- Deployar al VPS desde `stable` o desde el commit específico verificado

### ❌ NUNCA:
- `git pull origin main` en VPS — trae commits problemáticos
- Implementar múltiples WOs en el mismo branch sin testing individual
- Hacer merge a `stable` sin verificar que no rompió hooks con otros módulos
- Asumir que la implementación previa está bien hecha

---

## ESTADO DE ENTORNOS

| Entorno | Branch/Commit | URL | Estado |
|---------|--------------|-----|--------|
| Local dev | `stable` (ff111721) | localhost:5176 | ✅ Estable |
| VPS Producción | `ff111721` hardcoded | pilot.aiduxcare.com | ✅ Estable |
| GitHub main | `a07768a6` | — | ⚠️ Divergido, no usar |

---

## PROCESO PARA NUEVO WORK ORDER

```
1. Asegurarse de estar en stable:
   git checkout stable

2. Crear branch para el WO:
   git checkout -b fix/wo-XXX-descripcion

3. Implementar SOLO ese WO

4. Verificar en localhost que funciona

5. Correr prueba de corroboración:
   npm run build
   (verificar que no hay errores)

6. Confirmar que no se rompieron componentes con hooks:
   - ProfessionalWorkflowPage.tsx
   - SessionContext.tsx
   - PromptFactory-Canada.ts
   - soapPartialUpdateService.ts

7. Merge a stable:
   git checkout stable
   git merge fix/wo-XXX-descripcion

8. Deploy a VPS:
   gcloud compute ssh pilot-vps --zone=us-central1-a --project=aiduxcare-v2-uat-dev
   cd /var/www/pilot
   git fetch origin
   git checkout stable
   git reset --hard stable
   npm run build
   pm2 restart pilot-web
```

---

## DEPLOY DE EMERGENCIA (ROLLBACK)

Si algo sale mal, siempre se puede volver al estado seguro:

```bash
# En VPS:
cd /var/www/pilot
git checkout ff111721
git reset --hard ff111721
rm -rf dist
npm run build
pm2 restart pilot-web
```

---

## WORK ORDERS PENDIENTES DE RE-IMPLEMENTAR

Los siguientes WOs fueron revertidos del VPS el 2026-02-22.
Están en GitHub main pero NO en `stable`. Deben re-implementarse
uno por uno siguiendo el proceso descrito arriba.

| WO | Descripción | Estado |
|----|-------------|--------|
| WO-001 | Red flag justification capture | ⏳ Pendiente re-implementar |
| WO-002 | SOAP partial update (preservar edits manuales) | ⏳ Pendiente re-implementar |
| WO-003 | Treatment modalities categorization | ⏳ Pendiente re-implementar |
| WO-004 | Physical test descriptions via Vertex AI | ⏳ Pendiente re-implementar |
| WO-005 | Consent text expansion (PHIPA compliant) | ⏳ Pendiente re-implementar |

---

## COMPONENTES CRÍTICOS — NO TOCAR SIN SOLICITUD EXPLÍCITA

Estos archivos tienen hooks con múltiples partes del sistema.
Cualquier cambio en ellos puede romper flujos sin que sea obvio:

- `src/pages/ProfessionalWorkflowPage.tsx`
- `src/context/SessionContext.tsx`
- `src/core/ai/PromptFactory-Canada.ts`
- `src/services/vertex-ai-service-firebase.ts`
- `src/services/soapPartialUpdateService.ts`
- `src/router/router.tsx`

---

## FILOSOFÍA DE TRABAJO (aidux26)

**Safe > Fast > Focused**

Un cambio a la vez. Corroboración después de cada paso.
No asumir que lo anterior está bien. Verificar siempre.

---

*Documento mantenido por: CTO AiduxCare*  
*Última actualización: 2026-02-22*
