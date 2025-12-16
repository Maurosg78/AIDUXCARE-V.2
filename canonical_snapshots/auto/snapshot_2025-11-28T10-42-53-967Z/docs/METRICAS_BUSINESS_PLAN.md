# 📊 MÉTRICAS DEL PILOTO - AIDUX NORTH
## Respuesta para Business Plan - Piloto de 3 Semanas en Ontario

---

## 1. MÉTRICAS DE USO

### Eventos Capturados:
- Sesiones iniciadas/completadas
- Transcripciones iniciadas/completadas  
- Notas SOAP generadas/renderizadas
- Pacientes creados
- Citas programadas
- Errores del sistema
- Uso de características (transcripción, IA, dictado, tests físicos)

### Métricas de Adopción:
- Tests propuestos vs. completados vs. omitidos
- Tests personalizados agregados
- Tasa de aceptación de sugerencias IA: `(aceptadas / ofrecidas) * 100`
- Uso por módulo (transcripción, análisis, evaluación, SOAP)
- Uso por especialidad del profesional

**Fuente:** Colección `system_analytics` en Firestore

---

## 2. MÉTRICAS DE PRODUCTIVIDAD

### Tiempos Medidos (minutos):
- **Tiempo total de documentación:** Desde inicio de sesión hasta SOAP finalizado
- **Tiempo de transcripción:** Duración de captura de audio
- **Tiempo de generación IA:** Tiempo para análisis y generación SOAP
- **Tiempo de edición manual:** Tiempo de edición post-generación

### Eficiencia:
- **Total de clics:** Número de interacciones durante sesión
- **Clics vs. óptimo:** Comparación con flujo ideal (15 clics)
- **Eficiencia de clics:** Porcentaje calculado
- **Pausas largas:** Pausas > 10 segundos (indica fricción)

**Fuente:** Colección `value_analytics` en Firestore

---

## 3. MÉTRICAS DE REDUCCIÓN DE TIEMPO DOCUMENTAL

### Comparación con Baseline:
- **Baseline tradicional:** 20 minutos por nota SOAP completa
- **Tiempo con Aidux:** Medido en cada sesión
- **Reducción porcentual:** `((20 - tiempoAidux) / 20) * 100`
- **Minutos ahorrados:** `20 - tiempoAidux`

### Métricas Longitudinales:
- Tiempo promedio por semana
- Tendencia de mejora (semana 1 vs. semana 3)
- Curva de aprendizaje por profesional

**Fuente:** Colección `value_analytics`, campo `calculatedTimes`

---

## 4. MÉTRICAS DE PRECISIÓN CLÍNICA

### Validación de SOAP:
- **Completitud de secciones:** Subjective, Objective, Assessment, Plan (Boolean cada una)
- **Score de completitud:** `(seccionesCompletadas / 4) * 100`

### Validación de Regiones Corporales:
- **Regiones testeadas:** Array de regiones evaluadas físicamente
- **Regiones mencionadas:** Array de regiones en sección Objective
- **Violaciones:** Regiones mencionadas pero no testeadas
- **Advertencias:** Inconsistencias detectadas

### Scores de Calidad:
- **Precisión:** 0-100%
- **Relevancia clínica:** 0-100%
- **Calidad de evidencia:** 0-100%
- **Calidad general:** 0-100%

**Fuente:** 
- Colección `value_analytics`, campo `quality`
- Validación en tiempo real (`SOAPObjectiveValidator`)

---

## 5. MÉTRICAS DE CUMPLIMIENTO CPO (Quality Documentation)

### Campos Requeridos (PIPEDA/PHIPA):
- Patient ID: Boolean (requerido)
- Practitioner ID: Boolean (requerido)
- Red Flags Assessment: Boolean (mandatorio)
- Treatment Plan Documented: Boolean (requerido)

### Validaciones Condicionales:
- Pain Scale (EVA): Boolean (si hay dolor reportado)
- Medication Verification: Boolean (si se mencionan medicamentos)

### Score de Completitud:
- **Completeness Score:** `(camposCompletados / camposRequeridos) * 100`
- **Validación exitosa:** Boolean (todos los requeridos presentes)
- **Errores/Advertencias:** Arrays de problemas encontrados

**Fuente:** 
- Colección `sessions` con validación (`ClinicalSchemaValidator`)
- Colección `consultations` con campos de cumplimiento

---

## 6. MÉTRICAS DE ERROR/AMBIGÜEDAD EN REGISTROS

### Errores del Sistema:
- **Total de errores:** Conteo de eventos `error_occurred`
- **Tasa de error:** `(errores / totalEventos) * 100`
- **Errores por tipo/módulo:** Agrupación

### Errores de IA:
- **Llamadas a Vertex AI:** Número y latencia (ms)
- **Errores de Vertex AI:** Conteo
- **Fallbacks utilizados:** Conteo

### Ambigüedades:
- **Correcciones de texto:** Número de correcciones
- **Reintentos:** Número de reintentos
- **Pausas largas:** Pausas > 10 segundos

**Fuente:** 
- Colección `system_analytics`
- Logs de validación

---

## 7. KPIs DE SATISFACCIÓN DEL PROFESIONAL

### Feedback Estructurado:
- **Tipo:** `bug` | `suggestion` | `question` | `other`
- **Severidad:** `critical` | `high` | `medium` | `low`
- **Descripción:** Texto libre
- **Contexto automático:** URL, user agent, página, error (si aplica)

### Engagement:
- **Sesiones por profesional:** Conteo
- **Días activos:** Número de días con actividad
- **Retención semanal:** Porcentaje que vuelve cada semana
- **Profundidad de uso:** Número de características utilizadas

### Adopción:
- **Tasa de aceptación de sugerencias:** `(aceptadas / ofrecidas) * 100`
- **Ediciones a SOAP:** Número de cambios post-generación

**Fuente:** 
- Colección `user_feedback`
- Colección `value_analytics`

---

## 8. MÉTRICAS ADICIONALES PARA INVERSORES

### Retención:
- **Retención Día 1:** Porcentaje que vuelve al día siguiente
- **Retención Semanal:** Porcentaje activo cada semana
- **Churn rate:** Porcentaje que deja de usar

### NPS (Net Promoter Score):
**Sin data:** No se captura actualmente.  
**Recomendación:** Agregar encuesta NPS al finalizar sesiones.

### Engagement:
- Sesiones promedio por profesional
- Tiempo promedio por sesión
- Características utilizadas por sesión
- Días activos por profesional

### Métricas de Negocio:
- **Time-to-Value:** Tiempo hasta SOAP finalizado
- **Feature Adoption Rate:** Porcentaje que usa cada característica
- **Suggestion Acceptance Rate:** `(aceptadas / ofrecidas) * 100`
- **Error Rate:** `(errores / totalEventos) * 100`

**Fuente:** 
- Colección `value_analytics`
- Colección `system_analytics`
- Cálculos agregados

---

## 9. FORMATO DE EXPORTACIÓN

### Formatos Disponibles:
- **JSON:** Estructura completa con todos los campos
- **CSV:** Formato tabular para Excel/Google Sheets

### Estructura CSV:
```
Metric,Value
Total Events,{totalEvents}
Average Session Duration (ms),{averageSessionDuration}
Suggestions Acceptance Rate (%),{suggestionsAcceptanceRate}
Error Rate (%),{errorRate}
Time Saved Per Patient (min),{timeSavedPerPatient}
Critical Alerts Triggered,{criticalAlertsTriggered}
```

### Estructura JSON:
```json
{
  "totalEvents": number,
  "averageSessionDuration": number,
  "suggestionsAcceptanceRate": number,
  "errorRate": number,
  "timeSavedPerPatient": number,
  "eventsByModule": { [module: string]: number },
  "eventsByUser": { [userId: string]: number },
  "eventsBySpecialty": { [specialty: string]: number }
}
```

**Método:** `AnalyticsService.exportAnalyticsData(dateRange, format: 'csv' | 'json')`

---

## 10. ESTRUCTURA DE BASE DE DATOS

### Colecciones Principales en Firestore:

#### `system_analytics`
Eventos del sistema y métricas de uso
- `event`: Tipo de evento
- `userId`: Pseudonymizado
- `module`: Módulo donde ocurrió
- `duration`: Duración en ms
- `success`: Boolean
- `timestamp`: Fecha/hora

#### `value_analytics`
Métricas de valor y productividad
- `hashedUserId`: Pseudonymizado
- `hashedSessionId`: Pseudonymizado
- `timestamps`: Objeto con timestamps de cada fase
- `calculatedTimes`: Objeto con tiempos calculados (minutos)
- `featuresUsed`: Objeto Boolean para cada característica
- `quality`: Objeto con métricas de calidad
- `sessionType`: 'initial' | 'follow-up'

#### `business_metrics`
Métricas de negocio para inversores
- `event`: Nombre del evento
- `value`: Valor numérico
- `unit`: Unidad de medida
- `createdAt`: Timestamp

#### `time_savings`
Ahorro de tiempo por paciente
- `patientId`: Pseudonymizado
- `timeSavedMinutes`: Número
- `sessionType`: String
- `timestamp`: ISO string

#### `user_feedback`
Feedback de usuarios
- `type`: Tipo de feedback
- `severity`: Severidad
- `description`: Texto
- `userId`: Pseudonymizado
- `sessionId`: Solo si está definido
- `url`, `userAgent`, `context`: Metadatos

#### `sessions`
Sesiones clínicas completas
- `userId`, `patientId`, `patientName`
- `transcript`: Texto completo
- `soapNote`: Objeto SOAP completo
- `physicalTests`: Array de tests realizados
- `transcriptionMeta`: Metadatos de transcripción
- `status`: 'draft' | 'completed'
- `timestamp`, `createdAt`: Timestamps

#### `consultations`
Notas clínicas guardadas (Clinical Vault)
- `id`, `patientId`, `sessionId`
- `soapData`: Datos SOAP
- `encryptedData`: Datos encriptados
- `ownerUid`: ID del propietario
- `createdAt`, `updatedAt`: Timestamps

### Índices:
- `system_analytics`: Por `timestamp` (desc), `userId`, `module`
- `value_analytics`: Por `timestamp` (desc), `hashedUserId`
- `sessions`: Por `userId`, `timestamp` (desc), `patientId`
- `user_feedback`: Por `timestamp` (desc), `severity`

### Pseudonymización:
- User IDs, Session IDs, Patient IDs pseudonymizados
- K-anonymity: Mínimo 5 eventos para agregación
- PHI Compliance: Validación de que queries no contengan PHI

---

## 11. FRECUENCIA DE MUESTREO

### Eventos en Tiempo Real:
- Eventos del sistema: Inmediato cuando ocurren
- Métricas de valor: Al finalizar cada sesión SOAP
- Feedback: Cuando el usuario envía

### Agregaciones:
- **Diarias:** Agregación diaria de eventos
- **Semanales:** Agregación semanal para tendencias
- **Piloto completo:** Agregación total de 3 semanas

### Intervalos:
- **Clicks/Inputs:** Cada interacción individual
- **Tiempo en página:** Cada segundo (1000ms)
- **Errores:** Inmediato
- **Performance:** Al finalizar operaciones

---

## 12. CORRELACIÓN DE DATOS PARA ANÁLISIS ESTADÍSTICO

### Identificadores de Correlación:
- `hashedUserId`: Por profesional
- `hashedSessionId`: Por sesión
- `patientId`: Por paciente (longitudinal)
- `timestamp`: Temporal

### Agregaciones:
- **Por profesional:** Todas las sesiones de un profesional
- **Por paciente:** Todas las sesiones de un paciente
- **Por especialidad:** Por especialidad del profesional
- **Por región:** Por región geográfica (Ontario)
- **Por tipo de sesión:** `initial` vs `follow-up`

### Correlaciones Calculadas:
- Tiempo vs. Completitud
- Uso de características vs. Tiempo ahorrado
- Aceptación de sugerencias vs. Calidad
- Errores vs. Tiempo total
- Ediciones vs. Calidad inicial

### Métodos Estadísticos:
- Agregación temporal (día/semana/mes)
- Agregación por usuario/paciente/especialidad
- Cálculo de promedios y tasas
- Comparación de tendencias (semana 1 vs. 3)

### Validación Estadística:
- **K-anonymity:** Mínimo 5 eventos para agregación
- **PHI Compliance:** Validación de queries
- **Pseudonymización:** IDs pseudonymizados antes de agregación

**Herramientas:** Firestore Queries + JavaScript/TypeScript para cálculos + Exportación para análisis externo

---

## RESUMEN EJECUTIVO

### ✅ Métricas Implementadas:
- **Uso:** 10+ tipos de eventos capturados
- **Productividad:** Tiempos medidos por fase
- **Reducción de tiempo:** Comparación con baseline 20 min
- **Precisión clínica:** Validación automática de SOAP
- **Cumplimiento CPO:** Validación de campos requeridos
- **Errores:** Tracking completo de errores y correcciones
- **Satisfacción:** Feedback estructurado
- **Retención:** Métricas de retención diaria/semanal
- **Engagement:** Sesiones, días activos, características

### ⚠️ Métricas No Implementadas:
- **NPS:** No capturado (recomendado agregar)
- **Encuesta de satisfacción estructurada:** Solo feedback libre (recomendado agregar)

### 📊 Formato de Exportación:
- JSON (estructurado completo)
- CSV (tabular para análisis)

### 🗄️ Base de Datos:
- 7 colecciones principales en Firestore
- Pseudonymización de datos sensibles
- Índices optimizados para queries

### ⏱️ Frecuencia:
- Tiempo real para eventos críticos
- Al finalizar sesión para métricas de valor
- Agregación diaria/semanal para análisis

### 📈 Correlación:
- Por profesional, paciente, especialidad, región
- Análisis temporal (tendencias)
- Validación estadística (k-anonymity, PHI compliance)

---

**Documento preparado para:** Business Plan - Aidux North  
**Basado en:** Código fuente real de AiduxCare V.2  
**Fecha:** Noviembre 2025

