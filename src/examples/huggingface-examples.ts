/**
 * Hugging Face API Examples - Complete Guide
 * Each example shows real-world usage with expected outputs
 */

import { ModernHuggingFaceClient } from '@/lib/huggingface-modern';

const client = new ModernHuggingFaceClient();

// ============================================
// 1. TEXT GENERATION - Basic completion
// ============================================
async function textGenerationExample() {
  const prompt = "The future of artificial intelligence will";
  
  const response = await client.textGeneration(prompt);
  
  console.log("Generated text:", response);
  // Output: "likely involve more sophisticated reasoning capabilities, 
  // better understanding of context, and seamless integration into daily life..."
}

// ============================================
// 2. CHAT COMPLETION - Conversation style
// ============================================
async function chatExample() {
  const messages = [
    { role: 'system', content: 'You are a helpful coding assistant.' },
    { role: 'user', content: 'How do I center a div in CSS?' },
    { role: 'assistant', content: 'You can use flexbox: display: flex; justify-content: center; align-items: center;' },
    { role: 'user', content: 'What about using grid?' }
  ];
  
  const response = await client.chatCompletion(messages);
  
  console.log("Assistant:", response);
  // Output: "With CSS Grid, you can center a div using: 
  // display: grid; place-items: center;"
}

// ============================================
// 3. TEXT TO IMAGE - Generate images
// ============================================
async function imageGenerationExample() {
  const prompt = "A serene Japanese garden with cherry blossoms, koi pond, photorealistic, 4k";
  const negativePrompt = "cartoon, anime, low quality, blurry";
  
  const imageData = await client.textToImage(prompt, undefined, negativePrompt);
  
  // imageData is base64 encoded image
  // You can display it in HTML: <img src={`data:image/png;base64,${imageData}`} />
  
  console.log("Image generated (base64 length):", imageData.length);
}

// ============================================
// 4. TEXT CLASSIFICATION - Sentiment analysis
// ============================================
async function sentimentAnalysisExample() {
  const reviews = [
    "This product is amazing! Best purchase ever!",
    "Terrible quality, waste of money.",
    "It's okay, nothing special."
  ];
  
  for (const review of reviews) {
    const result = await client.textClassification(review);
    console.log(`Review: "${review}"`);
    console.log("Sentiment:", result);
    // Output: [{label: "POSITIVE", score: 0.99}, {label: "NEGATIVE", score: 0.01}]
  }
}

// ============================================
// 5. TRANSLATION - Multi-language support
// ============================================
async function translationExample() {
  const englishText = "Hello, how are you today?";
  
  // English to Spanish
  const spanish = await client.translation(englishText, 'en', 'es');
  console.log("Spanish:", spanish); // "Hola, ¿cómo estás hoy?"
  
  // English to French
  const french = await client.translation(englishText, 'en', 'fr');
  console.log("French:", french); // "Bonjour, comment allez-vous aujourd'hui?"
  
  // English to German
  const german = await client.translation(englishText, 'en', 'de');
  console.log("German:", german); // "Hallo, wie geht es dir heute?"
}

// ============================================
// 6. SUMMARIZATION - Condense long texts
// ============================================
async function summarizationExample() {
  const longArticle = `
    Artificial intelligence has made remarkable progress in recent years. 
    Deep learning models have achieved human-level performance in many tasks,
    including image recognition, natural language processing, and game playing.
    The transformer architecture, introduced in 2017, revolutionized NLP by
    enabling models to process sequences in parallel rather than sequentially.
    This led to breakthroughs like GPT, BERT, and other large language models.
    These models can now generate coherent text, translate languages, answer
    questions, and even write code. However, challenges remain, including
    bias in AI systems, the need for massive computational resources, and
    questions about AI safety and alignment with human values.
  `;
  
  const summary = await client.summarization(longArticle);
  console.log("Summary:", summary);
  // Output: "AI has advanced significantly with deep learning achieving 
  // human-level performance. The transformer architecture revolutionized 
  // NLP, enabling models like GPT and BERT. Challenges include bias, 
  // computational costs, and AI safety."
}

// ============================================
// 7. QUESTION ANSWERING - Extract info
// ============================================
async function questionAnsweringExample() {
  const context = `
    The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars 
    in Paris, France. It is named after the engineer Gustave Eiffel, whose 
    company designed and built the tower. Constructed from 1887 to 1889, 
    it was initially criticized but has become a global cultural icon of 
    France and one of the most recognizable structures in the world. The 
    tower is 330 meters tall and weighs 10,100 tons.
  `;
  
  const questions = [
    "Who designed the Eiffel Tower?",
    "How tall is the Eiffel Tower?",
    "When was it built?"
  ];
  
  for (const question of questions) {
    const answer = await client.questionAnswering(question, context);
    console.log(`Q: ${question}`);
    console.log(`A: ${answer.answer} (confidence: ${answer.score.toFixed(2)})`);
  }
  // Output:
  // Q: Who designed the Eiffel Tower?
  // A: Gustave Eiffel (confidence: 0.95)
}

// ============================================
// 8. EMBEDDINGS - Semantic search
// ============================================
async function embeddingsExample() {
  const documents = [
    "The cat sat on the mat",
    "Dogs are loyal pets",
    "Machine learning is a subset of AI",
    "The feline rested on the rug"  // Similar to first sentence
  ];
  
  // Get embeddings for all documents
  const embeddings = await client.embeddings(documents);
  
  // Calculate cosine similarity between first and last sentence
  const similarity = cosineSimilarity(embeddings[0], embeddings[3]);
  console.log("Similarity between 'cat sat on mat' and 'feline rested on rug':", similarity);
  // Output: 0.85 (high similarity)
}

// Helper function for cosine similarity
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (mag1 * mag2);
}

// ============================================
// 9. ZERO-SHOT CLASSIFICATION - No training
// ============================================
async function zeroShotExample() {
  const email = "Your account has been temporarily suspended. Click here to verify.";
  
  const labels = ["spam", "legitimate", "promotional", "phishing"];
  
  const result = await client.zeroShotClassification(email, labels);
  console.log("Classification:", result);
  // Output: {
  //   labels: ["phishing", "spam", "promotional", "legitimate"],
  //   scores: [0.72, 0.18, 0.08, 0.02]
  // }
}

// ============================================
// 10. NAMED ENTITY RECOGNITION - Find entities
// ============================================
async function nerExample() {
  const text = "Apple Inc. was founded by Steve Jobs in Cupertino, California in 1976.";
  
  const entities = await client.tokenClassification(text);
  console.log("Entities found:");
  entities.forEach(entity => {
    console.log(`- ${entity.word}: ${entity.entity_group} (${entity.score.toFixed(2)})`);
  });
  // Output:
  // - Apple Inc.: ORG (0.99)
  // - Steve Jobs: PER (0.98)
  // - Cupertino: LOC (0.95)
  // - California: LOC (0.97)
}

// ============================================
// 11. FILL MASK - Complete sentences
// ============================================
async function fillMaskExample() {
  const sentence = "The capital of France is [MASK].";
  
  const predictions = await client.fillMask(sentence);
  console.log("Top predictions:");
  predictions.slice(0, 3).forEach(pred => {
    console.log(`- ${pred.token_str}: ${pred.score.toFixed(2)}`);
  });
  // Output:
  // - Paris: 0.98
  // - Lyon: 0.01
  // - Marseille: 0.01
}

// ============================================
// PRACTICAL USE CASES
// ============================================

// Customer Support Bot
async function customerSupportBot(userQuery: string) {
  // 1. Classify intent
  const intents = ["technical_issue", "billing", "general_inquiry", "complaint"];
  const intent = await client.zeroShotClassification(userQuery, intents);
  
  // 2. Extract entities
  const entities = await client.tokenClassification(userQuery);
  
  // 3. Generate response based on intent
  const prompt = `As a customer support agent, respond to this ${intent.labels[0]} query: ${userQuery}`;
  const response = await client.textGeneration(prompt);
  
  return { intent: intent.labels[0], response };
}

// Content Moderation Pipeline
async function moderateContent(text: string) {
  // 1. Check sentiment
  const sentiment = await client.textClassification(text);
  
  // 2. Check for inappropriate content
  const categories = ["safe", "toxic", "hate_speech", "violence"];
  const classification = await client.zeroShotClassification(text, categories);
  
  // 3. Extract entities (check for PII)
  const entities = await client.tokenClassification(text);
  const hasPII = entities.some(e => e.entity_group === 'PER');
  
  return {
    sentiment: sentiment[0],
    safety: classification.labels[0],
    safetyScore: classification.scores[0],
    containsPII: hasPII
  };
}

// Multi-language Support System
async function multiLanguageResponse(query: string, targetLang: string) {
  // 1. Detect language (using zero-shot)
  const languages = ["english", "spanish", "french", "german"];
  const detected = await client.zeroShotClassification(query, languages);
  
  // 2. Translate to English if needed
  let englishQuery = query;
  if (detected.labels[0] !== 'english') {
    englishQuery = await client.translation(query, detected.labels[0].slice(0, 2), 'en');
  }
  
  // 3. Generate response
  const response = await client.textGeneration(englishQuery);
  
  // 4. Translate back to target language
  const translatedResponse = await client.translation(response, 'en', targetLang);
  
  return translatedResponse;
}

// Export all examples
export {
  textGenerationExample,
  chatExample,
  imageGenerationExample,
  sentimentAnalysisExample,
  translationExample,
  summarizationExample,
  questionAnsweringExample,
  embeddingsExample,
  zeroShotExample,
  nerExample,
  fillMaskExample,
  customerSupportBot,
  moderateContent,
  multiLanguageResponse
};