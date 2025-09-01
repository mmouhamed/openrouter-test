import { NextRequest, NextResponse } from 'next/server';

// Add edge runtime configuration for Cloudflare compatibility
export const runtime = 'edge';


interface ChatAPIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatAPIRequest {
  message: string;                    // Current user message
  model?: string;                     // AI model to use
  conversationHistory?: ChatAPIMessage[]; // Previous messages for context
  contextWindowSize?: number;         // How many previous messages to include
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      message, 
      model = 'openai/gpt-4o',
      conversationHistory = [],
      contextWindowSize = 10 
    }: ChatAPIRequest = body;

    // Validation
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation context
    const messages: ChatAPIMessage[] = [];
    
    // Add conversation history (limited by context window)
    if (conversationHistory.length > 0) {
      // Take the most recent N messages based on context window size
      const recentHistory = conversationHistory.slice(-contextWindowSize);
      messages.push(...recentHistory);
      
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });


    // Use fetch instead of axios for edge runtime compatibility
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-app.pages.dev',
        'X-Title': 'ChatQora'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
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
      usage: data.usage,
      contextMessagesUsed: messages.length - 1
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    
    return NextResponse.json(
      { 
        error: 'Failed to get response from AI',
        details: err.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}