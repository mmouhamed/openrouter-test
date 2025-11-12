'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, SystemHealth, QueryAnalysis, RoutingDecision } from '@/types/chat';
import { smartChatAgent, SmartRecommendation } from '@/lib/SmartChatAgent';
import { conversationManager } from '@/lib/ConversationContext';
import RichMessageRenderer from './RichMessageRenderer';
// import FusionProgress from './FusionProgress';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';

// Types for conversation management
interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  lastUpdate: Date;
  createdAt: Date;
}

interface ConversationStorage {
  currentChatId: string;
  chats: { [chatId: string]: ChatHistory };
}

interface ChatInterfaceProps {
  className?: string;
}

export default function ImprovedChatInterface({ className = '' }: ChatInterfaceProps) {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Conversation management state
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ [chatId: string]: ChatHistory }>({});
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [editingTitleId, setEditingTitleId] = useState<string>('');
  const [editingTitle, setEditingTitle] = useState<string>('');

  // Enhanced features
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<string>('auto');
  const [processingStage, setProcessingStage] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [activeModel, setActiveModel] = useState<string>('');
  const [thinkingDots, setThinkingDots] = useState<number>(1);
  const [dynamicLoadingMessage, setDynamicLoadingMessage] = useState<string>('');
  const [processingKeywords, setProcessingKeywords] = useState<string[]>([]);
  
  // Smart Agent features
  const [smartRecommendations, setSmartRecommendations] = useState<SmartRecommendation[]>([]);
  const [, setUsageHints] = useState<string[]>([]);
  const [queryAnalysis, setQueryAnalysis] = useState<QueryAnalysis | null>(null);
  const [, setRoutingDecision] = useState<RoutingDecision | null>(null);
  const [selectedModel] = useState<string>('AI Fusion');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Conversation management functions
  const loadConversationsFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('chatqora-conversations');
      if (saved) {
        const parsed: ConversationStorage = JSON.parse(saved);
        // Convert date strings back to Date objects
        const chatsWithDates: { [chatId: string]: ChatHistory } = {};
        Object.entries(parsed.chats).forEach(([id, chat]) => {
          chatsWithDates[id] = {
            ...chat,
            lastUpdate: new Date(chat.lastUpdate),
            createdAt: new Date(chat.createdAt),
            messages: chat.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          };
        });
        setChatHistory(chatsWithDates);
        
        // Load current chat if it exists
        if (parsed.currentChatId && chatsWithDates[parsed.currentChatId]) {
          setCurrentChatId(parsed.currentChatId);
          setMessages(chatsWithDates[parsed.currentChatId].messages);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  const saveConversationsToStorage = useCallback((chats: { [chatId: string]: ChatHistory }, currentId: string) => {
    try {
      const storage: ConversationStorage = {
        currentChatId: currentId,
        chats
      };
      localStorage.setItem('chatqora-conversations', JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }, []);

  const generateChatTitle = useCallback((firstMessage: string): string => {
    // Generate title from first message (truncate and clean)
    const title = firstMessage
      .slice(0, 50)
      .replace(/\n/g, ' ')
      .trim();
    return title.length < 50 ? title : title + '...';
  }, []);

  const createNewChat = useCallback(() => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatHistory = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      lastUpdate: new Date(),
      createdAt: new Date()
    };
    
    const updatedChats = { ...chatHistory, [newChatId]: newChat };
    setChatHistory(updatedChats);
    setCurrentChatId(newChatId);
    setMessages([]);
    setError('');
    setSmartRecommendations([]);
    
    // Initialize conversation context
    conversationManager.initializeConversation(newChatId, []);
    
    saveConversationsToStorage(updatedChats, newChatId);
    console.log('📝 Created new chat:', newChatId);
  }, [chatHistory, saveConversationsToStorage]);

  const switchToChat = useCallback((chatId: string) => {
    if (chatHistory[chatId]) {
      setCurrentChatId(chatId);
      setMessages(chatHistory[chatId].messages);
      setError('');
      setSmartRecommendations([]);
      setShowSidebar(false);
      
      // Update conversation context
      conversationManager.initializeConversation(chatId, chatHistory[chatId].messages);
      
      saveConversationsToStorage(chatHistory, chatId);
      console.log('🔄 Switched to chat:', chatId);
    }
  }, [chatHistory, saveConversationsToStorage]);

  const deleteChat = useCallback((chatId: string) => {
    const updatedChats = { ...chatHistory };
    delete updatedChats[chatId];
    setChatHistory(updatedChats);
    
    // If we're deleting the current chat, create a new one
    if (currentChatId === chatId) {
      const remainingChats = Object.keys(updatedChats);
      if (remainingChats.length > 0) {
        const latestChatId = remainingChats.sort((a, b) => 
          updatedChats[b].lastUpdate.getTime() - updatedChats[a].lastUpdate.getTime()
        )[0];
        setCurrentChatId(latestChatId);
        setMessages(updatedChats[latestChatId].messages);
        saveConversationsToStorage(updatedChats, latestChatId);
      } else {
        createNewChat();
        return;
      }
    } else {
      saveConversationsToStorage(updatedChats, currentChatId);
    }
    
    console.log('🗑️ Deleted chat:', chatId);
  }, [chatHistory, currentChatId, saveConversationsToStorage, createNewChat]);

  const updateChatTitle = useCallback((chatId: string, newTitle: string) => {
    if (chatHistory[chatId] && newTitle.trim()) {
      const updatedChats = {
        ...chatHistory,
        [chatId]: {
          ...chatHistory[chatId],
          title: newTitle.trim(),
          lastUpdate: new Date()
        }
      };
      setChatHistory(updatedChats);
      saveConversationsToStorage(updatedChats, currentChatId);
      console.log('✏️ Updated chat title:', chatId, newTitle);
    }
    setEditingTitleId('');
    setEditingTitle('');
  }, [chatHistory, currentChatId, saveConversationsToStorage]);

  const updateCurrentChatWithMessages = useCallback((newMessages: Message[]) => {
    if (currentChatId && chatHistory[currentChatId]) {
      const updatedChat: ChatHistory = {
        ...chatHistory[currentChatId],
        messages: newMessages,
        lastUpdate: new Date(),
        // Update title if this is the first message
        title: newMessages.length === 1 ? generateChatTitle(newMessages[0].content) : chatHistory[currentChatId].title
      };
      
      const updatedChats = { ...chatHistory, [currentChatId]: updatedChat };
      setChatHistory(updatedChats);
      saveConversationsToStorage(updatedChats, currentChatId);
      
      // Update conversation context
      newMessages.forEach(msg => {
        conversationManager.addMessage(currentChatId, msg);
      });
    }
  }, [currentChatId, chatHistory, generateChatTitle, saveConversationsToStorage]);

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
    // Load conversations from storage first
    loadConversationsFromStorage();
    
    // If no conversations exist, create a new chat
    const saved = localStorage.getItem('chatqora-conversations');
    if (!saved) {
      createNewChat();
    }
    
    fetchSystemHealth();
    loadUsageHints();
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Cleanup old conversations periodically
    const cleanupInterval = setInterval(() => {
      conversationManager.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(cleanupInterval);
  }, []); // Run only on mount

  // Save conversation when messages change
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      updateCurrentChatWithMessages(messages);
    }
  }, [messages, currentChatId, updateCurrentChatWithMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSystemHealth = async () => {
    try {
      const { healthCheckService } = await import('@/lib/healthCheck');
      const health = await healthCheckService.getHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  // Enhanced dynamic processing messages
  const getDynamicProcessingMessages = (progress: number, userQuery: string) => {
    const queryKeywords = userQuery.toLowerCase().match(/\b(algorithm|data|code|analysis|design|system|model|process|compare|explain|create|build|implement|optimize|debug|test|architecture|framework|solution|performance|security|database|api|machine learning|ai|programming|development|software|technical|business|marketing|strategy|finance|research|study|learn|understand|concept|theory|practice|application|example|tutorial|guide|help|support|documentation|reference|overview|summary|details|features|benefits|advantages|disadvantages|pros|cons|comparison|difference|similarity|relationship|connection|integration|implementation|deployment|maintenance|scalability|reliability|efficiency|effectiveness|innovation|technology|digital|automation|cloud|mobile|web|frontend|backend|fullstack|devops|agile|scrum|kanban|project|management|leadership|team|collaboration|communication|presentation|report|analysis|dashboard|metrics|kpi|roi|conversion|growth|revenue|customer|user|experience|interface|design|visual|graphics|layout|typography|color|branding|marketing|sales|promotion|advertising|social|media|content|seo|analytics|tracking|monitoring|optimization|testing|qa|quality|assurance|control|validation|verification|compliance|standards|best practices|guidelines|recommendations|tips|tricks|hacks|shortcuts|tools|resources|libraries|frameworks|platforms|services|solutions|products|applications|software|hardware|infrastructure|network|server|database|storage|backup|recovery|disaster|security|privacy|encryption|authentication|authorization|access|permissions|roles|users|accounts|profiles|settings|configuration|customization|personalization|preferences|options|choices|selections|decisions|criteria|requirements|specifications|constraints|limitations|challenges|problems|issues|bugs|errors|exceptions|handling|debugging|troubleshooting|fixing|resolving|solving|improving|enhancing|upgrading|updating|migrating|refactoring|restructuring|reorganizing|streamlining|simplifying|clarifying|explaining|documenting|teaching|learning|training|coaching|mentoring|guiding|supporting|helping|assisting|facilitating|enabling|empowering|motivating|inspiring|encouraging|engaging|involving|participating|contributing|collaborating|cooperating|coordinating|communicating|connecting|networking|building|creating|developing|designing|planning|organizing|managing|leading|directing|controlling|monitoring|tracking|measuring|evaluating|assessing|reviewing|analyzing|researching|investigating|exploring|discovering|identifying|recognizing|understanding|comprehending|grasping|learning|absorbing|retaining|remembering|recalling|applying|using|utilizing|implementing|executing|performing|operating|running|functioning|working|processing|computing|calculating|determining|deciding|choosing|selecting|picking|opting|preferring|favoring|recommending|suggesting|proposing|offering|providing|delivering|supplying|serving|supporting|maintaining|sustaining|continuing|persisting|persevering|enduring|lasting|remaining|staying|keeping|holding|retaining|preserving|protecting|safeguarding|securing|defending|shielding|covering|wrapping|packaging|bundling|grouping|organizing|arranging|structuring|formatting|styling|designing|crafting|building|constructing|assembling|putting together|combining|merging|integrating|connecting|linking|joining|uniting|bringing together|gathering|collecting|accumulating|aggregating|summarizing|condensing|compressing|reducing|minimizing|optimizing|improving|enhancing|boosting|increasing|maximizing|expanding|extending|scaling|growing|developing|evolving|advancing|progressing|moving forward|proceeding|continuing|persisting|maintaining|sustaining|supporting|enabling|facilitating|streamlining|automating|digitizing|modernizing|updating|upgrading|improving|optimizing|fine-tuning|calibrating|adjusting|modifying|customizing|personalizing|tailoring|adapting|fitting|matching|aligning|synchronizing|coordinating|balancing|harmonizing|stabilizing|normalizing|standardizing|regularizing|systematizing|organizing|structuring|formalizing|documenting|recording|logging|tracking|monitoring|observing|watching|checking|verifying|validating|confirming|ensuring|guaranteeing|securing|protecting|safeguarding)\b/g) || [];
    
    const stages = [
      { min: 0, max: 15, 
        messages: [
          'Receiving your request...', 'Parsing query structure...', 'Understanding context...', 
          'Initializing ChatQora cores...', 'Activating neural pathways...', 'Loading cognitive modules...',
          'Establishing data connections...', 'Warming up processing units...', 'Calibrating response engines...'
        ], 
        keywords: [...new Set(queryKeywords)].slice(0, 3) 
      },
      { min: 15, max: 35, 
        messages: [
          'Selecting optimal AI models...', 'Routing to specialized cores...', 'Analyzing query complexity...', 
          'Distributing computational load...', 'Engaging ChatQora AI system...', 'Activating reasoning engine...',
          'Initializing creativity module...', 'Spinning up parallel processors...', 'Orchestrating model collaboration...',
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
      interval = setInterval(() => {
        setThinkingDots(prev => (prev % 3) + 1);
      }, 500);
      
      messageInterval = setInterval(() => {
        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage?.role === 'user' ? lastMessage.content : '';
        const dynamic = getDynamicProcessingMessages(processingProgress, userQuery);
        setDynamicLoadingMessage(dynamic.message);
        
        const allKeywords = userQuery.toLowerCase().match(/\b\w+\b/g) || ['processing', 'analyzing', 'computing'];
        const uniqueKeywords = [...new Set(allKeywords)].filter(word => word.length > 3).slice(0, 8);
        setProcessingKeywords(uniqueKeywords);
      }, 2000 + Math.random() * 1000);
    }
    
    return () => {
      clearInterval(interval);
      clearInterval(messageInterval);
    };
  }, [isLoading, processingProgress, messages]);

  // Enhanced processing stages simulation
  const simulateProcessingStages = (message: string) => {
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
    }, getVariableStageDelay(currentStageIndex, loadingStages.length));

    return stageInterval;
  };

  // Enhanced dynamic loading stages
  const getDynamicLoadingStages = (queryLength: number, hasComplexWords: boolean) => {
    const baseStages = [
      { stage: 'Initializing request handler...', model: 'Neural Gateway', progress: 3 },
      { stage: 'Parsing query semantics...', model: 'Language Processor', progress: 8 },
      { stage: 'Analyzing complexity metrics...', model: 'Smart Router', progress: 15 },
    ];

    if (queryLength > 200 || hasComplexWords) {
      const complexStages = [
        { stage: 'Engaging ChatQora reasoning matrix...', model: 'ChatQora Core Prime', progress: 25 },
        { stage: 'Activating deep analysis modules...', model: 'ChatQora Cognitive Engine', progress: 35 },
        { stage: 'Processing multi-dimensional context...', model: 'Context Analyzer', progress: 45 },
        { stage: 'Synthesizing comprehensive insights...', model: 'Knowledge Synthesizer', progress: 60 },
        { stage: 'Cross-referencing expert databases...', model: 'Domain Specialist', progress: 75 }
      ];
      baseStages.push(...complexStages);
    } else if (queryLength < 50) {
      const quickStages = [
        { stage: 'Spinning up ChatQora rapid core...', model: 'ChatQora Lightning', progress: 25 },
        { stage: 'Executing fast-track processing...', model: 'Speed Optimizer', progress: 45 },
        { stage: 'Delivering instant insights...', model: 'Rapid Response Unit', progress: 65 }
      ];
      baseStages.push(...quickStages);
    } else {
      const standardStages = [
        { stage: 'Initializing multi-core processing...', model: 'ChatQora Fusion Core', progress: 25 },
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

  const getVariableStageDelay = (stageIndex: number, totalStages: number): number => {
    const progress = stageIndex / totalStages;
    
    if (progress < 0.2) {
      return 300 + Math.random() * 200; // 300-500ms
    } else if (progress < 0.7) {
      return 600 + Math.random() * 400; // 600-1000ms
    } else {
      return 250 + Math.random() * 150; // 250-400ms
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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

    // Ensure we have a current chat
    if (!currentChatId) {
      createNewChat();
      return;
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');
    setProcessingStage('Analyzing query with Smart Agent...');
    setProcessingProgress(0);
    setActiveModel('Smart Agent');
    
    setSmartRecommendations([]);

    // Check if we should use contextual response or call model
    const shouldCallResult = conversationManager.shouldCallModel(userMessage.content, currentChatId);
    console.log('🤖 Smart routing decision:', shouldCallResult);

    // Try contextual response first for simple interactions
    if (!shouldCallResult.shouldCall) {
      const contextResponse = conversationManager.generateContextualResponse(userMessage.content, currentChatId);
      
      if (contextResponse) {
        // Create assistant message with contextual response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: contextResponse,
          timestamp: new Date(),
          metadata: {
            fromCache: true,
            processingTime: 150,
            model: 'Contextual AI',
            confidence: shouldCallResult.confidence
          }
        };
        
        setTimeout(() => {
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
          console.log('✅ Used contextual response:', shouldCallResult.reason);
        }, 150);
        
        return;
      }
    }

    // Check for cached response
    const cachedResponse = conversationManager.getCachedResponse(userMessage.content);
    if (cachedResponse && shouldCallResult.reason === 'Cached response available') {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cachedResponse,
        timestamp: new Date(),
        metadata: {
          fromCache: true,
          processingTime: 200,
          model: 'Cached AI',
          confidence: shouldCallResult.confidence
        }
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        console.log('✅ Used cached response for query');
      }, 200);
      
      return;
    }

    let stageInterval: NodeJS.Timeout | undefined;

    try {
      const smartAnalysis = await smartChatAgent.processQuery(
        userMessage.content,
        messages.slice(-5).map(m => m.content)
      );

      setQueryAnalysis(smartAnalysis.analysis);
      setRoutingDecision(smartAnalysis.routing);
      
      setProcessingStage(`Smart routing: ${smartAnalysis.routing.reasoning}`);
      setActiveModel(smartAnalysis.modelRecommendation.split('/').pop()?.split(':')[0] || 'Unknown');
      
      const modelToUse = selectedModel === 'auto' 
        ? smartAnalysis.modelRecommendation 
        : selectedModel;

      setCurrentStrategy(smartAnalysis.routing.strategy);
      setConfidence(smartAnalysis.routing.confidence);

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
        
        // Cache response if appropriate
        if (conversationManager.shouldCacheResponse(userMessage.content, data.response)) {
          conversationManager.cacheResponse(
            userMessage.content, 
            data.response, 
            JSON.stringify({ model: data.model, webSearchUsed: data.webSearchUsed }), 
            data.fusion ? data.fusion.confidence : 0.8
          );
          console.log('💾 Cached response for future use');
        }
        
        const dynamicRecommendations = data.dynamicRecommendations || [];
        setSmartRecommendations(dynamicRecommendations);
        
        // Add to smart agent history
        smartChatAgent.addToHistory('assistant', data.response, data.model, smartAnalysis.analysis);
        loadUsageHints();
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
      if (currentChatId) {
        await fetch(`/api/chat?action=clear&sessionId=${currentChatId}`, {
          method: 'DELETE'
        });
      }
      
      // Create a new chat instead of just clearing
      createNewChat();
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const formatTime = (date: Date | string | number) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Sidebar Content Component
  const SidebarContent = () => {
    const sortedChats = Object.values(chatHistory).sort((a, b) => 
      b.lastUpdate.getTime() - a.lastUpdate.getTime()
    );

    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 id="sidebar-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Chat History
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sortedChats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No chat history yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  createNewChat();
                  setShowSidebar(false);
                }}
                className="mt-2 text-teal-600 dark:text-teal-400"
              >
                Start your first chat
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedChats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group relative rounded-lg p-3 cursor-pointer transition-colors",
                    currentChatId === chat.id
                      ? "bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                  )}
                  onClick={() => switchToChat(chat.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingTitleId === chat.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => updateChatTitle(chat.id, editingTitle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateChatTitle(chat.id, editingTitle);
                            } else if (e.key === 'Escape') {
                              setEditingTitleId('');
                              setEditingTitle('');
                            }
                          }}
                          className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-white"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {chat.title}
                        </h3>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {chat.lastUpdate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(chat.id);
                          setEditingTitle(chat.title);
                        }}
                        className="w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Edit title"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this chat?')) {
                            deleteChat(chat.id);
                          }
                        }}
                        className="w-6 h-6 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Delete chat"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <Button
            onClick={() => {
              createNewChat();
              setShowSidebar(false);
            }}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
            size="sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Chat
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-screen bg-gray-50 dark:bg-gray-950", className)}>
      {/* Header */}
      <header 
        className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 py-2 flex-shrink-0"
        role="banner"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src="/ChatQora.png" 
                alt="ChatQora Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                ChatQora
              </h1>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span 
                  className="w-2 h-2 bg-green-500 rounded-full animate-pulse" 
                  aria-label="Online status"
                ></span>
                <span className="sr-only">Status:</span>
                <span>Online</span>
                {confidence > 0 && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{Math.round(confidence * 100)}% Confidence</span>
                  </>
                )}
                {queryAnalysis && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span className="capitalize">{queryAnalysis.complexity} Query</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Chat History Sidebar Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label="Toggle chat history"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.405l-3.431 1.143a1 1 0 01-1.287-1.287l1.143-3.431A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
              <span className="text-sm">Chats</span>
            </Button>

            {/* New Chat Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={createNewChat}
              className="flex items-center space-x-1 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-300"
              aria-label="Start new chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm">New</span>
            </Button>

            {/* Strategy Display */}
            <div className="hidden md:flex items-center space-x-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
              <span className="text-sm" aria-hidden="true">{getStrategyIcon(currentStrategy)}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {getStrategyName(currentStrategy)}
              </span>
            </div>

            {/* Web Search Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={cn(
                "flex items-center space-x-2 transition-colors",
                webSearchEnabled 
                  ? 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 dark:bg-gradient-to-r dark:from-teal-900/20 dark:to-cyan-900/20 dark:text-teal-300 hover:from-teal-200 hover:to-cyan-200 dark:hover:from-teal-900/30 dark:hover:to-cyan-900/30' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
              aria-label={webSearchEnabled ? 'Disable web search' : 'Enable web search'}
            >
              <span aria-hidden="true">{webSearchEnabled ? '🌐' : '📚'}</span>
              <span className="text-sm font-medium">
                {webSearchEnabled ? 'Web' : 'Local'}
              </span>
            </Button>

            {/* Clear Chat */}
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              aria-label="Start new chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Chat History Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-labelledby="sidebar-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setShowSidebar(false)}></div>
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col">
            <SidebarContent />
          </div>
        </div>
      )}

      <div className={cn("flex h-full", showSidebar ? "lg:pl-72" : "")}>
        {/* Desktop Sidebar */}
        <div className={cn(
          "hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:dark:border-gray-700 lg:bg-white lg:dark:bg-gray-900 transition-all duration-300",
          showSidebar ? "lg:translate-x-0" : "lg:-translate-x-full"
        )}>
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className={cn("flex-1 flex flex-col min-w-0", showSidebar ? "lg:pl-72" : "")}>

      {/* Messages */}
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden"
        role="main"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          /* Claude-style Welcome Screen */
          <div className="h-full flex items-center justify-center px-4 py-6">
            <div className="max-w-2xl w-full text-center">
              {/* ChatQora Logo */}
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <img 
                  src="/ChatQora.png" 
                  alt="ChatQora Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              
              {/* Welcome Message */}
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">
                Welcome to ChatQora
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Powered by advanced AI with intelligent routing technology
              </p>

              {/* Suggestion Cards */}
              <div className="grid gap-2 sm:grid-cols-2 text-left">
                <Card 
                  className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:shadow-teal-100/50 dark:hover:border-cyan-500 dark:hover:shadow-cyan-900/20 bg-white dark:bg-gray-900"
                  onClick={() => setInput('Explain quantum computing in simple terms')}
                  role="button"
                  tabIndex={0}
                  aria-label="Ask about quantum computing"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setInput('Explain quantum computing in simple terms');
                    }
                  }}
                >
                  <CardContent className="p-0">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center">
                      <span className="mr-2 text-base" aria-hidden="true">🧠</span>
                      Learn & Understand
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Get clear explanations of complex topics
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:shadow-teal-100/50 dark:hover:border-cyan-500 dark:hover:shadow-cyan-900/20 bg-white dark:bg-gray-900"
                  onClick={() => setInput('What are the latest AI developments in 2024?')}
                  role="button"
                  tabIndex={0}
                  aria-label="Ask about latest AI developments"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setInput('What are the latest AI developments in 2024?');
                    }
                  }}
                >
                  <CardContent className="p-0">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center">
                      <span className="mr-2 text-base" aria-hidden="true">🌐</span>
                      Research & Discover
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Find current information with web search
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:shadow-teal-100/50 dark:hover:border-cyan-500 dark:hover:shadow-cyan-900/20 bg-white dark:bg-gray-900"
                  onClick={() => setInput('Write a Python function to sort a list efficiently')}
                  role="button"
                  tabIndex={0}
                  aria-label="Ask for code help"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setInput('Write a Python function to sort a list efficiently');
                    }
                  }}
                >
                  <CardContent className="p-0">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center">
                      <span className="mr-2 text-base" aria-hidden="true">💻</span>
                      Code & Build
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Get help with programming and development
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:shadow-teal-100/50 dark:hover:border-cyan-500 dark:hover:shadow-cyan-900/20 bg-white dark:bg-gray-900"
                  onClick={() => setInput('Compare different machine learning approaches')}
                  role="button"
                  tabIndex={0}
                  aria-label="Ask for analysis"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setInput('Compare different machine learning approaches');
                    }
                  }}
                >
                  <CardContent className="p-0">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center">
                      <span className="mr-2 text-base" aria-hidden="true">⚡</span>
                      Analyze & Compare
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Deep analysis with multi-model fusion
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          /* ChatGPT-style Message Layout */
          <div className="px-3 sm:px-4 py-3 space-y-3">
            {messages.map((message, index) => (
              <div key={index} className="group">
                <div className={cn("flex", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn("max-w-4xl w-full flex", message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                    {/* Avatar */}
                    <div className={cn("flex-shrink-0", message.role === 'user' ? 'ml-3' : 'mr-3')}>
                      {message.role === 'assistant' ? (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img 
                            src="/ChatQora.png" 
                            alt="ChatQora Logo" 
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <span className="text-gray-700 dark:text-gray-300 text-sm font-bold" aria-hidden="true">U</span>
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      {/* Message Header */}
                      <div className={cn("flex items-baseline mb-2 text-sm text-gray-500 dark:text-gray-400", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <span className="font-medium">
                          {message.role === 'assistant' ? 'ChatQora' : 'You'}
                        </span>
                        <span className="mx-2" aria-hidden="true">•</span>
                        <time dateTime={message.timestamp.toISOString()}>
                          {formatTime(message.timestamp)}
                        </time>
                        {message.metadata?.fusion && (
                          <>
                            <span className="mx-2" aria-hidden="true">•</span>
                            <span className="text-xs text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/20 px-2 py-0.5 rounded">
                              {getStrategyIcon(message.metadata.fusion.strategy.type)} {getStrategyName(message.metadata.fusion.strategy.type)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={cn(
                        "rounded-xl px-3 py-2 shadow-sm", 
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white ml-8 shadow-md' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 mr-8'
                      )}>
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
                      </div>

                      {/* Message Metadata */}
                      {message.metadata?.processingTime && (
                        <div className={cn("mt-1 text-xs text-gray-500 dark:text-gray-400", message.role === 'user' ? 'text-right mr-8' : 'text-left')}>
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
                      {message.metadata?.sources && message.metadata.sources.length > 0 && (
                        <div className="mt-2 mr-8">
                          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <span aria-hidden="true">🌐</span>
                            <span>Sources:</span>
                          </div>
                          <div className="space-y-1">
                            {message.metadata.sources.slice(0, 3).map((source, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                      {source.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                      {source.snippet}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                                        {source.source}
                                      </span>
                                      <span className="text-xs text-gray-400" aria-hidden="true">•</span>
                                      <span className="text-xs text-green-600 dark:text-green-400">
                                        {Math.round(source.relevance * 100)}% relevant
                                      </span>
                                    </div>
                                  </div>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-3 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200 transition-colors"
                                    aria-label={`Open source: ${source.title}`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading State */}
            {isLoading && (
              <div className="group">
                <div className="flex justify-start">
                  <div className="max-w-4xl w-full flex flex-row">
                    {/* Avatar */}
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 flex items-center justify-center relative">
                        <img 
                          src="/ChatQora.png" 
                          alt="ChatQora Logo" 
                          className="w-8 h-8 object-contain"
                        />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full animate-ping" aria-hidden="true"></div>
                      </div>
                    </div>

                    {/* Loading Content */}
                    <div className="flex-1 min-w-0">
                      {/* Loading Header */}
                      <div className="flex items-baseline mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">ChatQora</span>
                        <span className="mx-2" aria-hidden="true">•</span>
                        <span>{dynamicLoadingMessage || processingStage || 'Thinking...'}</span>
                        {activeModel && (
                          <>
                            <span className="mx-2" aria-hidden="true">•</span>
                            <span className="text-xs bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-900/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded">
                              {activeModel}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Loading Bubble */}
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm mr-8">
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {processingProgress >= 95 ? 'Finalizing...' : 'Processing...'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {processingProgress >= 98 ? 
                                <span className="animate-pulse">Almost ready...</span> : 
                                `${processingProgress}%`
                              }
                            </span>
                          </div>
                          <div 
                            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden"
                            role="progressbar"
                            aria-valuenow={processingProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Processing: ${processingProgress}%`}
                          >
                            <div 
                              className="bg-gradient-to-r from-teal-600 to-cyan-600 h-1.5 rounded-full transition-all duration-700 ease-in-out shadow-sm"
                              style={{width: `${processingProgress}%`}}
                            >
                            </div>
                          </div>
                        </div>
                        
                        {/* Thinking Animation */}
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            {[...Array(3)].map((_, i) => (
                              <div 
                                key={i}
                                className={cn(
                                  "w-2 h-2 rounded-full transition-all duration-300",
                                  i < thinkingDots 
                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 scale-110 shadow-sm' 
                                    : 'bg-gray-300 dark:bg-gray-600'
                                )}
                                aria-hidden="true"
                              ></div>
                            ))}
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              AI is processing{'.'.repeat(thinkingDots)}
                            </span>
                            {processingKeywords.length > 0 && (
                              <div className="flex items-center space-x-1 mt-1">
                                <span className="text-xs text-gray-400 dark:text-gray-500">Keywords:</span>
                                <div className="flex space-x-1">
                                  {processingKeywords.slice(0, 3).map((keyword, index) => (
                                    <span 
                                      key={index}
                                      className="text-xs bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-900/20 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded animate-pulse"
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        )}
      </main>

      {/* Error Display */}
      {error && (
        <div 
          className="border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 px-6 py-3"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center text-sm text-red-800 dark:text-red-200">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Smart Recommendations - Collapsible */}
      {smartRecommendations.length > 0 && !isLoading && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {/* Toggle Button */}
          <div className="px-4 py-1.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-1 h-auto"
                aria-label={showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
              >
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white flex items-center justify-center text-xs font-medium shadow-sm">
                  ?
                </span>
                <span className="text-sm font-medium">
                  {smartRecommendations.length} suggestion{smartRecommendations.length > 1 ? 's' : ''}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${showSuggestions ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Collapsible Suggestions */}
          {showSuggestions && (
            <div className="px-4 pb-2 space-y-1 border-t border-gray-200/50 dark:border-gray-700/50 pt-2">
              <div className="flex flex-wrap gap-1.5">
                {smartRecommendations.slice(0, 3).map((rec) => (
                  <Button
                    key={rec.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput(rec.text);
                      setShowSuggestions(false); // Auto-hide after selection
                    }}
                    className="text-left h-auto whitespace-normal p-1.5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:shadow-teal-100/50 dark:hover:border-cyan-500 dark:hover:shadow-cyan-900/20 transition-all duration-200"
                  >
                    <div className="text-xs text-gray-700 dark:text-gray-300">
                      {rec.text}
                    </div>
                  </Button>
                ))}
              </div>
              {smartRecommendations.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                  + {smartRecommendations.length - 3} more available
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <footer 
        className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 sm:px-4 py-2 flex-shrink-0"
        role="contentinfo"
      >
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <label htmlFor="message-input" className="sr-only">
                Type your message
              </label>
              <textarea
                id="message-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="How can I help you today?"
                rows={1}
                className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 focus:ring-offset-teal-100/50 dark:focus:ring-offset-teal-900/20 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden min-h-[40px] max-h-[100px] transition-all duration-200 text-sm leading-relaxed"
                disabled={isLoading}
                style={{
                  height: 'auto',
                  minHeight: '40px',
                  fontSize: '16px' // Prevents zoom on iOS
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 100) + 'px';
                }}
                aria-describedby="input-help"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                variant="chatqora"
                size="icon"
                className="absolute right-2 bottom-1.5 w-7 h-7 shadow-md transition-all duration-200"
                aria-label="Send message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></span>
                <span>AI Models Online</span>
              </span>
              {systemHealth?.overall.score && (
                <span className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-900/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded">
                  Health: {systemHealth.overall.score}%
                </span>
              )}
            </div>
            <div 
              id="input-help" 
              className="text-xs text-gray-400 dark:text-gray-500"
              aria-live="polite"
            >
              <span className="hidden sm:inline">Enter to send • Shift+Enter for new line</span>
              <span className="sm:hidden">Tap send</span>
            </div>
          </div>
        </form>
      </footer>
        </div>
      </div>
    </div>
  );
}