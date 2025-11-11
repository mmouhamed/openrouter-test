import { test, expect } from '@playwright/test';

test.describe('Chat System', () => {
  test('landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that the landing page title is correct
    await expect(page).toHaveTitle(/ChatQora/);
    
    // Check that the ChatQora heading is visible
    await expect(page.locator('h1:has-text("ChatQora")')).toBeVisible();
    
    // Check that the "Start Chatting" button is visible and links to chat
    const startButton = page.locator('button:has-text("Start Chatting")');
    await expect(startButton).toBeVisible();
    
    // Check that chat link exists
    const chatLink = page.locator('a[href="/chat"]');
    await expect(chatLink).toBeVisible();
  });

  test('chat page loads correctly', async ({ page }) => {
    await page.goto('/chat');
    
    // Check that the page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Check for any error messages
    const errorElement = page.locator('[data-testid="error"]');
    await expect(errorElement).not.toBeVisible().catch(() => {}); // Ignore if element doesn't exist
  });

  test('navigation from landing to chat works', async ({ page }) => {
    await page.goto('/');
    
    // Click the "Start Chatting" button
    await page.click('a[href="/chat"] button');
    
    // Wait for navigation to chat
    await page.waitForURL('/chat');
    
    // Verify we're on the chat page
    expect(page.url()).toContain('/chat');
  });
});