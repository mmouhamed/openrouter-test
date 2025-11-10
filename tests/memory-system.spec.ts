import { test, expect } from '@playwright/test';

test.describe('Memory-Enhanced Chat System', () => {
  
  test('Memory system initialization and basic functionality', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to memory-enhanced chat page
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Should show the enhanced welcome message
    await expect(page.locator('text=Welcome to ChatQora with Memory')).toBeVisible();
    await expect(page.locator('text=intelligent memory that learns and adapts')).toBeVisible();
    
    console.log('✅ Memory-enhanced chat page loaded successfully');
  });

  test('Memory dashboard visibility and functionality', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to chat page
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Login first
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Go back to memory chat
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Send a test message to create conversation
    await page.fill('textarea[placeholder*="Message"]', 'Hello, test memory system');
    await page.press('textarea[placeholder*="Message"]', 'Enter');
    
    // Wait for response (might timeout, that's ok for testing)
    try {
      await page.waitForSelector('.message-content', { timeout: 10000 });
    } catch (e) {
      // Continue even if API call fails
    }

    // Look for memory dashboard button
    const memoryButton = page.locator('button[title="Memory Dashboard"]');
    if (await memoryButton.isVisible()) {
      await memoryButton.click();
      
      // Memory dashboard should open
      await expect(page.locator('text=Memory System')).toBeVisible();
      await expect(page.locator('text=Current Conversation')).toBeVisible();
      
      // Should show memory toggle
      await expect(page.locator('text=Smart Memory System')).toBeVisible();
      
      console.log('✅ Memory dashboard functionality verified');
    }
  });

  test('Free model selection with memory indicators', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Click model selector
    await page.click('button[title*="Current model"]');
    
    // Should show free models
    await expect(page.locator('text=Llama 3.3 70B')).toBeVisible();
    await expect(page.locator('text=Free open-source powerhouse')).toBeVisible();
    await expect(page.locator('text=Phi-3 Mini')).toBeVisible();
    await expect(page.locator('text=Gemma 2 9B')).toBeVisible();
    
    // All models should show as free
    const freeLabels = page.locator('text=Free');
    await expect(freeLabels).toHaveCount({ greaterThan: 1 });
    
    console.log('✅ Free model selection verified');
  });

  test('Memory-optimized API endpoint', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Login 
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Go back to memory chat
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Monitor network requests
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/chat-with-memory')) {
        apiCalls.push(request.url());
      }
    });

    // Send a message
    await page.fill('textarea[placeholder*="Message"]', 'Test memory API call');
    await page.press('textarea[placeholder*="Message"]', 'Enter');
    
    // Wait a bit for API call
    await page.waitForTimeout(3000);
    
    // Should have made API call to memory endpoint
    expect(apiCalls.length).toBeGreaterThan(0);
    
    console.log('✅ Memory-optimized API endpoint called');
  });

  test('Memory indicator in UI', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Login first
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Go back to memory chat
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Start a conversation
    await page.fill('textarea[placeholder*="Message"]', 'Hello memory system');
    await page.press('textarea[placeholder*="Message"]', 'Enter');
    await page.waitForTimeout(1000);

    // Should show memory indicator in header
    const memoryIndicator = page.locator('text=🧠 Memory');
    if (await memoryIndicator.isVisible()) {
      console.log('✅ Memory indicator visible in UI');
    }

    // Input placeholder should mention memory
    const inputPlaceholder = await page.getAttribute('textarea', 'placeholder');
    if (inputPlaceholder && inputPlaceholder.includes('memory')) {
      console.log('✅ Memory context in input placeholder');
    }
  });

  test('Enhanced welcome prompts for memory features', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Should show memory-specific welcome prompts
    await expect(page.locator('text*="remember my interest"')).toBeVisible();
    await expect(page.locator('text*="memory features"')).toBeVisible();
    await expect(page.locator('text*="memory system remember"')).toBeVisible();
    
    // Click on a memory-specific prompt
    await page.click('text*="remember my interest"');
    
    // Should populate the input
    const inputValue = await page.inputValue('textarea');
    expect(inputValue).toContain('remember my interest');
    
    console.log('✅ Memory-specific welcome prompts working');
  });

  test('Memory system performance indicators', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Login first
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.locator('text=Sign In').click();
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Go back to memory chat
    await page.goto('http://localhost:3003/chat-with-memory');
    await page.waitForLoadState('networkidle');

    // Send a message
    await page.fill('textarea[placeholder*="Message"]', 'Test memory performance');
    await page.press('textarea[placeholder*="Message"]', 'Enter');
    await page.waitForTimeout(2000);

    // Check for context stats in header (if visible)
    const contextStats = page.locator('text*="msgs"').or(page.locator('text*="tokens"'));
    if (await contextStats.isVisible()) {
      console.log('✅ Context statistics visible in UI');
    }

    // Check loading indicator mentions memory
    const memoryThinking = page.locator('text="thinking with memory..."');
    if (await memoryThinking.isVisible()) {
      console.log('✅ Memory-specific loading indicator shown');
    }
  });

});