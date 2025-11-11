/**
 * Clean Chat System - Core Types
 * No authentication complexity, focused on AI performance
 */

// Core Message Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface MessageMetadata {
  processingTime?: number;
  confidence?: number;
  model?: string;
  fusion?: FusionMetadata;
  sources?: WebSource[];
  context?: ContextMetadata;
  analysis?: QueryAnalysis; // QueryAnalysis from SmartChatAgent
  routing?: RoutingDecision; // RoutingDecision from SmartChatAgent
  isCorrection?: boolean; // Flag for user correction messages
}

export interface QueryAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  domain: string;
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  requiresSpeed: boolean;
  estimatedTokens: number;
  keywords: string[];
  intent: 'question' | 'task' | 'creative' | 'technical' | 'analysis';
}

export interface RoutingDecision {
  primaryModel: string;
  fallbackModels: string[];
  strategy: 'single' | 'sequential' | 'ensemble';
  reasoning: string;
  confidence: number;
}

// AI Model Types
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  capabilities: ModelCapabilities;
  performance: ModelPerformance;
}

export interface ModelCapabilities {
  reasoning: number;      // 0-1 scale
  creativity: number;     // 0-1 scale
  vision: number;         // 0-1 scale
  coding: number;         // 0-1 scale
  speed: number;          // 0-1 scale
  accuracy: number;       // 0-1 scale
}

export interface ModelPerformance {
  avgResponseTime: number;
  successRate: number;
  tokensPerSecond: number;
  lastResponseTime?: number;
}

// Fusion System Types
export interface FusionStrategy {
  type: 'single' | 'sequential' | 'parallel' | 'consensus';
  models: string[];
  reasoning: string;
  confidence: number;
}

export interface FusionMetadata {
  strategy: FusionStrategy;
  modelsUsed: string[];
  totalProcessingTime: number;
  qualityScore: number;
}

// Context Management
export interface ConversationContext {
  messages: Message[];
  summary?: string;
  topics: string[];
  userProfile: UserProfile;
  contextWindow: ContextWindow;
}

export interface UserProfile {
  preferredStyle: 'conversational' | 'technical' | 'creative' | 'analytical';
  complexityLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  interests: string[];
  sessionStats: SessionStats;
}

export interface SessionStats {
  messageCount: number;
  averageResponseTime: number;
  topicsDiscussed: string[];
  modelsUsed: Record<string, number>;
}

export interface ContextWindow {
  maxTokens: number;
  currentTokens: number;
  messages: Message[];
  priority: 'recent' | 'relevant' | 'important';
}

// Web Search Types
export interface WebSource {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
  trustScore: number;
  publishDate?: Date;
  source: string;
}

export interface SearchQuery {
  query: string;
  type: 'general' | 'technical' | 'current' | 'academic';
  urgency: 'low' | 'medium' | 'high';
  maxResults: number;
}

// Context Metadata
export interface ContextMetadata {
  tokensUsed: number;
  relevanceScore: number;
  topicContinuity: number;
  contextualShifts: string[];
}

// Processing Options
export interface ProcessingOptions {
  forceModel?: string;
  enableWebSearch?: boolean;
  maxSources?: number;
  fusionStrategy?: FusionStrategy['type'];
  priority?: 'speed' | 'quality' | 'comprehensive';
  includeImages?: boolean;
}

// Response Types
export interface ChatResponse {
  message: Message;
  processingTime: number;
  fusion: FusionMetadata;
  context: ContextMetadata;
  suggestions?: string[];
  relatedQueries?: string[];
}

// System Health Types
export interface SystemHealth {
  models: Record<string, ModelHealth>;
  fusion: FusionHealth;
  search: SearchHealth;
  overall: OverallHealth;
}

export interface ModelHealth {
  status: 'online' | 'degraded' | 'offline';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
}

export interface FusionHealth {
  strategiesAvailable: string[];
  averageProcessingTime: number;
  successRate: number;
}

export interface SearchHealth {
  providersOnline: string[];
  averageQueryTime: number;
  cacheHitRate: number;
}

export interface OverallHealth {
  status: 'optimal' | 'good' | 'degraded' | 'critical';
  score: number; // 0-100
  uptime: number;
  activeConnections: number;
}

// UI State Types
export interface ChatUIState {
  isLoading: boolean;
  isTyping: boolean;
  error?: string;
  currentModel?: string;
  fusionStrategy?: FusionStrategy['type'];
  webSearchEnabled: boolean;
  systemHealth: SystemHealth;
  processingIndicator?: ProcessingIndicator;
}

export interface ProcessingIndicator {
  stage: 'analyzing' | 'routing' | 'processing' | 'fusing' | 'searching' | 'finalizing';
  progress: number; // 0-100
  estimatedTime?: number;
  currentModel?: string;
}

// Events
export interface ChatEvent {
  type: 'message' | 'typing' | 'error' | 'system' | 'health';
  data: any;
  timestamp: Date;
}