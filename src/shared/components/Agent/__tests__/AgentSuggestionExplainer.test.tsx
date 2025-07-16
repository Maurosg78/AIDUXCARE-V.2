// @vitest-environment jsdom
/*  src/shared/components/Agent/__tests__/AgentSuggestionExplainer.test.tsx */

import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
  cleanup
} from '@testing-library/react';
import { describe, it, vi, beforeEach, expect, afterEach } from 'vitest';

import AgentSuggestionExplainer from '../../Agent/AgentSuggestionExplainer';
import { explainSuggestion } from '@/core/agent/AgentExplainer';
import { AgentSuggestion } from '@/types/agent';

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

  afterEach(() => {
    cleanup();
  });

  it('debe renderizar el botón para sugerencias explicables', () => {
    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    expect(screen.getByTestId('explanation-button')).to.exist;
  });

  it('no renderiza nada para sugerencias tipo info', () => {
    const infoSuggestion = { ...mockSuggestion, type: 'info' as AgentSuggestion['type'] };
    const { container } = render(<AgentSuggestionExplainer suggestion={infoSuggestion} />);
    expect(container.firstChild).to.be.null;
  });

  it('aria-expanded cambia al expandir/ocultar', async () => {
    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    const button = screen.getByTestId('explanation-button');
    expect(button.getAttribute('aria-expanded')).to.equal('false');
    fireEvent.click(button);
    await waitFor(() => expect(button.getAttribute('aria-expanded')).to.equal('true'));
    fireEvent.click(button);
    await waitFor(() => expect(button.getAttribute('aria-expanded')).to.equal('false'));
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
      expect(screen.getByTestId('explanation-text').textContent).to.include(COMPONENT_ERROR_MESSAGES.NETWORK);
    });
    expect(screen.getByRole('button', { name: 'Reintentar' })).to.exist;
    
    const retryButton = screen.getByRole('button', { name: 'Reintentar' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByTestId('explanation-text').textContent).to.include(successExplanation);
    });
    expect(screen.queryByRole('button', { name: 'Reintentar' })).to.not.exist;
    expect(vi.mocked(explainSuggestion)).toHaveBeenCalledTimes(2);
  });

  it('maneja varios reintentos fallidos', async () => {
    const networkError = new Error('Network connection has failed'); 
    const genericError = new Error('A generic failure'); 

    vi.mocked(explainSuggestion)
        .mockRejectedValueOnce(networkError) 
        .mockRejectedValueOnce(genericError); 
    
    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    fireEvent.click(screen.getByTestId('explanation-button'));

    await waitFor(() => {
        expect(screen.getByTestId('explanation-text').textContent).to.include(COMPONENT_ERROR_MESSAGES.NETWORK);
    });
    expect(screen.getByRole('button', { name: 'Reintentar' })).to.exist;

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    
    await waitFor(() => {
        expect(screen.getByTestId('explanation-text').textContent).to.include(COMPONENT_ERROR_MESSAGES.UNKNOWN);
    });
    expect(screen.getByRole('button', { name: 'Reintentar' })).to.exist;
    expect(vi.mocked(explainSuggestion)).toHaveBeenCalledTimes(2);
  });
  
  it('muestra indicador de carga y luego la explicación', async () => {
    const mockExplanation = 'Explicación de prueba generada';
    vi.mocked(explainSuggestion).mockImplementation(
      () => new Promise<string>(resolve => setTimeout(() => resolve(mockExplanation), 50))
    );

    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    fireEvent.click(screen.getByTestId('explanation-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('explanation-text').textContent).to.include(mockExplanation);
    });
    expect(screen.queryByTestId('loading-indicator')).to.not.exist;
  });

  it('oculta y vuelve a mostrar sin llamar otra vez', async () => {
    const mockExplanation = 'Explicación persistente';
    vi.mocked(explainSuggestion).mockResolvedValueOnce(mockExplanation);

    render(<AgentSuggestionExplainer suggestion={mockSuggestion} />);
    const button = screen.getByTestId('explanation-button');

    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('explanation-text').textContent).to.include(mockExplanation);
    });

    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByTestId('explanation-text')).to.not.exist;
    });
    
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('explanation-text')).to.exist;
      expect(screen.getByTestId('explanation-text').textContent).to.include(mockExplanation);
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
    
    expect(button).to.not.have.property('disabled', true);

    fireEvent.click(button); 

    await waitFor(() => {
        expect(button).to.have.property('disabled', true);
    });
    expect(screen.getByTestId('loading-indicator')).to.exist;

    await act(async () => {
      resolvePromise("Explicación cargada manualmente");
      await Promise.resolve(); 
      await new Promise(r => setTimeout(r, 0)); 
  });

    await waitFor(() => {
      expect(button).to.not.have.property('disabled', true);
    });
    expect(screen.getByTestId('explanation-text').textContent).to.include("Explicación cargada manualmente");
    expect(screen.queryByTestId('loading-indicator')).to.not.exist;
  });
}); 
