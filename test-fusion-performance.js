// Fusion Performance Test Suite
const testQueries = [
  {
    type: "simple",
    query: "What is JavaScript?",
    expectedResponseTime: { single: 3000, fusion: 8000, smart: 6000 }
  },
  {
    type: "complex_analysis", 
    query: "Explain the pros and cons of microservices architecture vs monolithic architecture, including when to choose each approach.",
    expectedResponseTime: { single: 5000, fusion: 12000, smart: 10000 }
  },
  {
    type: "creative",
    query: "Write a creative story about a developer who discovers their code has gained consciousness.",
    expectedResponseTime: { single: 4000, fusion: 10000, smart: 8000 }
  },
  {
    type: "technical_coding",
    query: "Create a React component that implements a real-time chat interface with WebSocket connections, error handling, and typing indicators.",
    expectedResponseTime: { single: 6000, fusion: 15000, smart: 12000 }
  },
  {
    type: "factual",
    query: "What are the current trends in AI development as of 2024?",
    expectedResponseTime: { single: 4000, fusion: 10000, smart: 8000 }
  }
];

async function testFusionMode(query, mode) {
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        fusionMode: mode,
        fusionStrategy: mode === 'consensus' ? 'consensus' : 'specialized',
        enableWebSearch: false,
        conversationContext: []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const endTime = Date.now();
    
    return {
      success: true,
      responseTime: endTime - startTime,
      response: data.response,
      model: data.model,
      fusion: data.fusion || null,
      confidence: data.fusion?.confidence || 0.8,
      qualityScore: data.fusion?.qualityScore || 85
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting Fusion Performance Analysis...\n');
  
  const results = [];
  
  for (const testCase of testQueries) {
    console.log(`\n📊 Testing: ${testCase.type.toUpperCase()}`);
    console.log(`Query: "${testCase.query.substring(0, 60)}..."`);
    console.log('─'.repeat(80));
    
    const modes = [
      { name: 'Single Model', value: 'single' },
      { name: 'AI Fusion', value: 'consensus' }, 
      { name: 'Smart Fusion', value: 'specialized' }
    ];
    
    const testResults = {
      query: testCase.query,
      type: testCase.type,
      modes: {}
    };
    
    for (const mode of modes) {
      console.log(`\n🔄 Testing ${mode.name}...`);
      
      const result = await testFusionMode(testCase.query, mode.value);
      
      if (result.success) {
        console.log(`✅ ${mode.name}: ${result.responseTime}ms`);
        console.log(`   Model(s): ${result.model}`);
        console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
        console.log(`   Quality Score: ${result.qualityScore || 'N/A'}`);
        console.log(`   Response Length: ${result.response.length} chars`);
        
        if (result.fusion) {
          console.log(`   Models Used: ${result.fusion.modelsUsed.join(', ')}`);
          console.log(`   Individual Responses: ${result.fusion.individualResponses.length}`);
        }
      } else {
        console.log(`❌ ${mode.name}: FAILED - ${result.error}`);
      }
      
      testResults.modes[mode.value] = result;
      
      // Wait between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    results.push(testResults);
  }
  
  return results;
}

async function analyzeResults(results) {
  console.log('\n\n📈 PERFORMANCE ANALYSIS REPORT');
  console.log('='.repeat(80));
  
  let totalSingle = 0, totalFusion = 0, totalSmart = 0;
  let successfulSingle = 0, successfulFusion = 0, successfulSmart = 0;
  let qualitySingle = 0, qualityFusion = 0, qualitySmart = 0;
  
  console.log('\n📊 Response Time Comparison:');
  console.log('─'.repeat(80));
  
  for (const result of results) {
    const single = result.modes.single;
    const fusion = result.modes.consensus;
    const smart = result.modes.specialized;
    
    console.log(`\n${result.type.toUpperCase()}:`);
    
    if (single?.success) {
      console.log(`  🎯 Single Model: ${single.responseTime}ms`);
      totalSingle += single.responseTime;
      successfulSingle++;
      qualitySingle += (single.confidence * 100);
    }
    
    if (fusion?.success) {
      console.log(`  🧠 AI Fusion: ${fusion.responseTime}ms (+${Math.round(((fusion.responseTime - single.responseTime) / single.responseTime) * 100)}%)`);
      totalFusion += fusion.responseTime;
      successfulFusion++;
      qualityFusion += fusion.qualityScore;
    }
    
    if (smart?.success) {
      console.log(`  ⚡ Smart Fusion: ${smart.responseTime}ms (+${Math.round(((smart.responseTime - single.responseTime) / single.responseTime) * 100)}%)`);
      totalSmart += smart.responseTime;
      successfulSmart++;
      qualitySmart += smart.qualityScore;
    }
  }
  
  // Calculate averages
  const avgSingle = successfulSingle > 0 ? totalSingle / successfulSingle : 0;
  const avgFusion = successfulFusion > 0 ? totalFusion / successfulFusion : 0;
  const avgSmart = successfulSmart > 0 ? totalSmart / successfulSmart : 0;
  
  const avgQualitySingle = successfulSingle > 0 ? qualitySingle / successfulSingle : 0;
  const avgQualityFusion = successfulFusion > 0 ? qualityFusion / successfulFusion : 0;
  const avgQualitySmart = successfulSmart > 0 ? qualitySmart / successfulSmart : 0;
  
  console.log('\n\n🏆 SUMMARY STATISTICS:');
  console.log('─'.repeat(80));
  console.log(`🎯 Single Model - Average: ${Math.round(avgSingle)}ms | Quality: ${Math.round(avgQualitySingle)}%`);
  console.log(`🧠 AI Fusion - Average: ${Math.round(avgFusion)}ms | Quality: ${Math.round(avgQualityFusion)}%`);
  console.log(`⚡ Smart Fusion - Average: ${Math.round(avgSmart)}ms | Quality: ${Math.round(avgQualitySmart)}%`);
  
  console.log('\n📈 PERFORMANCE INSIGHTS:');
  console.log('─'.repeat(80));
  
  if (avgFusion > 0 && avgSingle > 0) {
    const fusionOverhead = ((avgFusion - avgSingle) / avgSingle) * 100;
    const qualityImprovement = avgQualityFusion - avgQualitySingle;
    console.log(`• AI Fusion is ${Math.round(fusionOverhead)}% slower but ${Math.round(qualityImprovement)}% better quality`);
  }
  
  if (avgSmart > 0 && avgSingle > 0) {
    const smartOverhead = ((avgSmart - avgSingle) / avgSingle) * 100;
    const qualityImprovement = avgQualitySmart - avgQualitySingle;
    console.log(`• Smart Fusion is ${Math.round(smartOverhead)}% slower but ${Math.round(qualityImprovement)}% better quality`);
  }
  
  if (avgSmart > 0 && avgFusion > 0) {
    const speedGain = ((avgFusion - avgSmart) / avgFusion) * 100;
    console.log(`• Smart Fusion is ${Math.round(speedGain)}% faster than AI Fusion`);
  }
  
  // Recommendations
  console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
  console.log('─'.repeat(80));
  
  if (avgFusion > avgSingle * 2.5) {
    console.log('• Consider caching fusion responses for similar queries');
    console.log('• Implement timeout-based fallback (if fusion takes >10s, return best individual response)');
  }
  
  if (avgSmart < avgFusion * 0.8) {
    console.log('• Smart Fusion provides good balance - recommend as default for complex queries');
  }
  
  console.log('• Implement query complexity analysis to auto-choose mode');
  console.log('• Add response streaming to improve perceived performance');
  console.log('• Consider parallel processing optimizations');
  
  return {
    averages: { single: avgSingle, fusion: avgFusion, smart: avgSmart },
    quality: { single: avgQualitySingle, fusion: avgQualityFusion, smart: avgQualitySmart },
    success_rates: { 
      single: successfulSingle / results.length,
      fusion: successfulFusion / results.length, 
      smart: successfulSmart / results.length 
    }
  };
}

// Export for use in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testQueries, testFusionMode, runPerformanceTests, analyzeResults };
}

// Browser execution
if (typeof window !== 'undefined') {
  window.fusionTester = { testQueries, testFusionMode, runPerformanceTests, analyzeResults };
  
  console.log('🔧 Fusion Performance Tester loaded!');
  console.log('Run: fusionTester.runPerformanceTests().then(fusionTester.analyzeResults)');
}