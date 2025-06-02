import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import AgentSuggestionExplainer from './AgentSuggestionExplainer';
import { AgentSuggestion } from '@/types/agent';
import { explainSuggestion } from '@/core/agent/AgentExplainer';

const COMPONENT_ERROR_MESSAGES = {
  NETWORK: 'Error de conexión',
  TIMEOUT: 'La solicitud de explicación ha expirado',
  UNKNOWN: 'No se pudo generar una explicación'
} as const;

vi.mock('@/core/agent/AgentExplainer', () => ({
  explainSuggestion: vi.fn()
}));

describe('AgentSuggestionExplainer', () => {
  const mockSuggestion: AgentSuggestion = {
    id: 'test-suggestion-1',
    type: 'recommendation',
    field: 'diagnosis',
    content: 'Considerar radiografía de tórax',
    sourceBlockId: 'block-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el botón para sugerencias explicables', () => {
    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    expect(screen.getByTestId('explanation-button')).toBeInTheDocument();
  });
  
  it('no renderiza nada para sugerencias tipo info', () => {
    const infoSuggestion = { ...mockSuggestion, type: 'info' as AgentSuggestion['type'] };
    const { container } = render(<AgentSuggestionExplainer suggestion={infoSuggestion} />);
    expect(container.firstChild).toBeNull();
  });

  it('aria-expanded cambia al expandir/ocultar', async () => {
    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    const button = screen.getByTestId('explanation-button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'false'));
  });

  it('maneja un fallo inicial y reintento exitoso', async () => {
    const initialError = new Error('Network error'); 
    const successExplanation = 'Explicación obtenida tras reintento';

    vi.mocked(explainSuggestion)
      .mockRejectedValueOnce(initialError)
      .mockResolvedValueOnce(successExplanation); 

    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    const button = screen.getByTestId('explanation-button');
    fireEvent.click(button);

    await waitFor(() => {
      // Ahora esperamos que explanation-text contenga el mensaje de error de red
      expect(screen.getByTestId('explanation-text')).toHaveTextContent(COMPONENT_ERROR_MESSAGES.NETWORK);
    });
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Reintentar' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByTestId('explanation-text')).toHaveTextContent(successExplanation);
    });
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
    expect(vi.mocked(explainSuggestion)).toHaveBeenCalledTimes(2);
  });

  it('maneja varios reintentos fallidos', async () => {
    // Usar mensajes de error que activen las ramas correctas en detectErrorType
    const networkError = new Error('A network problem occurred'); 
    const genericError = new Error('A generic failure'); 

    vi.mocked(explainSuggestion)
        .mockRejectedValueOnce(networkError) 
        .mockRejectedValueOnce(genericError); 

    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    fireEvent.click(screen.getByTestId('explanation-button'));

    // Primer fallo (Error de red)
    await waitFor(() => {
        expect(screen.getByTestId('explanation-text')).toHaveTextContent(COMPONENT_ERROR_MESSAGES.NETWORK);
    });
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();

    // Click en Reintentar
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    // Segundo fallo (Error genérico -> UNKNOWN)
    await waitFor(() => {
        // Asegurarse que detectErrorType para genericError devuelve UNKNOWN
        expect(screen.getByTestId('explanation-text')).toHaveTextContent(COMPONENT_ERROR_MESSAGES.UNKNOWN);
    });
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(vi.mocked(explainSuggestion)).toHaveBeenCalledTimes(2);
  });
  
  it('muestra indicador de carga y luego la explicación', async () => {
    const mockExplanation = 'Explicación de prueba generada';
    vi.mocked(explainSuggestion).mockImplementation(
      () => new Promise<string>(resolve => setTimeout(() => resolve(mockExplanation), 50))
    );

    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    fireEvent.click(screen.getByTestId('explanation-button'));

    // Esperar a que el contenido de la explicación esté presente
    await waitFor(() => {
      expect(screen.getByTestId('explanation-text')).toHaveTextContent(mockExplanation);
    });
    // Y luego verificar que el indicador de carga ya no está
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });

  it('oculta y vuelve a mostrar sin llamar otra vez', async () => {
    const mockExplanation = 'Explicación persistente';
    vi.mocked(explainSuggestion).mockResolvedValueOnce(mockExplanation);

    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    const button = screen.getByTestId('explanation-button');

    // Primera expansión y carga
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('explanation-text')).toHaveTextContent(mockExplanation);
    });

    // Colapsar
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByTestId('explanation-text')).not.toBeInTheDocument();
    });
    
    // Expandir nuevamente
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('explanation-text')).toBeVisible();
      expect(screen.getByTestId('explanation-text')).toHaveTextContent(mockExplanation);
    });
    expect(explainSuggestion).toHaveBeenCalledTimes(1);
  });

  it('botón se deshabilita durante la carga y se habilita después', async () => {
    let resolvePromise: (value: string) => void = () => {};
    const explanationPromise = new Promise<string>(resolve => {
      resolvePromise = resolve; 
    });
    vi.mocked(explainSuggestion).mockImplementation(() => explanationPromise);

    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    const button = screen.getByTestId('explanation-button');
    
    expect(button).not.toBeDisabled(); 

    fireEvent.click(button); 

    await waitFor(() => {
        expect(button).toBeDisabled();
    });
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

    await act(async () => {
      resolvePromise("Explicación cargada manualmente");
      // Esperar a que la promesa se resuelva y React procese los cambios de estado
      await Promise.resolve(); // Permite que la cadena de promesas avance
      await new Promise(r => setTimeout(r, 0)); // Pequeño delay para el ciclo de eventos
    });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
    // Asegurarse que el texto también está presente
    expect(screen.getByTestId('explanation-text')).toHaveTextContent("Explicación cargada manualmente");
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });

});