// Test examples showing how the tone should adapt to different question types

export const TONE_EXAMPLES = {
  api_question: {
    input: "Does GitHub have an API for accessing repositories?",
    expected_opening: "Yes, GitHub has a comprehensive API with excellent documentation and multiple access methods. Here's what you need to know...",
    tone_characteristics: [
      "Confident confirmation",
      "Immediate value addition", 
      "Sets up comprehensive explanation"
    ]
  },
  
  how_to_question: {
    input: "How do I set up authentication with GitHub's API?",
    expected_opening: "Perfect! Let me walk you through the complete authentication setup process. There are 3 main approaches:",
    tone_characteristics: [
      "Enthusiastic helpfulness",
      "Clear structure preview",
      "Step-by-step promise"
    ]
  },
  
  comparison_question: {
    input: "What's the difference between REST API and GraphQL for GitHub?",
    expected_opening: "This is an excellent question that touches on some key architectural decisions. Both approaches have distinct advantages depending on your use case:",
    tone_characteristics: [
      "Acknowledges complexity",
      "Shows expertise",
      "Balanced analysis preview"
    ]
  },
  
  code_question: {
    input: "Can you show me how to fetch user data from GitHub API in Python?",
    expected_opening: "Here's exactly what you need to fetch GitHub user data in Python. I'll provide a complete working example:",
    tone_characteristics: [
      "Direct solution promise",
      "Concrete deliverable",
      "Implementation focus"
    ]
  }
};

// Test function to validate tone adaptation
export function testToneAdaptation() {
  console.log("🎭 Testing Tone Adaptation System:");
  
  Object.entries(TONE_EXAMPLES).forEach(([type, example]) => {
    console.log(`\n📝 ${type.replace('_', ' ').toUpperCase()}:`);
    console.log(`Input: "${example.input}"`);
    console.log(`Expected Opening: "${example.expected_opening}"`);
    console.log(`Characteristics: ${example.tone_characteristics.join(', ')}`);
  });
}