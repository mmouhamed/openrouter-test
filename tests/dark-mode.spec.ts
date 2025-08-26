import { test, expect } from '@playwright/test';

test.describe('Dark Mode UI Visibility', () => {
  test.beforeEach(async ({ page }) => {
    // Set dark mode preference before navigating
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
  });

  test('should have proper dark mode background gradients', async ({ page }) => {
    // Check for dark mode background classes
    const mainContainer = page.locator('.dark\\:from-gray-900').first();
    await expect(mainContainer).toBeVisible();
    
    // Verify dark gradient is applied
    const darkGradient = page.locator('.dark\\:via-gray-800').first();
    await expect(darkGradient).toBeVisible();
  });

  test('should display header with dark mode styling', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check for dark mode header styling
    await expect(header).toHaveClass(/dark:bg-gray-900\/80/);
    await expect(header).toHaveClass(/dark:border-gray-700\/50/);
  });

  test('should show title with proper dark mode contrast', async ({ page }) => {
    const title = page.getByText('AI Chat Hub');
    await expect(title).toBeVisible();
    
    // Title should have dark mode gradient classes
    await expect(title).toHaveClass(/dark:from-white/);
    await expect(title).toHaveClass(/dark:to-gray-300/);
  });

  test('should have visible model selector in dark mode', async ({ page }) => {
    const modelSelect = page.locator('select');
    await expect(modelSelect).toBeVisible();
    
    // Check for dark mode styling
    await expect(modelSelect).toHaveClass(/dark:bg-gray-800\/90/);
    await expect(modelSelect).toHaveClass(/dark:text-gray-200/);
    await expect(modelSelect).toHaveClass(/dark:border-gray-600\/50/);
  });

  test('should show welcome message with good contrast in dark mode', async ({ page }) => {
    const welcomeTitle = page.getByText('Ready to Chat!');
    await expect(welcomeTitle).toBeVisible();
    await expect(welcomeTitle).toHaveClass(/dark:text-gray-200/);
    
    const welcomeText = page.getByText('Choose your AI model');
    await expect(welcomeText).toBeVisible();
    await expect(welcomeText).toHaveClass(/dark:text-gray-400/);
  });

  test('should have visible input field in dark mode', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message...');
    await expect(input).toBeVisible();
    
    // Check dark mode input styling
    await expect(input).toHaveClass(/dark:bg-gray-800\/90/);
    await expect(input).toHaveClass(/dark:text-gray-100/);
    await expect(input).toHaveClass(/dark:placeholder-gray-400/);
    await expect(input).toHaveClass(/dark:border-gray-600\/50/);
  });

  test('should have proper footer styling in dark mode', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    await expect(footer).toHaveClass(/dark:bg-gray-900\/80/);
    await expect(footer).toHaveClass(/dark:border-gray-700\/50/);
  });

  test('should show send button with proper styling in dark mode', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /Send/ });
    await expect(sendButton).toBeVisible();
    
    // Send button should maintain blue gradient in dark mode
    await expect(sendButton).toHaveClass(/from-blue-500/);
    await expect(sendButton).toHaveClass(/to-blue-600/);
  });

  test('should handle typing in dark mode input', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message...');
    await input.fill('Test dark mode message');
    
    await expect(input).toHaveValue('Test dark mode message');
    
    // Text should be visible with proper contrast
    await expect(input).toHaveClass(/dark:text-gray-100/);
  });

  test('should show clear button with good visibility in dark mode', async ({ page }) => {
    const clearButton = page.getByRole('button', { name: 'Clear' });
    await expect(clearButton).toBeVisible();
    
    // Clear button maintains same styling across modes
    await expect(clearButton).toHaveClass(/from-gray-500/);
  });

  test('should maintain accessibility in dark mode', async ({ page }) => {
    // Check for label visibility
    const modelLabel = page.getByText('AI Model').first();
    await expect(modelLabel).toBeVisible();
    await expect(modelLabel).toHaveClass(/dark:text-gray-300/);
    
    // Focus should work properly
    const input = page.getByPlaceholder('Type your message...');
    await input.focus();
    await expect(input).toBeFocused();
  });
});