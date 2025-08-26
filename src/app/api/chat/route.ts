import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { message, model = 'openai/gpt-3.5-turbo' } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001', // Required for OpenRouter
          'X-Title': 'OpenRouter Test App', // Optional, for better analytics
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    
    return NextResponse.json({ 
      response: aiResponse,
      model: model,
      usage: response.data.usage 
    });

  } catch (error: any) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to get response from AI',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
}