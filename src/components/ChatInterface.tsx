'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, SystemHealth, QueryAnalysis, RoutingDecision } from '@/types/chat';
import { smartChatAgent, SmartRecommendation } from '@/lib/SmartChatAgent';
import RichMessageRenderer from './RichMessageRenderer';
import FusionProgress from './FusionProgress';
// import FusionComparison from './FusionComparison';

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
  const [, setSuggestions] = useState<string[]>([]);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [activeModel, setActiveModel] = useState<string>('');
  const [thinkingDots, setThinkingDots] = useState<number>(1);
  const [dynamicLoadingMessage, setDynamicLoadingMessage] = useState<string>('');
  const [processingKeywords, setProcessingKeywords] = useState<string[]>([]);
  
  // Smart Agent features
  const [smartRecommendations, setSmartRecommendations] = useState<SmartRecommendation[]>([]);
  const [usageHints, setUsageHints] = useState<string[]>([]);
  const [queryAnalysis, setQueryAnalysis] = useState<QueryAnalysis | null>(null);
  const [, setRoutingDecision] = useState<RoutingDecision | null>(null);
  const [selectedModel] = useState<string>('AI Fusion'); // Always use AI Fusion
  // const [showIndividualResponses, setShowIndividualResponses] = useState<boolean>(false);
  const [fusionProgress] = useState<{
    stage: 'initializing' | 'querying' | 'synthesizing' | 'completed' | 'error';
    modelProgress: { [modelId: string]: number };
    synthesisProgress: number;
    message: string;
  } | null>(null);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const [lastRecommendationUpdate, setLastRecommendationUpdate] = useState<Date | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Session ID (could be enhanced with proper session management)
  const sessionId = 'chat-session';

  const loadUsageHints = useCallback(async () => {
    try {
      const hints = smartChatAgent.generateUsageSuggestions({
        previousQueries: messages.map(m => m.content).slice(-10)
      });
      setUsageHints(hints);
    } catch (error) {
      console.error('Failed to load usage hints:', error);
    }
  }, [messages]);

  useEffect(() => {
    // Load system health on mount
    fetchSystemHealth();
    
    // Load usage hints
    loadUsageHints();
    
    // Focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [loadUsageHints]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close recommendations when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showRecommendations && !target.closest('.recommendations-container')) {
        setShowRecommendations(false);
      }
    };

    if (showRecommendations) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showRecommendations]);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch(`/api/chat?action=health`);
      const data = await response.json();
      setSystemHealth(data.health);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  // Enhanced dynamic loading stages with realistic AI system variations
  const getDynamicLoadingStages = (queryLength: number, hasComplexWords: boolean) => {
    const baseStages = [
      { stage: 'Initializing request handler...', model: 'Neural Gateway', progress: 3 },
      { stage: 'Parsing query semantics...', model: 'Language Processor', progress: 8 },
      { stage: 'Analyzing complexity metrics...', model: 'Smart Router', progress: 15 },
    ];

    // Add model-specific stages based on likely routing with more variety
    if (queryLength > 200 || hasComplexWords) {
      const complexStages = [
        { stage: 'Engaging Oracle reasoning matrix...', model: 'Oracle Core Prime', progress: 25 },
        { stage: 'Activating deep analysis modules...', model: 'Oracle Cognitive Engine', progress: 35 },
        { stage: 'Processing multi-dimensional context...', model: 'Context Analyzer', progress: 45 },
        { stage: 'Synthesizing comprehensive insights...', model: 'Knowledge Synthesizer', progress: 60 },
        { stage: 'Cross-referencing expert databases...', model: 'Domain Specialist', progress: 75 }
      ];
      baseStages.push(...complexStages);
    } else if (queryLength < 50) {
      const quickStages = [
        { stage: 'Spinning up Phoenix rapid core...', model: 'Phoenix Lightning', progress: 25 },
        { stage: 'Executing fast-track processing...', model: 'Speed Optimizer', progress: 45 },
        { stage: 'Delivering instant insights...', model: 'Rapid Response Unit', progress: 65 }
      ];
      baseStages.push(...quickStages);
    } else {
      const standardStages = [
        { stage: 'Initializing multi-core processing...', model: 'Phoenix Fusion Core', progress: 25 },
        { stage: 'Coordinating AI model collaboration...', model: 'Model Orchestrator', progress: 35 },
        { stage: 'Executing parallel computation...', model: 'Distributed Processor', progress: 50 },
        { stage: 'Integrating diverse perspectives...', model: 'Perspective Merger', progress: 65 }
      ];
      baseStages.push(...standardStages);
    }

    const finalStages = [
      { stage: 'Conducting accuracy validation...', model: 'Quality Assurance AI', progress: 82 },
      { stage: 'Optimizing user experience...', model: 'UX Enhancement Engine', progress: 88 },
      { stage: 'Preparing intelligent delivery...', model: 'Smart Delivery System', progress: 94 },
      { stage: 'Finalizing premium response...', model: 'Response Optimizer', progress: 98 }
    ];

    baseStages.push(...finalStages);
    return baseStages;
  };

  // Enhanced dynamic loading messages with realistic delivery variations
  const getDynamicProcessingMessages = (progress: number, userQuery: string) => {
    const queryKeywords = userQuery.toLowerCase().match(/\b(algorithm|data|code|analysis|design|system|model|process|compare|explain|create|build|implement|optimize|debug|test|architecture|framework|solution|performance|security|database|api|machine learning|ai|programming|development|software|technical|business|marketing|strategy|finance|research|study|learn|understand|concept|theory|practice|application|example|tutorial|guide|help|support|documentation|reference|overview|summary|details|features|benefits|advantages|disadvantages|pros|cons|comparison|difference|similarity|relationship|connection|integration|implementation|deployment|maintenance|scalability|reliability|efficiency|effectiveness|innovation|technology|digital|automation|cloud|mobile|web|frontend|backend|fullstack|devops|agile|scrum|kanban|project|management|leadership|team|collaboration|communication|presentation|report|analysis|dashboard|metrics|kpi|roi|conversion|growth|revenue|customer|user|experience|interface|design|visual|graphics|layout|typography|color|branding|marketing|sales|promotion|advertising|social|media|content|seo|analytics|tracking|monitoring|optimization|testing|qa|quality|assurance|control|validation|verification|compliance|standards|best practices|guidelines|recommendations|tips|tricks|hacks|shortcuts|tools|resources|libraries|frameworks|platforms|services|solutions|products|applications|software|hardware|infrastructure|network|server|database|storage|backup|recovery|disaster|security|privacy|encryption|authentication|authorization|access|permissions|roles|users|accounts|profiles|settings|configuration|customization|personalization|preferences|options|choices|selections|decisions|criteria|requirements|specifications|constraints|limitations|challenges|problems|issues|bugs|errors|exceptions|handling|debugging|troubleshooting|fixing|resolving|solving|improving|enhancing|upgrading|updating|migrating|refactoring|restructuring|reorganizing|streamlining|simplifying|clarifying|explaining|documenting|teaching|learning|training|coaching|mentoring|guiding|supporting|helping|assisting|facilitating|enabling|empowering|motivating|inspiring|encouraging|engaging|involving|participating|contributing|collaborating|cooperating|coordinating|communicating|connecting|networking|building|creating|developing|designing|planning|organizing|managing|leading|directing|controlling|monitoring|tracking|measuring|evaluating|assessing|reviewing|analyzing|researching|investigating|exploring|discovering|identifying|recognizing|understanding|comprehending|grasping|learning|absorbing|retaining|remembering|recalling|applying|using|utilizing|implementing|executing|performing|operating|running|functioning|working|processing|computing|calculating|determining|deciding|choosing|selecting|picking|opting|preferring|favoring|recommending|suggesting|proposing|offering|providing|delivering|supplying|serving|supporting|maintaining|sustaining|continuing|persisting|persevering|enduring|lasting|remaining|staying|keeping|holding|retaining|preserving|protecting|safeguarding|securing|defending|shielding|covering|wrapping|packaging|bundling|grouping|organizing|arranging|structuring|formatting|styling|designing|crafting|building|constructing|assembling|putting together|combining|merging|integrating|connecting|linking|joining|uniting|bringing together|gathering|collecting|accumulating|aggregating|summarizing|condensing|compressing|reducing|minimizing|optimizing|improving|enhancing|boosting|increasing|maximizing|expanding|extending|scaling|growing|developing|evolving|advancing|progressing|moving forward|proceeding|continuing|persisting|maintaining|sustaining|supporting|enabling|facilitating|streamlining|automating|digitizing|modernizing|updating|upgrading|improving|optimizing|fine-tuning|calibrating|adjusting|modifying|customizing|personalizing|tailoring|adapting|fitting|matching|aligning|synchronizing|coordinating|balancing|harmonizing|stabilizing|normalizing|standardizing|regularizing|systematizing|organizing|structuring|formalizing|documenting|recording|logging|tracking|monitoring|observing|watching|checking|verifying|validating|confirming|ensuring|guaranteeing|securing|protecting|safeguarding)\b/g) || [];
    
    const stages = [
      { min: 0, max: 15, 
        messages: [
          'Receiving your request...', 'Parsing query structure...', 'Understanding context...', 
          'Initializing AI cores...', 'Activating neural pathways...', 'Loading cognitive modules...',
          'Establishing data connections...', 'Warming up processing units...', 'Calibrating response engines...'
        ], 
        keywords: [...new Set(queryKeywords)].slice(0, 3) 
      },
      { min: 15, max: 35, 
        messages: [
          'Selecting optimal AI models...', 'Routing to specialized cores...', 'Analyzing query complexity...', 
          'Distributing computational load...', 'Engaging Phoenix AI system...', 'Activating Oracle reasoning engine...',
          'Initializing Wizard creativity module...', 'Spinning up parallel processors...', 'Orchestrating model collaboration...',
          'Establishing inter-model communication...', 'Configuring fusion parameters...'
        ], 
        keywords: ['neural networks', 'deep learning', 'optimization', 'routing', 'selection'] 
      },
      { min: 35, max: 55, 
        messages: [
          'Generating comprehensive insights...', 'Cross-referencing knowledge bases...', 'Building detailed response...', 
          'Synthesizing multi-model perspectives...', 'Conducting deep analysis...', 'Processing contextual information...',
          'Extracting relevant patterns...', 'Correlating data points...', 'Generating creative solutions...',
          'Performing logical reasoning...', 'Integrating domain expertise...', 'Validating information accuracy...'
        ], 
        keywords: [...new Set(queryKeywords)].slice(3, 6).concat(['insights', 'analysis', 'synthesis']) 
      },
      { min: 55, max: 75, 
        messages: [
          'Refining response structure...', 'Optimizing content clarity...', 'Enhancing explanation quality...', 
          'Structuring comprehensive output...', 'Polishing technical details...', 'Organizing information hierarchy...',
          'Improving readability flow...', 'Adding contextual examples...', 'Balancing depth and clarity...',
          'Ensuring accuracy standards...', 'Fine-tuning response tone...', 'Optimizing user comprehension...'
        ], 
        keywords: ['refinement', 'optimization', 'structure', 'clarity', 'enhancement'] 
      },
      { min: 75, max: 92, 
        messages: [
          'Conducting quality assurance...', 'Performing final validations...', 'Running accuracy checks...', 
          'Verifying response completeness...', 'Ensuring factual consistency...', 'Checking logical coherence...',
          'Validating source credibility...', 'Testing response usefulness...', 'Confirming answer relevance...',
          'Applying safety filters...', 'Reviewing ethical guidelines...', 'Finalizing quality metrics...'
        ], 
        keywords: ['validation', 'verification', 'quality', 'accuracy', 'assurance'] 
      },
      { min: 92, max: 100, 
        messages: [
          'Preparing delivery package...', 'Formatting final response...', 'Optimizing display layout...', 
          'Packaging response data...', 'Applying final polish...', 'Preparing user presentation...',
          'Finalizing output structure...', 'Completing delivery protocol...', 'Generating response metadata...',
          'Preparing interactive elements...', 'Optimizing mobile compatibility...', 'Delivering premium results...',
          'Finalizing AI-powered insights...', 'Completing intelligent analysis...', 'Ready for user consumption...'
        ], 
        keywords: ['finalization', 'delivery', 'completion', 'presentation', 'optimization'] 
      }
    ];
    
    const currentStage = stages.find(stage => progress >= stage.min && progress <= stage.max) || stages[0];
    const messageIndex = Math.floor(Date.now() / 2500) % currentStage.messages.length;
    const keywordIndex = Math.floor(Date.now() / 2000) % Math.max(1, currentStage.keywords.length);
    
    return {
      message: currentStage.messages[messageIndex],
      keyword: currentStage.keywords[keywordIndex] || 'processing'
    };
  };

  // Animate thinking dots and dynamic messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let messageInterval: NodeJS.Timeout;
    
    if (isLoading) {
      // Update dots
      interval = setInterval(() => {
        setThinkingDots(prev => (prev % 3) + 1);
      }, 500);
      
      // Update dynamic messages with psychological timing
      messageInterval = setInterval(() => {
        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage?.role === 'user' ? lastMessage.content : '';
        const dynamic = getDynamicProcessingMessages(processingProgress, userQuery);
        setDynamicLoadingMessage(dynamic.message);
        
        // Extract and rotate keywords with more variety
        const allKeywords = userQuery.toLowerCase().match(/\b\w+\b/g) || ['processing', 'analyzing', 'computing'];
        const uniqueKeywords = [...new Set(allKeywords)].filter(word => word.length > 3).slice(0, 8);
        setProcessingKeywords(uniqueKeywords);
      }, 2000 + Math.random() * 1000); // 2-3 seconds with randomness for natural feel
    }
    
    return () => {
      clearInterval(interval);
      clearInterval(messageInterval);
    };
  }, [isLoading, processingProgress, messages]);

  // Enhanced psychological processing stages simulation
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
    }, getVariableStageDelay(currentStageIndex, loadingStages.length)); // Variable timing for realism

    return stageInterval;
  };

  // Psychological timing: faster at start, slower in middle, faster at end
  const getVariableStageDelay = (stageIndex: number, totalStages: number): number => {
    const progress = stageIndex / totalStages;
    
    if (progress < 0.2) {
      // Fast start - creates immediate engagement
      return 300 + Math.random() * 200; // 300-500ms
    } else if (progress < 0.7) {
      // Slower middle - builds anticipation
      return 600 + Math.random() * 400; // 600-1000ms
    } else {
      // Fast finish - satisfying completion
      return 250 + Math.random() * 150; // 250-400ms
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check for correction patterns
    const correctionPatterns = [
      /actually.*is.*(\d{4})/i,
      /correct.*date.*is/i,
      /we.*are.*in.*(\d{4})/i,
      /current.*year.*is.*(\d{4})/i,
      /it.*is.*(\d{4})/i,
      /(no|incorrect).*link/i,
      /broken.*link/i,
      /that.*link.*doesn't.*work/i
    ];
    
    const isCorrection = correctionPatterns.some(pattern => pattern.test(input.trim()));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      metadata: {
        isCorrection
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');
    setProcessingStage('Analyzing query with Smart Agent...');
    setProcessingProgress(0);
    setActiveModel('Smart Agent');
    setSuggestions([]);
    
    // Clear old recommendations - fresh ones will be generated after response
    setSmartRecommendations([]);

    let stageInterval: NodeJS.Timeout | undefined;

    try {
      // Use Smart Agent to analyze query and route to optimal model
      const smartAnalysis = await smartChatAgent.processQuery(
        userMessage.content,
        messages.slice(-5).map(m => m.content)
      );

      setQueryAnalysis(smartAnalysis.analysis);
      setRoutingDecision(smartAnalysis.routing);
      
      // Update UI with smart insights
      setProcessingStage(`Smart routing: ${smartAnalysis.routing.reasoning}`);
      setActiveModel(smartAnalysis.modelRecommendation.split('/').pop()?.split(':')[0] || 'Unknown');
      
      // Determine which model to use
      const modelToUse = selectedModel === 'auto' 
        ? smartAnalysis.modelRecommendation 
        : selectedModel;

      setCurrentStrategy(smartAnalysis.routing.strategy);
      setConfidence(smartAnalysis.routing.confidence);

      // Start dynamic processing simulation
      stageInterval = simulateProcessingStages(userMessage.content);
      const startTime = Date.now();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          model: 'AI Fusion',
          enableWebSearch: webSearchEnabled,
          maxSources: 5,
          conversationContext: [...messages, userMessage].slice(-6).map(msg => ({
            role: msg.role,
            content: msg.content,
            model: msg.metadata?.model,
            isCorrection: msg.metadata?.isCorrection
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      if (data.response) {
        // Debug: Log the sources data
        console.log('🔍 Web Search Debug Info:', {
          webSearchEnabled,
          apiSources: data.sources,
          sourcesLength: data.sources?.length || 0,
          webSearchUsed: data.webSearchUsed,
          hasSourcesArray: Array.isArray(data.sources)
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          metadata: {
            model: data.model,
            processingTime: Date.now() - startTime,
            confidence: data.fusion ? data.fusion.confidence : smartAnalysis.routing.confidence,
            sources: data.sources || [],
            analysis: smartAnalysis.analysis,
            routing: smartAnalysis.routing,
            fusion: data.fusion || null
          }
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Use dynamic LLM-generated recommendations from API
        const dynamicRecommendations = data.dynamicRecommendations || [];
        console.log('🔄 Updating recommendations after response:', {
          newRecommendationsCount: dynamicRecommendations.length,
          messageCount: messages.length + 1, // +1 for the message we just added
          conversationContextSent: messages.slice(-5).length
        });
        
        setSmartRecommendations(dynamicRecommendations);
        setLastRecommendationUpdate(new Date());
        
        // Update suggestions with dynamic recommendations
        setSuggestions(dynamicRecommendations.map((r: SmartRecommendation) => r.text));
        
        // Add to smart agent history
        smartChatAgent.addToHistory('assistant', data.response, data.model, smartAnalysis.analysis);
        
        // Update usage hints
        loadUsageHints();
        
        console.log('💫 Enhanced Response metadata:', {
          model: data.model,
          confidence: smartAnalysis.routing.confidence,
          processingTime: Date.now() - startTime,
          sourcesCount: data.sources?.length || 0,
          webSearchUsed: data.webSearchUsed,
          strategy: smartAnalysis.routing.strategy,
          dynamicRecommendationsCount: dynamicRecommendations.length,
          queryComplexity: smartAnalysis.analysis.complexity,
          recommendationType: 'LLM-generated'
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Chat error:', error);
      setError((error as Error).message || 'Something went wrong. Please try again.');
    } finally {
      if (stageInterval) {
        clearInterval(stageInterval);
      }
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
    setShowRecommendations(false); // Close recommendations dropdown
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
    <div className={`flex flex-col min-h-screen mobile-vh bg-gray-50 dark:bg-gray-900 overscroll-contain ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-lg">AI</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                ChatQora
              </h1>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>4 AI Models Online</span>
                {confidence > 0 && (
                  <>
                    <span>•</span>
                    <span>{Math.round(confidence * 100)}% Confidence</span>
                  </>
                )}
                {queryAnalysis && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{queryAnalysis.complexity} Query</span>
                  </>
                )}
                {messages.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{messages.length} Messages</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-wrap gap-1 sm:gap-2">
            {/* Strategy Display - Hidden on small screens */}
            <div className="hidden md:flex items-center space-x-2 px-2 lg:px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-lg">{getStrategyIcon(currentStrategy)}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getStrategyName(currentStrategy)}
              </span>
            </div>

            {/* AI Fusion Status Display */}
            <div className="px-2 lg:px-3 py-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-600 rounded-lg text-xs lg:text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center space-x-2 min-w-0 flex-shrink">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span>🧠 AI Fusion Active</span>
            </div>

            {/* Web Search Toggle - Responsive */}
            <button
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 rounded-lg transition-colors flex-shrink-0 touch-manipulation ${
                webSearchEnabled 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
              title={webSearchEnabled ? 'Web search enabled' : 'Web search disabled'}
            >
              <span>{webSearchEnabled ? '🌐' : '📚'}</span>
              <span className="text-xs lg:text-sm font-medium">
                {webSearchEnabled ? 'Web' : 'Local'}
              </span>
            </button>

            {/* Clear Chat */}
            <button
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors touch-manipulation"
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
          <div className="px-4 sm:px-6 py-4 custom-scrollbar ios-scroll-fix">
            {messages.map((message, index) => (
              <div key={index} className="mb-6">
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-full sm:max-w-3xl chat-message ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
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
                    <div className={`p-3 sm:p-4 rounded-2xl animate-fade-in ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}>
                      {message.role === 'user' ? (
                        <div className="prose prose-sm max-w-none prose-invert">
                          {message.content}
                        </div>
                      ) : (
                        <RichMessageRenderer
                          content={message.content}
                          role={message.role}
                          messageId={message.id}
                          enableImageSearch={true}
                          enableInteractiveElements={true}
                        />
                      )}
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
                      
                      {/* Web Search Sources */}
                      {(() => {
                        const sources = message.metadata?.sources;
                        console.log('🔍 Sources Render Check:', {
                          messageId: message.id,
                          messageRole: message.role,
                          hasSources: !!sources,
                          sourcesLength: sources?.length || 0,
                          sourcesArray: sources
                        });
                        return sources && sources.length > 0;
                      })() && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <span>🌐</span>
                            <span>Sources:</span>
                          </div>
                          <div className="space-y-2">
                            {message.metadata?.sources?.slice(0, 3).map((source, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                      {source.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                      {source.snippet}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                        {source.source}
                                      </span>
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-xs text-green-600 dark:text-green-400">
                                        {Math.round(source.relevance * 100)}% relevant
                                      </span>
                                    </div>
                                  </div>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                                    title="Open source"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                              </div>
                            ))}
                            {(message.metadata?.sources?.length ?? 0) > 3 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                + {(message.metadata?.sources?.length ?? 0) - 3} more sources
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Fusion Comparison - Disabled until FusionMetadata matches component requirements */}
                      {/* {message.metadata?.fusion && (
                        <FusionComparison 
                          fusionData={message.metadata.fusion} 
                          fusedResponse={message.content}
                        />
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Fusion Progress */}
            {fusionProgress && (
              <FusionProgress progress={fusionProgress} />
            )}

            {isLoading && (
              <div className="mb-6">
                <div className="flex justify-start">
                  <div className="max-w-full sm:max-w-3xl w-full">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Assistant • {dynamicLoadingMessage || processingStage || 'Initializing...'}
                      </span>
                      {activeModel && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                          {activeModel}
                        </span>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl animate-pulse-glow">
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {processingProgress >= 95 ? (dynamicLoadingMessage || 'Processing...') : 'Processing...'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {processingProgress >= 98 ? 
                              <span className="animate-pulse">Finalizing...</span> : 
                              `${processingProgress}%`
                            }
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 via-purple-600 to-blue-600 h-1.5 rounded-full transition-all duration-700 ease-in-out relative"
                            style={{width: `${processingProgress}%`}}
                          >
                            {/* Shimmer effect for active processing */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Animated Thinking with Dynamic Keywords */}
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
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            AI is processing your request{'.'.repeat(thinkingDots)}
                          </span>
                          {processingKeywords.length > 0 && (
                            <div className="flex items-center space-x-1 mt-1">
                              <span className="text-xs text-gray-400 dark:text-gray-500">Processing:</span>
                              <div className="flex space-x-1">
                                {processingKeywords.slice(0, 3).map((keyword, index) => (
                                  <span 
                                    key={index}
                                    className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded animate-pulse"
                                    style={{ animationDelay: `${index * 0.3}s` }}
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
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

      {/* Smart Recommendations Loading State */}
      {smartRecommendations.length === 0 && !isLoading && messages.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>🤖</span>
            <span>Generating fresh AI suggestions...</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Recommendations - Hover Icon */}
      {smartRecommendations.length > 0 && !isLoading && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>🤖</span>
              <span>{smartRecommendations.length} AI-generated suggestions</span>
              {lastRecommendationUpdate && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  • Updated {lastRecommendationUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {queryAnalysis && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                  {queryAnalysis.complexity} • {queryAnalysis.domain}
                </span>
              )}
            </div>
            
            {/* Hover/Click Icon for Recommendations */}
            <div className="relative group recommendations-container">
              <button 
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                title="View smart recommendations"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {/* Hover Dropdown with improved positioning - Desktop hover + Mobile click */}
              <div className={`absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl transition-all duration-200 z-50 max-h-96 overflow-y-auto ${
                showRecommendations 
                  ? 'opacity-100 visible' 
                  : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
              }`}>
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-2">
                      <span>🧠</span>
                      <span>AI-Generated Suggestions</span>
                    </div>
                    <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                      Dynamic
                    </span>
                  </div>
                  <div className="space-y-2">
                    {smartRecommendations.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => {
                          setInput(rec.text);
                          setShowRecommendations(false);
                        }}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 rounded-lg text-left transition-colors group/item"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white group-hover/item:text-purple-700 dark:group-hover/item:text-purple-300">
                              {rec.text}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {rec.reasoning}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-3">
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                              {rec.category}
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400">
                              {Math.round(rec.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Hints */}
      {usageHints.length > 0 && !isLoading && messages.length === 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>✨</span>
            <span>Try asking:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {usageHints.map((hint, index) => (
              <button
                key={index}
                onClick={() => setInput(hint)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                {hint}
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
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-6 py-4 safe-area-bottom mobile-input-container">
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
              placeholder="Ask anything... AI will route to the best models."
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden min-h-[48px] max-h-[120px] transition-colors touch-manipulation"
              disabled={isLoading}
              style={{
                height: 'auto',
                minHeight: '48px',
                fontSize: '16px' // Prevents zoom on iOS
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
              className="absolute right-2 bottom-2 w-10 h-10 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed shadow-lg touch-manipulation"
              title="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="hidden sm:inline">Phoenix, Oracle, Wizard, GPT Cores Online</span>
              <span className="sm:hidden">AI Online</span>
            </span>
            {systemHealth?.overall.score && (
              <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                Health: {systemHealth.overall.score}%
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="hidden sm:inline">{webSearchEnabled ? '🌐 Web search active' : '📚 Local processing'}</span>
            <span className="sm:hidden">{webSearchEnabled ? '🌐' : '📚'}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Enter to send, Shift+Enter for new line</span>
            <span className="sm:hidden">Tap send</span>
          </div>
        </div>
      </div>
    </div>
  );
}