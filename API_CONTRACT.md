# 📋 CONTRATO DE API - AIDUXCARE V.2

**Versión**: 1.0.0  
**Fecha**: Enero 2025  
**Autor**: AiDuxCare Team  

## 🏥 OBJETO PACIENTE

### Estructura JSON

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

## 📊 ENDPOINTS CRUD

### POST /patients - Crear Paciente

**Request:**
```json
{
  "name": "Andrea González",
  "email": "andrea.gonzalez@example.com",
  "phone": "+56987654321",
  "birthDate": "1990-03-15",
  "reasonForConsultation": "Dolor lumbar crónico"
}
```

**Response (201):**
```json
{
  "id": "abc123def456",
  "name": "Andrea González",
  "email": "andrea.gonzalez@example.com",
  "phone": "+56987654321",
  "birthDate": "1990-03-15",
  "reasonForConsultation": "Dolor lumbar crónico",
  "status": "active",
  "createdAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
  "updatedAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
  "deletedAt": null
}
```

### GET /patients/:id - Obtener Paciente

**Response (200):**
```json
{
  "id": "abc123def456",
  "name": "Andrea González",
  "email": "andrea.gonzalez@example.com",
  "phone": "+56987654321",
  "birthDate": "1990-03-15",
  "reasonForConsultation": "Dolor lumbar crónico",
  "status": "active",
  "createdAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
  "updatedAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
  "deletedAt": null
}
```

### PUT /patients/:id - Actualizar Paciente

**Request:**
```json
{
  "reasonForConsultation": "Dolor lumbar crónico con irradiación"
}
```

**Response (200):**
```json
{
  "id": "abc123def456",
  "name": "Andrea González", 
  "email": "andrea.gonzalez@example.com",
  "phone": "+56987654321",
  "birthDate": "1990-03-15",
  "reasonForConsultation": "Dolor lumbar crónico con irradiación",
  "status": "active",
  "createdAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
  "updatedAt": { "_seconds": 1704153600, "_nanoseconds": 0 },
  "deletedAt": null
}
```

### DELETE /patients/:id - Eliminar Paciente

**Response (204):** Sin contenido

### GET /patients - Listar Pacientes

**Response (200):**
```json
[
  {
    "id": "abc123def456",
    "name": "Andrea González",
    "email": "andrea.gonzalez@example.com", 
    "phone": "+56987654321",
    "birthDate": "1990-03-15",
    "reasonForConsultation": "Dolor lumbar crónico",
    "status": "active",
    "createdAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
    "updatedAt": { "_seconds": 1704067200, "_nanoseconds": 0 },
    "deletedAt": null
  }
]
```

## 🔗 URL BASE

```
https://us-central1-[PROJECT-ID].cloudfunctions.net/api
```

## 📝 CÓDIGOS DE ESTADO

- `200` - OK
- `201` - Created  
- `204` - No Content
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error 