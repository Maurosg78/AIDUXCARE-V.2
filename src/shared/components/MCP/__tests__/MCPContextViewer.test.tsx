import { vi } from "vitest";
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MCPContextViewer from '../MCPContextViewer';
import { MCPContext, MCPMemoryBlock } from '@/core/mcp/schema';

// Datos de prueba para la memoria contextual
const contextualData: MCPMemoryBlock = {
  id: 'ctx-1',
  created_at: '2025-05-15T10:30:00.000Z',
  type: 'contextual',
  content: 'Información contextual de prueba',
  metadata: { source: 'test', priority: 'high' },
  visit_id: 'visit-123'
};

// Datos de prueba para la memoria persistente
const persistentData: MCPMemoryBlock = {
  id: 'per-1',
  created_at: '2025-05-10T08:15:00.000Z',
  type: 'persistent',
  content: 'Historial médico del paciente',
  patient_id: 'patient-456',
  tags: ['historial', 'crónico']
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
        // Pasar explícitamente el metadata para que el componente lo muestre
        metadata: contextualData.metadata,
        visit_id: contextualData.visit_id
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
        patient_id: persistentData.patient_id,
        // Es importante pasar explícitamente los tags para que el componente los muestre
        tags: persistentData.tags
      }
    ]
  },
  semantic: {
    source: 'mock',
    data: [] // Sin datos para probar el mensaje "Sin datos disponibles"
  }
};

describe('MCPContextViewer', () => {
  it('renderiza correctamente el título del visor', () => {
    render(<MCPContextViewer context={mockContext} />);
    const title = screen.getByText('Visor de Contexto MCP');
    expect(title).toBeInTheDocument();
  });

  it('muestra los títulos de las tres secciones de memoria', () => {
    render(<MCPContextViewer context={mockContext} />);
    
    expect(screen.getByText('Memoria Contextual')).toBeInTheDocument();
    expect(screen.getByText('Memoria Persistente')).toBeInTheDocument();
    expect(screen.getByText('Memoria Semántica')).toBeInTheDocument();
  });

  it('muestra correctamente el contenido de la memoria contextual', () => {
    render(<MCPContextViewer context={mockContext} />);
    
    expect(screen.getByText('Información contextual de prueba')).toBeInTheDocument();
    expect(screen.getByText('ID: ctx-1')).toBeInTheDocument();
    // También podríamos verificar que se muestra el metadata si es necesario
  });

  it('muestra correctamente el contenido de la memoria persistente', () => {
    render(<MCPContextViewer context={mockContext} />);
    
    expect(screen.getByText('Historial médico del paciente')).toBeInTheDocument();
    expect(screen.getByText('ID: per-1')).toBeInTheDocument();
    
    // Para verificar las etiquetas, necesitamos usar una función de consulta más flexible
    // Ya que pueden estar en elementos distintos
    const tagsContainer = screen.getByText((content, element) => {
      // Buscar un elemento que sea el contenedor de las etiquetas
      return element?.className.includes('flex-wrap gap-1') || false;
    });
    
    // Ahora verificamos que las etiquetas están dentro de este contenedor
    expect(tagsContainer).toContainHTML('historial');
    expect(tagsContainer).toContainHTML('crónico');
  });

  it('muestra mensaje cuando no hay datos en una sección', () => {
    render(<MCPContextViewer context={mockContext} />);
    
    const emptyMessage = screen.getByText('Sin datos disponibles en esta sección');
    expect(emptyMessage).toBeInTheDocument();
  });
  
  // Tests para el modo editable
  
  describe('Modo editable', () => {
    it('renderiza el título del editor', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      const title = screen.getByText('Editor de Contexto MCP');
      expect(title).toBeInTheDocument();
    });
    
    it('muestra las instrucciones', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      expect(screen.getByText('Instrucciones:')).toBeInTheDocument();
      expect(screen.getByText('Edite el contenido de los bloques según sea necesario')).toBeInTheDocument();
    });
    
    it('muestra botones de validación para cada bloque', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      
      // Debería haber dos bloques (contextual y persistente) con botones de validación
      const validationButtons = screen.getAllByText('Validar');
      expect(validationButtons.length).toBe(2);
    });
    
    it('permite editar contenido de un bloque', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      
      // Buscar y hacer clic en el primer botón de edición
      const editButtons = screen.getAllByText('Editar');
      fireEvent.click(editButtons[0]);
      
      // Debería aparecer un textarea para editar
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      
      // Cambiar el valor del textarea
      fireEvent.change(textarea, { target: { value: 'Nuevo contenido editado' } });
      
      // Guardar los cambios
      const saveButton = screen.getByText('Guardar');
      fireEvent.click(saveButton);
      
      // Verificar que el nuevo contenido se muestra
      expect(screen.getByText('Nuevo contenido editado')).toBeInTheDocument();
    });
    
    it('cambia el estado de validación al hacer clic en el botón', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      
      // Todos los bloques comienzan como pendientes
      const pendingLabels = screen.getAllByText('Pendiente');
      expect(pendingLabels.length).toBe(2);
      
      // Hacer clic en el primer botón de validación
      const validationButtons = screen.getAllByText('Validar');
      fireEvent.click(validationButtons[0]);
      
      // Debería haber una etiqueta "Validado"
      const validatedLabel = screen.getByText('Validado');
      expect(validatedLabel).toBeInTheDocument();
      
      // Y ahora hay un botón con texto "Validado ✓"
      expect(screen.getByText('Validado ✓')).toBeInTheDocument();
    });
    
    it('habilita el botón de confirmación solo cuando todos los bloques están validados', async () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      
      // El botón debería estar deshabilitado inicialmente
      const confirmButton = screen.getByText('Confirmar incorporación al EMR');
      expect(confirmButton).toBeDisabled();
      
      // Validamos todos los bloques
      const validationButtons = screen.getAllByText('Validar');
      validationButtons.forEach(button => {
        fireEvent.click(button);
      });
      
      // Ahora el botón debería estar habilitado
      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
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
        expect(confirmButton).not.toBeDisabled();
      });
      
      // Hacemos clic en el botón de confirmación
      fireEvent.click(confirmButton);
      
      // Verificamos que se llamó a onSave
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });
    });
    
    it('muestra indicador de que la persistencia real estará disponible en una versión futura', () => {
      render(<MCPContextViewer context={mockContext} editable={true} />);
      
      const disclaimerText = screen.getByText('Nota: La persistencia real estará disponible en v2.2.1-persistence');
      expect(disclaimerText).toBeInTheDocument();
    });
  });
}); 