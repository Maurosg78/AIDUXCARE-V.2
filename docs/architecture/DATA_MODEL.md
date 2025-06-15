# DATA_MODEL.md

## Esquema de Datos: Google Firestore (AiDuxCare MVP)

### Colección: patients
- **id**: string (UID Firestore)
- **name**: string
- **birthdate**: timestamp
- **gender**: string ("male" | "female" | "other")
- **contact_info**: map
  - email: string
  - phone: string
- **clinical_history**: string
- **allergies**: array<string>
- **medications**: array<map>
  - name: string
  - dosage: string
  - frequency: string
  - prescribed_by: string
  - status: string ("active" | "suspended" | "temporary")
- **created_at**: timestamp
- **updated_at**: timestamp

### Colección: therapists
- **id**: string (UID Firestore)
- **name**: string
- **email**: string
- **specialty**: string
- **created_at**: timestamp
- **active**: boolean

### Colección: sessions
- **id**: string (UID Firestore)
- **patient_id**: reference (patients/{id})
- **therapist_id**: reference (therapists/{id})
- **date**: timestamp
- **notes_raw**: string (texto libre)
- **soap**: map
  - subjetivo: string
  - objetivo: string
  - evaluacion: string
  - plan: string
- **highlights**: array<map>
  - type: string ("síntoma" | "hallazgo" | "plan" | "advertencia")
  - text: string
  - confidence: number
- **audio_url**: string (opcional)
- **created_at**: timestamp
- **updated_at**: timestamp

### Relaciones
- Un paciente puede tener muchas sesiones.
- Un terapeuta puede tener muchas sesiones.
- Cada sesión referencia a un paciente y un terapeuta.

### Reglas de Seguridad (borrador)
- Solo el terapeuta asignado y el paciente pueden leer la sesión.
- Solo el terapeuta puede modificar la sesión.
- Acceso a datos personales restringido por rol.

---

_Este esquema es la base para la implementación cloud-first y puede ser extendido según necesidades regulatorias o de negocio._ 