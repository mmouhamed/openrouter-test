'use client';

import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  timestamp: Date;
}

const MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', icon: '✨', provider: 'OpenAI', description: 'Most capable GPT model' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', icon: '🧠', provider: 'OpenAI', description: 'Fast and efficient' },
  { id: 'anthropic/claude-3.5-sonnet:beta', name: 'Claude 3.5 Sonnet', icon: '🎭', provider: 'Anthropic', description: 'Excellent for complex reasoning' },
  { id: 'anthropic/claude-3-haiku:beta', name: 'Claude 3 Haiku', icon: '🎋', provider: 'Anthropic', description: 'Quick and concise responses' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', icon: '🦙', provider: 'Meta', description: 'Open-source powerhouse' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', icon: '💎', provider: 'Google', description: 'Fast multimodal AI' },
  { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1', icon: '🔥', provider: 'DeepSeek', description: 'Advanced reasoning model' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder', icon: '💻', provider: 'Qwen', description: 'Code-specialized model' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [modelChangeToast, setModelChangeToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close model selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
    };

    if (showModelSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelSelector]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { 
      role: 'user', 
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          model: selectedModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        model: data.model,
        usage: data.usage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Something went wrong');
      console.error('Error:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
    inputRef.current?.focus();
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getModelInfo = (modelId: string) => {
    return MODELS.find(m => m.id === modelId) || MODELS[0];
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen max-w-5xl mx-auto relative">
        {/* Model Selector Dropdown - Fixed Positioned */}
        {showModelSelector && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowModelSelector(false)}></div>
            <div className="relative w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-96 overflow-hidden mx-4">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select AI Model</h3>
                  <button
                    onClick={() => setShowModelSelector(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelSelector(false);
                      setModelChangeToast(`Switched to ${model.name}`);
                      setTimeout(() => setModelChangeToast(null), 2000);
                    }}
                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation mb-1 ${
                      selectedModel === model.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg flex-shrink-0">{model.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{model.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0">
                            {model.provider}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{model.description}</p>
                      </div>
                      {selectedModel === model.id && (
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Model Change Toast */}
        {modelChangeToast && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{modelChangeToast}</span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-First Header */}
        <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm safe-area-top">
          <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                <img 
                  src="/chatbot-icon.svg" 
                  alt="ChatQora Logo" 
                  className="w-full h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">ChatQora</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  <span className="sm:hidden">{getModelInfo(selectedModel).name}</span>
                  <span className="hidden sm:inline">{getModelInfo(selectedModel).provider} • {getModelInfo(selectedModel).name}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              {/* Model Selector with Fixed Positioning */}
              <div className="relative" ref={modelSelectorRef}>
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                  disabled={isLoading}
                  title={`Current model: ${getModelInfo(selectedModel).name}`}
                >
                  <span className="text-sm sm:text-base">{getModelInfo(selectedModel).icon}</span>
                  <span className="text-xs sm:text-sm truncate max-w-16 sm:max-w-24">{getModelInfo(selectedModel).name}</span>
                  <svg 
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${showModelSelector ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {/* Clear Chat - Mobile Optimized */}
              <button
                onClick={clearChat}
                disabled={isLoading || messages.length === 0}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                title="Clear conversation"
              >
                <span className="sm:hidden">✕</span>
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        </header>

        {/* Chat Messages - Mobile Optimized */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center px-3 sm:px-4 py-6">
              <div className="max-w-sm sm:max-w-md text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
                  <img 
                    src="/chatbot-icon.svg" 
                    alt="ChatQora Logo" 
                    className="w-full h-full"
                  />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to ChatQora
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                  Start a conversation with {getModelInfo(selectedModel).name}. Ask questions, get help, or explore ideas together.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <button 
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left touch-manipulation"
                    onClick={() => setInput('Explain quantum computing simply')}
                  >
                    <span className="text-gray-700 dark:text-gray-300">&ldquo;Explain quantum computing simply&rdquo;</span>
                  </button>
                  <button 
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left touch-manipulation"
                    onClick={() => setInput('Help me write a Python function')}
                  >
                    <span className="text-gray-700 dark:text-gray-300">&ldquo;Help me write a Python function&rdquo;</span>
                  </button>
                  <button 
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left touch-manipulation"
                    onClick={() => setInput('What are the latest AI trends?')}
                  >
                    <span className="text-gray-700 dark:text-gray-300">&ldquo;What are the latest AI trends?&rdquo;</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6">
              {messages.map((message, index) => (
                <div key={index} className="group relative">
                  {message.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] sm:max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-md px-3 sm:px-4 py-2 sm:py-3">
                        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-2 sm:space-x-4">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                        <span className="text-xs sm:text-sm">{getModelInfo(message.model || selectedModel).icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            {getModelInfo(message.model || selectedModel).name}
                          </span>
                          {message.usage && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                              {message.usage.total_tokens} tokens
                            </span>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center space-x-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded touch-manipulation"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="hidden sm:inline">Copy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex space-x-2 sm:space-x-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                    <span className="text-xs sm:text-sm">{getModelInfo(selectedModel).icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {getModelInfo(selectedModel).name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">thinking...</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Error Display - Mobile Optimized */}
        {error && (
          <div className="p-3 sm:p-4 mx-3 sm:mx-4 mb-3 sm:mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center text-xs sm:text-sm text-red-800 dark:text-red-200">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="break-words">{error}</span>
            </div>
          </div>
        )}

        {/* Mobile-First Input Area */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm safe-area-bottom">
          <div className="max-w-3xl mx-auto p-3 sm:p-4">
            <form onSubmit={sendMessage} className="flex items-end space-x-2 sm:space-x-4">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="Message ChatQora..."
                  rows={1}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base transition-all resize-none overflow-hidden min-h-[44px] max-h-[120px]"
                  disabled={isLoading}
                  style={{
                    height: 'auto',
                    minHeight: '44px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-1.5 sm:right-2 bottom-2 sm:bottom-2.5 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center transition-colors disabled:cursor-not-allowed touch-manipulation"
                >
                  {isLoading ? (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
            <div className="flex items-center justify-center mt-2 sm:mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                ChatQora may produce inaccurate information about people, places, or facts.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}