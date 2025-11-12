#!/usr/bin/env node

const fetch = require('node-fetch').default;

async function speedTest() {
  console.log('🚀 TURBO AI FUSION SPEED TEST');
  console.log('==============================\n');
  
  const tests = [
    { type: 'Simple', query: "What is React?" },
    { type: 'Medium', query: "Explain the differences between React and Vue" },
    { type: 'Complex', query: "Compare microservices vs monolithic architecture with pros, cons, and examples" }
  ];
  
  for (const test of tests) {
    console.log(`⏱️  Testing ${test.type} Query...`);
    const startTime = Date.now();
    
    try {
      const response = await fetch('http://localhost:3007/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: test.query })
      });
      
      if (response.ok) {
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        console.log(`✅ ${test.type}: ${responseTime}ms (${Math.round(responseTime/1000)}s)`);
        console.log(`   Model: ${data.model}`);
        console.log(`   Length: ${data.response.length} chars`);
        console.log(`   Quality: ${data.fusion?.qualityScore || 'N/A'}`);
        console.log('');
      }
    } catch (error) {
      console.log(`❌ ${test.type}: Failed - ${error.message}`);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('🎯 Speed optimization analysis complete!');
}

speedTest();