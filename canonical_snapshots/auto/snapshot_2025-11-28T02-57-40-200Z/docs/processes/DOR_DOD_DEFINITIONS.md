# DoR/DoD oficiales por track — Aidux North

> Estos criterios son **obligatorios**. Ningún issue entra sin DoR; nada se cierra sin DoD.

## TRACK: DESARROLLO DE FEATURES
**Definition of Ready (DoR)**
- User story definida con criterios de aceptación clínicos
- Mockups/wireframes aprobados por stakeholder médico
- Dependencias técnicas identificadas y disponibles
- Estimación completada por equipo dev
- Casos de prueba clínicos definidos
- Impacto en compliance evaluado

**Definition of Done (DoD)**
- Código implementado y revisado (PR aprobado)
- Tests unitarios con >80% cobertura
- Validación clínica completada por profesional médico
- Demo funcional en ambiente staging
- Documentación técnica actualizada
- Zero errores críticos o de seguridad

## TRACK: INFRAESTRUCTURA/DEVOPS
**Definition of Ready (DoR)**
- Requisitos de performance definidos (uptime, latencia)
- Impacto en costos evaluado y aprobado
- Plan de rollback documentado
- Métricas de éxito definidas
- Ventana de mantenimiento aprobada

**Definition of Done (DoD)**
- Infraestructura desplegada en producción
- Monitoreo y alertas configurados
- Backup y disaster recovery validados
- Documentación de operaciones actualizada
- Performance targets alcanzados (99.9% uptime)
- Rollback plan probado exitosamente

## TRACK: COMPLIANCE MÉDICO
**Definition of Ready (DoR)**
- Regulación específica identificada (PIPEDA, HIPAA, etc.)
- Legal review iniciado
- Checklist de compliance definido
- Stakeholder médico asignado para validación
- Documentación de proceso requerida

**Definition of Done (DoD)**
- Audit trail implementado y validado
- Documentación de compliance completada
- Sign-off legal obtenido
- Profesional médico valida cumplimiento clínico
- Plan de respuesta a incidentes actualizado
- Certificación externa (si aplicable) obtenida

## TRACK: VALIDACIÓN CLÍNICA
**Definition of Ready (DoR)**
- Protocolo de validación definido
- Profesional médico asignado como reviewer
- Casos de prueba clínicos preparados
- Criterios de éxito médico establecidos
- Datos de prueba anonimizados disponibles

**Definition of Done (DoD)**
- Validación por ≥2 profesionales médicos independientes
- Casos edge clínicos probados exitosamente
- Accuracy médica >95% en casos de prueba
- Zero hallucinations en output final
- Documentación de validación clínica completada
- Sign-off médico formal obtenido

## TRACK: EXPERIENCIA USUARIO (UX)
**Definition of Ready (DoR)**
- User journey definido para profesional médico
- Feedback de usuarios beta documentado
- Tiempo objetivo de completion definido (<3 min)
- Accesibilidad requirements establecidos
- Device compatibility requirements claros

**Definition of Done (DoD)**
- User testing completado con ≥3 profesionales médicos
- Tiempo de completion <3 minutos promedio
- SUS score >70 (System Usability Scale)
- Zero friction points críticos identificados
- Mobile responsiveness validada
- Accessibility WCAG AA compliance

## CRITERIOS TRANSVERSALES (TODOS LOS TRACKS)
**Criterios de Bloqueo Universal**
- No introducir regresiones en funcionalidad existente
- No aumentar tiempo de respuesta >20%
- No impactar negativamente métricas de compliance
- Budget impact <$500/mes adicional sin aprobación

**Criterios de Release**
- Demo exitoso ante stakeholder médico
- Load testing passed (50 usuarios concurrentes)
- Security scan sin vulnerabilidades críticas
- Backup de rollback verified
- Communication plan ejecutado (usuarios beta notificados)
