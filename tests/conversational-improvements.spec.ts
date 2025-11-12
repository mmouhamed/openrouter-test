import { test, expect, Page } from '@playwright/test';

test.describe('Conversational AI Improvements', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('http://localhost:3004');
    
    // Wait for the chat interface to be ready
    await expect(page.getByPlaceholder('Ask anything... AI will route to the best models.')).toBeVisible();
    await page.waitForTimeout(2000); // Give time for context manager to initialize
  });

  test('should persist conversation across page refresh', async () => {
    // Send a message to establish context
    await page.fill('[placeholder="Ask anything... AI will route to the best models."]', 'Hello, my name is John');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await expect(page.locator('.animate-fade-in').last()).toBeVisible({ timeout: 15000 });
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check that conversation was restored from localStorage
    const messages = page.locator('[class*="mb-6"]');
    await expect(messages).toHaveCountGreaterThan(0);
    
    console.log('✅ Conversation persistence test passed');
  });

  test('should use contextual responses for simple interactions', async () => {
    // First establish some context
    await page.fill('[placeholder="Ask anything... AI will route to the best models."]', 'Can you explain machine learning?');
    await page.click('button[type="submit"]');
    
    // Wait for AI response
    await expect(page.locator('.animate-fade-in').last()).toBeVisible({ timeout: 15000 });
    
    // Now test simple acknowledgments
    const testCases = [
      { input: 'thanks', expectedPattern: /welcome|help/i },
      { input: 'yes', expectedPattern: /great|specific|elaborate/i },
      { input: 'got it', expectedPattern: /welcome|else/i }
    ];

    for (const testCase of testCases) {
      await page.fill('[placeholder="Ask anything... AI will route to the best models."]', testCase.input);
      
      // Listen for console logs to check smart routing
      const responsePromise = page.waitForEvent('console', msg => 
        msg.text().includes('Smart routing decision') || msg.text().includes('Used contextual response')
      );
      
      await page.click('button[type="submit"]');
      
      // Check if contextual response was used (should be fast)
      const startTime = Date.now();
      await expect(page.locator('.animate-fade-in').last()).toBeVisible({ timeout: 3000 });
      const responseTime = Date.now() - startTime;
      
      // Contextual responses should be much faster than AI model calls
      expect(responseTime).toBeLessThan(1000);
      
      // Verify the response content matches expected pattern
      const lastMessage = page.locator('.animate-fade-in').last();
      const responseText = await lastMessage.textContent();
      expect(responseText).toMatch(testCase.expectedPattern);
      
      console.log(`✅ Contextual response test passed for "${testCase.input}": ${responseText?.substring(0, 50)}...`);
      await page.waitForTimeout(1000);
    }
  });

  test('should show improved processing indicators', async () => {
    // Send a complex query that should trigger full model processing
    await page.fill('[placeholder="Ask anything... AI will route to the best models."]', 'Compare different machine learning algorithms and their use cases');
    await page.click('button[type="submit"]');
    
    // Check for improved loading indicators
    await expect(page.locator('[class*="animate-pulse-glow"]')).toBeVisible();
    
    // Should show dynamic processing messages
    const processingMessage = page.locator('text=/Processing|Analyzing|Generating/i');
    await expect(processingMessage).toBeVisible();
    
    // Should show progress bar
    const progressBar = page.locator('[class*="bg-gradient-to-r from-purple-500"]');
    await expect(progressBar).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('.animate-fade-in').last()).toBeVisible({ timeout: 30000 });
    
    console.log('✅ Processing indicators test passed');
  });

  test('should maintain conversation context and flow', async () => {
    const conversationFlow = [
      {
        input: 'What is React?',
        expectedInResponse: /react|library|component/i
      },
      {
        input: 'How does it compare to Vue?',
        expectedInResponse: /vue|react|compar/i
      },
      {
        input: 'Which one should I learn first?',
        expectedInResponse: /learn|first|beginner|recommend/i
      }
    ];

    for (let i = 0; i < conversationFlow.length; i++) {
      const step = conversationFlow[i];
      
      await page.fill('[placeholder="Ask anything... AI will route to the best models."]', step.input);
      await page.click('button[type="submit"]');
      
      // Wait for response
      await expect(page.locator('.animate-fade-in').last()).toBeVisible({ timeout: 20000 });
      
      // Verify context awareness in later messages
      if (i > 0) {
        const responseText = await page.locator('.animate-fade-in').last().textContent();
        
        // Later responses should reference earlier context
        if (i === 1) {
          expect(responseText?.toLowerCase()).toMatch(/react|previous/);
        }
        if (i === 2) {
          expect(responseText?.toLowerCase()).toMatch(/vue|react|mentioned|discussed/);
        }
        
        console.log(`✅ Context awareness verified for message ${i + 1}`);
      }
      
      await page.waitForTimeout(2000);
    }
    
    console.log('✅ Conversation context flow test passed');
  });

  test('should show enhanced smart recommendations', async () => {
    // Send a message to get recommendations
    await page.fill('[placeholder="Ask anything... AI will route to the best models."]', 'Explain artificial intelligence');
    await page.click('button[type="submit"]');
    
    // Wait for response and recommendations
    await expect(page.locator('.animate-fade-in').last()).toBeVisible({ timeout: 20000 });
    
    // Should show smart recommendations section
    await expect(page.locator('text=/AI-generated suggestions/i')).toBeVisible();
    
    // Should show recommendation count
    await expect(page.locator('text=/AI-generated suggestions/i')).toBeVisible();
    
    // Click to expand recommendations
    await page.click('[title="View smart recommendations"]');
    
    // Should show individual recommendations with reasoning
    const recommendations = page.locator('[class*="group/item"]');
    await expect(recommendations).toHaveCountGreaterThan(0);
    
    console.log('✅ Smart recommendations test passed');
  });

  test('should handle localStorage and session management', async () => {
    // Clear any existing storage first
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Send some messages
    const messages = [
      'Hello, I want to learn programming',
      'What language should I start with?',
      'Thank you for the advice'
    ];
    
    for (const message of messages) {
      await page.fill('[placeholder="Ask anything... AI will route to the best models."]', message);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000); // Wait for response
    }
    
    // Check localStorage has been populated
    const storageData = await page.evaluate(() => {
      const stored = localStorage.getItem('chat-chat-session');
      return stored ? JSON.parse(stored) : null;
    });
    
    expect(storageData).toBeTruthy();
    expect(storageData.messages).toBeTruthy();
    expect(storageData.messages.length).toBeGreaterThan(0);
    
    console.log(`✅ localStorage test passed - ${storageData.messages.length} messages stored`);
    
    // Test clear functionality
    await page.click('[title="Clear conversation"]');
    await page.waitForTimeout(1000);
    
    // Should clear localStorage
    const clearedStorage = await page.evaluate(() => {
      return localStorage.getItem('chat-chat-session');
    });
    
    expect(clearedStorage).toBeNull();
    
    console.log('✅ Clear conversation test passed');
  });
});