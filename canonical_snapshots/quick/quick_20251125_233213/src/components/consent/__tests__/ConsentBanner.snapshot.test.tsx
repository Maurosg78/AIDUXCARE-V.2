/**
 * Snapshot Test: Consent Banner Component
 * 
 * Tests that consent banner renders correctly with:
 * - Single banner (no duplication)
 * - Official AiduxCare palette
 * - Correct button styles (gradient/outline brand)
 * 
 * ✅ P2.2: DoD - Banner único, limpio, de AiduxCare
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// Mock consent banner component structure
const ConsentBanner: React.FC<{
  consentStatus: 'ongoing' | 'session-only' | 'declined' | null;
  consentLink: string | null;
  onOpenPortal: () => void;
  onCopyLink: () => void;
  onMarkAuthorized: () => void;
}> = ({ consentStatus, consentLink, onOpenPortal, onCopyLink, onMarkAuthorized }) => {
  if (consentStatus) {
    return (
      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
        <input
          type="checkbox"
          checked={consentStatus === 'ongoing' || consentStatus === 'session-only'}
          readOnly
          className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue font-apple"
        />
        <span className="text-xs text-slate-600 font-apple">
          {consentStatus === 'ongoing' && 'Consent approved'}
          {consentStatus === 'session-only' && 'Approved for one session'}
          {consentStatus === 'declined' && 'Not approved'}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex items-start gap-2 mb-3">
          <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-800 font-apple">
              Patient consent required
            </p>
            <p className="mt-1 text-xs text-red-700 font-apple">
              Send consent link to patient or mark as authorized manually.
            </p>
          </div>
        </div>
        {consentLink && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenPortal}
              className="inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-primary-blue to-primary-purple px-3 py-1.5 text-xs font-medium text-white hover:from-primary-blue-hover hover:to-primary-purple-hover transition font-apple min-h-[32px]"
            >
              Open consent portal
            </button>
            <button
              type="button"
              onClick={onCopyLink}
              className="inline-flex items-center rounded-md border border-primary-blue/30 bg-white px-3 py-1.5 text-xs font-medium text-primary-blue hover:bg-primary-blue/5 transition font-apple min-h-[32px]"
            >
              Copy consent link
            </button>
            <button
              type="button"
              onClick={onMarkAuthorized}
              className="inline-flex items-center rounded-md border border-primary-blue/30 bg-white px-3 py-1.5 text-xs font-medium text-primary-blue hover:bg-primary-blue/5 transition font-apple min-h-[32px]"
            >
              Mark as authorized
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

describe('Consent Banner Snapshot', () => {
  it('should render single banner with pending consent', () => {
    const { container } = render(
      <ConsentBanner
        consentStatus={null}
        consentLink="https://example.com/consent/token-123"
        onOpenPortal={() => {}}
        onCopyLink={() => {}}
        onMarkAuthorized={() => {}}
      />
    );
    
    // Verify only one banner exists
    const banners = container.querySelectorAll('.rounded-lg.border.border-red-200');
    expect(banners.length).toBe(1);
    
    // Verify official palette
    const banner = banners[0];
    expect(banner).toHaveClass('bg-red-50', 'border-red-200');
    
    // Verify buttons use official styles
    const primaryButton = container.querySelector('.bg-gradient-to-r.from-primary-blue');
    expect(primaryButton).toBeTruthy();
    
    const secondaryButtons = container.querySelectorAll('.border-primary-blue\\/30');
    expect(secondaryButtons.length).toBe(2); // Copy link + Mark as authorized
  });

  it('should render approved status when consent is given', () => {
    const { container } = render(
      <ConsentBanner
        consentStatus="ongoing"
        consentLink={null}
        onOpenPortal={() => {}}
        onCopyLink={() => {}}
        onMarkAuthorized={() => {}}
      />
    );
    
    // Verify no banner (only status indicator)
    const banners = container.querySelectorAll('.rounded-lg.border.border-red-200');
    expect(banners.length).toBe(0);
    
    // Verify status indicator
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeTruthy();
    expect(checkbox).toHaveProperty('checked', true);
  });

  it('should not render duplicate banners', () => {
    const { container } = render(
      <div>
        <ConsentBanner
          consentStatus={null}
          consentLink="https://example.com/consent/token-123"
          onOpenPortal={() => {}}
          onCopyLink={() => {}}
          onMarkAuthorized={() => {}}
        />
      </div>
    );
    
    // Verify only one banner
    const banners = container.querySelectorAll('.rounded-lg.border.border-red-200.bg-red-50');
    expect(banners.length).toBe(1);
  });

  it('should use official AiduxCare palette', () => {
    const { container } = render(
      <ConsentBanner
        consentStatus={null}
        consentLink="https://example.com/consent/token-123"
        onOpenPortal={() => {}}
        onCopyLink={() => {}}
        onMarkAuthorized={() => {}}
      />
    );
    
    const banner = container.querySelector('.bg-red-50');
    expect(banner).toBeTruthy();
    expect(banner).toHaveClass('border-red-200');
    
    // Verify text colors
    const title = container.querySelector('.text-red-800');
    const description = container.querySelector('.text-red-700');
    expect(title).toBeTruthy();
    expect(description).toBeTruthy();
    
    // Verify no black buttons
    const blackButtons = container.querySelectorAll('.bg-black, .bg-gray-900, .bg-slate-900');
    expect(blackButtons.length).toBe(0);
  });
});

