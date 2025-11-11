// Test script to evaluate all free Llama and Qwen models for reliability
// This will help identify which models are most reliable for production use

const FREE_MODELS = [
  // Qwen Models
  'qwen/qwen3-coder:free',
  'deepseek/deepseek-r1-052b-qwen3-8b:free', 
  'qwen/qwen3-4b:free',
  'qwen/qwen3-30b-a3b:free',
  'qwen/qwen3-14b:free',
  'qwen/qwen3-235b-a22b:free',
  'qwen/qwen2.5-vl-32b-instruct:free',
  
  // Llama Models
  'meta-llama/llama-3.3-8b-instruct:free',
  'meta-llama/llama-4-maverick:free',
  'meta-llama/llama-4-sneak:free',
  'meta-llama/llama-3.1-titan-large-instruct:free',
  'meta-llama/llama-3.2-7b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'nvidia/nemotron/nemotron-3-llama-3-70b-instruct:free',
  'meta-llama/llama-3.2-1b-instruct:free'
];

const TEST_MESSAGE = "Hello! Can you respond with a brief test message?";

// Track results for each model
const results = {
  successful: [],
  rateLimited: [],
  notFound: [],
  errors: [],
  timeouts: []
};

async function testModel(modelId) {
  const startTime = Date.now();
  
  try {
    console.log(`Testing ${modelId}...`);
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
      body: JSON.stringify({
        message: TEST_MESSAGE,
        model: modelId,
        conversationContext: []
      })
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      
      if (response.status === 404) {
        console.log(`❌ ${modelId}: Not Found (404)`);
        results.notFound.push({ model: modelId, error: errorData });
      } else if (response.status === 429) {
        console.log(`⏰ ${modelId}: Rate Limited (429)`);
        results.rateLimited.push({ model: modelId, error: errorData });
      } else {
        console.log(`❌ ${modelId}: Error ${response.status}`);
        results.errors.push({ model: modelId, status: response.status, error: errorData });
      }
      return;
    }

    const data = await response.json();
    console.log(`✅ ${modelId}: Success (${responseTime}ms)`);
    results.successful.push({ 
      model: modelId, 
      responseTime,
      responseLength: data.response?.length || 0,
      usage: data.usage
    });

  } catch (error) {
    console.log(`💥 ${modelId}: ${error.message}`);
    
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      results.timeouts.push({ model: modelId, error: error.message });
    } else {
      results.errors.push({ model: modelId, error: error.message });
    }
  }
}

async function runTests() {
  console.log('🚀 Starting free model reliability tests...\n');
  
  // Test models sequentially to avoid overwhelming the API
  for (const model of FREE_MODELS) {
    await testModel(model);
    // Wait 2 seconds between tests to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  if (results.successful.length > 0) {
    console.log('\n✅ SUCCESSFUL MODELS:');
    results.successful
      .sort((a, b) => a.responseTime - b.responseTime)
      .forEach(result => {
        console.log(`  ${result.model} - ${result.responseTime}ms - ${result.responseLength} chars`);
      });
  }
  
  if (results.rateLimited.length > 0) {
    console.log('\n⏰ RATE LIMITED MODELS (High Usage):');
    results.rateLimited.forEach(result => {
      console.log(`  ${result.model}`);
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n❌ NOT FOUND MODELS (Unavailable):');
    results.notFound.forEach(result => {
      console.log(`  ${result.model}`);
    });
  }
  
  if (results.timeouts.length > 0) {
    console.log('\n⏳ TIMEOUT MODELS (Too Slow):');
    results.timeouts.forEach(result => {
      console.log(`  ${result.model}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n💥 ERROR MODELS:');
    results.errors.forEach(result => {
      console.log(`  ${result.model} - ${result.error}`);
    });
  }
  
  // Production recommendations
  console.log('\n🎯 PRODUCTION RECOMMENDATIONS:');
  console.log('='.repeat(50));
  
  if (results.successful.length > 0) {
    const fastModels = results.successful.filter(r => r.responseTime < 5000);
    const reliableModels = results.successful.filter(r => r.responseTime < 10000);
    
    console.log('\n🚀 FAST & RELIABLE (< 5s response):');
    fastModels.forEach(result => {
      console.log(`  ✅ ${result.model} - ${result.responseTime}ms`);
    });
    
    console.log('\n⚡ RELIABLE (< 10s response):');
    reliableModels.forEach(result => {
      console.log(`  ✅ ${result.model} - ${result.responseTime}ms`);
    });
    
    console.log('\n⚠️ AVOID IN PRODUCTION:');
    [...results.rateLimited, ...results.notFound, ...results.timeouts, ...results.errors]
      .forEach(result => {
        console.log(`  ❌ ${result.model} - ${result.error || 'Unreliable'}`);
      });
  }
  
  return results;
}

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, FREE_MODELS };
} else if (typeof window !== 'undefined') {
  window.testFreeModels = runTests;
}