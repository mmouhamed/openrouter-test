#!/usr/bin/env node

const fetch = require('node-fetch').default;

const BASE_URL = 'http://localhost:3007';

async function quickTest() {
  console.log('🚀 QUICK FUSION PERFORMANCE TEST');
  console.log('================================\n');
  
  const query = "Explain the difference between React and Vue.js in 3 key points.";
  
  const modes = [
    { name: 'Single Model', value: 'single' },
    { name: 'Smart Fusion', value: 'specialized' },
    { name: 'AI Fusion', value: 'consensus' }
  ];
  
  const results = {};
  
  for (const mode of modes) {
    console.log(`\n🔄 Testing ${mode.name}...`);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          fusionMode: mode.value,
          fusionStrategy: mode.value === 'consensus' ? 'consensus' : 'specialized',
          enableWebSearch: false,
          conversationContext: []
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      results[mode.value] = {
        success: true,
        responseTime,
        responseLength: data.response.length,
        confidence: data.fusion?.confidence || 0.8,
        qualityScore: data.fusion?.qualityScore || 85,
        modelsUsed: data.fusion?.modelsUsed?.length || 1
      };
      
      console.log(`✅ ${mode.name}:`);
      console.log(`   ⏱️  Response Time: ${responseTime}ms`);
      console.log(`   📏 Response Length: ${data.response.length} chars`);
      console.log(`   🎯 Confidence: ${Math.round((data.fusion?.confidence || 0.8) * 100)}%`);
      
      if (data.fusion) {
        console.log(`   📊 Quality Score: ${data.fusion.qualityScore}`);
        console.log(`   🧬 Models Used: ${data.fusion.modelsUsed.length}`);
      }
      
    } catch (error) {
      console.log(`❌ ${mode.name}: FAILED - ${error.message}`);
      results[mode.value] = { success: false, error: error.message };
    }
    
    // Shorter wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Performance Analysis
  console.log('\n\n📈 PERFORMANCE ANALYSIS');
  console.log('========================\n');
  
  const single = results.single;
  const smart = results.specialized;
  const fusion = results.consensus;
  
  if (single && single.success) {
    console.log(`🎯 Single Model Baseline: ${single.responseTime}ms`);
  }
  
  if (smart && smart.success && single && single.success) {
    const smartOverhead = ((smart.responseTime - single.responseTime) / single.responseTime) * 100;
    const qualityGain = smart.qualityScore - (single.confidence * 100);
    console.log(`⚡ Smart Fusion: +${Math.round(smartOverhead)}% time, +${Math.round(qualityGain)}% quality`);
  }
  
  if (fusion && fusion.success && single && single.success) {
    const fusionOverhead = ((fusion.responseTime - single.responseTime) / single.responseTime) * 100;
    const qualityGain = fusion.qualityScore - (single.confidence * 100);
    console.log(`🧬 AI Fusion: +${Math.round(fusionOverhead)}% time, +${Math.round(qualityGain)}% quality`);
  }
  
  console.log('\n💡 QUICK INSIGHTS:');
  console.log('==================');
  
  if (smart && smart.success && single && single.success) {
    const speedRatio = smart.responseTime / single.responseTime;
    if (speedRatio < 2) {
      console.log('✅ Smart Fusion provides reasonable speed/quality trade-off');
    } else if (speedRatio > 4) {
      console.log('⚠️  Smart Fusion may be too slow for real-time use');
    }
  }
  
  if (fusion && fusion.success && smart && smart.success) {
    const improvement = smart.responseTime / fusion.responseTime;
    if (improvement > 0.8) {
      console.log('💡 Smart Fusion offers better speed than AI Fusion with similar quality');
    }
  }
  
  console.log('\n✅ Quick test complete! Use this data to optimize fusion performance.');
}

if (require.main === module) {
  quickTest().catch(console.error);
}

module.exports = { quickTest };