import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataSovereigntyBadge } from '../DataSovereigntyBadge';

describe('✅ DÍA 3: DataSovereigntyBadge Component', () => {
  describe('Basic Rendering', () => {
    it('✅ should render badge with default size (md)', () => {
      render(<DataSovereigntyBadge />);
      
      const badge = screen.getByText(/100% Canadian Data/i);
      expect(badge).toBeInTheDocument();
      
      const flag = screen.getByText('🇨🇦');
      expect(flag).toBeInTheDocument();
    });

    it('✅ should render badge with small size', () => {
      render(<DataSovereigntyBadge size="sm" />);
      
      const badge = screen.getByText(/100% Canadian Data/i);
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('text-xs');
    });

    it('✅ should render badge with medium size', () => {
      render(<DataSovereigntyBadge size="md" />);
      
      const badge = screen.getByText(/100% Canadian Data/i);
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('text-sm');
    });

    it('✅ should render badge with large size', () => {
      render(<DataSovereigntyBadge size="lg" />);
      
      const badge = screen.getByText(/100% Canadian Data/i);
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('text-base');
    });
  });

  describe('Description Display', () => {
    it('✅ should not show description by default', () => {
      render(<DataSovereigntyBadge />);
      
      const description = screen.queryByText(/Your data stays in Canada/i);
      expect(description).not.toBeInTheDocument();
    });

    it('✅ should show description when showDescription is true', () => {
      render(<DataSovereigntyBadge showDescription={true} />);
      
      const description = screen.getByText(/Your data stays in Canada/i);
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent(/No cross-border processing/i);
    });
  });

  describe('Styling', () => {
    it('✅ should have correct green styling classes', () => {
      render(<DataSovereigntyBadge />);
      
      const badge = screen.getByText(/100% Canadian Data/i);
      const container = badge.parentElement;
      
      expect(container).toHaveClass('bg-green-100');
      expect(container).toHaveClass('text-green-800');
      expect(container).toHaveClass('border-green-200');
      expect(container).toHaveClass('rounded-full');
    });

    it('✅ should accept custom className', () => {
      render(<DataSovereigntyBadge className="custom-class" />);
      
      const container = screen.getByText(/100% Canadian Data/i).parentElement?.parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('✅ should be accessible with proper semantic HTML', () => {
      render(<DataSovereigntyBadge />);
      
      const badge = screen.getByText(/100% Canadian Data/i);
      expect(badge).toBeInTheDocument();
      
      // Badge should be in a container div (semantic structure)
      const container = badge.parentElement;
      expect(container?.tagName).toBe('DIV');
    });
  });
});

