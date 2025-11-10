'use client';

import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import ConversationHistory from '@/components/ConversationHistory';
import MessageDisplay from '@/components/MessageDisplay';
import MemoryDashboard from '@/components/MemoryDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, ChatMessage } from '@/contexts/ChatContext';

const MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', icon: '🦙', provider: 'Meta', description: 'Free 70B parameter powerhouse' },
  { id: 'meta-llama/llama-3.2-11b-vision-instruct:free', name: 'Llama 3.2 Vision', icon: '👁️', provider: 'Meta', description: 'Free vision & text model' },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini', icon: '⚡', provider: 'Microsoft', description: 'Free lightweight model' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', icon: '💎', provider: 'Google', description: 'Free Google model' },
];

export default function ChatPage() {
  const { user, isAdmin } = useAuth();
  const { 
    activeConversation, 
    addMessage, 
    createConversation, 
    clearActiveConversation,
    getOptimizedContext,
    toggleMemoryForConversation
  } = useChat();
  
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [modelChangeToast, setModelChangeToast] = useState<string | null>(null);
  const [showMemoryDashboard, setShowMemoryDashboard] = useState(false);
  const [contextStats, setContextStats] = useState<{ size: number; tokens: number } | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const messages = user && activeConversation ? activeConversation.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Handle ESC key and prevent body scroll when modal is open
  useEffect(() => {
    if (showModelSelector) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowModelSelector(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showModelSelector]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Create a new conversation if user is logged in and no active conversation
    if (user && !activeConversation) {
      createConversation();
    }

    const userMessage: Omit<ChatMessage, 'id'> = { 
      role: 'user', 
      content: input,
      timestamp: new Date()
    };
    
    // Add to context if user is logged in, otherwise handle locally
    if (user) {
      addMessage(userMessage);
    }
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setError('');
    setContextStats(null);

    try {
      // Get optimized context using memory system if enabled
      let optimizedContext: any[] = [];
      try {
        const contextResult = user && activeConversation && activeConversation.memoryEnabled
          ? await Promise.race([
              getOptimizedContext(currentInput),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Memory context timeout')), 5000)
              )
            ])
          : [];
        optimizedContext = Array.isArray(contextResult) ? contextResult : [];
      } catch (memoryError) {
        console.warn('Memory system error, falling back to recent messages:', memoryError);
        // Fallback to recent messages if memory fails
        optimizedContext = user && activeConversation 
          ? activeConversation.messages.slice(-10)
          : [];
      }

      // Update context stats
      if (optimizedContext.length > 0) {
        const contextTokens = optimizedContext.reduce((acc, msg) => acc + Math.ceil(msg.content.length / 4), 0);
        setContextStats({ size: optimizedContext.length, tokens: contextTokens });
      }

      // Add timeout to the fetch request
      const controller = new AbortController();
      setAbortController(controller);
      timeoutIdRef.current = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      }, 60000); // 60 second timeout for free models (they can be slower)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: currentInput,
          model: selectedModel,
          conversationContext: optimizedContext,
          systemPrompt: activeConversation?.memoryEnabled 
            ? 'You are an AI assistant with access to conversation memory and context. Use the provided context to give more relevant and personalized responses.'
            : undefined
        })
      });


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();

      const assistantMessage: Omit<ChatMessage, 'id'> = {
        role: 'assistant',
        content: data.response,
        model: data.model,
        usage: data.usage,
        timestamp: new Date()
      };

      if (user) {
        addMessage(assistantMessage);
      }

      // Update context stats with response info
      if (data.contextSize) {
        setContextStats({ 
          size: data.contextSize, 
          tokens: data.estimatedTokens || 0 
        });
      }
    } catch (err: unknown) {
      const error = err as { message?: string; name?: string };
      
      // Handle different types of errors gracefully
      if (error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('terminated')) {
        setError('Request timed out. Please try again.');
      } else if (error.message?.includes('Failed to get response from AI')) {
        setError('AI service is temporarily unavailable. Please try again.');
      } else {
        setError(error.message || 'Something went wrong');
      }
      
      // Only log actual errors, not user-initiated aborts
      if (error.name !== 'AbortError' && !error.message?.includes('aborted')) {
        console.error('Error:', error.message);
      }
    } finally {
      // Clean up timeout and abort controller
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      try {
        abortController.abort();
      } catch (e) {
        // Ignore abort errors
      }
    }
    
    // Clean up timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    
    setAbortController(null);
    setIsLoading(false);
    setError('Generation stopped by user');
  };

  const clearChat = () => {
    if (user && activeConversation) {
      clearActiveConversation();
    }
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


  const getModelInfo = (modelId: string) => {
    return MODELS.find(m => m.id === modelId) || MODELS[0];
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen relative">
        {/* Model Selector Dropdown - Fixed Positioned */}
        {showModelSelector && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowModelSelector(false)}></div>
            <div 
              className="relative w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-96 overflow-hidden mx-4"
              onClick={(e) => e.stopPropagation()}
            >
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
        <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0">
                <img 
                  src="/chatbot-icon.svg" 
                  alt="ChatQora Logo" 
                  className="w-full h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                    {user ? `${user.name || user.username}` : 'ChatQora'}
                  </h1>
                  {activeConversation?.memoryEnabled && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                      🧠 Memory
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  {user && activeConversation && (
                    <span className="truncate">{activeConversation.title}</span>
                  )}
                  {contextStats && (
                    <span className="hidden sm:inline bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {contextStats.size} msgs • ~{contextStats.tokens} tokens
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Memory Toggle - Admin Only */}
              {user && isAdmin() && activeConversation && (
                <button
                  onClick={() => toggleMemoryForConversation(activeConversation.id)}
                  className={`p-2 rounded-lg transition-colors touch-manipulation ${
                    activeConversation.memoryEnabled 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title={activeConversation.memoryEnabled ? "Disable memory" : "Enable memory"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
              )}

              {/* Memory Dashboard - Admin Only with Memory Enabled */}
              {user && isAdmin() && activeConversation?.memoryEnabled && (
                <button
                  onClick={() => setShowMemoryDashboard(true)}
                  className="p-2 rounded-lg transition-colors touch-manipulation text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  title="Memory Dashboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              )}

              {/* History Button - Mobile First for authenticated users */}
              {user && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded-lg transition-colors touch-manipulation ${
                    showHistory 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title={showHistory ? "Close history" : "Open chat history"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showHistory ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </button>
              )}
              
              {/* Model Selector - Mobile Optimized */}
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center space-x-1 px-2 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                disabled={isLoading}
                title={`Current model: ${getModelInfo(selectedModel).name}`}
              >
                <span className="text-sm">{getModelInfo(selectedModel).icon}</span>
                <span className="hidden sm:block text-xs truncate max-w-20">{getModelInfo(selectedModel).name}</span>
                <svg 
                  className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${showModelSelector ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Clear Chat - Mobile Icon Only */}
              <button
                onClick={clearChat}
                disabled={isLoading || messages.length === 0}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors touch-manipulation"
                title="Clear conversation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Chat Messages - Mobile First */}
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center px-4 py-6">
              <div className="max-w-sm text-center">
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
            <div className="px-4 py-4">
              {messages.map((message, index) => (
                <MessageDisplay
                  key={index}
                  message={message}
                  getModelInfo={getModelInfo}
                  onCopy={copyMessage}
                />
              ))}
              
              {isLoading && (
                <div className="mb-6">
                  <div className="flex space-x-3">
                    {/* AI Avatar */}
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {getModelInfo(selectedModel).icon}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Typing Header */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {getModelInfo(selectedModel).name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          thinking...
                        </span>
                      </div>

                      {/* Typing Indicator */}
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
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
          <div className="p-4">
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
                  placeholder={activeConversation?.memoryEnabled ? "Message with memory..." : "Message ChatQora..."}
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
                {isLoading ? (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    className="absolute right-1.5 sm:right-2 bottom-2 sm:bottom-2.5 w-7 h-7 sm:w-8 sm:h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors touch-manipulation"
                    title="Stop generation"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="absolute right-1.5 sm:right-2 bottom-2 sm:bottom-2.5 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center transition-colors disabled:cursor-not-allowed touch-manipulation"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
            <div className="flex items-center justify-center mt-2 sm:mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                {activeConversation?.memoryEnabled 
                  ? 'Enhanced with AI memory for personalized conversations'
                  : 'ChatQora may produce inaccurate information about people, places, or facts.'
                }
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Conversation History - Only for authenticated users */}
      {user && (
        <ConversationHistory 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)} 
        />
      )}

      {/* Memory Dashboard - Only for admins */}
      {user && isAdmin() && (
        <MemoryDashboard 
          isOpen={showMemoryDashboard} 
          onClose={() => setShowMemoryDashboard(false)} 
        />
      )}
    </AppLayout>
  );
}