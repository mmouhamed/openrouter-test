'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, SystemHealth } from '@/types/chat';

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className = '' }: ChatInterfaceProps) {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Enhanced features
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [currentStrategy, setCurrentStrategy] = useState<string>('auto');
  const [processingStage, setProcessingStage] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [activeModel, setActiveModel] = useState<string>('');
  const [thinkingDots, setThinkingDots] = useState<number>(1);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Session ID (could be enhanced with proper session management)
  const sessionId = 'chat-session';

  useEffect(() => {
    // Load system health on mount
    fetchSystemHealth();
    
    // Focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch(`/api/chat?action=health`);
      const data = await response.json();
      setSystemHealth(data.health);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  // Dynamic loading stages with variation based on query type
  const getDynamicLoadingStages = (queryLength: number, hasComplexWords: boolean) => {
    const baseStages = [
      { stage: 'Analyzing query structure...', model: 'Smart Router', progress: 5 },
      { stage: 'Selecting optimal model...', model: 'Model Registry', progress: 15 },
    ];

    // Add model-specific stages based on likely routing
    if (queryLength > 200 || hasComplexWords) {
      baseStages.push(
        { stage: 'Activating Oracle Core...', model: 'Oracle Core', progress: 30 },
        { stage: 'Deep reasoning analysis...', model: 'Oracle Core', progress: 50 },
        { stage: 'Synthesizing complex response...', model: 'Fusion Engine', progress: 70 }
      );
    } else if (queryLength < 50) {
      baseStages.push(
        { stage: 'Engaging Phoenix Core...', model: 'Phoenix Core', progress: 30 },
        { stage: 'Rapid processing...', model: 'Phoenix Core', progress: 60 }
      );
    } else {
      baseStages.push(
        { stage: 'Initializing AI cores...', model: 'Phoenix Core', progress: 30 },
        { stage: 'Processing with neural fusion...', model: 'Fusion Engine', progress: 55 }
      );
    }

    baseStages.push(
      { stage: 'Optimizing response quality...', model: 'Quality Filter', progress: 85 },
      { stage: 'Finalizing output...', model: 'Response Engine', progress: 98 }
    );

    return baseStages;
  };

  // Animate thinking dots
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setThinkingDots(prev => (prev % 3) + 1);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Simulate processing stages
  const simulateProcessingStages = (message: string) => {
    // Generate dynamic stages based on query analysis
    const hasComplexWords = /\b(analyze|compare|comprehensive|detailed|complex|advanced|technical|algorithm|implementation)\b/i.test(message);
    const loadingStages = getDynamicLoadingStages(message.length, hasComplexWords);
    
    let currentStageIndex = 0;
    const stageInterval = setInterval(() => {
      if (currentStageIndex < loadingStages.length) {
        const stage = loadingStages[currentStageIndex];
        setProcessingStage(stage.stage);
        setActiveModel(stage.model);
        setProcessingProgress(stage.progress);
        currentStageIndex++;
      } else {
        clearInterval(stageInterval);
      }
    }, 400); // Change stage every 400ms

    return stageInterval;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');
    setProcessingStage('Initializing AI cores...');
    setProcessingProgress(0);
    setActiveModel('System');
    setSuggestions([]);

    // Start dynamic processing simulation
    const stageInterval = simulateProcessingStages(userMessage.content);
    const startTime = Date.now();

    try {
      // Processing options for future enhancement
      // const options: ProcessingOptions = {
      //   enableWebSearch: webSearchEnabled,
      //   priority: 'quality',
      //   maxSources: 3
      // };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          model: 'meta-llama/llama-3.3-8b-instruct:free' // Default model for now
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      if (data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          metadata: {
            model: data.model,
            processingTime: Date.now() - startTime,
            confidence: 0.85
          }
        };
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentStrategy('single');
        setConfidence(0.85);
        setSuggestions([]);
        
        console.log('💫 Response metadata:', {
          model: data.model,
          confidence: 0.85,
          processingTime: Date.now() - startTime
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Chat error:', error);
      setError((error as Error).message || 'Something went wrong. Please try again.');
      clearInterval(stageInterval);
    } finally {
      clearInterval(stageInterval);
      setIsLoading(false);
      setProcessingStage('');
      setProcessingProgress(0);
      setActiveModel('');
    }
  };

  const clearChat = async () => {
    try {
      await fetch(`/api/chat?action=clear&sessionId=${sessionId}`, {
        method: 'DELETE'
      });
      setMessages([]);
      setError('');
      setSuggestions([]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const useSuggestion = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const getStrategyIcon = (strategy: string) => {
    const icons = {
      single: '⚡',
      sequential: '🔄',
      parallel: '⚡⚡',
      consensus: '🤝',
      auto: '🎯'
    };
    return icons[strategy as keyof typeof icons] || '🤖';
  };

  const getStrategyName = (strategy: string) => {
    const names = {
      single: 'Single Model',
      sequential: 'Sequential Fusion',
      parallel: 'Parallel Fusion',
      consensus: 'Consensus Fusion',
      auto: 'Smart Routing'
    };
    return names[strategy as keyof typeof names] || 'Processing';
  };

  const formatTime = (date: Date | string | number) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chat System
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>3 AI Models Online</span>
                {confidence > 0 && (
                  <>
                    <span>•</span>
                    <span>{Math.round(confidence * 100)}% Confidence</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Strategy Display */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-lg">{getStrategyIcon(currentStrategy)}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getStrategyName(currentStrategy)}
              </span>
            </div>

            {/* Web Search Toggle */}
            <button
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                webSearchEnabled 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
              title={webSearchEnabled ? 'Web search enabled' : 'Web search disabled'}
            >
              <span>{webSearchEnabled ? '🌐' : '📚'}</span>
              <span className="text-sm font-medium">
                {webSearchEnabled ? 'Web' : 'Local'}
              </span>
            </button>

            {/* Clear Chat */}
            <button
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              title="Clear conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center px-6 py-12">
            <div className="max-w-md w-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-3">
                Welcome to ChatQora
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Powered by advanced AI models with intelligent routing technology.
              </p>
              <div className="grid gap-3 text-sm">
                <button 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => setInput('Explain machine learning in simple terms')}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    🧠 Explain complex concepts
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Get clear explanations with smart model routing
                  </div>
                </button>
                <button 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => setInput('What are the latest developments in AI for 2024?')}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    🌐 Search current information
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Get up-to-date information with web search
                  </div>
                </button>
                <button 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => setInput('Compare different programming paradigms')}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    ⚡ Complex analysis
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Leverage multi-model fusion for comprehensive answers
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4">
            {messages.map((message, index) => (
              <div key={index} className="mb-6">
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Assistant • {formatTime(message.timestamp)}
                        </span>
                        {message.metadata?.fusion && (
                          <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                            {getStrategyIcon(message.metadata.fusion.strategy.type)} {getStrategyName(message.metadata.fusion.strategy.type)}
                          </span>
                        )}
                      </div>
                    )}
                    {message.role === 'user' && (
                      <div className="flex items-center justify-end space-x-2 mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          You • {formatTime(message.timestamp)}
                        </span>
                        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <span className="text-gray-700 dark:text-gray-300 text-xs font-bold">U</span>
                        </div>
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className={`prose prose-sm max-w-none ${
                        message.role === 'user' 
                          ? 'prose-invert' 
                          : 'prose-gray dark:prose-invert'
                      }`}>
                        {message.content}
                      </div>
                      {message.metadata?.processingTime && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                          Processed in {message.metadata.processingTime}ms
                          {message.metadata.confidence && (
                            <> • {Math.round(message.metadata.confidence * 100)}% confidence</>
                          )}
                          {(message.metadata.sources?.length || 0) > 0 && (
                            <> • {message.metadata.sources?.length} sources</>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="mb-6">
                <div className="flex justify-start">
                  <div className="max-w-3xl w-full">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Assistant • {processingStage || 'Initializing...'}
                      </span>
                      {activeModel && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                          {activeModel}
                        </span>
                      )}
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Processing...</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{processingProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                            style={{width: `${processingProgress}%`}}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Animated Thinking */}
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div 
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                i < thinkingDots 
                                  ? 'bg-purple-500 scale-110' 
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            ></div>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          AI is processing your request{'.'.repeat(thinkingDots)}
                        </span>
                      </div>

                      {/* Current Model Status */}
                      {activeModel && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Active: <span className="font-medium text-gray-700 dark:text-gray-300">{activeModel}</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !isLoading && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>💡</span>
            <span>Suggestions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => useSuggestion(suggestion)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 px-6 py-3">
          <div className="flex items-center text-sm text-red-800 dark:text-red-200">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
        <form onSubmit={sendMessage} className="flex items-end space-x-3">
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
              placeholder="Ask anything... The AI will intelligently route your question to the best models."
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden min-h-[48px] max-h-[120px] transition-colors"
              disabled={isLoading}
              style={{
                height: 'auto',
                minHeight: '48px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed shadow-lg"
              title="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Phoenix, Oracle, Iris Cores Online</span>
            </span>
            {systemHealth?.overall.score && (
              <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                Health: {systemHealth.overall.score}%
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span>{webSearchEnabled ? '🌐 Web search active' : '📚 Local processing'}</span>
            <span>•</span>
            <span>Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}