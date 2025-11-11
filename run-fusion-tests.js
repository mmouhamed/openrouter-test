#!/usr/bin/env node

const fetch = require('node-fetch').default;

const BASE_URL = 'http://localhost:3007';

const testQueries = [
  {
    type: "simple",
    query: "What is React and why is it popular?",
    expectedQuality: { single: 80, fusion: 90, smart: 85 }
  },
  {
    type: "complex", 
    query: "Compare microservices vs monolithic architecture. Include pros, cons, and when to use each approach with real examples.",
    expectedQuality: { single: 75, fusion: 92, smart: 88 }
  },
  {
    type: "creative",
    query: "Write a short story about a programmer who discovers their AI assistant has become sentient.",
    expectedQuality: { single: 70, fusion: 88, smart: 82 }
  }
];

async function testFusionMode(query, fusionMode) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        fusionMode: fusionMode,
        fusionStrategy: fusionMode === 'consensus' ? 'consensus' : 'specialized',
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
      qualityScore: data.fusion?.qualityScore || 85,
      responseLength: data.response.length
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function runSpeedComparison() {
  console.log('🚀 FUSION PERFORMANCE TEST SUITE');
  console.log('================================\n');
  
  const results = [];
  
  for (const testCase of testQueries) {
    console.log(`\n📊 Testing: ${testCase.type.toUpperCase()}`);
    console.log(`Query: "${testCase.query.substring(0, 80)}..."`);
    console.log('─'.repeat(80));
    
    const modes = [
      { name: 'Single Model', value: 'single' },
      { name: 'Smart Fusion', value: 'specialized' },
      { name: 'AI Fusion', value: 'consensus' }
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
        console.log(`✅ ${mode.name}:`);
        console.log(`   ⏱️  Response Time: ${result.responseTime}ms`);
        console.log(`   📏 Response Length: ${result.responseLength} chars`);
        console.log(`   🎯 Confidence: ${Math.round(result.confidence * 100)}%`);
        
        if (result.fusion) {
          console.log(`   🧬 Models Used: ${result.fusion.modelsUsed?.length || 0}`);
          console.log(`   📊 Quality Score: ${result.qualityScore}`);
          console.log(`   ⚡ Processing: ${result.fusion.processingTime}ms`);
        }
      } else {
        console.log(`❌ ${mode.name}: FAILED - ${result.error}`);
      }
      
      testResults.modes[mode.value] = result;
      
      // Wait between tests to avoid overloading
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    results.push(testResults);
    
    // Longer wait between test cases
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  return results;
}

async function analyzePerformance(results) {
  console.log('\n\n📈 DETAILED PERFORMANCE ANALYSIS');
  console.log('=====================================\n');
  
  let stats = {
    single: { total: 0, count: 0, quality: 0, avgLength: 0 },
    specialized: { total: 0, count: 0, quality: 0, avgLength: 0 },
    consensus: { total: 0, count: 0, quality: 0, avgLength: 0 }
  };
  
  console.log('📊 Individual Test Results:');
  console.log('─'.repeat(80));
  
  for (const result of results) {
    console.log(`\n${result.type.toUpperCase()}:`);
    
    const single = result.modes.single;
    const smart = result.modes.specialized;
    const fusion = result.modes.consensus;
    
    if (single?.success) {
      const time = single.responseTime;
      const quality = single.confidence * 100;
      console.log(`  🎯 Single: ${time}ms | Quality: ${Math.round(quality)}% | Length: ${single.responseLength}`);
      
      stats.single.total += time;
      stats.single.quality += quality;
      stats.single.avgLength += single.responseLength;
      stats.single.count++;
    }
    
    if (smart?.success) {
      const time = smart.responseTime;
      const quality = smart.qualityScore;
      const speedup = single ? ((time / single.responseTime - 1) * 100) : 0;
      console.log(`  ⚡ Smart:  ${time}ms | Quality: ${quality}% | Length: ${smart.responseLength} | vs Single: ${speedup > 0 ? '+' : ''}${Math.round(speedup)}%`);
      
      stats.specialized.total += time;
      stats.specialized.quality += quality;
      stats.specialized.avgLength += smart.responseLength;
      stats.specialized.count++;
    }
    
    if (fusion?.success) {
      const time = fusion.responseTime;
      const quality = fusion.qualityScore;
      const speedup = single ? ((time / single.responseTime - 1) * 100) : 0;
      console.log(`  🧬 Fusion: ${time}ms | Quality: ${quality}% | Length: ${fusion.responseLength} | vs Single: ${speedup > 0 ? '+' : ''}${Math.round(speedup)}%`);
      
      stats.consensus.total += time;
      stats.consensus.quality += quality;
      stats.consensus.avgLength += fusion.responseLength;
      stats.consensus.count++;
    }
  }
  
  // Calculate averages
  Object.keys(stats).forEach(mode => {
    const s = stats[mode];
    s.avgTime = s.count > 0 ? s.total / s.count : 0;
    s.avgQuality = s.count > 0 ? s.quality / s.count : 0;
    s.avgLength = s.count > 0 ? s.avgLength / s.count : 0;
  });
  
  console.log('\n\n🏆 SUMMARY STATISTICS:');
  console.log('─'.repeat(80));
  console.log(`🎯 Single Model:`);
  console.log(`   Average Time: ${Math.round(stats.single.avgTime)}ms`);
  console.log(`   Average Quality: ${Math.round(stats.single.avgQuality)}%`);
  console.log(`   Average Length: ${Math.round(stats.single.avgLength)} chars\n`);
  
  console.log(`⚡ Smart Fusion:`);
  console.log(`   Average Time: ${Math.round(stats.specialized.avgTime)}ms`);
  console.log(`   Average Quality: ${Math.round(stats.specialized.avgQuality)}%`);
  console.log(`   Average Length: ${Math.round(stats.specialized.avgLength)} chars`);
  if (stats.single.avgTime > 0) {
    const slowdown = ((stats.specialized.avgTime / stats.single.avgTime - 1) * 100);
    const qualityGain = stats.specialized.avgQuality - stats.single.avgQuality;
    console.log(`   vs Single: ${slowdown > 0 ? '+' : ''}${Math.round(slowdown)}% time, +${Math.round(qualityGain)}% quality\n`);
  }
  
  console.log(`🧬 AI Fusion:`);
  console.log(`   Average Time: ${Math.round(stats.consensus.avgTime)}ms`);
  console.log(`   Average Quality: ${Math.round(stats.consensus.avgQuality)}%`);
  console.log(`   Average Length: ${Math.round(stats.consensus.avgLength)} chars`);
  if (stats.single.avgTime > 0) {
    const slowdown = ((stats.consensus.avgTime / stats.single.avgTime - 1) * 100);
    const qualityGain = stats.consensus.avgQuality - stats.single.avgQuality;
    console.log(`   vs Single: ${slowdown > 0 ? '+' : ''}${Math.round(slowdown)}% time, +${Math.round(qualityGain)}% quality`);
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('─'.repeat(80));
  
  const smartSlowdown = stats.single.avgTime > 0 ? (stats.specialized.avgTime / stats.single.avgTime - 1) * 100 : 0;
  const fusionSlowdown = stats.single.avgTime > 0 ? (stats.consensus.avgTime / stats.single.avgTime - 1) * 100 : 0;
  
  if (smartSlowdown < 100) {
    console.log('✅ Smart Fusion provides good speed/quality balance - recommend for most queries');
  }
  
  if (fusionSlowdown > 200) {
    console.log('⚠️  AI Fusion is significantly slower - reserve for complex/important queries only');
  }
  
  const qualityDiff = stats.specialized.avgQuality - stats.single.avgQuality;
  if (qualityDiff > 5) {
    console.log('📈 Fusion modes show significant quality improvement - worth the speed trade-off');
  }
  
  if (stats.consensus.avgQuality > stats.specialized.avgQuality + 3) {
    console.log('🏆 Full AI Fusion shows superior quality for complex tasks');
  }
  
  console.log('\n🎯 OPTIMIZATION TARGETS:');
  console.log('─'.repeat(80));
  console.log('• Target Smart Fusion response time: <150% of Single Model');
  console.log('• Target AI Fusion response time: <250% of Single Model');
  console.log('• Minimum quality improvement: +10% for mode to be worthwhile');
  console.log('• Consider caching for responses >8 seconds');
  
  return stats;
}

async function main() {
  try {
    console.log('Starting performance tests...\n');
    
    const results = await runSpeedComparison();
    await analyzePerformance(results);
    
    console.log('\n\n✅ Performance testing complete!');
    console.log('Check the analysis above for optimization recommendations.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Make sure the development server is running on port 3007');
  }
}

if (require.main === module) {
  main();
}

module.exports = { testFusionMode, runSpeedComparison, analyzePerformance };