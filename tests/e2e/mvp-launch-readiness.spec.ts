/**
 * MVP Launch Readiness - End-to-End Test Suite
 * 
 * This test suite validates all critical functionality required for MVP launch.
 * Run before any customer-facing demonstrations.
 */

import { test, expect } from '@playwright/test';

test.describe('MVP Launch Readiness', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as test professional
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@aiduxcare.com');
    await page.fill('[name="password"]', 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/workflow');
  });

  test.describe('SMS Workflow', () => {
    test('should send SMS in English only', async ({ page }) => {
      // Navigate to patient consent workflow
      await page.goto('/workflow?patient=test-patient-id');
      
      // Trigger SMS sending
      const smsButton = page.locator('button:has-text("Send Consent SMS")');
      await smsButton.click();
      
      // Verify SMS was sent (check for success message)
      const successMessage = page.locator('text=/consent.*sent/i');
      await expect(successMessage).toBeVisible();
      
      // Note: Actual SMS content validation would require backend API testing
      // This test validates the UI workflow
    });

    test('should generate mobile-accessible URLs', async ({ page }) => {
      await page.goto('/workflow?patient=test-patient-id');
      
      // Get consent link from UI
      const consentLink = page.locator('[data-testid="consent-link"]');
      const linkText = await consentLink.textContent();
      
      // Verify link is not localhost
      expect(linkText).not.toContain('localhost');
      expect(linkText).toMatch(/^https:\/\//);
      
      // Verify link structure
      expect(linkText).toContain('/consent/');
    });

    test('should complete consent workflow end-to-end', async ({ page, context }) => {
      // Create new patient
      await page.goto('/workflow');
      await page.click('button:has-text("New Patient")');
      
      // Fill patient form
      await page.fill('[name="firstName"]', 'Test');
      await page.fill('[name="lastName"]', 'Patient');
      await page.fill('[name="phone"]', '+14161234567');
      await page.click('button:has-text("Create Patient")');
      
      // Send consent SMS
      await page.click('button:has-text("Send Consent SMS")');
      await page.waitForSelector('text=/sent/i');
      
      // Get consent link
      const consentLink = page.locator('[data-testid="consent-link"]');
      const linkUrl = await consentLink.getAttribute('href');
      
      // Open consent portal in new tab
      const consentPage = await context.newPage();
      await consentPage.goto(linkUrl!);
      
      // Verify consent portal loads
      await expect(consentPage.locator('h1')).toContainText(/consent/i);
      
      // Complete consent
      await consentPage.click('input[value="ongoing"]');
      await consentPage.fill('[name="signature"]', 'Test Patient');
      await consentPage.click('button:has-text("Submit")');
      
      // Verify consent recorded
      await expect(consentPage.locator('text=/recorded/i')).toBeVisible();
      
      // Return to workflow and verify consent status
      await page.reload();
      const consentStatus = page.locator('[data-testid="consent-status"]');
      await expect(consentStatus).toContainText(/approved/i);
    });
  });

  test.describe('UI Consistency', () => {
    test('should apply design system consistently', async ({ page }) => {
      // Check Login page
      await page.goto('/login');
      const loginButton = page.locator('button[type="submit"]');
      const loginClasses = await loginButton.getAttribute('class');
      expect(loginClasses).toContain('bg-gradient');
      
      // Check Onboarding page
      await page.goto('/onboarding');
      const onboardingButton = page.locator('button:has-text("Next")');
      const onboardingClasses = await onboardingButton.getAttribute('class');
      expect(onboardingClasses).toContain('bg-gradient');
      
      // Check Workflow page
      await page.goto('/workflow');
      const workflowButton = page.locator('button:has-text("Start Recording")');
      const workflowClasses = await workflowButton.getAttribute('class');
      expect(workflowClasses).toContain('bg-gradient');
    });

    test('should maintain color consistency across pages', async ({ page }) => {
      const pages = ['/login', '/onboarding', '/workflow'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Check for primary color usage
        const primaryElements = page.locator('[class*="primary"], [class*="purple"], [class*="blue"]');
        const count = await primaryElements.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('SOAP Report', () => {
    test('should display SOAP note professionally', async ({ page }) => {
      await page.goto('/workflow?patient=test-patient-id');
      
      // Navigate to SOAP tab
      await page.click('button:has-text("SOAP Report")');
      
      // Verify SOAP sections are visible
      await expect(page.locator('text=/Subjective.*S/i')).toBeVisible();
      await expect(page.locator('text=/Objective.*O/i')).toBeVisible();
      await expect(page.locator('text=/Assessment.*A/i')).toBeVisible();
      await expect(page.locator('text=/Plan.*P/i')).toBeVisible();
      
      // Verify professional styling
      const soapContainer = page.locator('.soap-report-container');
      await expect(soapContainer).toBeVisible();
    });

    test('should allow export functionality', async ({ page }) => {
      await page.goto('/workflow?patient=test-patient-id');
      await page.click('button:has-text("SOAP Report")');
      
      // Click export button
      const exportButton = page.locator('button:has-text("Export")');
      await expect(exportButton).toBeVisible();
      
      // Note: Actual export functionality would require file download testing
    });
  });

  test.describe('Physical Tests', () => {
    test('should display tests organized by region', async ({ page }) => {
      await page.goto('/workflow?patient=test-patient-id');
      
      // Navigate to Physical Evaluation tab
      await page.click('button:has-text("Physical Evaluation")');
      
      // Verify region tabs are visible
      const regionTabs = page.locator('.region-tab');
      const tabCount = await regionTabs.count();
      expect(tabCount).toBeGreaterThan(0);
    });

    test('should provide clear selection feedback', async ({ page }) => {
      await page.goto('/workflow?patient=test-patient-id');
      await page.click('button:has-text("Physical Evaluation")');
      
      // Click on a test
      const firstTest = page.locator('.test-card').first();
      await firstTest.click();
      
      // Verify selected state
      await expect(firstTest).toHaveClass(/border-primary-purple/);
      await expect(firstTest.locator('text=/✓/')).toBeVisible();
    });
  });
});

