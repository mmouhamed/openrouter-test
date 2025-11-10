import { test, expect } from '@playwright/test';

test('Message formatting and display', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Navigate to chat page
  await page.goto('http://localhost:3003/chat');
  await page.waitForLoadState('networkidle');

  // Login first
  await page.locator('button[aria-label="Toggle sidebar"]').click();
  await page.locator('text=Sign In').click();
  await page.fill('input[id="username"]', 'admin');
  await page.fill('input[id="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Go back to chat
  await page.goto('http://localhost:3003/chat');
  await page.waitForLoadState('networkidle');

  // Send a test message with various formatting
  const testMessage = `Hello! Here's a test message with **bold text**, *italic text*, and \`inline code\`.

Here's a code block:
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

And here's a [link](https://example.com) for testing.`;

  await page.fill('textarea[placeholder="Message ChatQora..."]', testMessage);
  await page.press('textarea[placeholder="Message ChatQora..."]', 'Enter');

  // Wait for user message to appear
  await expect(page.locator('text=Hello! Here\'s a test message')).toBeVisible();

  // Check if the new message format is applied
  await expect(page.locator('.message-content')).toBeVisible();
  
  console.log('✅ Message formatting test passed!');
});

test('AI response formatting', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Navigate to chat page
  await page.goto('http://localhost:3003/chat');
  await page.waitForLoadState('networkidle');

  // Login first
  await page.locator('button[aria-label="Toggle sidebar"]').click();
  await page.locator('text=Sign In').click();
  await page.fill('input[id="username"]', 'admin');
  await page.fill('input[id="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Go back to chat
  await page.goto('http://localhost:3003/chat');
  await page.waitForLoadState('networkidle');

  // Send a simple message
  await page.fill('textarea[placeholder="Message ChatQora..."]', 'Write a simple function in Python');
  await page.press('textarea[placeholder="Message ChatQora..."]', 'Enter');

  // Wait for typing indicator
  await expect(page.locator('text=thinking...')).toBeVisible();

  // Wait for response (with extended timeout for API call)
  await expect(page.locator('.message-content')).toBeVisible({ timeout: 30000 });

  console.log('✅ AI response formatting test passed!');
});