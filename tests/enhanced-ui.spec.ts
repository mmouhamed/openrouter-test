import { test, expect } from '@playwright/test';

test.describe('Enhanced 2025 AI Chat UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display modern header with gradient background', async ({ page }) => {
    // Check for modern header elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('AI Chat Hub')).toBeVisible();
    
    // Verify gradient background is applied to the visible container
    const gradientContainer = page.locator('.bg-gradient-to-br').first();
    await expect(gradientContainer).toBeVisible();
  });

  test('should show glassmorphism effects on header', async ({ page }) => {
    // Check for backdrop blur classes (glassmorphism)
    const header = page.locator('header');
    await expect(header).toHaveClass(/backdrop-blur-md/);
    await expect(header).toHaveClass(/bg-white\/70/);
  });

  test('should display model selector with icons', async ({ page }) => {
    const modelSelect = page.locator('select');
    await expect(modelSelect).toBeVisible();
    
    // Check if options contain emojis/icons
    const options = page.locator('option');
    const firstOption = options.first();
    const optionText = await firstOption.textContent();
    expect(optionText).toMatch(/[\u{1F300}-\u{1F6FF}]/u); // Unicode emoji range
  });

  test('should show welcome message with modern styling', async ({ page }) => {
    // Check for empty state
    await expect(page.getByText('Ready to Chat!')).toBeVisible();
    await expect(page.getByText('Choose your AI model')).toBeVisible();
    
    // Verify gradient circle icon
    const gradientIcon = page.locator('div').filter({ hasText: '💬' }).first();
    await expect(gradientIcon).toBeVisible();
  });

  test('should have modern input field with glassmorphism', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message...');
    await expect(input).toBeVisible();
    await expect(input).toHaveClass(/bg-white\/80/);
    await expect(input).toHaveClass(/backdrop-blur-sm/);
    await expect(input).toHaveClass(/rounded-xl/);
  });

  test('should have modern send button with gradient', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /Send/ });
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toHaveClass(/bg-gradient-to-r/);
    await expect(sendButton).toHaveClass(/from-blue-500/);
    await expect(sendButton).toHaveClass(/to-blue-600/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if layout adapts
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    const input = page.getByPlaceholder('Type your message...');
    await expect(input).toBeVisible();
    
    const sendButton = page.getByRole('button', { name: /Send/ });
    await expect(sendButton).toBeVisible();
  });

  test('should handle focus states properly', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message...');
    await input.focus();
    
    // Verify focus ring classes
    await expect(input).toHaveClass(/focus:ring-2/);
    await expect(input).toHaveClass(/focus:ring-blue-500\/50/);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for label text (first occurrence)
    await expect(page.getByText('AI Model').first()).toBeVisible();
    
    // Check for proper button roles
    const sendButton = page.getByRole('button', { name: /Send/ });
    await expect(sendButton).toBeVisible();
    
    const clearButton = page.getByRole('button', { name: 'Clear' });
    await expect(clearButton).toBeVisible();
  });

  test('should apply proper hover effects', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /Send/ });
    
    // Hover over send button
    await sendButton.hover();
    
    // Verify hover classes exist (they would be applied via CSS)
    await expect(sendButton).toHaveClass(/hover:from-blue-600/);
    await expect(sendButton).toHaveClass(/hover:to-blue-700/);
  });

  test('should show typing input correctly', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message...');
    await input.fill('Hello AI!');
    
    await expect(input).toHaveValue('Hello AI!');
    
    // Send button should be enabled with text
    const sendButton = page.getByRole('button', { name: /Send/ });
    await expect(sendButton).toBeEnabled();
  });

  test('should handle clear button functionality', async ({ page }) => {
    // Initially no messages, so this tests the button exists and is clickable
    const clearButton = page.getByRole('button', { name: 'Clear' });
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toBeEnabled();
    
    // Click should work without errors
    await clearButton.click();
  });
});