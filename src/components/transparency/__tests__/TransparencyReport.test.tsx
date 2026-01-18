import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TransparencyReport } from '../TransparencyReport';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('✅ DÍA 3: TransparencyReport Component', () => {
  describe('Basic Rendering', () => {
    it('✅ should render main heading', () => {
      renderWithRouter(<TransparencyReport />);
      
      const heading = screen.getByText(/Supply Chain Transparency/i);
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('✅ should render description text', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text appears in multiple places, use getAllByText and check first occurrence
      const descriptions = screen.getAllByText(/Complete transparency about our AI processors/i);
      expect(descriptions.length).toBeGreaterThan(0);
      expect(descriptions[0]).toBeInTheDocument();
    });

    it('✅ should render back to workflow link', () => {
      renderWithRouter(<TransparencyReport />);
      
      const backLinks = screen.getAllByRole('link', { name: /← Back to Workflow/i });
      expect(backLinks.length).toBeGreaterThan(0);
      expect(backLinks.some((a) => a.getAttribute('href') === '/workflow')).toBe(true);
    });
  });

  describe('Canadian Data Sovereignty Section', () => {
    it('✅ should render data sovereignty badge section', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Multiple H2 headings contain this text, use getAllByRole and verify at least one exists
      const sovereigntyHeadings = screen.getAllByRole('heading', { level: 2, name: /100% Canadian Data Sovereignty/i });
      expect(sovereigntyHeadings.length).toBeGreaterThan(0);
      // Verify it's an H2 element
      expect(sovereigntyHeadings[0].tagName).toBe('H2');
    });

    it('✅ should render sovereignty description', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text appears multiple times, use getAllByText and verify at least one exists
      const descriptions = screen.getAllByText(/All data processing, storage, and AI computation occurs within Canadian borders/i);
      expect(descriptions.length).toBeGreaterThan(0);
      expect(descriptions[0]).toBeInTheDocument();
    });

    it('✅ should render Canadian flag emoji', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Flag appears in multiple places (badge component and large badge), use getAllByText
      const flags = screen.getAllByText('🇨🇦');
      expect(flags.length).toBeGreaterThan(0);
      expect(flags[0]).toBeInTheDocument();
    });

    it('✅ should render DataSovereigntyBadge component', () => {
      renderWithRouter(<TransparencyReport />);
      
      // "100% Canadian Data" appears in heading and badge, use getAllByText and find the badge (span)
      const badges = screen.getAllByText(/100% Canadian Data/i);
      expect(badges.length).toBeGreaterThan(0);
      
      // Find the badge component (should be in a span, not heading)
      const badgeComponent = badges.find(el => el.tagName === 'SPAN');
      expect(badgeComponent).toBeInTheDocument();
    });
  });

  describe('AI Processing Partners Section', () => {
    it('✅ should render AI Processors heading', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Multiple H2 headings may contain this text, use getAllByRole and verify at least one exists
      const headings = screen.getAllByRole('heading', { level: 2, name: /AI Processing Partners/i });
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].tagName).toBe('H2');
    });

    it('✅ should render Google Vertex AI processor name', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text may appear multiple times, use getAllByText and verify at least one exists
      const processorNames = screen.getAllByText(/Google Vertex AI \(Gemini 2.5 Flash\)/i);
      expect(processorNames.length).toBeGreaterThan(0);
      expect(processorNames[0]).toBeInTheDocument();
    });

    it('✅ should render processor region', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Region appears multiple times (AI processor and 3 infrastructure items), use getAllByText
      const regions = screen.getAllByText(/northamerica-northeast1 \(Montreal, Canada\)/i);
      expect(regions.length).toBeGreaterThan(0);
      
      // Find the region in the AI processor section (should be in a span)
      const processorRegion = regions.find(el => el.tagName === 'SPAN');
      expect(processorRegion).toBeInTheDocument();
    });

    it('✅ should render processor purpose', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text may appear multiple times, use getAllByText and verify at least one exists
      const purposes = screen.getAllByText(/SOAP note generation, clinical analysis, treatment plan suggestions/i);
      expect(purposes.length).toBeGreaterThan(0);
      expect(purposes[0]).toBeInTheDocument();
    });

    it('✅ should render processor compliance info', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text may appear multiple times, use getAllByText and verify at least one exists
      const compliances = screen.getAllByText(/PHIPA|PIPEDA/i);
      expect(compliances.length).toBeGreaterThan(0);
      expect(compliances[0]).toBeInTheDocument();
    });

    it('✅ should render link to Google Cloud SOC 2 report', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Use getAllByRole to find links, then verify at least one has the correct href
      const links = screen.getAllByRole('link', { name: /View Google Cloud SOC 2 report \(provider\)/i });
      expect(links.length).toBeGreaterThan(0);
      const validLink = links.find(link => link.getAttribute('href') === 'https://cloud.google.com/security/compliance/soc2');
      expect(validLink).toBeInTheDocument();
      expect(validLink).toHaveAttribute('target', '_blank');
      expect(validLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Data Infrastructure Section', () => {
    it('✅ should render Data Infrastructure heading', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Multiple H2 headings may contain this text, use getAllByRole and verify at least one exists
      const headings = screen.getAllByRole('heading', { level: 2, name: /Data Infrastructure/i });
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].tagName).toBe('H2');
    });

    it('✅ should render Firestore Database info', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text may appear multiple times, use getAllByText and verify at least one exists
      const firestores = screen.getAllByText(/Firestore Database/i);
      expect(firestores.length).toBeGreaterThan(0);
      
      // Verify region info exists in at least one element
      const firestoreWithRegion = firestores.find(el => 
        el.closest('div')?.textContent?.includes('northamerica-northeast1')
      );
      expect(firestoreWithRegion).toBeDefined();
    });

    it('✅ should render Firebase Storage info', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text may appear multiple times, use getAllByText and verify at least one exists
      const storages = screen.getAllByText(/Firebase Storage/i);
      expect(storages.length).toBeGreaterThan(0);
      expect(storages[0]).toBeInTheDocument();
    });

    it('✅ should render Firebase Authentication info', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text may appear multiple times, use getAllByText and verify at least one exists
      const auths = screen.getAllByText(/Firebase Authentication/i);
      expect(auths.length).toBeGreaterThan(0);
      expect(auths[0]).toBeInTheDocument();
    });
  });

  describe('Security Practices Section', () => {
    it('✅ should render Security Practices heading', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Multiple H2 headings may contain this text, use getAllByRole and verify at least one exists
      const headings = screen.getAllByRole('heading', { level: 2, name: /Security Practices/i });
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].tagName).toBe('H2');
    });

    it('✅ should render security practices section', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Verify security practices section exists
      const securityHeading = screen.getByText(/Security Practices/i);
      expect(securityHeading).toBeInTheDocument();
      
      // Verify audit logging is mentioned
      const auditText = screen.getByText(/audit logging/i);
      expect(auditText).toBeInTheDocument();
    });

    it('✅ should render PHIPA Compliance section', () => {
      renderWithRouter(<TransparencyReport />);
      
      // PHIPA Compliance appears as heading, use getAllByRole and verify at least one exists
      const phipas = screen.getAllByRole('heading', { level: 3, name: /PHIPA Compliance/i });
      expect(phipas.length).toBeGreaterThan(0);
      expect(phipas[0]).toBeInTheDocument();
    });

    it('✅ should render Security Approach section', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Security Approach appears as heading, verify it exists
      const approachHeadings = screen.getAllByText(/Security Approach/i);
      expect(approachHeadings.length).toBeGreaterThan(0);
      
      // Verify text about cloud providers and security controls
      const cloudProviderText = screen.getByText(/We rely on major cloud providers' security programs/i);
      expect(cloudProviderText).toBeInTheDocument();
    });

    it('✅ should render link to Legal Framework', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Use getAllByRole to find links, then verify at least one has the correct href
      const links = screen.getAllByRole('link', { name: /View Framework/i });
      expect(links.length).toBeGreaterThan(0);
      const validLink = links.find(link => link.getAttribute('href') === '/docs/north/LEGAL_DELIVERY_FRAMEWORK.md');
      expect(validLink).toBeInTheDocument();
      expect(validLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Competitive Advantage Section', () => {
    it('✅ should render "Why Transparency Matters" section', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Multiple H2 headings may contain this text, use getAllByRole and verify at least one exists
      const headings = screen.getAllByRole('heading', { level: 2, name: /Why Transparency Matters/i });
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].tagName).toBe('H2');
    });

    it('✅ should render CPO requirement bullet', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text may appear multiple times, use getAllByText and verify at least one exists
      const cpos = screen.getAllByText(/CPO Required/i);
      expect(cpos.length).toBeGreaterThan(0);
      expect(cpos[0]).toBeInTheDocument();
    });

    it('✅ should render PHIPA compliance bullet', () => {
      renderWithRouter(<TransparencyReport />);
      
      // PHIPA Compliant appears in heading and competitive advantage section, find the strong tag
      const phipaTexts = screen.getAllByText(/PHIPA Compliant/i);
      expect(phipaTexts.length).toBeGreaterThan(0);
      
      // Find the strong tag in competitive advantage section
      const phipaStrong = phipaTexts.find(el => el.tagName === 'STRONG');
      expect(phipaStrong).toBeInTheDocument();
    });

    it('✅ should render competitive advantage mention', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text may appear multiple times, use getAllByText and verify at least one exists
      const competitives = screen.getAllByText(/Jane.app and others don't provide this level of transparency/i);
      expect(competitives.length).toBeGreaterThan(0);
      expect(competitives[0]).toBeInTheDocument();
    });
  });

  describe('Footer Section', () => {
    it('✅ should render last updated date', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Text may appear multiple times, use getAllByText and verify at least one exists
      const lastUpdateds = screen.getAllByText(/Last updated: November 2025/i);
      expect(lastUpdateds.length).toBeGreaterThan(0);
      expect(lastUpdateds[0]).toBeInTheDocument();
    });

    it('✅ should render compliance contact email', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Email is in href attribute, not visible text. Find by link text and check href
      // Text may appear multiple times, use getAllByRole to find links, then verify at least one has the correct href
      const emailLinks = screen.getAllByRole('link', { name: /Contact our compliance team/i });
      expect(emailLinks.length).toBeGreaterThan(0);
      const validLink = emailLinks.find(link => link.getAttribute('href') === 'mailto:compliance@aiduxcare.com');
      expect(validLink).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('✅ should have proper heading hierarchy', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Multiple H1 headings may exist, use getAllByRole and verify at least one has the expected text
      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s.length).toBeGreaterThan(0);
      const h1WithText = h1s.find(h1 => /Supply Chain Transparency/i.test(h1.textContent || ''));
      expect(h1WithText).toBeDefined();
      
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('✅ should have proper link accessibility', () => {
      renderWithRouter(<TransparencyReport />);
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });
});

