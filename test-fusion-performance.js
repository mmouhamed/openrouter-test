#!/usr/bin/env node

const testQueries = [
  "Explain the difference between React and Vue.js in 3 key points.",
  "What are microservices and when should I use them?", 
  "Compare TypeScript vs JavaScript advantages",
  "Explain machine learning in simple terms",
  "What are the benefits of using React hooks?"
];

async function testFusionPerformance() {
  console.log('🚀 Testing Turbo AI Fusion Performance...\n');
  
  const results = [];
  const baseUrl = 'http://localhost:3007'; // Assuming dev server on 3007
  
  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`Test ${i + 1}/5: "${query.substring(0, 50)}..."`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          model: 'AI Fusion',
          conversationContext: [],
          enableWebSearch: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      results.push({
        query: query.substring(0, 30) + '...',
        responseTime,
        strategy: data.fusion?.strategy || 'unknown',
        modelsUsed: data.fusion?.modelsUsed?.length || 0,
        confidence: data.fusion?.confidence || 0,
        qualityScore: data.fusion?.qualityScore || 0,
        success: true
      });
      
      console.log(`✅ Completed in ${responseTime}ms (${Math.round(responseTime/1000)}s)`);
      console.log(`   Strategy: ${data.fusion?.strategy}, Models: ${data.fusion?.modelsUsed?.length}, Quality: ${data.fusion?.qualityScore}`);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      results.push({
        query: query.substring(0, 30) + '...',
        responseTime,
        error: error.message,
        success: false
      });
      
      console.log(`❌ Failed after ${responseTime}ms: ${error.message}`);
    }
    
    console.log('');
    
    // Small delay between requests
    if (i < testQueries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Calculate statistics
  const successfulTests = results.filter(r => r.success);
  const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
  const minTime = Math.min(...successfulTests.map(r => r.responseTime));
  const maxTime = Math.max(...successfulTests.map(r => r.responseTime));
  const avgQuality = successfulTests.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / successfulTests.length;
  
  console.log('📊 Performance Summary:');
  console.log('====================================');
  console.log(`✅ Successful tests: ${successfulTests.length}/${results.length}`);
  console.log(`⚡ Average response time: ${Math.round(avgResponseTime/1000)}s (${avgResponseTime}ms)`);
  console.log(`🏃 Fastest response: ${Math.round(minTime/1000)}s (${minTime}ms)`);
  console.log(`🐌 Slowest response: ${Math.round(maxTime/1000)}s (${maxTime}ms)`);
  console.log(`📈 Average quality score: ${Math.round(avgQuality)}%`);
  
  const targetTime = 15000; // 15 seconds
  const oldAverageTime = 35000; // 35 seconds baseline
  
  console.log(`\n🎯 Performance vs Targets:`);
  console.log(`   Target time: 15s`);
  console.log(`   Actual avg time: ${Math.round(avgResponseTime/1000)}s`);
  
  if (avgResponseTime <= targetTime) {
    console.log(`   ✅ TARGET ACHIEVED! (${Math.round(((targetTime - avgResponseTime) / targetTime) * 100)}% under target)`);
  } else {
    const percentageOver = Math.round(((avgResponseTime - targetTime) / targetTime) * 100);
    console.log(`   ⚠️  ${percentageOver}% over target (need ${Math.round((avgResponseTime - targetTime)/1000)}s improvement)`);
  }
  
  const improvementVsBaseline = Math.round(((oldAverageTime - avgResponseTime) / oldAverageTime) * 100);
  console.log(`   📈 ${improvementVsBaseline}% faster than 35s baseline`);
  
  console.log(`\n📋 Individual Results:`);
  results.forEach((result, index) => {
    if (result.success) {
      const timeColor = result.responseTime <= targetTime ? '🟢' : result.responseTime <= 25000 ? '🟡' : '🔴';
      console.log(`   ${index + 1}. ${timeColor} ${result.query} - ${Math.round(result.responseTime/1000)}s`);
    } else {
      console.log(`   ${index + 1}. ❌ ${result.query} - FAILED`);
    }
  });
}

// Run the test
testFusionPerformance().catch(console.error);