# Exportar feedback del formulario flotante

Las sugerencias y reportes que los usuarios envían desde el **formulario flotante** se guardan en Firestore en la colección `user_feedback`. Para rescatar esas sugerencias y analizarlas puedes usar el script de exportación o la consola de Firebase.

## Si eres administrador y no te deja acceder

Las reglas de Firestore exigen el **custom claim** `admin: true` en el token del usuario para poder **leer** `user_feedback`. Ser “admin” en la app o en el equipo no basta si ese claim no está asignado en Firebase Auth.

Tienes dos caminos:

1. **Ver feedback desde la app (o cualquier cliente con tu usuario):** hay que asignar el claim a tu cuenta una vez:
   ```bash
   node scripts/set-admin-claim.cjs TU_EMAIL@ejemplo.com
   ```
   Después **cierra sesión y vuelve a entrar** para que el nuevo token incluya `admin: true`.

2. **Exportar sin depender de tu usuario:** el script `export-user-feedback.cjs` usa el **Firebase Admin SDK**, que no depende de las reglas. Ejecútalo con `node scripts/export-user-feedback.cjs` (ver abajo credenciales).

## Asignar el claim “admin” a un usuario (una vez)

Para que un administrador pueda leer `user_feedback` desde la app o desde cualquier cliente con su login:

```bash
# Por email (el más habitual)
node scripts/set-admin-claim.cjs admin@aiduxcare.com

# Por UID
node scripts/set-admin-claim.cjs --uid abc123...
```

**Credenciales:** una de las dos:
- `GOOGLE_APPLICATION_CREDENTIALS` con la **ruta real** al JSON de la service account (Firebase Console → Project settings → Service accounts → Generate new private key). Ejemplo: `export GOOGLE_APPLICATION_CREDENTIALS=$HOME/Downloads/mi-proyecto-firebase-adminsdk.json`
- O **sin** esa variable: ejecutar `gcloud auth application-default login` y usar el proyecto por defecto.

Después de asignar el claim, el usuario debe **cerrar sesión y volver a entrar** para que el ID token se actualice.

## Opción 1: Script de exportación (recomendado)

### Requisitos

- Ejecutar siempre con **node**: `node scripts/export-user-feedback.cjs` (no ejecutar el archivo directamente).
- Credenciales (una de las dos):
  - **Opción A:** `GOOGLE_APPLICATION_CREDENTIALS` con la **ruta real** al JSON de la service account (ej.: `export GOOGLE_APPLICATION_CREDENTIALS=$HOME/Downloads/mi-proyecto-firebase-adminsdk.json`). Si la ruta no existe, el script usará credenciales por defecto y mostrará un aviso.
  - **Opción B:** Sin esa variable: `gcloud auth application-default login` (proyecto por defecto).

### Uso

Desde la raíz del repo:

```bash
# Exportar a JSON (por defecto proyecto UAT)
node scripts/export-user-feedback.cjs

# Exportar también CSV
node scripts/export-user-feedback.cjs --csv

# Solo no resueltos (para priorizar pendientes)
node scripts/export-user-feedback.cjs --csv --unresolved-only

# Otro proyecto (ej. producción)
node scripts/export-user-feedback.cjs --project aiduxcare-v2-prod --csv
```

Los archivos se guardan en `scripts/exports/` con nombre tipo:

- `user_feedback_<projectId>_<fecha>.json`
- `user_feedback_<projectId>_<fecha>.csv` (si usas `--csv`)

Esa carpeta está en `.gitignore` para no subir feedback de usuarios al repo.

### Filtros de exportación

- `--unresolved-only`: solo registros que **no** están marcados como resueltos (por defecto se exportan todos).
- `--resolved-only`: solo registros resueltos.

Ejemplo: exportar solo feedback pendiente a CSV:
```bash
node scripts/export-user-feedback.cjs --csv --unresolved-only
```

### Campos exportados

Cada registro incluye, entre otros:

- `type`: bug, suggestion, question, other
- `severity`: critical, high, medium, low
- `description`: texto que escribió el usuario
- `url`, `userAgent`, `timestamp`
- `userId` (si aplica)
- **`resolved`**, **`resolvedAt`**, **`resolvedBy`**: estado de resolución (ver siguiente sección)
- `autoTags`, `calculatedPriority`
- `enrichedContext`: paso del workflow, tipo de sesión, etc.

## Clasificar feedback: resuelto / no resuelto

En Firestore cada documento de `user_feedback` puede tener:

- **`resolved`** (boolean): `true` = resuelto, `false` o ausente = no resuelto
- **`resolvedAt`** (timestamp): cuándo se marcó como resuelto
- **`resolvedBy`** (string): quién lo marcó (uid o identificador)

Solo usuarios con claim **admin** pueden actualizar estos campos (las reglas permiten `update` para admins).

### Marcar como resuelto o no resuelto (script)

Desde la raíz del repo:

```bash
# Marcar uno o varios por ID
node scripts/mark-feedback-resolved.cjs x4beyq189P9YK8yzWsxv w2Fkg0YmrBSiiFWH9WYS

# Marcar todos los de un export que tengan "localhost" en la URL (bugs antiguos de desarrollo)
node scripts/mark-feedback-resolved.cjs --from-export scripts/exports/user_feedback_aiduxcare-v2-uat-dev_2026-02-04T21-58-43.json --filter localhost

# Marcar desde un archivo con un ID por línea (crea scripts/exports/feedback-ids-to-resolve.txt con los IDs)
node scripts/mark-feedback-resolved.cjs --file scripts/exports/feedback-ids-to-resolve.txt

# Volver a marcar como no resuelto
node scripts/mark-feedback-resolved.cjs --unresolve x4beyq189P9YK8yzWsxv
```

Para “antiguos que ya deben estar resueltos” (bugs de localhost, errores ya corregidos), lo más rápido es usar `--from-export` con el JSON del último export y `--filter localhost` para marcar todos los reportes con URL de desarrollo de una vez.

## Opción 2: Firebase Console

1. [Firebase Console](https://console.firebase.google.com) → tu proyecto.
2. **Firestore Database** → colección `user_feedback`.
3. Puedes revisar documentos uno a uno o usar **Export** en el menú (si está disponible en tu plan) para exportar la colección.

## Resumen

| Método              | Ventaja                          |
|---------------------|-----------------------------------|
| Script `export-user-feedback.cjs` | Automatizable, JSON/CSV, filtros por proyecto |
| Firebase Console    | Sin script, revisión manual       |

Para reuniones o análisis de NIS, conviene ejecutar el script con `--csv` y abrir el CSV en Excel o Google Sheets.
