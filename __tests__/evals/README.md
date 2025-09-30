# Tests de Evaluación (EVALs) para AIDUXCARE-V.2

Este directorio contiene tests de evaluación automatizados (EVALs) diseñados para auditar y validar componentes críticos de seguridad y funcionalidad del sistema AIDUXCARE-V.2.

## Propósito

Los EVALs son tests especializados que van más allá de las pruebas unitarias convencionales. Su objetivo es verificar:

1. **Seguridad**: Validar que los mecanismos de seguridad estén correctamente implementados
2. **Integridad**: Asegurar la integridad de datos clínicos en todo el sistema
3. **Cumplimiento**: Verificar el cumplimiento de requisitos regulatorios en salud
4. **Resistencia**: Probar la capacidad del sistema para resistir intentos de acceso indebido

## Tests Disponibles

### patientsRLS.eval.test.ts

Este test verifica la implementación correcta de Row Level Security (RLS) para la tabla `patients` en Supabase.

#### Casos de prueba:

1. **Visibilidad de pacientes propios**: Verifica que un profesional puede ver solo los pacientes que él mismo creó
2. **Aislamiento entre profesionales**: Confirma que un profesional no puede ver pacientes creados por otros
3. **Asignación correcta de user_id**: Valida que el ID del profesional se asigna correctamente al crear pacientes
4. **Bloqueo de actualización**: Confirma que las políticas RLS bloquean actualizaciones a pacientes ajenos
5. **Bloqueo de eliminación**: Verifica que las políticas RLS previenen la eliminación de pacientes ajenos

#### Ejecución:

```bash
npm test -- __tests__/evals/patientsRLS.eval.test.ts
```

## Estructura de los Tests

Cada EVAL sigue un patrón común:

1. **Sesiones simuladas**: Diferentes perfiles de usuario para probar acceso
2. **Validación estricta**: Verificación del comportamiento esperado con aserciones explícitas
3. **Errores esperados**: Captura y verificación de errores específicos
4. **Aislamiento**: Cada test se ejecuta de forma aislada con estado limpio

## Integración con CI/CD

Estos tests se ejecutan automáticamente en el pipeline de integración continua para evitar que cambios que comprometan la seguridad lleguen a producción.

## Mantenimiento

Al realizar cambios en el sistema que afecten a:

- Estructura de la base de datos
- Políticas de seguridad RLS
- Flujos de autenticación
- Manejo de pacientes

Asegúrese de actualizar o ampliar estos tests para mantener una completa cobertura de seguridad. 