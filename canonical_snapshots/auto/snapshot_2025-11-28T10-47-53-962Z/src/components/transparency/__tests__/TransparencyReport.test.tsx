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
      
      const backLink = screen.getByText(/← Back to Workflow/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/workflow');
    });
  });

  describe('Canadian Data Sovereignty Section', () => {
    it('✅ should render data sovereignty badge section', () => {
      renderWithRouter(<TransparencyReport />);
      
      const sovereigntyHeading = screen.getByText(/100% Canadian Data Sovereignty/i);
      expect(sovereigntyHeading).toBeInTheDocument();
      expect(sovereigntyHeading.tagName).toBe('H2');
    });

    it('✅ should render sovereignty description', () => {
      renderWithRouter(<TransparencyReport />);
      
      const description = screen.getByText(/All data processing, storage, and AI computation occurs within Canadian borders/i);
      expect(description).toBeInTheDocument();
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
      
      const heading = screen.getByText(/AI Processing Partners/i);
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('✅ should render Google Vertex AI processor name', () => {
      renderWithRouter(<TransparencyReport />);
      
      const processorName = screen.getByText(/Google Vertex AI \(Gemini 2.5 Flash\)/i);
      expect(processorName).toBeInTheDocument();
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
      
      const purpose = screen.getByText(/SOAP note generation, clinical analysis, treatment plan suggestions/i);
      expect(purpose).toBeInTheDocument();
    });

    it('✅ should render processor compliance info', () => {
      renderWithRouter(<TransparencyReport />);
      
      const compliance = screen.getByText(/PHIPA, PIPEDA, HIPAA BAA, SOC 2 Type II/i);
      expect(compliance).toBeInTheDocument();
    });

    it('✅ should render link to Google Cloud SOC 2', () => {
      renderWithRouter(<TransparencyReport />);
      
      const link = screen.getByText(/View Google Cloud SOC 2 Certification →/i);
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', 'https://cloud.google.com/security/compliance/soc2');
      expect(link.closest('a')).toHaveAttribute('target', '_blank');
      expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Data Infrastructure Section', () => {
    it('✅ should render Data Infrastructure heading', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Use getByRole to find the specific heading (text appears in multiple places)
      const heading = screen.getByRole('heading', { name: /Data Infrastructure/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('✅ should render Firestore Database info', () => {
      renderWithRouter(<TransparencyReport />);
      
      const firestore = screen.getByText(/Firestore Database/i);
      expect(firestore).toBeInTheDocument();
      
      const firestoreRegion = screen.getByText(/Firestore Database/i).closest('div')?.textContent;
      expect(firestoreRegion).toContain('northamerica-northeast1');
    });

    it('✅ should render Firebase Storage info', () => {
      renderWithRouter(<TransparencyReport />);
      
      const storage = screen.getByText(/Firebase Storage/i);
      expect(storage).toBeInTheDocument();
    });

    it('✅ should render Firebase Authentication info', () => {
      renderWithRouter(<TransparencyReport />);
      
      const auth = screen.getByText(/Firebase Authentication/i);
      expect(auth).toBeInTheDocument();
    });
  });

  describe('Security Certifications Section', () => {
    it('✅ should render Security & Compliance heading', () => {
      renderWithRouter(<TransparencyReport />);
      
      const heading = screen.getByText(/Security & Compliance Certifications/i);
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('✅ should render SOC 2 Type II certification', () => {
      renderWithRouter(<TransparencyReport />);
      
      // SOC 2 Type II appears in multiple places, use getAllByText and find the heading (h3)
      const soc2Texts = screen.getAllByText(/SOC 2 Type II/i);
      expect(soc2Texts.length).toBeGreaterThan(0);
      
      // Find the certification heading (should be h3)
      const soc2Heading = soc2Texts.find(el => el.tagName === 'H3');
      expect(soc2Heading).toBeInTheDocument();
      
      // CERTIFIED appears multiple times (SOC 2 and ISO 27001), use getAllByText
      const certifiedTexts = screen.getAllByText(/CERTIFIED/i);
      expect(certifiedTexts.length).toBeGreaterThan(0);
    });

    it('✅ should render ISO 27001 certification', () => {
      renderWithRouter(<TransparencyReport />);
      
      const iso = screen.getByText(/ISO 27001/i);
      expect(iso).toBeInTheDocument();
    });

    it('✅ should render HIPAA BAA certification', () => {
      renderWithRouter(<TransparencyReport />);
      
      // HIPAA BAA appears in compliance list and as heading, use getByRole to find heading
      const hipaa = screen.getByRole('heading', { name: /HIPAA BAA/i });
      expect(hipaa).toBeInTheDocument();
      
      const signed = screen.getByText(/SIGNED/i);
      expect(signed).toBeInTheDocument();
    });

    it('✅ should render PHIPA Compliant badge', () => {
      renderWithRouter(<TransparencyReport />);
      
      // PHIPA Compliant appears in multiple places, use getByRole to find the heading in certifications
      const phipa = screen.getByRole('heading', { name: /PHIPA Compliant/i });
      expect(phipa).toBeInTheDocument();
      
      const verified = screen.getByText(/VERIFIED/i);
      expect(verified).toBeInTheDocument();
    });

    it('✅ should render link to Legal Framework', () => {
      renderWithRouter(<TransparencyReport />);
      
      const link = screen.getByText(/View Framework →/i);
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/docs/north/LEGAL_DELIVERY_FRAMEWORK.md');
      expect(link.closest('a')).toHaveAttribute('target', '_blank');
    });
  });

  describe('Competitive Advantage Section', () => {
    it('✅ should render "Why Transparency Matters" section', () => {
      renderWithRouter(<TransparencyReport />);
      
      const heading = screen.getByText(/Why Transparency Matters/i);
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('✅ should render CPO requirement bullet', () => {
      renderWithRouter(<TransparencyReport />);
      
      const cpo = screen.getByText(/CPO Required/i);
      expect(cpo).toBeInTheDocument();
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
      
      const competitive = screen.getByText(/Jane.app and others don't provide this level of transparency/i);
      expect(competitive).toBeInTheDocument();
    });
  });

  describe('Footer Section', () => {
    it('✅ should render last updated date', () => {
      renderWithRouter(<TransparencyReport />);
      
      const lastUpdated = screen.getByText(/Last updated: November 2025/i);
      expect(lastUpdated).toBeInTheDocument();
    });

    it('✅ should render compliance contact email', () => {
      renderWithRouter(<TransparencyReport />);
      
      // Email is in href attribute, not visible text. Find by link text and check href
      const emailLink = screen.getByText(/Contact our compliance team/i);
      expect(emailLink).toBeInTheDocument();
      expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:compliance@aiduxcare.com');
    });
  });

  describe('Accessibility', () => {
    it('✅ should have proper heading hierarchy', () => {
      renderWithRouter(<TransparencyReport />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent(/Supply Chain Transparency/i);
      
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

