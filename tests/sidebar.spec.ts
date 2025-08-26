import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display sidebar on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Sidebar should be visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Check for sidebar header
    await expect(page.getByText('AI Chat Hub')).toBeVisible();
    await expect(page.getByText('Premium Experience')).toBeVisible();
  });

  test('should have working hamburger menu on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Sidebar should be hidden initially
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    
    // Click hamburger menu
    const menuButton = page.locator('button[aria-label="Toggle sidebar"]');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    
    // Sidebar should be visible
    await expect(sidebar).toHaveClass(/translate-x-0/);
    
    // Click backdrop to close (click at specific coordinates to avoid clicking on sidebar)
    await page.mouse.click(100, 100);
    
    // Wait for animation
    await page.waitForTimeout(300);
    
    // Sidebar should be hidden again
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('should show Chat as active page', async ({ page }) => {
    // Chat link should have active styling
    const chatLink = page.locator('a[href="/"]').filter({ hasText: 'Chat' });
    await expect(chatLink).toBeVisible();
    await expect(chatLink).toHaveClass(/from-blue-500\/20/);
  });

  test('should display coming soon features', async ({ page }) => {
    // Check for coming soon section
    await expect(page.getByText('Coming Soon')).toBeVisible();
    
    // Check for disabled features
    await expect(page.getByText('History')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('Profile')).toBeVisible();
    
    // Check that they are disabled (have opacity)
    const historyItem = page.locator('div').filter({ hasText: '📜' }).filter({ hasText: 'History' });
    await expect(historyItem).toHaveClass(/opacity-50/);
  });

  test('should show user info in sidebar footer', async ({ page }) => {
    const userSection = page.locator('div').filter({ hasText: 'User' }).filter({ hasText: 'Free Plan' }).last();
    await expect(userSection).toBeVisible();
  });

  test('sidebar should work in dark mode', async ({ page }) => {
    // Set dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Check for dark mode classes
    await expect(sidebar).toHaveClass(/dark:bg-gray-900\/80/);
    await expect(sidebar).toHaveClass(/dark:border-gray-700\/50/);
  });

  test('should maintain chat functionality with sidebar', async ({ page }) => {
    // Ensure chat interface is still accessible
    await expect(page.getByText('Chat Assistant')).toBeVisible();
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible();
    
    // Test that input still works
    const input = page.getByPlaceholder('Type your message...');
    await input.fill('Test message with sidebar');
    await expect(input).toHaveValue('Test message with sidebar');
  });

  test('sidebar should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Sidebar should be hidden on tablet (like mobile)
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    
    // Hamburger menu should be visible
    const menuButton = page.locator('button[aria-label="Toggle sidebar"]');
    await expect(menuButton).toBeVisible();
  });
});