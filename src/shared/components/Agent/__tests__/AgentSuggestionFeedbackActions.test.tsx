// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AgentSuggestionFeedbackActions from '../AgentSuggestionFeedbackActions';
import { AgentSuggestion, SuggestionType } from '../../../../types/agent';
import { track } from '../../../utils/analytics';

// Mock de la función track
vi.mock('../../../utils/analytics', () => ({
  track: vi.fn()
}));

describe('AgentSuggestionFeedbackActions', () => {
  const visitId = 'test-visit-id';
  const userId = 'test-user-id';
  const suggestion: AgentSuggestion = {
    id: 'test-suggestion-id',
    type: 'recommendation' as SuggestionType,
    field: 'diagnosis',
    content: 'Test content',
    sourceBlockId: 'test-block-id',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const onAccept = vi.fn();
  const onReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('debe mostrar los botones de aceptar y rechazar', () => {
    render(
      <AgentSuggestionFeedbackActions
        visitId={visitId}
        userId={userId}
        suggestion={suggestion}
        onAccept={onAccept}
        onReject={onReject}
        isIntegrated={false}
      />
    );

    expect(screen.getByText('Aceptar')).to.exist;
    expect(screen.getByText('Rechazar')).to.exist;
  });

  it('debe llamar a onAccept al hacer clic en Aceptar', () => {
    render(
      <AgentSuggestionFeedbackActions
        visitId={visitId}
        userId={userId}
        suggestion={suggestion}
        onAccept={onAccept}
        onReject={onReject}
        isIntegrated={false}
      />
    );

    fireEvent.click(screen.getByText('Aceptar'));
    expect(onAccept).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('suggestion_accepted', {
      visitId,
      userId,
      suggestionId: suggestion.id
    });
  });

  it('debe llamar a onReject al hacer clic en Rechazar', () => {
    render(
      <AgentSuggestionFeedbackActions
        visitId={visitId}
        userId={userId}
        suggestion={suggestion}
        onAccept={onAccept}
        onReject={onReject}
        isIntegrated={false}
      />
    );

    fireEvent.click(screen.getByText('Rechazar'));
    expect(onReject).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('suggestion_rejected', {
      visitId,
      userId,
      suggestionId: suggestion.id
    });
  });

  it('debe mostrar mensaje de integrado cuando isIntegrated es true', () => {
    render(
      <AgentSuggestionFeedbackActions
        visitId={visitId}
        userId={userId}
        suggestion={suggestion}
        onAccept={onAccept}
        onReject={onReject}
        isIntegrated={true}
      />
    );

    expect(screen.getByText('✓ Sugerencia integrada')).to.exist;
    expect(screen.queryByText('Aceptar')).to.not.exist;
    expect(screen.queryByText('Rechazar')).to.not.exist;
  });
}); 