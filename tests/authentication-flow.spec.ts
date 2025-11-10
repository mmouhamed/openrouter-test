import { test, expect } from '@playwright/test';

test.describe('Authentication and Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport to ensure sidebar toggle is visible
    await page.setViewportSize({ width: 375, height: 667 });
    // Navigate to the home page
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
  });

  test('should show sign-in button when user is not authenticated', async ({ page }) => {
    // Check if the landing page shows non-authenticated content
    await expect(page.locator('h1')).toContainText('ChatQora');
    await expect(page.locator('text=Your AI conversation companion')).toBeVisible();
    
    // Check for sign-in button in sidebar
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should allow user to sign in with valid credentials', async ({ page }) => {
    // Open sidebar and click sign in
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();

    // Login form should be visible
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    
    // Fill in the demo credentials
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForTimeout(2000);
    
    // Check if user is logged in by looking for user name in sidebar
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await expect(page.locator('text=ChatQora Admin')).toBeVisible();
    await expect(page.locator('text=Premium User')).toBeVisible();
  });

  test('should show branded experience for authenticated users', async ({ page }) => {
    // Login first
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to home page
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Check for personalized content
    await expect(page.locator('h1')).toContainText('Welcome back, ChatQora Admin!');
    await expect(page.locator('text=Ready for your next AI conversation?')).toBeVisible();
    await expect(page.locator('text=Continue your AI conversations with full chat history')).toBeVisible();
    await expect(page.locator('text=Continue Chatting')).toBeVisible();

    // Check for premium features
    await expect(page.locator('text=Chat History')).toBeVisible();
    await expect(page.locator('text=Memory & Context')).toBeVisible();
    await expect(page.locator('text=Premium Experience')).toBeVisible();
  });

  test('should show chat history functionality for authenticated users', async ({ page }) => {
    // Login first
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to chat page
    await page.goto('http://localhost:3002/chat');
    await page.waitForLoadState('networkidle');

    // Check for personalized header
    await expect(page.locator('text=Welcome, ChatQora Admin')).toBeVisible();
    
    // Check for history button
    await expect(page.locator('text=History')).toBeVisible();
    
    // Click history button to open history sidebar
    await page.click('text=History');
    await expect(page.locator('text=Chat History')).toBeVisible();
    await expect(page.locator('text=New Conversation')).toBeVisible();
  });

  test('should create and save conversations for authenticated users', async ({ page }) => {
    // Login first
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to chat page
    await page.goto('http://localhost:3002/chat');
    await page.waitForLoadState('networkidle');

    // Send a test message
    const testMessage = 'Hello, this is a test message for conversation history';
    await page.fill('textarea[placeholder="Message ChatQora..."]', testMessage);
    await page.press('textarea[placeholder="Message ChatQora..."]', 'Enter');

    // Wait for user message to appear
    await expect(page.locator(`text=${testMessage}`)).toBeVisible();

    // Open history to see if conversation was saved
    await page.click('text=History');
    await page.waitForTimeout(1000);
    
    // Check if conversation appears in history (title should be auto-generated from message)
    const conversationTitle = testMessage.slice(0, 50) + (testMessage.length > 50 ? '...' : '');
    await expect(page.locator(`text=${conversationTitle}`).first()).toBeVisible();
  });

  test('should allow user to sign out', async ({ page }) => {
    // Login first
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Click logout button (door emoji)
    await page.locator('button[title="Sign Out"]').click();
    await page.waitForTimeout(1000);

    // Should be back to non-authenticated state
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await expect(page.locator('text=Sign In')).toBeVisible();
    
    // Home page should show non-authenticated content
    await page.goto('http://localhost:3002');
    await expect(page.locator('h1')).toContainText('ChatQora');
    await expect(page.locator('text=Your AI conversation companion')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    // Open sidebar and click sign in
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();

    // Try with invalid credentials
    await page.fill('input[id="username"]', 'invalid');
    await page.fill('input[id="password"]', 'invalid');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should persist login across page refreshes', async ({ page }) => {
    // Login first
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be logged in
    await expect(page.locator('h1')).toContainText('Welcome back, ChatQora Admin!');
    
    // Check sidebar shows logged in user
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await expect(page.locator('text=ChatQora Admin')).toBeVisible();
  });
});