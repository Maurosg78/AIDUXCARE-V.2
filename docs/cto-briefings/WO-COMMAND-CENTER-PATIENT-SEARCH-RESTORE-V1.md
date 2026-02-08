# WO-COMMAND-CENTER-PATIENT-SEARCH-RESTORE-V1

**Restaurar barra buscadora de pacientes y acciones clínicas correctas**

## Contexto

La barra buscadora de pacientes permite buscar paciente, ir a su historial y mostrar 3 acciones clínicas claras. Actualmente la barra no estaba visible y el historial no mostraba las 3 opciones.

## Objetivo

Reinstalar el flujo correcto:

1. Mostrar **PatientSearchBar** en Command Center
2. Al seleccionar paciente → ir a **Patient History** (`/patients/:id/history`)
3. En Patient History, mostrar **3 acciones clínicas**: Start follow-up, View/edit baseline, New ongoing/assessment
4. Eliminar el link único que solo llevaba a follow-up

## Implementación aplicada

### 1. PatientSearchBar (`src/features/command-center/components/PatientSearchBar.tsx`)

* Componente nuevo que usa `usePatientSearch` (PatientService.searchPatients)
* Input con placeholder "Search patient by name..."
* Dropdown con resultados; al seleccionar → `navigate(/patients/:id/history)`

### 2. Command Center

* PatientSearchBar visible en la parte superior del contenido principal
* useEffect para abrir Ongoing modal cuando se llega con `state.openOngoingForPatientId` (desde Patient History → New ongoing/assessment)

### 3. Patient History (PatientDashboardPage)

* Bloque **"Clinical actions"** con 3 botones:
  * **Start follow-up** → `/workflow?type=followup&patientId=...`
  * **View / edit baseline** → `/patients/:id`
  * **New ongoing / assessment** → `/command-center` con `state.openOngoingForPatientId`

* Quick Actions (One step left, Resume, Set baseline, etc.) se mantienen para flujos de recuperación

## Scope

* Solo UI / navegación
* Sin cambios en backend, Firestore, Ongoing internals, baseline logic, Dictation

## Rama sugerida

* `fix/command-center-patient-search-restore` (from `feature/ongoing-dictation-multilang`)

## Commit sugerido

```
fix(command-center): restore patient search bar and clinical action options
```
