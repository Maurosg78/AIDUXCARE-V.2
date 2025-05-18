# Componentes MCP (Modelo Cognitivo del Paciente)

Este directorio contiene componentes relacionados con la visualización y edición del Modelo Cognitivo del Paciente (MCP), un componente central del sistema AIDUXCARE.

## MCPContextViewer

Componente para visualizar y editar el contexto MCP completo de una visita específica.

## MCPContextDiffDashboard

Componente para comparar el contexto MCP entre dos visitas de un paciente.

### Características

- Permite seleccionar visitas para comparación entre una visita actual y una anterior
- Muestra estadísticas de diferencias por tipo de memoria (contextual, persistente, semántica)
- Visualiza detalladamente los bloques que han sido:
  - Añadidos: bloques nuevos en la visita actual
  - Eliminados: bloques que existían en la visita anterior pero no en la actual
  - Modificados: bloques que han cambiado su contenido
  - Iguales: bloques sin cambios

### Uso

```tsx
import MCPContextDiffDashboard from '@/shared/components/MCP/MCPContextDiffDashboard';

// Ejemplo de uso en un componente
function PatientHistory({ patient, visits }) {
  return (
    <div>
      <h1>Historial del Paciente</h1>
      
      {/* Comparador de contexto MCP */}
      <MCPContextDiffDashboard 
        visits={visits} 
        patientId={patient.id} 
      />
    </div>
  );
}
```

### Propiedades

| Propiedad   | Tipo       | Descripción                                         |
|-------------|------------|-----------------------------------------------------|
| `visits`    | `Visit[]`  | Lista de visitas del paciente                       |
| `patientId` | `string`   | ID del paciente para obtener memoria persistente    |

### Funcionamiento

1. Permite al usuario seleccionar dos visitas para comparar (actual y anterior)
2. Consulta datos MCP para ambas visitas usando los servicios de fuente de datos
3. Compara los bloques de memoria por tipo (contextual, persistente, semántico)
4. Genera estadísticas y entradas detalladas de cada diferencia encontrada
5. Muestra los resultados organizados y con codificación por colores

### Integración

Este componente está integrado en:
- `PatientDetailPage`: permite comparar visitas del historial del paciente 