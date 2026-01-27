# ✅ Deploy Checklist - WO-CONSENT-DECLINED-HARD-BLOCK-01

## ⚠️ NOTA IMPORTANTE

Si encuentras el error `Error generating the service identity for eventarc.googleapis.com`, consulta `DEPLOY_ERROR_SOLUTION.md` para soluciones.

El código está **100% listo** - el error es solo de permisos/APIs de Google Cloud.

## 📋 Cambios Implementados

### Frontend (React)
- ✅ **ProfessionalWorkflowPage.tsx**: 
  - Reset de estado cuando cambia paciente
  - Hard block guard que muestra `DeclinedConsentModal` si `hardBlock === true`
  - Callback `onConsentDeclined` con delay de 1s para propagación de Firestore
  - Polling se detiene inmediatamente si detecta `isDeclined === true`
  
- ✅ **ConsentGateScreen.tsx**:
  - Callback `onConsentDeclined` pasa al parent
  - No más lógica de consentimiento interna (puramente declarativo)

- ✅ **DeclinedConsentModal.tsx**:
  - Mensaje mejorado indicando que el bloqueo es solo para ese paciente
  - Botón "Volver al Command Center"

- ✅ **VerbalConsentModal.tsx**:
  - Callback `onConsentDeclined` cuando se registra declined

- ✅ **patientConsentService.ts**:
  - Guarda `consentStatus: 'declined'` y `status: 'declined'` (compatibilidad)

### Backend (Cloud Functions)
- ✅ **getConsentStatus.js**:
  - Verifica `granted` PRIMERO (permite reversión)
  - Luego verifica `declined` (hard block)
  - Retorna `isDeclined: true` cuando encuentra declined
  - Logs detallados para debugging
  - Siempre retorna `isDeclined` (false si no hay declined)

### Domain
- ✅ **resolveConsentChannel.ts**:
  - Retorna `channel: 'blocked'` y `hardBlock: true` si `isDeclined === true`
  - `allowedActions` todos en `false` cuando blocked

## 🚀 Comandos de Deploy

### 1. Deploy Frontend (Hosting)
```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
npm run build
firebase deploy --only hosting
```

### 2. Deploy Cloud Functions
```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
firebase deploy --only functions:getConsentStatus
```

### 3. Deploy Todo (Frontend + Functions)
```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
npm run build
firebase deploy
```

## ✅ Verificación Post-Deploy

1. **Probar flujo de decline:**
   - Ir a workflow con paciente sin consentimiento
   - Registrar consentimiento verbal como "declined"
   - Verificar que aparece `DeclinedConsentModal` (no `ConsentGateScreen`)
   - Verificar logs en Cloud Function que muestren `isDeclined: true`

2. **Probar reversión:**
   - Con paciente que tiene `declined`
   - Registrar nuevo consentimiento `granted`
   - Verificar que el sistema permite uso (hard block removido)

3. **Probar cambio de paciente:**
   - Con paciente A que tiene `declined`
   - Navegar a paciente B
   - Verificar que el estado se resetea y verifica consentimiento de paciente B

## 📝 Notas Importantes

- El delay de 1 segundo en `onConsentDeclined` es para permitir propagación de Firestore
- El polling detectará el declined en el siguiente ciclo si el check inmediato falla
- El bloqueo es **por paciente**, no global
- El `granted` siempre tiene prioridad sobre `declined` (permite reversión)

## 🔍 Logs Esperados

### Cuando se registra declined:
```
[PATIENT CONSENT] ✅ Verbal consent recorded (NON-BLOCKING): {status: 'declined'}
[ConsentGate] Consent declined - triggering immediate check
[WORKFLOW] Consent declined - triggering immediate check
[ConsentServer] Consent status retrieved: {isDeclined: true, status: 'declined'}
[WORKFLOW] 🚫 Declined consent confirmed via immediate check
[WORKFLOW] 🚫 HARD BLOCK: Patient declined consent
```

### En Cloud Function:
```
[getConsentStatus] Found consent documents: {documentCount: X, documentStatuses: [...]}
[getConsentStatus] Declined consent found - HARD BLOCK: {isDeclined: true}
```
