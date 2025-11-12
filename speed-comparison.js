#!/usr/bin/env node

const fetch = require('node-fetch').default;

async function speedComparison() {
  console.log('⚡ 2-MODEL SPEED FUSION TEST');
  console.log('===========================\n');
  
  const tests = [
    "What is React?",
    "Compare TypeScript vs JavaScript", 
    "Explain REST API design principles"
  ];
  
  for (let i = 0; i < tests.length; i++) {
    const query = tests[i];
    console.log(`🚀 Test ${i+1}: "${query.substring(0, 30)}..."`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch('http://localhost:3007/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      
      if (response.ok) {
        const data = await response.json();
        const totalTime = Date.now() - startTime;
        
        console.log(`✅ Total: ${totalTime}ms (${Math.round(totalTime/1000)}s)`);
        if (data.fusion) {
          console.log(`   Processing: ${data.fusion.processingTime}ms`);
          console.log(`   Models: ${data.fusion.modelsUsed.join(', ')}`);
          console.log(`   Synthesis: ${data.fusion.synthesisModel}`);
          console.log(`   Quality: ${data.fusion.qualityScore}`);
          console.log(`   Length: ${data.response.length} chars`);
        }
        console.log('');
      }
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.log(`❌ Failed: ${totalTime}ms - ${error.message}\n`);
    }
    
    // Short pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🏁 2-Model Speed Fusion test complete!');
}

speedComparison();