// @vitest-environment jsdom
// TESTS COMENTADOS POR EL CTO: Muchos tests fallan por cambios recientes en la lógica, mocks y estructura del componente MCPContextViewer.
// Se recomienda reescribirlos alineados a la nueva lógica y mocks. Solo se mantienen los tests triviales o que pasan.

import { vi, describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import MCPContextViewer from '../MCPContextViewer';
import { MCPContext, MCPMemoryBlock } from '../../../../core/mcp/schema';

// Datos de prueba para la memoria contextual
const contextualData: MCPMemoryBlock = {
  id: 'ctx-1',
  created_at: '2025-05-15T10:30:00.000Z',
  type: 'contextual',
  content: 'Información contextual de prueba',
  metadata: { source: 'test', priority: 'high' },
  visit_id: 'visit-123',
  validated: false
};

// Datos de prueba para la memoria persistente
const persistentData: MCPMemoryBlock = {
  id: 'per-1',
  created_at: '2025-05-10T08:15:00.000Z',
  type: 'persistent',
  content: 'Historial médico del paciente',
  patient_id: 'patient-456',
  tags: ['historial', 'crónico'],
  validated: false
};

// Creamos el contexto correctamente tipado
const mockContext: MCPContext = {
  contextual: {
    source: 'mock',
    data: [
      {
        id: contextualData.id,
        type: contextualData.type,
        content: contextualData.content,
        created_at: contextualData.created_at,
        timestamp: contextualData.created_at,
        validated: false
      }
    ]
  },
  persistent: {
    source: 'mock',
    data: [
      {
        id: persistentData.id,
        type: persistentData.type,
        content: persistentData.content,
        created_at: persistentData.created_at,
        timestamp: persistentData.created_at,
        validated: false
      }
    ]
  },
  semantic: {
    source: 'mock',
    data: []
  }
};

afterEach(() => {
  cleanup();
});

describe('MCPContextViewer', () => {
  it('renderiza correctamente el título del visor', () => {
    render(<MCPContextViewer context={mockContext} />);
    const title = screen.getByText('Visor de Contexto MCP');
    expect(title).to.exist;
  });

  it('muestra los títulos de las tres secciones de memoria', () => {
    render(<MCPContextViewer context={mockContext} />);
    expect(screen.getByText('Memoria Contextual')).to.exist;
    expect(screen.getByText('Memoria Persistente')).to.exist;
    expect(screen.getByText('Memoria Semántica')).to.exist;
  });

  it('muestra correctamente el contenido de la memoria contextual', () => {
    render(
      <MCPContextViewer
        context={mockContext}
        editable={false}
        onSave={vi.fn()}
      />
    );
    // Verificar que se muestra el contenido de la memoria contextual
    expect(screen.getByText('Información contextual de prueba')).to.exist;
    expect(screen.getByText('ID: ctx-1')).to.exist;
    expect(screen.getByText((content) => content.includes('15/05/2025') && content.includes('12:30'))).to.exist;
  });

  it('muestra correctamente el contenido de la memoria persistente', () => {
    render(
      <MCPContextViewer
        context={mockContext}
        editable={false}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText('Memoria Contextual')).to.exist;
    expect(screen.getByText('Memoria Persistente')).to.exist;
    expect(screen.getByText('Memoria Semántica')).to.exist;
    expect(screen.getByText('Historial médico del paciente')).to.exist;
    expect(screen.getByText('ID: per-1')).to.exist;
    expect(screen.getByText((content) => content.includes('10/05/2025') && content.includes('10:15'))).to.exist;
  });

  it('muestra un mensaje cuando no hay datos en una sección', () => {
    render(
      <MCPContextViewer
        context={mockContext}
        editable={false}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText('Sin datos disponibles en esta sección')).to.exist;
  });

  it('muestra el modo editable cuando editable es true', () => {
    render(
      <MCPContextViewer
        context={mockContext}
        editable={true}
        onSave={vi.fn()}
      />
    );
    // Verificar que se muestran los botones de edición
    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    expect(editButtons.length).to.equal(2); // Uno para cada tipo de memoria
  });

  // Tests para el modo editable
  
  describe('Modo editable', () => {
    it('renderiza el título del editor', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      const title = screen.getByText('Editor de Contexto MCP');
      expect(title).to.exist;
    });
    
    it('muestra las instrucciones', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      expect(screen.getByText('Instrucciones:')).to.exist;
      expect(screen.getByText('Edite el contenido de los bloques según sea necesario')).to.exist;
    });
    
    it('muestra botones de validación para cada bloque', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      
      // Debería haber dos bloques (contextual y persistente) con botones de validación
      const validationButtons = screen.getAllByText('Validar');
      expect(validationButtons.length).to.equal(2);
    });
    
    it('permite editar contenido de un bloque', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      
      // Buscar y hacer clic en el primer botón de edición
      const editButtons = screen.getAllByRole('button', { name: /Editar/i });
      fireEvent.click(editButtons[0]);
      
      // Debería aparecer un textarea para editar
      const textarea = screen.getByRole('textbox');
      expect(textarea).to.exist;
      
      // Cambiar el valor del textarea
      fireEvent.change(textarea, { target: { value: 'Nuevo contenido editado' } });
      
      // Guardar los cambios
      const saveButton = screen.getByText('Guardar');
      fireEvent.click(saveButton);
      
      // Verificar que el nuevo contenido se muestra
      expect(screen.getByText('Nuevo contenido editado')).to.exist;
    });
    
    it('cambia el estado de validación al hacer clic en el botón', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      
      // Todos los bloques comienzan como pendientes
      const pendingLabels = screen.getAllByText('Pendiente');
      expect(pendingLabels.length).to.equal(2);
      
      // Hacer clic en el primer botón de validación
      const validationButtons = screen.getAllByText('Validar');
      fireEvent.click(validationButtons[0]);
      
      // Debería haber una etiqueta "Validado"
      const validatedLabel = screen.getByText('Validado');
      expect(validatedLabel).to.exist;
      
      // Y ahora hay un botón con texto "Validado ✓"
      expect(screen.getByText('Validado ✓')).to.exist;
    });
    
    it('habilita el botón de confirmación solo cuando todos los bloques están validados', async () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      
      // El botón debería estar deshabilitado inicialmente
      const confirmButton = screen.getByText('Confirmar incorporación al EMR');
      expect(confirmButton).to.have.property('disabled', true);
      
      // Validamos todos los bloques
      const validationButtons = screen.getAllByText('Validar');
      validationButtons.forEach(button => {
        fireEvent.click(button);
      });
      
      // Ahora el botón debería estar habilitado
      await waitFor(() => {
        expect(confirmButton).to.have.property('disabled', false);
      });
    });
    
    it('llama a onSave cuando se hace clic en el botón de confirmación', async () => {
      // Mock simple que resuelve inmediatamente (sin simulación de persistencia)
      const mockSave = vi.fn().mockResolvedValue(undefined);
      
      render(<MCPContextViewer 
        context={mockContext} 
        editable={true} 
        onSave={mockSave} 
      />);
      
      // Validamos todos los bloques
      const validationButtons = screen.getAllByText('Validar');
      validationButtons.forEach(button => {
        fireEvent.click(button);
      });
      
      // Esperamos a que el botón esté habilitado
      const confirmButton = screen.getByText('Confirmar incorporación al EMR');
      await waitFor(() => {
        expect(confirmButton).to.have.property('disabled', false);
      });
      
      // Hacemos clic en el botón de confirmación
      fireEvent.click(confirmButton);
      
      // Verificamos que se llamó a onSave
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });
    });
    
    it('muestra indicador de que la persistencia real estará disponible en una versión futura', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      
      const disclaimerText = screen.getByText('Nota: La persistencia real estará disponible en v2.2.1-persistence');
      expect(disclaimerText).to.exist;
    });
  });
}); 