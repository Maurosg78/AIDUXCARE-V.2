# Configuración de Supabase para AiDuxCare V.2

Este documento explica cómo configurar Supabase para persistir datos reales en AiDuxCare V.2, reemplazando los mocks por almacenamiento real.

## 1. Requisitos previos

1. Crear una cuenta en [Supabase](https://supabase.io)
2. Crear un nuevo proyecto en Supabase
3. Obtener las credenciales de acceso (URL y claves)

## 2. Estructura de la base de datos

Necesitas crear las siguientes tablas en tu proyecto Supabase:

### Tabla: `visits`

```sql
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas comunes
CREATE INDEX visits_professional_id_idx ON visits(professional_id);
CREATE INDEX visits_patient_id_idx ON visits(patient_id);
```

### Tabla: `clinical_forms`

```sql
CREATE TABLE clinical_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES visits(id),
  professional_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  form_type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas comunes
CREATE INDEX clinical_forms_visit_id_idx ON clinical_forms(visit_id);
CREATE INDEX clinical_forms_professional_id_idx ON clinical_forms(professional_id);
```

### Tabla: `form_suggestions`

```sql
CREATE TABLE form_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES clinical_forms(id),
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  source_block_id TEXT,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas comunes
CREATE INDEX form_suggestions_form_id_idx ON form_suggestions(form_id);
```

### Tabla: `patients`

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  insurance_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla: `audit_logs`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB NOT NULL,
  visit_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas comunes
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_visit_id_idx ON audit_logs(visit_id);
CREATE INDEX audit_logs_event_type_idx ON audit_logs(event_type);
```

## 3. Configuración de autenticación

1. Habilita la autenticación por correo electrónico en Supabase
2. Crea un usuario de demostración con el correo: `demo@aiduxcare.com`

## 4. Configuración del archivo .env

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
# Configuración de Supabase
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE=your-service-role-key

# Configuración de Langfuse para tracking (opcional)
VITE_LANGFUSE_PUBLIC_KEY=your-langfuse-public-key
VITE_LANGFUSE_SECRET_KEY=your-langfuse-secret-key
VITE_LANGFUSE_ENDPOINT=https://api.langfuse.com/v1

# Modo de operación
VITE_USE_MOCKS=false
```

Reemplaza las credenciales con las de tu proyecto Supabase.

## 5. Datos de prueba

Para probar el sistema, inserta al menos estos datos:

1. Un registro de paciente
2. Un registro de visita asociado a ese paciente y al usuario demo
3. Un formulario clínico básico asociado a la visita

Puedes usar el siguiente SQL para insertar datos de prueba:

```sql
-- Insertar paciente de prueba
INSERT INTO patients (id, name, age, gender, insurance_id)
VALUES (
  'e12e9f2a-3c3a-4c3e-8f2a-3c3a4c3e8f2a',
  'Juan Pérez',
  45,
  'masculino',
  'INS-12345'
);

-- Insertar visita de prueba (reemplaza DEMO_USER_ID con el ID del usuario demo)
INSERT INTO visits (id, professional_id, patient_id, date, status, notes)
VALUES (
  'f12e9f2a-3c3a-4c3e-8f2a-3c3a4c3e8f2b',
  'DEMO_USER_ID',
  'e12e9f2a-3c3a-4c3e-8f2a-3c3a4c3e8f2a',
  NOW(),
  'in_progress',
  'Consulta de seguimiento'
);

-- Insertar formulario clínico
INSERT INTO clinical_forms (visit_id, professional_id, patient_id, form_type, content, status)
VALUES (
  'f12e9f2a-3c3a-4c3e-8f2a-3c3a4c3e8f2b',
  'DEMO_USER_ID',
  'e12e9f2a-3c3a-4c3e-8f2a-3c3a4c3e8f2a',
  'SOAP',
  '{"subjective":"Paciente refiere dolor abdominal","objective":"Presión arterial 120/80","assessment":"Gastritis leve","plan":"Tratamiento con omeprazol","notes":"Seguimiento en 2 semanas"}',
  'draft'
);
```

## 6. Verificación

Para verificar que la configuración es correcta:

1. Inicia la aplicación con `npm run dev`
2. Navega a la página principal
3. Deberías ver los datos cargados desde Supabase en lugar de datos simulados
4. Las operaciones como escucha activa, registro de formularios y auditoría deberían estar persistiendo en Supabase

## 7. Recomendaciones de seguridad

- Nunca expongas las claves de servicio en el código del cliente
- Usa Row Level Security (RLS) en Supabase para limitar el acceso a los datos
- Configura políticas para que cada profesional solo pueda ver sus propias visitas
- Habilita análisis de uso y monitoreo para detectar anomalías 