import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowAnalysisTab } from '../src/components/WorkflowAnalysisTab';
import '@testing-library/jest-dom';

// Mock de useAuth
vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-id',
      email: 'doctor@test.com',
      displayName: 'Dr. Test',
      license: 'LIC-12345'
    }
  })
}));

describe('Analysis UI Tests', () => {
  const defaultProps = {
    transcript: '',
    setTranscript: vi.fn(),
    isRecording: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    onAnalyze: vi.fn(),
    isAnalyzing: false
  };

  it('debe renderizar solo una caja de consulta', () => {
    render(<WorkflowAnalysisTab {...defaultProps} />);
    
    const textareas = screen.getAllByRole('textbox');
    expect(textareas).toHaveLength(1);
    expect(textareas[0]).toHaveAttribute('placeholder', expect.stringContaining('Grabe o escriba'));
  });

  it('debe mostrar los 4 bloques de resultados cuando hay análisis', () => {
    const mockResults = {
      motivo_consulta: 'Dolor lumbar',
      hallazgos_clinicos: ['Dolor a la flexión', 'Rigidez matutina'],
      red_flags: [],
      evaluaciones_fisicas_sugeridas: [
        { test: 'Lasègue', sensibilidad: 0.91, especificidad: 0.26 },
        { test: 'FABER', sensibilidad: 0.77, especificidad: 0.82 },
        { test: 'Schober', sensibilidad: 0.83, especificidad: 0.75 }
      ],
      plan_tratamiento: {
        inmediato: ['Educación postural'],
        seguimiento: 'Semanal'
      }
    };

    render(<WorkflowAnalysisTab {...defaultProps} niagaraResults={mockResults} />);
    
    // Verificar los 4 bloques
    expect(screen.getByText('Alertas Médico-Legales (PHIPA/PIPEDA)')).toBeInTheDocument();
    expect(screen.getByText('Hallazgos Clínicos')).toBeInTheDocument();
    expect(screen.getByText('Evaluación Física Propuesta')).toBeInTheDocument();
    expect(screen.getByText('Plan y Cierre del Día')).toBeInTheDocument();
  });

  it('debe mostrar barra forense con traceId y residencia CA', () => {
    render(<WorkflowAnalysisTab {...defaultProps} />);
    
    // Buscar elementos de la barra forense
    expect(screen.getByText(/TraceID:/)).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument(); // Residencia de datos
    expect(screen.getByText('Dr. Test')).toBeInTheDocument(); // Ejecutor
  });

  it('debe requerir checkbox de consentimiento para habilitar botón analizar', async () => {
    render(<WorkflowAnalysisTab {...defaultProps} transcript="Texto de prueba" />);
    
    const analyzeButton = screen.getByRole('button', { name: /Analizar con IA/i });
    const consentCheckbox = screen.getByRole('checkbox');
    
    // Inicialmente deshabilitado sin consentimiento
    expect(analyzeButton).toBeDisabled();
    
    // Marcar consentimiento
    fireEvent.click(consentCheckbox);
    await waitFor(() => {
      expect(analyzeButton).not.toBeDisabled();
    });
    
    // Desmarcar consentimiento
    fireEvent.click(consentCheckbox);
    await waitFor(() => {
      expect(analyzeButton).toBeDisabled();
    });
  });

  it('debe permitir seleccionar hallazgos con checkboxes', () => {
    const mockResults = {
      hallazgos_clinicos: ['Hallazgo 1', 'Hallazgo 2']
    };
    
    const onFindingsChange = vi.fn();
    
    render(
      <WorkflowAnalysisTab 
        {...defaultProps} 
        niagaraResults={mockResults}
        onFindingsChange={onFindingsChange}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    // Primer checkbox es consentimiento, los siguientes son hallazgos
    expect(checkboxes.length).toBeGreaterThan(1);
    
    // Click en un hallazgo
    fireEvent.click(checkboxes[1]);
    expect(onFindingsChange).toHaveBeenCalled();
  });
});
