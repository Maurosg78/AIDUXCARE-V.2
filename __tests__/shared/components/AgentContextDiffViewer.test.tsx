import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom';
import AgentContextDiffViewer from '../../../src/shared/components/Agent/AgentContextDiffViewer';
import { MCPContext } from '../../../src/core/mcp/schema';

describe('AgentContextDiffViewer', () => {
  // Crear contextos de prueba
  const createMockContext = (
    contextualContent: string[] = [],
    persistentContent: string[] = [],
    semanticContent: string[] = []
  ): MCPContext => {
    const createBlocks = (contents: string[], type: 'contextual' | 'persistent' | 'semantic') => ({
      source: 'test',
      data: contents.map((content, index) => ({
        id: `${type}-${index}`,
        type,
        content,
        timestamp: new Date().toISOString()
      }))
    });

    return {
      contextual: createBlocks(contextualContent, 'contextual'),
      persistent: createBlocks(persistentContent, 'persistent'),
      semantic: createBlocks(semanticContent, 'semantic')
    };
  };

  test('no muestra nada cuando no hay diferencias', () => {
    // Crear dos contextos idénticos
    const originalContext = createMockContext(
      ['Dato contextual 1'],
      ['Dato persistente 1'],
      ['Dato semántico 1']
    );
    
    const modifiedContext = createMockContext(
      ['Dato contextual 1'],
      ['Dato persistente 1'],
      ['Dato semántico 1']
    );

    render(<AgentContextDiffViewer 
      originalContext={originalContext} 
      modifiedContext={modifiedContext} 
    />);

    expect(screen.getByText('No se encontraron diferencias entre los contextos.')).toBeInTheDocument();
  });

  test('muestra bloques agregados con el estilo correcto', () => {
    // Crear contexto original y uno modificado con un bloque nuevo
    const originalContext = createMockContext(
      ['Dato contextual 1'],
      [],
      []
    );
    
    const modifiedContext = createMockContext(
      ['Dato contextual 1', 'Dato contextual 2 (NUEVO)'],
      [],
      []
    );

    render(<AgentContextDiffViewer 
      originalContext={originalContext} 
      modifiedContext={modifiedContext} 
    />);

    // Verificar que muestra el encabezado del grupo contextual
    expect(screen.getByText('Contextual (2)')).toBeInTheDocument();
    
    // Verificar que muestra el bloque agregado
    const addedBlock = screen.getByTestId('diff-block-added');
    expect(addedBlock).toBeInTheDocument();
    expect(addedBlock).toHaveTextContent('Dato contextual 2 (NUEVO)');
    
    // Verificar que tiene el estilo correcto (fondo verde)
    expect(addedBlock).toHaveClass('bg-green-50');
  });

  test('muestra bloques modificados con el estilo correcto', () => {
    // Crear contexto original y uno con un bloque modificado
    const originalContext = createMockContext(
      ['Dato contextual 1', 'Dato contextual original'],
      [],
      []
    );
    
    const modifiedContext = createMockContext(
      ['Dato contextual 1', 'Dato contextual modificado'],
      [],
      []
    );

    render(<AgentContextDiffViewer 
      originalContext={originalContext} 
      modifiedContext={modifiedContext} 
    />);

    // Verificar que muestra el encabezado del grupo contextual
    expect(screen.getByText('Contextual (2)')).toBeInTheDocument();
    
    // Verificar que muestra el bloque modificado
    const modifiedBlock = screen.getByTestId('diff-block-modified');
    expect(modifiedBlock).toBeInTheDocument();
    
    // Verificar que muestra tanto el contenido original como el modificado
    expect(modifiedBlock).toHaveTextContent('Dato contextual original');
    expect(modifiedBlock).toHaveTextContent('Dato contextual modificado');
    
    // Verificar que tiene el estilo correcto (fondo amarillo)
    expect(modifiedBlock).toHaveClass('bg-yellow-50');
  });

  test('muestra bloques sin cambios con el estilo correcto', () => {
    // Crear contexto original y uno con un bloque sin cambios
    const originalContext = createMockContext(
      ['Dato contextual sin cambios'],
      [],
      []
    );
    
    const modifiedContext = createMockContext(
      ['Dato contextual sin cambios'],
      ['Dato persistente nuevo'],  // Agregar un bloque nuevo para que haya diferencias
      []
    );

    render(<AgentContextDiffViewer 
      originalContext={originalContext} 
      modifiedContext={modifiedContext} 
    />);
    
    // Verificar que muestra el bloque sin cambios
    const unchangedBlock = screen.getByTestId('diff-block-unchanged');
    expect(unchangedBlock).toBeInTheDocument();
    expect(unchangedBlock).toHaveTextContent('Dato contextual sin cambios');
    
    // Verificar que tiene el estilo correcto (fondo gris)
    expect(unchangedBlock).toHaveClass('bg-gray-50');
  });

  test('muestra correctamente múltiples tipos de bloques', () => {
    // Crear contextos con varios tipos de bloques
    const originalContext = createMockContext(
      ['Contextual 1', 'Contextual 2'],
      ['Persistente 1'],
      ['Semántico 1']
    );
    
    const modifiedContext = createMockContext(
      ['Contextual 1', 'Contextual 2 modificado'], // Uno sin cambios, uno modificado
      ['Persistente 1', 'Persistente 2'],         // Uno sin cambios, uno nuevo
      []                                           // Todos eliminados (no se muestran)
    );

    render(<AgentContextDiffViewer 
      originalContext={originalContext} 
      modifiedContext={modifiedContext} 
    />);

    // Verificar que muestra los encabezados de grupos correctos
    expect(screen.getByText('Contextual (2)')).toBeInTheDocument();
    expect(screen.getByText('Persistente (2)')).toBeInTheDocument();
    
    // El grupo semántico no debe mostrarse ya que no hay elementos en el contexto modificado
    expect(screen.queryByText('Semántico')).not.toBeInTheDocument();
    
    // Verificar que hay bloques de cada tipo
    expect(screen.getByTestId('diff-block-unchanged')).toBeInTheDocument();
    expect(screen.getByTestId('diff-block-modified')).toBeInTheDocument();
    expect(screen.getByTestId('diff-block-added')).toBeInTheDocument();
  });

  test('soporta expansión y colapso de grupos', () => {
    // Crear contextos con varios tipos
    const originalContext = createMockContext(
      ['Contextual 1'],
      ['Persistente 1'],
      []
    );
    
    const modifiedContext = createMockContext(
      ['Contextual 1', 'Contextual 2'],
      ['Persistente modificado'],
      []
    );

    render(<AgentContextDiffViewer 
      originalContext={originalContext} 
      modifiedContext={modifiedContext} 
    />);

    // Por defecto todos los grupos están expandidos
    expect(screen.getByText('Contextual 1')).toBeVisible();
    
    // Colapsar el grupo contextual
    fireEvent.click(screen.getByText('Contextual (2)'));
    
    // Verificar que el contenido ya no es visible
    expect(screen.queryByText('Contextual 1')).not.toBeVisible();
    
    // Expandir de nuevo
    fireEvent.click(screen.getByText('Contextual (2)'));
    
    // Verificar que el contenido es visible nuevamente
    expect(screen.getByText('Contextual 1')).toBeVisible();
  });

  test('usa atributos de accesibilidad correctos', () => {
    const originalContext = createMockContext(['C1'], ['P1'], ['S1']);
    const modifiedContext = createMockContext(['C1', 'C2'], ['P1'], ['S1']);

    render(<AgentContextDiffViewer 
      originalContext={originalContext} 
      modifiedContext={modifiedContext} 
    />);

    // Verificar que los grupos tienen atributos de accesibilidad
    const groupElement = screen.getByRole('group', { name: /Diferencias de tipo Contextual/i });
    expect(groupElement).toBeInTheDocument();
    
    // Verificar que los botones tienen texto accesible
    const button = screen.getByTitle('Colapsar');
    expect(button).toHaveAttribute('aria-label', 'Colapsar sección Contextual');
  });
}); 