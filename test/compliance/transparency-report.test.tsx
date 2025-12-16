import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TransparencyReportPage from '../../src/pages/TransparencyReportPage';
import { DataSovereigntyBadge } from '../../src/components/transparency/DataSovereigntyBadge';

/**
 * ✅ DÍA 3: Integration Tests - Transparency Report
 * 
 * Tests end-to-end functionality of Transparency Report UI
 */

describe('✅ DÍA 3: Transparency Report - Integration Tests', () => {
  describe('Page Integration', () => {
    it('✅ should render TransparencyReportPage correctly', () => {
      render(
        <BrowserRouter>
          <TransparencyReportPage />
        </BrowserRouter>
      );
      
      const heading = screen.getByText(/Supply Chain Transparency/i);
      expect(heading).toBeInTheDocument();
    });

    it('✅ should render all main sections', () => {
      render(
        <BrowserRouter>
          <TransparencyReportPage />
        </BrowserRouter>
      );
      
      // Check all main sections are present using getByRole for headings (more specific)
      expect(screen.getByRole('heading', { name: /100% Canadian Data Sovereignty/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /AI Processing Partners/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Data Infrastructure/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Security & Compliance Certifications/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Why Transparency Matters/i })).toBeInTheDocument();
    });
  });

  describe('DataSovereigntyBadge Integration', () => {
    it('✅ should render badge in multiple contexts', () => {
      // Test standalone
      const { rerender } = render(<DataSovereigntyBadge />);
      expect(screen.getByText(/100% Canadian Data/i)).toBeInTheDocument();
      
      // Test with description
      rerender(<DataSovereigntyBadge showDescription={true} />);
      expect(screen.getByText(/Your data stays in Canada/i)).toBeInTheDocument();
      
      // Test different sizes
      rerender(<DataSovereigntyBadge size="lg" />);
      const badge = screen.getByText(/100% Canadian Data/i);
      expect(badge.parentElement).toHaveClass('text-base');
    });

    it('✅ should be accessible within TransparencyReport', () => {
      render(
        <BrowserRouter>
          <TransparencyReportPage />
        </BrowserRouter>
      );
      
      // Badge should be present in the sovereignty section
      const badge = screen.getAllByText(/100% Canadian Data/i);
      expect(badge.length).toBeGreaterThan(0);
    });
  });

  describe('Content Completeness', () => {
    it('✅ should display all required compliance information', () => {
      render(
        <BrowserRouter>
          <TransparencyReportPage />
        </BrowserRouter>
      );
      
      // CPO Requirements (appears only once)
      expect(screen.getByText(/CPO Required/i)).toBeInTheDocument();
      
      // PHIPA Compliance (appears in multiple places, use getAllByText)
      const phipaTexts = screen.getAllByText(/PHIPA Compliant/i);
      expect(phipaTexts.length).toBeGreaterThan(0);
      
      // Named AI Processor
      expect(screen.getByText(/Google Vertex AI/i)).toBeInTheDocument();
      
      // Region Disclosure (appears multiple times - AI processor + 3 infrastructure items)
      const montrealTexts = screen.getAllByText(/Montreal, Canada/i);
      expect(montrealTexts.length).toBeGreaterThan(0);
      
      // Security Certifications (SOC 2 Type II appears in multiple places)
      const soc2Texts = screen.getAllByText(/SOC 2 Type II/i);
      expect(soc2Texts.length).toBeGreaterThan(0);
      expect(screen.getByText(/ISO 27001/i)).toBeInTheDocument();
      
      // HIPAA BAA appears in compliance list and as heading, use getAllByText
      const hipaaTexts = screen.getAllByText(/HIPAA BAA/i);
      expect(hipaaTexts.length).toBeGreaterThan(0);
    });

    it('✅ should display competitive advantage messaging', () => {
      render(
        <BrowserRouter>
          <TransparencyReportPage />
        </BrowserRouter>
      );
      
      // Jane.app comparison
      expect(screen.getByText(/Jane.app/i)).toBeInTheDocument();
      
      // Trust building messaging
      expect(screen.getByText(/Trust Building/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Integration', () => {
    it('✅ should have back to workflow link', () => {
      render(
        <BrowserRouter>
          <TransparencyReportPage />
        </BrowserRouter>
      );
      
      const backLink = screen.getByText(/← Back to Workflow/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/workflow');
    });

    it('✅ should have external links with proper attributes', () => {
      render(
        <BrowserRouter>
          <TransparencyReportPage />
        </BrowserRouter>
      );
      
      const externalLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href')?.startsWith('http')
      );
      
      externalLinks.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });
});

