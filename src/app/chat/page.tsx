'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useConversation } from '@/contexts/ConversationContext';
import { getConversationStorage } from '@/lib/storage/ConversationStorageManager';

const MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', icon: '🦙', provider: 'Meta', description: 'Open-source powerhouse' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder', icon: '💻', provider: 'Qwen', description: 'Code-specialized model' },
];

export default function ChatPage() {
  const {
    activeConversation,
    conversations,
    addMessage,
    createConversation,
    switchConversation,
    isLoading: conversationsLoading,
    error: conversationError
  } = useConversation();

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [modelChangeToast, setModelChangeToast] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeConversation?.messages) {
      scrollToBottom();
    }
  }, [activeConversation?.messages]);


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

  const handleModelSelect = useCallback((modelId: string) => {
    const model = MODELS.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model.id);
      setShowModelSelector(false);
      setModelChangeToast(`Switched to ${model.name}`);
      setTimeout(() => setModelChangeToast(null), 2000);
    }
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Ensure we have an active conversation
    let currentConversation = activeConversation;
    if (!currentConversation) {
      await createConversation('New Chat', selectedModel);
      currentConversation = getConversationStorage().getActiveConversation();
    }

    if (!currentConversation) {
      setError('Failed to create conversation');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // 1️⃣ Add user message to conversation
      await addMessage({
        role: 'user',
        content: input,
        model: selectedModel
      });

      const inputContent = input;
      setInput(''); // Clear input immediately for better UX

      // 2️⃣ Build conversation history for API context
      const contextWindow = getConversationStorage().buildContextWindow(currentConversation.id);
      const conversationHistory = contextWindow.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // 3️⃣ Call API with conversation history
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputContent,
          model: selectedModel,
          conversationHistory: conversationHistory,
          contextWindowSize: currentConversation.settings.contextWindowSize
        })
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // 4️⃣ Add assistant response to conversation
      await addMessage({
        role: 'assistant',
        content: data.response,
        model: selectedModel,
        usage: data.usage
      });

    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!activeConversation) return;
    
    try {
      // Create a new conversation instead of clearing (better UX)
      await createConversation('New Chat', selectedModel);
      inputRef.current?.focus();
    } catch (error) {
      // Silent fail - user will see no response if it fails
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      // Silent fail for copy operation
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

  const getConversationStats = () => {
    if (!activeConversation) return null;
    
    return {
      messageCount: activeConversation.messages.length,
      totalTokens: activeConversation.metadata.totalTokensUsed,
      title: activeConversation.title
    };
  };

  const stats = getConversationStats();

  return (
    <AppLayout>
      <div className="flex h-screen">
        {/* Conversation Sidebar */}
        {showConversations && (
          <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversations</h2>
                <button
                  onClick={() => setShowConversations(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => createConversation('New Chat', selectedModel)}
                className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Conversation
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => switchConversation(conversation.id)}
                  className={`w-full text-left p-3 mb-2 rounded-lg transition-colors ${
                    activeConversation?.id === conversation.id
                      ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {conversation.messages.length} messages • {formatTime(conversation.updatedAt)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Model Selector Dropdown */}
          {showModelSelector && (
            <div className="fixed inset-0 z-50">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
                onClick={() => setShowModelSelector(false)}
              />
              {/* Modal container with proper positioning */}
              <div className="relative z-10 flex items-start justify-center min-h-screen pt-16 sm:pt-20 pointer-events-none">
                <div className="w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-96 overflow-hidden mx-4 pointer-events-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select AI Model</h3>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowModelSelector(false);
                      }}
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
                      type="button"
                      data-model-id={model.id}
                      data-model-name={model.name}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleModelSelect(model.id);
                      }}
                      className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation mb-1 cursor-pointer border-none bg-transparent ${
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

          {/* Header with Stats */}
          <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
            <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                {/* Conversations Toggle */}
                <button
                  onClick={() => setShowConversations(!showConversations)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Toggle conversations"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>

                <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                  <img 
                    src="/chatbot-icon.svg" 
                    alt="ChatQora Logo" 
                    className="w-full h-full"
                  />
                </div>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {stats?.title || 'ChatQora'}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {stats ? `${stats.messageCount} messages` : 'Memory-enabled AI chat'}
                    {stats?.totalTokens ? ` • ${stats.totalTokens} tokens` : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
                {/* Model Selector */}
                <div className="relative" ref={modelSelectorRef}>
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    disabled={isLoading}
                    title={`Current model: ${selectedModel}`}
                  >
                    <span className="text-sm sm:text-base">
                      {MODELS.find(m => m.id === selectedModel)?.icon || '❓'}
                    </span>
                    <span className="text-xs sm:text-sm truncate max-w-16 sm:max-w-24">
                      {MODELS.find(m => m.id === selectedModel)?.name || 'Unknown Model'}
                    </span>
                    <svg 
                      className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Clear Chat */}
                <button
                  onClick={clearChat}
                  disabled={isLoading || !activeConversation?.messages.length}
                  className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="New conversation"
                >
                  <span className="sm:hidden">+</span>
                  <span className="hidden sm:inline">New</span>
                </button>
              </div>
            </div>
          </header>

          {/* Chat Messages */}
          <main className="flex-1 overflow-y-auto">
            {!activeConversation?.messages.length ? (
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
                    Start a conversation with {getModelInfo(selectedModel).name}. Your conversations are automatically saved with full memory.
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <button 
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      onClick={() => setInput('Explain quantum computing simply')}
                    >
                      <span className="text-gray-700 dark:text-gray-300">&ldquo;Explain quantum computing simply&rdquo;</span>
                    </button>
                    <button 
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      onClick={() => setInput('Help me write a Python function')}
                    >
                      <span className="text-gray-700 dark:text-gray-300">&ldquo;Help me write a Python function&rdquo;</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6">
                {activeConversation.messages.map((message, index) => (
                  <div key={message.id || index} className="group relative">
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
                              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center space-x-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
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
                
                {/* Loading indicator */}
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

          {/* Error Display */}
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

          {/* Input Area */}
          <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
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
                    className="absolute right-1.5 sm:right-2 bottom-2 sm:bottom-2.5 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center transition-colors disabled:cursor-not-allowed"
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
                  ChatQora remembers your entire conversation • {conversations.length} total conversations
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </AppLayout>
  );
}