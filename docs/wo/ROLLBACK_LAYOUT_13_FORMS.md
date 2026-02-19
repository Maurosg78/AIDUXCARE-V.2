# Rollback: Layout 13" Patient Forms (WO-LAYOUT-13)

## Punto de rollback

**Commit anterior (estado estable antes del fix):**
```
88ce790c9332e4ae141460247446f105d2a65dc3
```

## Archivos modificados

- `src/features/command-center/components/PatientForm.tsx`
- `src/features/command-center/components/OngoingPatientIntakeModal.tsx`

## Si algo falla, revertir con:

```bash
# Opción 1: Revertir solo estos archivos al commit anterior
git checkout 88ce790c -- src/features/command-center/components/PatientForm.tsx src/features/command-center/components/OngoingPatientIntakeModal.tsx

# Opción 2: Si ya hiciste commit del fix, revertir el commit
git revert <commit-del-fix> --no-edit
```

## Cambios aplicados (CTO spec - 13" 1280x800)

### PatientForm
- `max-h-[90vh]` → `max-h-[calc(100vh-120px)]` + `overflow-hidden` (garantiza espacio para header/footer)
- `p-4` → `p-3` (header, progress, content, footer)
- `pt-6 mb-4 gap-4` → `pt-4 mb-3 gap-3` (Contacto de Emergencia)

### OngoingPatientIntakeModal
- `max-h-[90vh]` → `max-h-[calc(100vh-120px)]` + `overflow-hidden`
- `p-5` → `p-4` (header, content, footer)
- `flex-shrink-0` en footer (botones siempre visibles)
- `min-h-0` en content div (permite scroll correcto en flex)
