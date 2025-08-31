# Hugging Face Integration Guide

## Installation

First, install the Hugging Face Inference library:

```bash
npm install @huggingface/inference
```

## Setup Environment Variables

Add to your `.env.local`:

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
```

Get your API key from: https://huggingface.co/settings/tokens

## Key Differences: OpenRouter vs Hugging Face

### OpenRouter
- **Pros:**
  - Access to multiple providers (OpenAI, Anthropic, Google, etc.)
  - Unified pricing across models
  - Built-in rate limiting and fallbacks
  - OpenAI-compatible API format

- **Cons:**
  - Additional layer of abstraction
  - Potential latency from proxy
  - Costs slightly more than direct provider access

### Hugging Face
- **Pros:**
  - Free tier available (rate-limited)
  - Access to 100,000+ open-source models
  - Specialized models for specific tasks
  - Can self-host models (no API costs)
  - Direct model access (lower latency)

- **Cons:**
  - Variable model quality
  - Need to manage different input/output formats
  - Some models require GPU for good performance

## Usage Examples

### 1. Basic Chat Completion

```typescript
// Using the unified provider
import { UnifiedAIProvider } from '@/lib/unified-ai-provider';

const provider = new UnifiedAIProvider({
  provider: 'huggingface',
  model: 'mistralai/Mixtral-8x7B-Instruct-v0.1'
});

const response = await provider.chat([
  { role: 'user', content: 'What is quantum computing?' }
]);
```

### 2. Specialized Tasks with Hugging Face

```typescript
import { hfClient } from '@/lib/huggingface-client';

// Text to Image
const image = await hfClient.textToImage(
  "A serene landscape with mountains and a lake at sunset"
);

// Translation
const translated = await hfClient.translation(
  "Hello, how are you?",
  "en", // source language
  "es"  // target language
);

// Summarization
const summary = await hfClient.summarization(
  "Your long article text here..."
);

// Question Answering
const answer = await hfClient.questionAnswering(
  "What is the capital of France?",
  "France is a country in Europe. Its capital is Paris, which is known for the Eiffel Tower."
);
```

### 3. Switching Providers Dynamically

```typescript
// In your React component
const [provider, setProvider] = useState<AIProvider>('openrouter');

const aiProvider = new UnifiedAIProvider({
  provider: provider,
  model: provider === 'openrouter' 
    ? 'openai/gpt-3.5-turbo'
    : 'mistralai/Mixtral-8x7B-Instruct-v0.1'
});

// User can switch providers in UI
<select onChange={(e) => setProvider(e.target.value as AIProvider)}>
  <option value="openrouter">OpenRouter</option>
  <option value="huggingface">Hugging Face</option>
  <option value="ollama">Ollama (Local)</option>
</select>
```

## Model Recommendations

### For Chat/Conversation:
- `mistralai/Mixtral-8x7B-Instruct-v0.1` - Best overall performance
- `meta-llama/Llama-2-70b-chat-hf` - Good for longer contexts
- `HuggingFaceH4/zephyr-7b-beta` - Fast and efficient

### For Code Generation:
- `codellama/CodeLlama-34b-Instruct-hf`
- `bigcode/starcoder`
- `Salesforce/codegen2-16B`

### For Summarization:
- `facebook/bart-large-cnn`
- `google/pegasus-xsum`

### For Translation:
- `Helsinki-NLP/opus-mt-{source}-{target}`

### For Embeddings:
- `sentence-transformers/all-MiniLM-L6-v2`
- `BAAI/bge-large-en-v1.5`

## Cost Comparison

| Provider | Free Tier | Paid Pricing |
|----------|-----------|--------------|
| OpenRouter | No | $0.00015-$0.032 per 1K tokens |
| Hugging Face | Yes (rate limited) | $0.06/hour for dedicated inference |
| Ollama | Yes (local) | Free (your hardware costs) |

## When to Use Each Provider

### Use OpenRouter when:
- You need access to proprietary models (GPT-4, Claude)
- You want simplified billing across providers
- You need high reliability and uptime
- You're building a production application

### Use Hugging Face when:
- You want to experiment with many different models
- You need specialized models for specific tasks
- You want to use open-source models
- Budget is a primary concern
- You need models for non-English languages

### Use Ollama when:
- You need complete data privacy
- You have good local hardware (GPU)
- You want zero API costs
- You need offline capability

## Migration Path

1. Start with the UnifiedAIProvider class
2. Test with different providers using the same interface
3. Monitor performance and costs
4. Choose the best provider for your use case
5. Optimize model selection based on task requirements