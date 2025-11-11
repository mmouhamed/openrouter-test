'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, ChatMessage, Attachment } from '@/contexts/ChatContext';
import { useEnsembleNeuroFusion31 } from '@/utils/EnsembleNeuroFusion31';
import InteractiveProcessing from '@/components/InteractiveProcessing';
import EnhancedFileUpload from '@/components/EnhancedFileUpload';
import MessageDisplay from '@/components/MessageDisplay';

interface SmartChatInterfaceProps {
  className?: string;
}

export default function SmartChatInterface({ className = '' }: SmartChatInterfaceProps) {
  const { user } = useAuth();
  const { 
    activeConversation, 
    addMessage, 
    createConversation,
    getOptimizedContext
  } = useChat();
  
  const [isMobile, setIsMobile] = useState(false);
  
  // Initialize EnsembleNeuroFusion-3.1
  const {
    processRequest,
    systemStatus,
    systemName,
    version: _version
  } = useEnsembleNeuroFusion31(user?.id || 'anonymous', activeConversation?.id || 'default');
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [lastEnsembleInfo, setLastEnsembleInfo] = useState<{ model?: string; status?: string; confidence?: number; metadata?: Record<string, unknown> } | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [_processingStartTime, _setProcessingStartTime] = useState<number | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const messages = useMemo(() => {
    return user && activeConversation ? activeConversation.messages : [];
  }, [user, activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640);
      }
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // No need for periodic updates - systemStatus is updated automatically

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && selectedAttachments.length === 0) || isLoading) return;

    // Create a new conversation if user is logged in and no active conversation
    if (user && !activeConversation) {
      createConversation();
    }

    const userMessage: Omit<ChatMessage, 'id'> = { 
      role: 'user', 
      content: input,
      attachments: selectedAttachments.length > 0 ? selectedAttachments : undefined,
      timestamp: new Date()
    };
    
    // Add to context if user is logged in
    if (user) {
      addMessage(userMessage);
    }
    
    const currentInput = input;
    const currentAttachments = [...selectedAttachments];
    setInput('');
    setSelectedAttachments([]);
    setIsLoading(true);
    setError('');
    // _setProcessingStartTime(Date.now()); // Commented out as not used

    try {
      // Get optimized context for memory-enabled conversations
      let optimizedContext: ChatMessage[] = [];
      if (user && activeConversation && activeConversation.memoryEnabled) {
        try {
          const contextResult = await Promise.race([
            getOptimizedContext(currentInput),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Memory context timeout')), 5000)
            )
          ]);
          optimizedContext = Array.isArray(contextResult) ? contextResult : [];
        } catch (memoryError) {
          console.warn('Memory system error, falling back to recent messages:', memoryError);
          optimizedContext = activeConversation.messages.slice(-10);
        }
      }

      // Configure ensemble processing options
      const ensembleOptions = {
        userId: user?.id,
        conversationId: activeConversation?.id,
        conversationContext: optimizedContext,
        systemPrompt: activeConversation?.memoryEnabled ? 
          'You are an AI assistant with access to conversation memory and context. Use the provided context to give more relevant and personalized responses.' 
          : undefined,
        // Force ensemble for complex requests
        forceEnsemble: currentInput.length > 200 || 
                      /\b(analyze|compare|comprehensive|detailed|complex|advanced)\b/i.test(currentInput),
        // Suggest ensemble strategy based on content
        ensembleStrategy: currentAttachments.length > 0 ? 'parallel' : 
                         /\b(explain|teach|tutorial)\b/i.test(currentInput) ? 'sequential' :
                         /\b(verify|validate|check|accurate)\b/i.test(currentInput) ? 'consensus' :
                         'parallel'
      };

      // Set up abort controller for timeout handling
      const controller = new AbortController();
      setAbortController(controller);

      // Process through EnsembleNeuroFusion-3.1
      const result = await processRequest(
        currentInput, 
        currentAttachments, 
        ensembleOptions
      );

      // Update ensemble info
      setLastEnsembleInfo(
        (result as Record<string, unknown>).ensembleNeuroFusion || 
        (result as Record<string, unknown>).neuroFusion || 
        null
      );

      const assistantMessage: Omit<ChatMessage, 'id'> = {
        role: 'assistant',
        content: result.response,
        model: result.model,
        usage: result.usage,
        timestamp: new Date(),
        ensembleInfo: result.ensembleNeuroFusion || result.neuroFusion, // Add ensemble metadata
        routingInfo: result.ensembleNeuroFusion || result.neuroFusion // Backwards compatibility
      };

      if (user) {
        addMessage(assistantMessage);
      }

    } catch (err: unknown) {
      const error = err as { message?: string; name?: string };
      
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        setError('Request timed out. Please try again.');
      } else {
        setError(error.message || 'Something went wrong. Please try again.');
      }
      
      console.error('Smart chat error:', error);
    } finally {
      setIsLoading(false);
      setAbortController(null);
      // _setProcessingStartTime(null); // Commented out as not used
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      try {
        abortController.abort();
      } catch (_e) {
        // Ignore abort errors
      }
    }
    setAbortController(null);
    setIsLoading(false);
  };

  const handleAttachmentAdd = (attachment: Attachment) => {
    setSelectedAttachments(prev => [...prev, attachment]);
  };

  const clearAttachments = () => {
    setSelectedAttachments([]);
    setShowFileUpload(false);
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const getModelInfo = (modelId: string) => {
    // Map actual model IDs to neural core info
    const modelInfo: { [key: string]: { name: string; description: string } } = {
      'meta-llama/llama-3.3-8b-instruct:free': { 
        name: 'Phoenix Core', 
        icon: '🔥', 
        description: 'Primary Neural Core' 
      },
      'openai/gpt-oss-20b:free': { 
        name: 'Oracle Core', 
        icon: '🧠', 
        description: 'Advanced Reasoning Core' 
      },
      'qwen/qwen2.5-vl-32b-instruct:free': { 
        name: 'Iris Core', 
        icon: '👁️', 
        description: 'Vision Processing Core' 
      },
      'ensemble_fusion': {
        name: 'NeuroFusion-3.1',
        icon: '⚡',
        description: 'Ensemble Processing'
      },
      'system_fallback': {
        name: 'Assistant',
        icon: '🤖',
        description: 'Helpful guidance'
      }
    };

    return modelInfo[modelId] || { name: modelId, icon: '🔥', description: 'Neural Core' };
  };

  const getEnsembleStatusColor = (ensembleInfo: { status?: string } | null) => {
    if (!ensembleInfo) return 'text-gray-600';
    
    if (ensembleInfo.ensembleStrategy) {
      switch (ensembleInfo.ensembleStrategy) {
        case 'parallel': return 'text-purple-600';
        case 'sequential': return 'text-blue-600'; 
        case 'consensus': return 'text-green-600';
        case 'synthesis': return 'text-orange-600';
        default: return 'text-gray-600';
      }
    } else if (ensembleInfo.neuralCore) {
      return 'text-blue-600'; // Single neural core
    }
    
    return 'text-gray-600';
  };

  const getEnsembleStatusMessage = (ensembleInfo: { status?: string; model?: string; confidence?: number } | null) => {
    if (!ensembleInfo) return '';
    
    if (ensembleInfo.ensembleStrategy) {
      const modelsCount = ensembleInfo.modelsParticipated || 0;
      switch (ensembleInfo.ensembleStrategy) {
        case 'parallel':
          return `⚡ Parallel ensemble (${modelsCount} models) - Comprehensive analysis`;
        case 'sequential':
          return `🔄 Sequential ensemble (${modelsCount} models) - Enhanced response`;
        case 'consensus':
          return `✅ Consensus ensemble (${modelsCount} models) - Cross-validated`;
        case 'synthesis':
          return `🎯 Synthesis ensemble (${modelsCount} models) - Best combined`;
        default:
          return `⚡ Multi-model ensemble (${modelsCount} models)`;
      }
    } else if (ensembleInfo.neuralCore) {
      switch (ensembleInfo.neuralCore) {
        case 'Phoenix':
          return '🔥 Phoenix Core - Primary neural processing';
        case 'Oracle':
          return '🧠 Oracle Core - Advanced reasoning';
        case 'Iris':
          return '👁️ Iris Core - Vision processing';
        default:
          return `🔥 ${ensembleInfo.neuralCore} - Neural processing`;
      }
    }
    
    return '🤖 NeuroFusion-3.1 processing';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* NeuroFusion-3.1 Status Bar - Mobile Optimized */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Desktop Status Bar */}
        <div className="hidden md:block px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {systemName} Status:
              </span>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-600">
                  Phoenix: {systemStatus?.neuralCores?.primary?.status || 'online'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  systemStatus?.neuralCores?.reasoning?.status === 'available' ? 'bg-blue-500' : 'bg-yellow-500'
                }`}></span>
                <span className={systemStatus?.neuralCores?.reasoning?.status === 'available' ? 'text-blue-600' : 'text-yellow-600'}>
                  Oracle: {systemStatus?.neuralCores?.reasoning?.status || 'available'}
                  {systemStatus?.neuralCores?.reasoning?.nextAvailable !== 'now' && 
                    ` (${systemStatus?.neuralCores?.reasoning?.nextAvailable})`
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  systemStatus?.neuralCores?.vision?.status === 'available' ? 'bg-purple-500' : 'bg-red-500'
                }`}></span>
                <span className={systemStatus?.neuralCores?.vision?.status === 'available' ? 'text-purple-600' : 'text-red-600'}>
                  Iris: {systemStatus?.neuralCores?.vision?.status || 'maintenance'}
                  {systemStatus?.neuralCores?.vision?.nextAvailable !== 'now' && 
                    ` (${systemStatus?.neuralCores?.vision?.nextAvailable})`
                  }
                </span>
              </div>
              {systemStatus?.ensembleIntelligence && (
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  <span className="text-purple-600">
                    Ensemble: Active ({systemStatus.ensembleIntelligence.maxConcurrentModels} cores)
                  </span>
                </div>
              )}
            </div>
            <div className="text-gray-500">
              Efficiency: {systemStatus?.system?.efficiency || '95%'} | 
              Synapses: {systemStatus?.system?.totalSynapses || 0}
            </div>
          </div>
        </div>
        
        {/* Mobile Status Bar - Compact */}
        <div className="md:hidden px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {systemName}
              </span>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  systemStatus?.neuralCores?.vision?.status === 'available' ? 'bg-purple-500' : 'bg-red-500'
                }`}></span>
              </div>
              {systemStatus?.ensembleIntelligence && (
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                  <span className="text-purple-600 text-xs">
                    Ensemble
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-gray-500">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center px-4 py-6">
            <div className="max-w-md w-full text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-white font-bold text-lg sm:text-xl">C</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white mb-3">
                How can I help you today?
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 leading-relaxed">
                I&apos;m ChatQora, powered by NeuroFusion technology that combines multiple AI models for enhanced responses.
              </p>
              <div className="grid gap-3 text-sm">
                <button 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => setInput('Explain machine learning concepts in simple terms')}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    Explain complex topics
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Break down machine learning concepts
                  </div>
                </button>
                <button 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => setInput('Help me brainstorm ideas for a mobile app')}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    Creative brainstorming
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Generate ideas for your next project
                  </div>
                </button>
                <button 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => setShowFileUpload(true)}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    Analyze images and files
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Upload content for AI analysis
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4">
            {messages.map((message, index) => (
              <div key={index}>
                <MessageDisplay
                  message={message}
                  getModelInfo={getModelInfo}
                  onCopy={copyMessage}
                />
                {/* Show ensemble info for assistant messages */}
                {message.role === 'assistant' && (message.ensembleInfo || message.routingInfo) && (
                  <div className="ml-11 mb-4 text-xs">
                    <span className={`${getEnsembleStatusColor(message.ensembleInfo || message.routingInfo)} font-medium`}>
                      {getEnsembleStatusMessage(message.ensembleInfo || message.routingInfo)}
                    </span>
                    {(message.ensembleInfo?.fusionConfidence || message.routingInfo?.complexity) && (
                      <span className="text-gray-500 ml-2">
                        {message.ensembleInfo?.fusionConfidence && 
                          `(Confidence: ${(message.ensembleInfo.fusionConfidence * 100).toFixed(1)}%)`
                        }
                        {message.routingInfo?.complexity?.score && 
                          `(Complexity: ${message.routingInfo.complexity.score})`
                        }
                      </span>
                    )}
                    {message.ensembleInfo?.qualityImprovement > 0 && (
                      <span className="text-green-500 ml-2">
                        ↗ Quality improved
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="mb-6 flex justify-center">
                <InteractiveProcessing
                  ensembleStrategy={lastEnsembleInfo?.ensembleStrategy || 'parallel'}
                  hasAttachments={selectedAttachments.length > 0}
                  estimatedTime={selectedAttachments.length > 0 ? 15000 : 10000}
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 mx-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center text-sm text-red-800 dark:text-red-200">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Enhanced File Upload Modal - Mobile Optimized */}
      {showFileUpload && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full sm:max-w-2xl bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    📎 Attach Files for Analysis
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Upload images, documents, or files for AI analysis
                  </p>
                </div>
                <button
                  onClick={() => setShowFileUpload(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
              <EnhancedFileUpload
                onFileSelect={handleAttachmentAdd}
                disabled={isLoading}
                multiple={true}
                maxFiles={10}
                maxFileSize={10}
              />
            </div>

            {selectedAttachments.length > 0 && (
              <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedAttachments.length} file{selectedAttachments.length !== 1 ? 's' : ''} ready
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={clearAttachments}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 transition-colors touch-manipulation"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFileUpload(false)}
                      className="px-4 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors touch-manipulation"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
        <div className="p-4">
          {/* Attachment Preview - Compact */}
          {selectedAttachments.length > 0 && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  📎 {selectedAttachments.length} file{selectedAttachments.length !== 1 ? 's' : ''} attached
                </span>
                <button
                  onClick={clearAttachments}
                  className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {selectedAttachments.slice(0, 6).map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group"
                  >
                    {attachment.type.startsWith('image/') ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        📄
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs text-center px-1">
                        {attachment.name.length > 12 
                          ? attachment.name.substring(0, 12) + '...' 
                          : attachment.name}
                      </span>
                    </div>
                  </div>
                ))}
                {selectedAttachments.length > 6 && (
                  <div className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      +{selectedAttachments.length - 6}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={sendMessage} className="flex items-end space-x-2 sm:space-x-3">
            {/* Attach Files Button */}
            <button
              type="button"
              onClick={() => setShowFileUpload(true)}
              disabled={isLoading}
              className="flex-shrink-0 p-2.5 sm:p-3 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              title="Attach files for analysis"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
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
                placeholder={
                  selectedAttachments.length > 0
                    ? "Describe what you want me to analyze..."
                    : isMobile 
                      ? "Message ChatQora..."
                      : "Ask anything... NeuroFusion will intelligently process your request..."
                }
                rows={1}
                className="w-full px-3 sm:px-4 py-3 pr-12 sm:pr-14 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden min-h-[44px] sm:min-h-[48px] max-h-[120px] transition-colors text-sm sm:text-base"
                disabled={isLoading}
                style={{
                  height: 'auto',
                  minHeight: isMobile ? '44px' : '48px'
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
                  className="absolute right-2 bottom-2.5 w-7 h-7 sm:w-8 sm:h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg touch-manipulation"
                  title="Stop generation"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && selectedAttachments.length === 0}
                  className="absolute right-2 bottom-2.5 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed shadow-lg touch-manipulation"
                  title="Send message"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              )}
            </div>
          </form>
          
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <span className="truncate">
                {selectedAttachments.length > 0
                  ? '⚡ Multi-modal ensemble'
                  : '🧠 Neural routing'
                }
              </span>
              {systemStatus?.system?.efficiency && (
                <span className="hidden sm:inline bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs">
                  {systemStatus.system.efficiency} efficient
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="hidden sm:inline">{systemName} Online</span>
              <span className="sm:hidden">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}