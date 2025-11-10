import { test, expect } from '@playwright/test';

test('Basic authentication flow', async ({ page }) => {
  // Set mobile viewport to ensure sidebar toggle is visible
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Navigate to the home page
  await page.goto('http://localhost:3002');
  await page.waitForLoadState('networkidle');

  // Check if the landing page shows non-authenticated content
  await expect(page.locator('h1')).toContainText('ChatQora');

  // Open sidebar 
  await page.locator('button[aria-label="Toggle sidebar"]').click();
  
  // Click sign in
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

  // Navigate to home page to check branded experience
  await page.goto('http://localhost:3002');
  await page.waitForLoadState('networkidle');

  // Check for personalized content
  await expect(page.locator('h1')).toContainText('Welcome back, ChatQora Admin!');
  
  console.log('✅ Authentication test passed successfully!');
});