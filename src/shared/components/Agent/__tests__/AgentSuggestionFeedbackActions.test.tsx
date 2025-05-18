import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionFeedbackActions from '../AgentSuggestionFeedbackActions';
import { AuditLogger } from '../../../../core/audit/AuditLogger';
import * as UsageAnalyticsService from '../../../../services/UsageAnalyticsService';
import supabase from '../../../../core/auth/supabaseClient';

describe('AgentSuggestionFeedbackActions', () => {
  const mockProps = {
    visitId: 'visit-test-123',
    userId: 'user-test-123',
    suggestionId: 'suggestion-test-123',
    suggestion: {
      id: 'suggestion-test-123',
      type: 'recommendation' as const,
      content: 'Considerar radiografía de tórax',
      sourceBlockId: 'block-123'
    },
    onFeedback: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza correctamente los botones de feedback', () => {
    render(<AgentSuggestionFeedbackActions {...mockProps} />);
    
    expect(screen.getByText(/Útil/)).toBeInTheDocument();
    expect(screen.getByText(/Irrelevante/)).toBeInTheDocument();
    expect(screen.getByText(/Incorrecta/)).toBeInTheDocument();
    expect(screen.getByText(/Peligrosa/)).toBeInTheDocument();
  });

  it('intenta guardar feedback al hacer clic en un botón', () => {
    render(<AgentSuggestionFeedbackActions {...mockProps} />);
    
    fireEvent.click(screen.getByText(/Útil/));
    
    expect(supabase.from).toHaveBeenCalled();
  });
}); 