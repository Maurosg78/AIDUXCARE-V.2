# API_SPEC.md

## Especificación de API Backend (AiDuxCare MVP)

### Autenticación

#### POST /auth/login
- **Body:**
  - email: string
  - password: string
- **Response:**
  - token: string
  - user: { id, name, email, role }

#### POST /auth/register
- **Body:**
  - name: string
  - email: string
  - password: string
- **Response:**
  - token: string
  - user: { id, name, email, role }

### Gestión de Pacientes

#### GET /patients
- **Query:**
  - [opcional] search: string
- **Response:**
  - patients: array<Patient>

#### GET /patients/{id}
- **Response:**
  - patient: Patient

#### POST /patients
- **Body:**
  - name, birthdate, gender, contact_info, clinical_history, allergies, medications
- **Response:**
  - patient: Patient

#### PATCH /patients/{id}
- **Body:**
  - campos a actualizar
- **Response:**
  - patient: Patient

### Gestión de Sesiones

#### GET /sessions?patient_id={id}
- **Response:**
  - sessions: array<Session>

#### POST /sessions
- **Body:**
  - patient_id, therapist_id, date, notes_raw
- **Response:**
  - session: Session

#### GET /sessions/{id}
- **Response:**
  - session: Session

#### PATCH /sessions/{id}
- **Body:**
  - campos a actualizar
- **Response:**
  - session: Session

#### POST /sessions/{id}/process-text
- **Body:**
  - notes_raw: string
- **Response:**
  - soap: { subjetivo, objetivo, evaluacion, plan }
  - highlights: array<Highlight>

### Tipos de Datos
- **Patient:** Ver DATA_MODEL.md
- **Session:** Ver DATA_MODEL.md
- **Highlight:** { type, text, confidence }

---

_Esta especificación es un borrador inicial y puede ser extendida con endpoints de administración, logs y auditoría._ 