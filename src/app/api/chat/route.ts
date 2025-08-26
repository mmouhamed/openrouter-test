import { NextRequest, NextResponse } from 'next/server';

// Add edge runtime configuration for Cloudflare compatibility
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { message, model = 'openai/gpt-3.5-turbo' } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use fetch instead of axios for edge runtime compatibility
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-app.pages.dev', // Update with your Cloudflare Pages URL
        'X-Title': 'AI Chat Hub'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return NextResponse.json({
      response: aiResponse,
      model: model,
      usage: data.usage 
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('OpenRouter API Error:', err.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to get response from AI',
        details: err.message 
      },
      { status: 500 }
    );
  }
}