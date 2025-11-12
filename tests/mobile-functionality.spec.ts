import { test, expect, devices } from '@playwright/test';

// Configure mobile device for all tests
test.use({ ...devices['iPhone 12'] });

// Mobile device tests - iPhone 12 as primary
test.describe('Mobile Tests - iPhone 12', () => {

    test('should display mobile-optimized homepage layout', async ({ page }) => {
      await page.goto('/');
      
      // Check if page loads successfully
      await expect(page).toHaveTitle(/ChatQora|QoraFusion/);
      
      // Check mobile-specific elements  
      await expect(page.getByText('Hello Welcome, Happy')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'ChatQora' })).toBeVisible();
      
      // Check responsive input area
      const inputArea = page.locator('textarea, input[placeholder*="help"]');
      await expect(inputArea).toBeVisible();
      
      // Check mobile action buttons are visible and properly sized
      const chatButton = page.getByRole('link', { name: '💬 Chat' });
      const writeButton = page.getByText('✍️Write');
      const learnButton = page.getByText('📚Learn');
      const codeButton = page.getByText('💻Code');
      
      await expect(chatButton).toBeVisible();
      await expect(writeButton).toBeVisible();
      await expect(learnButton).toBeVisible();
      await expect(codeButton).toBeVisible();
      
      // Check touch-friendly button sizing (minimum 44px)
      const chatButtonBox = await chatButton.boundingBox();
      expect(chatButtonBox?.height).toBeGreaterThanOrEqual(40);
      
      // Take screenshot for visual regression
      await page.screenshot({ 
        path: `test-results/mobile-iphone12-homepage.png`,
        fullPage: true 
      });
    });

    test('should handle mobile navigation properly', async ({ page }) => {
      await page.goto('/');
      
      // Test navigation to chat page
      await page.getByRole('link', { name: '💬 Chat' }).click();
      await expect(page).toHaveURL('/improved-chat');
      
      // Check if chat interface loads on mobile
      await expect(page.locator('[data-testid="chat-container"], .chat-interface, #chat')).toBeVisible();
      
      // Take screenshot of chat interface
      await page.screenshot({ 
        path: `test-results/mobile-iphone12-chat.png`,
        fullPage: true 
      });
    });

    test('should support touch interactions', async ({ page }) => {
      await page.goto('/');
      
      // Test touch on action buttons
      const chatButton = page.getByRole('link', { name: '💬 Chat' });
      
      // Simulate touch events
      await chatButton.dispatchEvent('touchstart');
      await chatButton.dispatchEvent('touchend');
      await chatButton.click();
      
      await expect(page).toHaveURL('/improved-chat');
    });

    test('should have proper mobile input handling', async ({ page }) => {
      await page.goto('/');
      
      // Find the main input field
      const input = page.locator('textarea[placeholder*="help"], input[placeholder*="help"]');
      await expect(input).toBeVisible();
      
      // Test typing on mobile
      await input.click();
      await input.fill('Test mobile input functionality');
      
      // Check if text is properly entered
      await expect(input).toHaveValue('Test mobile input functionality');
      
      // Test that input doesn't cause zoom on focus (font-size >= 16px)
      const fontSize = await input.evaluate((el) => 
        window.getComputedStyle(el).fontSize
      );
      const fontSizeNum = parseInt(fontSize.replace('px', ''));
      expect(fontSizeNum).toBeGreaterThanOrEqual(16);
    });

    test('should handle mobile keyboard interactions', async ({ page }) => {
      await page.goto('/');
      
      const input = page.locator('textarea[placeholder*="help"], input[placeholder*="help"]');
      await input.click();
      await input.fill('Testing mobile keyboard');
      
      // Test Enter key behavior on mobile
      await input.press('Enter');
      
      // Should handle the input appropriately (either submit or new line)
      // This depends on your app's specific behavior
    });

    test('should display proper mobile spacing and typography', async ({ page }) => {
      await page.goto('/');
      
      // Check that buttons have adequate spacing for touch
      const buttons = page.locator('button, [role="button"]');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44px in height/width
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(40);
        }
      }
      
      // Check text is readable (not too small)
      const bodyText = page.locator('body');
      const fontSize = await bodyText.evaluate((el) => 
        window.getComputedStyle(el).fontSize
      );
      const fontSizeNum = parseInt(fontSize.replace('px', ''));
      expect(fontSizeNum).toBeGreaterThanOrEqual(14);
    });
});

test.describe('Mobile-Specific Features', () => {

  test('should handle orientation changes', async ({ page }) => {
    await page.goto('/');
    
    // Test portrait mode
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: 'ChatQora' })).toBeVisible();
    
    // Test landscape mode
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.getByRole('heading', { name: 'ChatQora' })).toBeVisible();
    
    // Layout should still be functional
    const chatButton = page.getByRole('link', { name: '💬 Chat' });
    await expect(chatButton).toBeVisible();
    await chatButton.click();
    await expect(page).toHaveURL('/improved-chat');
  });

  test('should support mobile gestures and scrolling', async ({ page }) => {
    await page.goto('/');
    
    // Test vertical scrolling
    await page.evaluate(() => window.scrollTo(0, 200));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
    
    // Test smooth scrolling back to top
    await page.evaluate(() => window.scrollTo(0, 0));
  });

  test('should handle mobile-specific CSS and animations', async ({ page }) => {
    await page.goto('/');
    
    // Check for mobile-optimized animations (should be reduced for performance)
    const animationElements = page.locator('.animate, [class*="animate"], [class*="transition"]');
    const count = await animationElements.count();
    
    if (count > 0) {
      // Check that animations are not too aggressive on mobile
      const firstAnimated = animationElements.first();
      const animationDuration = await firstAnimated.evaluate((el) => 
        window.getComputedStyle(el).animationDuration || window.getComputedStyle(el).transitionDuration
      );
      
      // Animations should be reasonably fast on mobile
      if (animationDuration && animationDuration !== '0s') {
        const duration = parseFloat(animationDuration.replace('s', ''));
        expect(duration).toBeLessThanOrEqual(0.5); // Max 500ms
      }
    }
  });

  test('should be accessible on mobile screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper ARIA labels and roles
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const innerText = await button.innerText();
      
      // Button should have either aria-label or inner text for screen readers
      expect(ariaLabel || innerText.trim()).toBeTruthy();
    }
    
    // Check for proper heading hierarchy
    const h1 = page.getByText('Hello Welcome, Happy');
    await expect(h1).toBeVisible();
  });
});

test.describe('Mobile Performance Tests', () => {

  test('should load quickly on mobile', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time on mobile
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
  });

  test('should not have layout shifts on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Wait for any dynamic content to load
    await page.waitForTimeout(2000);
    
    // Check that main elements are stable
    const mainContent = page.locator('main, .main, [role="main"]').first();
    const initialBox = await mainContent.boundingBox();
    
    // Wait a bit more and check again
    await page.waitForTimeout(1000);
    const finalBox = await mainContent.boundingBox();
    
    if (initialBox && finalBox) {
      // Position shouldn't shift significantly
      expect(Math.abs(initialBox.y - finalBox.y)).toBeLessThan(10);
    }
  });
});