# WO-ONGOING-INPUT-FOCUS-LAG-V1

**Fix: pérdida de foco al escribir en OngoingPatientIntakeModal**

## Contexto

En el modal **Ongoing patient, first time in AiDuxCare**, los inputs perdían el foco en cada tecla porque los componentes **Input** y **TextArea** estaban definidos **dentro** del componente del modal. En cada re-render se creaban nuevas referencias de función, React los trataba como componentes nuevos y desmontaba/remontaba el DOM → pérdida de foco.

## Solución aplicada

* **OngoingModalInput** y **OngoingModalTextArea** definidos a **nivel de módulo** (identidad estable).
* Se les pasan `submitting` y `dictationLang` como props desde el modal.
* Sin cambios en DictationButton, useDictation, backend ni lógica clínica.

## Scope

* Solo `OngoingPatientIntakeModal.tsx`.
* Rama sugerida: `fix/ongoing-input-focus-lag` (from `feature/ongoing-dictation-multilang`).

## DoD

* [x] Inputs mantienen foco al escribir.
* [x] Dictation y selector de idioma intactos.
* [x] Sin cambios fuera del archivo indicado.

## Commit sugerido

```
fix(ongoing): prevent input focus loss on typing in intake modal
```
