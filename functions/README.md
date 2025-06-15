# 🏥 AiDuxCare Backend - Cloud Functions

API REST para gestión de pacientes construida con Firebase Cloud Functions y Firestore.

## 📋 Endpoints Disponibles

### Pacientes (Patients)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/patients` | Crear nuevo paciente |
| `GET` | `/patients/:id` | Obtener paciente por ID |
| `PUT` | `/patients/:id` | Actualizar paciente |
| `DELETE` | `/patients/:id` | Eliminar paciente (soft delete) |
| `GET` | `/patients` | Listar todos los pacientes activos |

### Utilidad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Health check del API |

## 📊 Estructura de Datos

### Paciente (Patient)

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string | null",
  "birthDate": "string | null",
  "reasonForConsultation": "string",
  "status": "active | deleted",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "deletedAt": "timestamp | null"
}
```

## 🚀 Despliegue

### Prerrequisitos
- Node.js 18+
- Firebase CLI instalado
- Proyecto de Firebase configurado

### Comandos

```bash
# Instalar dependencias
cd functions && npm install

# Desplegar funciones
firebase deploy --only functions

# Desplegar todo (funciones + Firestore)
firebase deploy --only functions,firestore
```

### Usando el script automatizado

```bash
./deploy-backend.sh
```

## 🛠️ Desarrollo Local

```bash
# Iniciar emuladores
firebase emulators:start

# La API estará disponible en:
# http://localhost:5001/[PROJECT-ID]/us-central1/api
```

## 📝 Ejemplos de Uso

### Crear Paciente

```bash
curl -X POST "https://us-central1-[PROJECT-ID].cloudfunctions.net/api/patients" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Andrea González",
    "email": "andrea@example.com",
    "phone": "+56987654321",
    "birthDate": "1990-01-01",
    "reasonForConsultation": "Dolor lumbar crónico"
  }'
```

### Obtener Paciente

```bash
curl "https://us-central1-[PROJECT-ID].cloudfunctions.net/api/patients/[PATIENT-ID]"
```

### Health Check

```bash
curl "https://us-central1-[PROJECT-ID].cloudfunctions.net/api/health"
```

## 🔒 Seguridad

**⚠️ IMPORTANTE**: Esta es la Fase 1 del backend y NO incluye autenticación ni autorización. Las reglas de Firestore están configuradas para permitir acceso completo para propósitos de desarrollo.

En fases posteriores se implementará:
- Autenticación de usuarios
- Autorización basada en roles
- Validación de entrada más robusta
- Rate limiting
- Auditoría de acciones

## 📂 Estructura del Proyecto

```
functions/
├── index.js           # Cloud Function principal
├── package.json       # Dependencias
└── README.md         # Esta documentación

firestore.rules       # Reglas de seguridad de Firestore
firestore.indexes.json # Configuración de índices
firebase.json         # Configuración de Firebase
```

---

**Desarrollado por**: AiDuxCare Team  
**Versión**: 1.0.0  
**Fecha**: 2025 