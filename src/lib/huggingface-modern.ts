/**
 * Modern Hugging Face Client using direct API calls (2025 approach)
 * This avoids the deprecated HfInference class
 */

interface HFParameters {
  max_new_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  repetition_penalty?: number;
  return_full_text?: boolean;
  do_sample?: boolean;
}

export class ModernHuggingFaceClient {
  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.HUGGINGFACE_API_KEY;
    if (!key) {
      throw new Error('Hugging Face API key is required');
    }
    this.apiKey = key;
  }

  /**
   * Make a request to Hugging Face API
   * This is the core method that handles all API communication
   */
  private async makeRequest(modelId: string, payload: any) {
    const response = await fetch(`${this.baseUrl}/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HF API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Text Generation - Generate text from a prompt
   * Line-by-line explanation:
   * 1. Takes a prompt string and optional model
   * 2. Sends request with inputs and parameters
   * 3. Returns only the generated text
   */
  async textGeneration(
    prompt: string, 
    model = 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    parameters?: HFParameters
  ) {
    const payload = {
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false,
        ...parameters // Allow custom parameters to override defaults
      }
    };

    const response = await this.makeRequest(model, payload);
    
    // Response is either array or single object
    return Array.isArray(response) 
      ? response[0]?.generated_text 
      : response.generated_text;
  }

  /**
   * Chat Completion - Handle conversation-style interactions
   * Converts chat messages to a formatted prompt
   */
  async chatCompletion(
    messages: Array<{role: string, content: string}>,
    model = 'mistralai/Mixtral-8x7B-Instruct-v0.1'
  ) {
    // Format messages into a chat template
    const formattedPrompt = messages
      .map(msg => {
        if (msg.role === 'system') return `System: ${msg.content}`;
        if (msg.role === 'user') return `User: ${msg.content}`;
        if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
        return msg.content;
      })
      .join('\n') + '\nAssistant:';

    return this.textGeneration(formattedPrompt, model);
  }

  /**
   * Text to Image - Generate images from text descriptions
   * Uses Stable Diffusion or similar models
   */
  async textToImage(
    prompt: string,
    model = 'stabilityai/stable-diffusion-2',
    negativePrompt?: string
  ) {
    const payload = {
      inputs: prompt,
      parameters: {
        negative_prompt: negativePrompt,
        width: 1024,
        height: 1024,
        num_inference_steps: 50,
        guidance_scale: 7.5
      }
    };

    const response = await this.makeRequest(model, payload);
    
    // Response is a blob/base64 image
    return response;
  }

  /**
   * Text Classification - Classify text into categories
   * Returns labels with confidence scores
   */
  async textClassification(
    text: string,
    model = 'distilbert-base-uncased-finetuned-sst-2-english'
  ) {
    const payload = { inputs: text };
    const response = await this.makeRequest(model, payload);
    
    // Returns array of {label: string, score: number}
    return response;
  }

  /**
   * Translation - Translate text between languages
   * Model name format: Helsinki-NLP/opus-mt-{source}-{target}
   */
  async translation(
    text: string,
    sourceLang: string,
    targetLang: string
  ) {
    const model = `Helsinki-NLP/opus-mt-${sourceLang}-${targetLang}`;
    const payload = { inputs: text };
    
    const response = await this.makeRequest(model, payload);
    
    // Returns translation_text field
    return Array.isArray(response)
      ? response[0]?.translation_text
      : response.translation_text;
  }

  /**
   * Summarization - Create concise summaries of longer texts
   * Useful for articles, documents, conversations
   */
  async summarization(
    text: string,
    model = 'facebook/bart-large-cnn',
    maxLength = 150,
    minLength = 30
  ) {
    const payload = {
      inputs: text,
      parameters: {
        max_length: maxLength,
        min_length: minLength,
        do_sample: false
      }
    };

    const response = await this.makeRequest(model, payload);
    
    return Array.isArray(response)
      ? response[0]?.summary_text
      : response.summary_text;
  }

  /**
   * Question Answering - Extract answers from context
   * Provide a question and context, get specific answer
   */
  async questionAnswering(
    question: string,
    context: string,
    model = 'deepset/roberta-base-squad2'
  ) {
    const payload = {
      inputs: {
        question: question,
        context: context
      }
    };

    const response = await this.makeRequest(model, payload);
    
    // Returns {answer: string, score: number, start: number, end: number}
    return response;
  }

  /**
   * Embeddings - Convert text to vector representations
   * Used for semantic search, similarity, clustering
   */
  async embeddings(
    texts: string | string[],
    model = 'sentence-transformers/all-MiniLM-L6-v2'
  ) {
    const payload = {
      inputs: texts,
      options: { wait_for_model: true }
    };

    const response = await this.makeRequest(model, payload);
    
    // Returns array of float arrays (vectors)
    return response;
  }

  /**
   * Zero-Shot Classification - Classify without training
   * Classify text into any categories you define
   */
  async zeroShotClassification(
    text: string,
    candidateLabels: string[],
    model = 'facebook/bart-large-mnli'
  ) {
    const payload = {
      inputs: text,
      parameters: {
        candidate_labels: candidateLabels,
        multi_label: false
      }
    };

    const response = await this.makeRequest(model, payload);
    
    // Returns {labels: string[], scores: number[], sequence: string}
    return response;
  }

  /**
   * Token Classification (NER) - Named Entity Recognition
   * Identify people, places, organizations in text
   */
  async tokenClassification(
    text: string,
    model = 'dslim/bert-base-NER'
  ) {
    const payload = { inputs: text };
    
    const response = await this.makeRequest(model, payload);
    
    // Returns array of {entity_group, score, word, start, end}
    return response;
  }

  /**
   * Fill Mask - Complete sentences with missing words
   * Use [MASK] token to indicate where to fill
   */
  async fillMask(
    text: string,
    model = 'bert-base-uncased'
  ) {
    const payload = { inputs: text };
    
    const response = await this.makeRequest(model, payload);
    
    // Returns array of {token_str, score, token, sequence}
    return response;
  }
}

// Export singleton instance
export const hfModernClient = new ModernHuggingFaceClient();