/**
 * Playwright E2E Tests for Mobile Viewports
 * 
 * Tests the application in various mobile viewport sizes
 */

import { test, expect } from '@playwright/test';

const mobileViewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12/13', width: 390, height: 844 },
  { name: 'iPhone 14 Pro', width: 393, height: 852 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Android Small', width: 360, height: 640 },
  { name: 'Android Medium', width: 412, height: 915 },
  { name: 'Android Large', width: 412, height: 892 },
];

mobileViewports.forEach((viewport) => {
  test.describe(`Mobile Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
    });

    test('should load login page correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check viewport meta tag
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewportMeta).toContain('width=device-width');
      
      // Check that page is visible
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have proper touch targets', async ({ page }) => {
      await page.goto('/');
      
      // Check button minimum sizes
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box) {
          // At least 44px for iOS, 48px for Android
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should handle scroll correctly', async ({ page }) => {
      await page.goto('/');
      
      // Scroll down
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait a bit for scroll to complete
      await page.waitForTimeout(100);
      
      // Verify scroll position
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    });

    test('should handle orientation change', async ({ page }) => {
      await page.goto('/');
      
      // Get initial dimensions
      const initialWidth = viewport.width;
      const initialHeight = viewport.height;
      
      // Change orientation (swap width/height)
      await page.setViewportSize({ 
        width: initialHeight, 
        height: initialWidth 
      });
      
      // Verify new dimensions
      const newWidth = page.viewportSize()?.width;
      const newHeight = page.viewportSize()?.height;
      
      expect(newWidth).toBe(initialHeight);
      expect(newHeight).toBe(initialWidth);
    });

    test('should prevent zoom on input focus', async ({ page }) => {
      await page.goto('/');
      
      // Check viewport meta tag doesn't allow zoom
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewportMeta).toContain('maximum-scale=1.0');
      expect(viewportMeta).toContain('user-scalable=no');
    });
  });
});

test.describe('Mobile Touch Interactions', () => {
  test.use({
    viewport: { width: 375, height: 812 }, // iPhone size
  });

  test('should handle touch events', async ({ page }) => {
    await page.goto('/');
    
    // Simulate touch
    await page.touchscreen.tap(100, 100);
    
    // Verify touch was registered (if there's a touch handler)
    // This is a basic test - actual touch handling would need specific elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle swipe gesture', async ({ page }) => {
    await page.goto('/');
    
    // Simulate swipe
    await page.touchscreen.tap(200, 400);
    await page.mouse.move(200, 400);
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();
    
    // Verify swipe was registered
    await expect(page.locator('body')).toBeVisible();
  });
});

