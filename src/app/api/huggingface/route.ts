import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface HuggingFaceRequest {
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      model = 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      temperature = 0.7,
      maxTokens = 500,
      systemPrompt = "You are a helpful assistant."
    }: HuggingFaceRequest = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
          parameters: {
            max_new_tokens: maxTokens,
            temperature: temperature,
            top_p: 0.95,
            do_sample: true,
            return_full_text: false,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    const aiResponse = Array.isArray(data) 
      ? data[0]?.generated_text || data[0]?.text || ''
      : data.generated_text || data.text || '';

    return NextResponse.json({
      response: aiResponse,
      model: model,
      provider: 'huggingface'
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Hugging Face API Error:', err.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to get response from Hugging Face',
        details: err.message 
      },
      { status: 500 }
    );
  }
}