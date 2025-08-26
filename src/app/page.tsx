'use client';

import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: Date;
}

const MODELS = [
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', icon: '🚀' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', icon: '🧠' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', icon: '✨' },
  { id: 'anthropic/claude-3-haiku:beta', name: 'Claude 3 Haiku', icon: '🎋' },
  { id: 'anthropic/claude-3.5-sonnet:beta', name: 'Claude 3.5 Sonnet', icon: '🎭' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', icon: '🦙' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash', icon: '💎' },
  { id: 'z-ai/glm-4.5-air:free', name: 'Z.AI: GLM 4.5 Air: Free', icon: '💎' },
  { id: 'qwen/qwen3-coder:', name: 'Qwen: Qwen3 Coder', icon: '💎' },
  { id: 'moonshotai/kimi-k2:free', name: 'MoonshotAI: Kimi K2: Free', icon: '💎' },
  { id: 'meta-llama/llama-3.3-8b-instruct:free', name: 'lamma 3.3 8B', icon: '💎' },
  { id: 'deepseek/deepseek-r1-0528:free', name: 'Deep Seek (free)', icon: '💎' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta: Llama 3.3 70B Instruct', icon: '💎' },
];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getModelInfo = (modelId: string) => {
    return MODELS.find(m => m.id === modelId) || MODELS[0];
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Modern Header with Glassmorphism */}
        <header className="flex-shrink-0 backdrop-blur-md bg-white/70 dark:bg-gray-900/80 border-b border-white/20 dark:border-gray-700/50 shadow-sm rounded-xl mt-2 sm:mt-4">
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
                  Chat Assistant
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 hidden xs:block">
                  Ask anything to your AI assistant
                </p>
              </div>
              <button
                onClick={clearChat}
                className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg sm:rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none min-w-0 flex-shrink-0"
                disabled={isLoading}
              >
                <span className="hidden sm:inline">Clear Chat</span>
                <span className="sm:hidden">Clear</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  AI Model
                </label>
                <div className="relative">
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-600/50 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-gray-800 dark:text-gray-200"
                    disabled={isLoading}
                  >
                    {MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.icon} {model.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-sm sm:text-lg">
                    {getModelInfo(selectedModel).icon}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Modern Chat Messages Area */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 scroll-smooth custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-2xl">💬</span>
              </div>
              <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">Ready to Chat!</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Choose your AI model and start a conversation. Your messages will appear here with beautiful, modern styling.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className="flex flex-col max-w-[90%] sm:max-w-[85%] md:max-w-[70%]">
                    <div
                      className={`px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-sm transition-all duration-300 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto rounded-br-md'
                          : 'bg-white/80 dark:bg-gray-800/90 border border-white/30 dark:border-gray-600/50 text-gray-800 dark:text-gray-200 mr-auto rounded-bl-md'
                      }`}
                    >
                      {message.role === 'assistant' && message.model && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <span className="mr-1">{getModelInfo(message.model).icon}</span>
                          <span className="font-medium">{getModelInfo(message.model).name}</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                    <div className={`text-xs text-gray-400 dark:text-gray-500 mt-1 px-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md border border-white/30 dark:border-gray-600/50 text-gray-800 dark:text-gray-200 px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl rounded-bl-md shadow-sm max-w-[90%] sm:max-w-[85%] md:max-w-[70%]">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Error Display */}
        {error && (
          <div className="flex-shrink-0 px-2 sm:px-4 lg:px-6 py-2">
            <div className="bg-red-50 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl shadow-sm animate-fade-in">
              <div className="flex items-center text-sm sm:text-base">
                <span className="text-red-500 mr-1 sm:mr-2 text-sm">⚠️</span>
                <span className="font-medium">Error:</span>
                <span className="ml-1 sm:ml-2 break-words flex-1">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modern Input Form */}
        <footer className="flex-shrink-0 backdrop-blur-md bg-white/70 dark:bg-gray-900/80 border-t border-white/20 dark:border-gray-700/50">
          <div className="p-3 sm:p-4 lg:p-6">
            <form onSubmit={sendMessage} className="flex space-x-2 sm:space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-3 sm:px-4 py-3 pr-10 sm:pr-12 text-sm sm:text-base bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-600/50 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 resize-none"
                  disabled={isLoading}
                />
                <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm sm:text-base">
                  💬
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 sm:px-6 py-3 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl font-medium min-w-0 flex-shrink-0"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Send</span>
                    <span>🚀</span>
                  </div>
                )}
              </button>
            </form>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}