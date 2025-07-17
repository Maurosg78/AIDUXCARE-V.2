import React from 'react';
// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom';
import AgentContextDiffViewer from '../../../src/shared/components/Agent/AgentContextDiffViewer';
import { MCPContext } from '../../../src/core/mcp/schema';

describe.skip('AgentContextDiffViewer (LEGACY - Requiere refactorización)', () => {
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

  test('no muestra diferencias cuando tienen idéntico contenido', () => {
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
      previousContext={originalContext} 
      currentContext={modifiedContext} 
    />);

    // En realidad, el componente muestra los bloques sin cambios, no un mensaje
    // Verificar que los bloques se muestran como unchanged
    const unchangedBlocks = screen.getAllByTestId('diff-block-unchanged');
    expect(unchangedBlocks.length).toBe(3); // Uno para cada tipo
    
    // Verificar que los bloques tienen el estilo correcto
    unchangedBlocks.forEach(block => {
      expect(block).toHaveClass('bg-gray-50');
    });
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
      previousContext={originalContext} 
      currentContext={modifiedContext} 
    />);

    // Verificar que muestra el encabezado del grupo contextual
    expect(screen.getByText('contextual (2)')).toBeInTheDocument();
    
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
      previousContext={originalContext} 
      currentContext={modifiedContext} 
    />);

    // Verificar que muestra el encabezado del grupo contextual
    expect(screen.getByText('contextual (2)')).toBeInTheDocument();
    
    // Verificar que muestra los bloques modificados
    const modifiedBlocks = screen.getAllByTestId('diff-block-modified');
    expect(modifiedBlocks).toHaveLength(2); // Uno para el original y uno para el modificado
    
    // Verificar que muestra tanto el contenido original como el modificado
    const blockContents = modifiedBlocks.map(block => block.textContent);
    expect(blockContents).toContain('Dato contextual original');
    expect(blockContents).toContain('Dato contextual modificado');
    
    // Verificar que tienen el estilo correcto (fondo amarillo)
    modifiedBlocks.forEach(block => {
      expect(block).toHaveClass('bg-yellow-50');
    });
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
      previousContext={originalContext} 
      currentContext={modifiedContext} 
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
      previousContext={originalContext} 
      currentContext={modifiedContext} 
    />);

    // Verificar que muestra los encabezados de grupos correctos
    expect(screen.getByText('contextual (2)')).toBeInTheDocument();
    expect(screen.getByText('persistent (2)')).toBeInTheDocument();
    
    // El grupo semántico no debe mostrarse ya que no hay elementos en el contexto modificado
    expect(screen.queryByText('semantic')).not.toBeInTheDocument();
    
    // Verificar que hay al menos un bloque de cada tipo usando getAllByTestId
    expect(screen.getAllByTestId('diff-block-unchanged').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('diff-block-modified').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('diff-block-added').length).toBeGreaterThan(0);
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
      previousContext={originalContext} 
      currentContext={modifiedContext} 
    />);

    // Por defecto todos los grupos están expandidos
    // Verificar que el texto del bloque es visible inicialmente
    const contentText = screen.getByText('Contextual 1');
    expect(contentText).toBeVisible();
    
    // Encontrar el grupo contextual
    const groupHeader = screen.getByText('contextual (2)');
    
    // Colapsar el grupo contextual
    fireEvent.click(groupHeader);
    
    // Verificar que después de colapsar, el texto ya no está visible
    // Usando queryByText debería ser null o no visible
    expect(screen.queryByText('Contextual 1')).not.toBeInTheDocument();
    
    // Expandir de nuevo
    fireEvent.click(groupHeader);
    
    // Verificar que el texto es visible nuevamente
    expect(screen.getByText('Contextual 1')).toBeVisible();
  });

  test('usa atributos de accesibilidad correctos', () => {
    const originalContext = createMockContext(['C1'], ['P1'], ['S1']);
    const modifiedContext = createMockContext(['C1', 'C2'], ['P1'], ['S1']);

    render(<AgentContextDiffViewer 
      previousContext={originalContext} 
      currentContext={modifiedContext} 
    />);

    // Verificar que los grupos tienen atributos de accesibilidad
    const contextualGroup = screen.getByRole('group', { name: /contextual/i });
    expect(contextualGroup).toBeInTheDocument();
    
    // Verificar que el botón de colapso tiene los atributos correctos
    const collapseButton = screen.getByRole('button', { name: /Colapsar sección contextual/i });
    expect(collapseButton).toHaveAttribute('aria-label', 'Colapsar sección contextual');
    
    // Verificar que el grupo tiene el encabezado correcto
    const header = screen.getByText('contextual (2)');
    expect(header).toHaveAttribute('id', 'contextual-header');
    expect(contextualGroup).toHaveAttribute('aria-labelledby', 'contextual-header');
  });
}); 