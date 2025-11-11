/**
 * ContextualNeuroFusion-3.1 Advanced AI System
 * 
 * Enhanced with conversation context awareness and content-based intelligent routing
 * for optimal model selection based on conversation history, user patterns, and content type.
 */

import React, { useState } from 'react';
import { NeuroFusion31, NeuroFusionError } from './NeuroFusion31.js';

export class ContextualNeuroFusion31 extends NeuroFusion31 {
  constructor(config = {}) {
    super(config);
    
    // Contextual Intelligence Layer
    this.contextualIntelligence = {
      conversationMemory: new Map(), // userId -> conversation context
      userProfiles: new Map(),       // userId -> user behavior patterns
      contentPatterns: new Map(),    // content type -> usage patterns
      topicContinuity: new Map(),    // conversation -> topic progression
      modelPerformanceByContext: new Map(), // context type -> model performance
      
      // Context analysis settings
      maxContextHistory: 10,
      contentClassificationEnabled: true,
      userBehaviorLearning: true,
      topicTrackingEnabled: true
    };
    
    // Content Classification System
    this.contentClassifier = {
      // Technical Content Types
      technicalCategories: [
        'programming', 'system_design', 'algorithms', 'database',
        'networking', 'security', 'devops', 'ai_ml', 'data_science'
      ],
      
      // Communication Styles
      communicationStyles: [
        'formal_academic', 'casual_conversational', 'technical_precise',
        'creative_expressive', 'analytical_structured', 'educational_tutorial'
      ],
      
      // Content Complexity Levels
      complexityLevels: ['beginner', 'intermediate', 'advanced', 'expert'],
      
      // Response Requirements
      responseTypes: [
        'quick_answer', 'detailed_explanation', 'step_by_step',
        'comprehensive_analysis', 'creative_generation', 'problem_solving'
      ]
    };

    this.neuralLog('ContextualNeuroFusion-3.1 initialized with contextual intelligence');
  }

  /**
   * Enhanced Neural Processing with Contextual Awareness
   */
  async processContextualRequest(input, attachments = [], options = {}) {
    const userId = options.userId || 'anonymous';
    const conversationId = options.conversationId || 'default';
    const synapseId = this.generateSynapseId();
    
    try {
      // Analyze conversation context
      const contextualProfile = await this.analyzeConversationalContext(
        input, 
        attachments, 
        userId, 
        conversationId, 
        options
      );

      // Enhanced routing with contextual awareness
      const contextualRoute = this.routeWithContextualIntelligence(
        input, 
        attachments, 
        contextualProfile, 
        options
      );

      // Update context before processing
      this.updateConversationalContext(userId, conversationId, {
        input,
        attachments,
        contextualProfile,
        timestamp: Date.now()
      });

      // Execute with contextual optimization
      const response = await this.executeNeuralSynapse(
        synapseId,
        contextualRoute,
        input,
        attachments,
        options
      );

      // Learn from the interaction
      this.learnFromInteraction(userId, conversationId, contextualProfile, response, true);

      return {
        success: true,
        response: response.content,
        model: response.model,
        pathway: contextualRoute.pathway,
        contextualIntelligence: {
          ...contextualProfile,
          recommendedModel: contextualRoute.core.codename,
          contextInfluence: contextualRoute.contextInfluence,
          adaptiveOptimization: contextualRoute.adaptiveOptimization
        },
        neuroFusion: {
          systemName: this.systemName,
          version: this.version,
          neuralCore: contextualRoute.core.codename,
          contextuallyOptimized: true,
          userProfile: contextualProfile.userProfile,
          conversationContinuity: contextualProfile.topicContinuity
        },
        usage: response.usage,
        metadata: response.metadata
      };

    } catch (error) {
      // Learn from failures too
      const contextualProfile = await this.analyzeConversationalContext(
        input, attachments, userId, conversationId, options
      );
      this.learnFromInteraction(userId, conversationId, contextualProfile, null, false);
      
      throw error;
    }
  }

  /**
   * Advanced Conversational Context Analysis
   */
  async analyzeConversationalContext(input, attachments, userId, conversationId, options) {
    const conversationHistory = this.getConversationHistory(userId, conversationId);
    const userProfile = this.getUserProfile(userId);
    
    // Content Classification
    const contentProfile = this.classifyContent(input, attachments);
    
    // Topic Continuity Analysis
    const topicContinuity = this.analyzeTopicContinuity(input, conversationHistory);
    
    // User Behavior Patterns
    const behaviorPatterns = this.analyzeBehaviorPatterns(userProfile, contentProfile);
    
    // Context Evolution
    const contextEvolution = this.analyzeContextEvolution(conversationHistory, input);
    
    // Model Performance History
    const modelPerformanceContext = this.getModelPerformanceInContext(contentProfile, userProfile);

    return {
      contentProfile,
      topicContinuity,
      behaviorPatterns,
      contextEvolution,
      modelPerformanceContext,
      userProfile,
      conversationDepth: conversationHistory.length,
      temporalContext: this.analyzeTemporalContext(conversationHistory),
      preferredComplexity: userProfile.preferredComplexity || 'adaptive'
    };
  }

  /**
   * Content Classification System
   */
  classifyContent(input, attachments) {
    const classification = {
      primaryCategory: 'general',
      secondaryCategories: [],
      complexityLevel: 'intermediate',
      communicationStyle: 'casual_conversational',
      responseType: 'detailed_explanation',
      technicalDepth: 0,
      creativityRequired: 0,
      analysisRequired: 0,
      hasVisualContent: attachments && attachments.length > 0
    };

    // Technical Category Detection
    const technicalPatterns = {
      programming: /\b(code|function|class|algorithm|programming|software|debug|api|framework)\b/i,
      system_design: /\b(architecture|system design|scalability|microservices|database design|distributed)\b/i,
      ai_ml: /\b(machine learning|neural network|ai|artificial intelligence|deep learning|model training)\b/i,
      data_science: /\b(data analysis|statistics|visualization|pandas|numpy|sql|analytics)\b/i,
      security: /\b(security|encryption|authentication|vulnerability|penetration testing|cybersecurity)\b/i,
      devops: /\b(docker|kubernetes|ci\/cd|deployment|infrastructure|cloud|aws|azure)\b/i
    };

    Object.entries(technicalPatterns).forEach(([category, pattern]) => {
      if (pattern.test(input)) {
        if (classification.primaryCategory === 'general') {
          classification.primaryCategory = category;
        } else {
          classification.secondaryCategories.push(category);
        }
        classification.technicalDepth += 2;
      }
    });

    // Communication Style Detection
    const stylePatterns = {
      formal_academic: /\b(research|analysis|methodology|comprehensive|systematic|theoretical)\b/i,
      technical_precise: /\b(specification|implementation|technical|precise|exact|detailed)\b/i,
      creative_expressive: /\b(creative|story|poem|artistic|innovative|brainstorm|imagine)\b/i,
      educational_tutorial: /\b(explain|teach|learn|tutorial|guide|step by step|beginner)\b/i
    };

    Object.entries(stylePatterns).forEach(([style, pattern]) => {
      if (pattern.test(input)) {
        classification.communicationStyle = style;
      }
    });

    // Complexity Level Assessment
    const complexityIndicators = {
      beginner: /\b(simple|basic|beginner|easy|intro|getting started)\b/i,
      intermediate: /\b(intermediate|moderate|standard|typical|normal)\b/i,
      advanced: /\b(advanced|complex|sophisticated|detailed|comprehensive|in-depth)\b/i,
      expert: /\b(expert|professional|enterprise|production|optimized|cutting-edge)\b/i
    };

    Object.entries(complexityIndicators).forEach(([level, pattern]) => {
      if (pattern.test(input)) {
        classification.complexityLevel = level;
      }
    });

    // Response Type Detection
    if (/\b(quick|briefly|short|summary)\b/i.test(input)) {
      classification.responseType = 'quick_answer';
    } else if (/\b(step by step|tutorial|guide|how to)\b/i.test(input)) {
      classification.responseType = 'step_by_step';
    } else if (/\b(comprehensive|detailed|thorough|complete|extensive)\b/i.test(input)) {
      classification.responseType = 'comprehensive_analysis';
    } else if (/\b(create|write|generate|design|compose)\b/i.test(input)) {
      classification.responseType = 'creative_generation';
    }

    // Creativity and Analysis Requirements
    classification.creativityRequired = this.assessCreativityRequirement(input);
    classification.analysisRequired = this.assessAnalysisRequirement(input);

    return classification;
  }

  assessCreativityRequirement(input) {
    const creativeIndicators = [
      /\b(creative|innovative|original|unique|artistic|imaginative)\b/i,
      /\b(write|compose|create|design|generate|brainstorm)\b/i,
      /\b(story|poem|essay|article|content|narrative)\b/i
    ];
    
    return creativeIndicators.reduce((score, pattern) => 
      score + (pattern.test(input) ? 1 : 0), 0
    );
  }

  assessAnalysisRequirement(input) {
    const analyticalIndicators = [
      /\b(analyze|compare|evaluate|assess|review|examine)\b/i,
      /\b(pros and cons|advantages|disadvantages|trade-offs)\b/i,
      /\b(research|investigation|study|survey|methodology)\b/i,
      /\b(critical|systematic|comprehensive|thorough)\b/i
    ];
    
    return analyticalIndicators.reduce((score, pattern) => 
      score + (pattern.test(input) ? 1 : 0), 0
    );
  }

  /**
   * User Behavior Pattern Analysis
   */
  analyzeBehaviorPatterns(userProfile, contentProfile) {
    const patterns = {
      responseStylePreference: 'adaptive',
      complexityPreference: 'adaptive',
      modelPreference: null,
      interactionFrequency: 'moderate',
      contentTypeAffinity: [],
      temporalPatterns: {},
      qualityExpectation: 'standard'
    };

    if (!userProfile || !userProfile.interactionHistory) {
      return patterns;
    }

    const recentInteractions = userProfile.interactionHistory.slice(-20);
    
    // Analyze response style preferences
    const stylePreferences = {};
    recentInteractions.forEach(interaction => {
      const style = interaction.contentProfile?.communicationStyle || 'casual_conversational';
      stylePreferences[style] = (stylePreferences[style] || 0) + 1;
    });
    
    if (Object.keys(stylePreferences).length > 0) {
      patterns.responseStylePreference = Object.keys(stylePreferences).reduce((a, b) => 
        stylePreferences[a] > stylePreferences[b] ? a : b
      );
    }

    // Analyze complexity preferences
    const complexityPreferences = {};
    recentInteractions.forEach(interaction => {
      const complexity = interaction.contentProfile?.complexityLevel || 'intermediate';
      complexityPreferences[complexity] = (complexityPreferences[complexity] || 0) + 1;
    });
    
    if (Object.keys(complexityPreferences).length > 0) {
      patterns.complexityPreference = Object.keys(complexityPreferences).reduce((a, b) => 
        complexityPreferences[a] > complexityPreferences[b] ? a : b
      );
    }

    // Analyze model preferences based on success rates
    if (userProfile.modelSuccessRates) {
      let bestModel = null;
      let bestSuccessRate = 0;
      
      Object.entries(userProfile.modelSuccessRates).forEach(([model, stats]) => {
        if (stats.attempts >= 3) {
          const successRate = stats.successes / stats.attempts;
          if (successRate > bestSuccessRate) {
            bestSuccessRate = successRate;
            bestModel = model;
          }
        }
      });
      
      if (bestModel && bestSuccessRate > 0.7) {
        patterns.modelPreference = bestModel;
      }
    }

    // Analyze content type affinity
    const contentTypes = {};
    recentInteractions.forEach(interaction => {
      const contentType = interaction.contentProfile?.primaryCategory || 'general';
      contentTypes[contentType] = (contentTypes[contentType] || 0) + 1;
    });
    
    patterns.contentTypeAffinity = Object.entries(contentTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type, frequency: count }));

    // Analyze interaction frequency
    if (recentInteractions.length > 0) {
      const timeSpan = Date.now() - recentInteractions[0].timestamp;
      const daySpan = timeSpan / (1000 * 60 * 60 * 24);
      const dailyFrequency = recentInteractions.length / Math.max(daySpan, 1);
      
      if (dailyFrequency > 5) patterns.interactionFrequency = 'high';
      else if (dailyFrequency > 2) patterns.interactionFrequency = 'moderate';
      else patterns.interactionFrequency = 'low';
    }

    // Analyze quality expectations based on content complexity trends
    const complexityTrend = recentInteractions
      .map(i => i.contentProfile?.complexityLevel || 'intermediate')
      .slice(-5);
    
    const advancedCount = complexityTrend.filter(c => c === 'advanced' || c === 'expert').length;
    if (advancedCount >= 3) {
      patterns.qualityExpectation = 'high';
    } else if (advancedCount >= 1) {
      patterns.qualityExpectation = 'standard';
    } else {
      patterns.qualityExpectation = 'efficient';
    }

    return patterns;
  }

  /**
   * Topic Continuity Analysis
   */
  analyzeTopicContinuity(input, conversationHistory) {
    if (conversationHistory.length === 0) {
      return {
        isNewTopic: true,
        topicEvolution: 'initial',
        continuityStrength: 0,
        relatedToRecent: false
      };
    }

    const recentMessages = conversationHistory.slice(-3);
    const topicKeywords = this.extractTopicKeywords(input);
    
    let continuityScore = 0;
    let relatedMessages = 0;

    recentMessages.forEach(message => {
      const messageKeywords = this.extractTopicKeywords(message.input);
      const overlap = this.calculateKeywordOverlap(topicKeywords, messageKeywords);
      
      if (overlap > 0.3) {
        continuityScore += overlap;
        relatedMessages++;
      }
    });

    return {
      isNewTopic: continuityScore < 0.2,
      topicEvolution: this.classifyTopicEvolution(continuityScore, relatedMessages),
      continuityStrength: continuityScore,
      relatedToRecent: relatedMessages > 0,
      topicKeywords
    };
  }

  extractTopicKeywords(text) {
    // Simple keyword extraction (in production, use more sophisticated NLP)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
    
    return [...new Set(words)];
  }

  calculateKeywordOverlap(keywords1, keywords2) {
    const intersection = keywords1.filter(word => keywords2.includes(word));
    const union = [...new Set([...keywords1, ...keywords2])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  classifyTopicEvolution(continuityScore, relatedMessages) {
    if (continuityScore > 0.7) return 'deep_continuation';
    if (continuityScore > 0.4) return 'related_progression';
    if (continuityScore > 0.2) return 'loose_connection';
    return 'topic_shift';
  }

  isStopWord(word) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during'];
    return stopWords.includes(word);
  }

  /**
   * Context Evolution Analysis
   */
  analyzeContextEvolution(conversationHistory, currentInput) {
    const evolution = {
      evolutionType: 'stable',
      complexityProgression: 'constant',
      topicDrift: 0,
      contextualShifts: [],
      emergingPatterns: [],
      conversationMomentum: 'steady'
    };

    if (conversationHistory.length === 0) {
      evolution.evolutionType = 'initial';
      return evolution;
    }

    // Analyze complexity progression over time
    const complexityLevels = conversationHistory.map(entry => {
      const complexity = entry.contextualProfile?.contentProfile?.complexityLevel || 'intermediate';
      return this.getComplexityScore(complexity);
    });
    
    const currentComplexity = this.getComplexityScore(
      this.classifyContent(currentInput, []).complexityLevel
    );
    
    if (complexityLevels.length > 2) {
      const trend = this.calculateTrend(complexityLevels);
      if (trend > 0.3) evolution.complexityProgression = 'increasing';
      else if (trend < -0.3) evolution.complexityProgression = 'decreasing';
      else evolution.complexityProgression = 'stable';
    }

    // Analyze topic drift
    if (conversationHistory.length > 1) {
      const recentTopics = conversationHistory.slice(-3).map(entry => 
        entry.contextualProfile?.topicContinuity?.topicKeywords || []
      );
      
      const currentTopics = this.extractTopicKeywords(currentInput);
      evolution.topicDrift = this.calculateTopicDrift(recentTopics, currentTopics);
    }

    // Detect contextual shifts
    const shifts = this.detectContextualShifts(conversationHistory, currentInput);
    evolution.contextualShifts = shifts;

    // Analyze conversation momentum
    if (conversationHistory.length > 2) {
      const recentTimestamps = conversationHistory.slice(-3).map(entry => entry.timestamp);
      const timeIntervals = [];
      
      for (let i = 1; i < recentTimestamps.length; i++) {
        timeIntervals.push(recentTimestamps[i] - recentTimestamps[i-1]);
      }
      
      const avgInterval = timeIntervals.reduce((a, b) => a + b, 0) / timeIntervals.length;
      const recentInterval = Date.now() - recentTimestamps[recentTimestamps.length - 1];
      
      if (recentInterval < avgInterval * 0.5) evolution.conversationMomentum = 'accelerating';
      else if (recentInterval > avgInterval * 2) evolution.conversationMomentum = 'slowing';
      else evolution.conversationMomentum = 'steady';
    }

    // Identify emerging patterns
    evolution.emergingPatterns = this.identifyEmergingPatterns(conversationHistory, currentInput);

    // Determine overall evolution type
    if (evolution.topicDrift > 0.7) evolution.evolutionType = 'divergent';
    else if (evolution.topicDrift < 0.3 && evolution.complexityProgression === 'increasing') evolution.evolutionType = 'deepening';
    else if (shifts.length > 0) evolution.evolutionType = 'transitional';
    else evolution.evolutionType = 'progressive';

    return evolution;
  }

  getComplexityScore(complexityLevel) {
    const scores = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    return scores[complexityLevel] || 2;
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  calculateTopicDrift(recentTopicSets, currentTopics) {
    if (recentTopicSets.length === 0) return 0;
    
    const allRecentTopics = recentTopicSets.flat();
    const overlap = this.calculateKeywordOverlap(allRecentTopics, currentTopics);
    
    return 1 - overlap;
  }

  detectContextualShifts(conversationHistory, currentInput) {
    const shifts = [];
    
    if (conversationHistory.length === 0) return shifts;
    
    const lastEntry = conversationHistory[conversationHistory.length - 1];
    const lastProfile = lastEntry.contextualProfile?.contentProfile;
    const currentProfile = this.classifyContent(currentInput, []);
    
    if (lastProfile && lastProfile.primaryCategory !== currentProfile.primaryCategory) {
      shifts.push({
        type: 'content_category',
        from: lastProfile.primaryCategory,
        to: currentProfile.primaryCategory,
        confidence: 0.8
      });
    }
    
    if (lastProfile && lastProfile.communicationStyle !== currentProfile.communicationStyle) {
      shifts.push({
        type: 'communication_style',
        from: lastProfile.communicationStyle,
        to: currentProfile.communicationStyle,
        confidence: 0.6
      });
    }
    
    return shifts;
  }

  identifyEmergingPatterns(conversationHistory, currentInput) {
    const patterns = [];
    
    if (conversationHistory.length < 3) return patterns;
    
    // Check for recurring technical domains
    const technicalCategories = conversationHistory.map(entry => 
      entry.contextualProfile?.contentProfile?.primaryCategory
    ).concat([this.classifyContent(currentInput, []).primaryCategory]);
    
    const categoryFreq = {};
    technicalCategories.forEach(cat => {
      if (cat && cat !== 'general') {
        categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;
      }
    });
    
    Object.entries(categoryFreq).forEach(([category, frequency]) => {
      if (frequency >= 3) {
        patterns.push({
          type: 'recurring_domain',
          pattern: category,
          frequency,
          confidence: Math.min(frequency / conversationHistory.length, 1)
        });
      }
    });
    
    return patterns;
  }

  /**
   * Temporal Context Analysis
   */
  analyzeTemporalContext(conversationHistory) {
    const temporal = {
      sessionDuration: 0,
      interactionPattern: 'sporadic',
      peakActivity: 'unknown',
      conversationRhythm: 'steady',
      timeBasedPreferences: {},
      sessionPhase: 'initial'
    };

    if (conversationHistory.length === 0) {
      return temporal;
    }

    // Calculate session duration
    const firstInteraction = conversationHistory[0].timestamp;
    const lastInteraction = conversationHistory[conversationHistory.length - 1].timestamp;
    temporal.sessionDuration = lastInteraction - firstInteraction;

    // Analyze interaction pattern
    if (conversationHistory.length > 1) {
      const intervals = [];
      for (let i = 1; i < conversationHistory.length; i++) {
        intervals.push(conversationHistory[i].timestamp - conversationHistory[i-1].timestamp);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => 
        sum + Math.pow(interval - avgInterval, 2), 0
      ) / intervals.length;
      
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avgInterval;

      if (coefficientOfVariation < 0.3) temporal.interactionPattern = 'consistent';
      else if (coefficientOfVariation < 0.7) temporal.interactionPattern = 'moderate';
      else temporal.interactionPattern = 'sporadic';
    }

    // Determine session phase
    const totalDuration = temporal.sessionDuration;
    const recentActivity = Date.now() - lastInteraction;
    
    if (totalDuration < 5 * 60 * 1000) { // Less than 5 minutes
      temporal.sessionPhase = 'warming_up';
    } else if (totalDuration < 30 * 60 * 1000) { // Less than 30 minutes
      temporal.sessionPhase = 'active';
    } else if (recentActivity < 5 * 60 * 1000) { // Recent activity within 5 minutes
      temporal.sessionPhase = 'deep_engagement';
    } else {
      temporal.sessionPhase = 'winding_down';
    }

    // Analyze conversation rhythm
    const recentIntervals = conversationHistory.slice(-5).map((entry, index, arr) => 
      index > 0 ? entry.timestamp - arr[index - 1].timestamp : 0
    ).filter(interval => interval > 0);

    if (recentIntervals.length > 1) {
      const trend = this.calculateTrend(recentIntervals);
      if (trend > 0) temporal.conversationRhythm = 'accelerating';
      else if (trend < 0) temporal.conversationRhythm = 'decelerating';
      else temporal.conversationRhythm = 'steady';
    }

    // Identify time-based preferences
    temporal.timeBasedPreferences = this.identifyTimeBasedPreferences(conversationHistory);

    // Determine peak activity
    temporal.peakActivity = this.determinePeakActivityPattern(conversationHistory);

    return temporal;
  }

  identifyTimeBasedPreferences(conversationHistory) {
    const preferences = {
      preferredResponseTime: 'normal',
      complexityByPhase: {},
      topicPreferenceByTime: {}
    };

    // Analyze response time preferences based on interaction patterns
    if (conversationHistory.length > 3) {
      const intervals = [];
      for (let i = 1; i < conversationHistory.length; i++) {
        intervals.push(conversationHistory[i].timestamp - conversationHistory[i-1].timestamp);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      if (avgInterval < 30000) preferences.preferredResponseTime = 'fast'; // Less than 30 seconds
      else if (avgInterval > 300000) preferences.preferredResponseTime = 'deliberate'; // More than 5 minutes
      else preferences.preferredResponseTime = 'normal';
    }

    // Analyze complexity preferences by conversation phase
    const phaseSize = Math.ceil(conversationHistory.length / 3);
    const phases = ['early', 'middle', 'late'];
    
    phases.forEach((phase, index) => {
      const start = index * phaseSize;
      const end = Math.min((index + 1) * phaseSize, conversationHistory.length);
      const phaseEntries = conversationHistory.slice(start, end);
      
      const complexities = phaseEntries.map(entry => 
        entry.contextualProfile?.contentProfile?.complexityLevel || 'intermediate'
      );
      
      const complexityCount = {};
      complexities.forEach(complexity => {
        complexityCount[complexity] = (complexityCount[complexity] || 0) + 1;
      });
      
      const dominantComplexity = Object.keys(complexityCount).length > 0 
        ? Object.keys(complexityCount).reduce((a, b) => 
            complexityCount[a] > complexityCount[b] ? a : b
          )
        : 'intermediate';
      
      preferences.complexityByPhase[phase] = dominantComplexity;
    });

    return preferences;
  }

  determinePeakActivityPattern(conversationHistory) {
    if (conversationHistory.length < 5) return 'insufficient_data';

    // Group interactions by time periods to find peak activity
    const hourCounts = {};
    
    conversationHistory.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.keys(hourCounts).length > 0 
      ? Object.keys(hourCounts).reduce((a, b) => 
          hourCounts[a] > hourCounts[b] ? a : b
        )
      : '12';

    const peakHourNum = parseInt(peakHour);
    
    if (peakHourNum >= 6 && peakHourNum < 12) return 'morning';
    else if (peakHourNum >= 12 && peakHourNum < 18) return 'afternoon';
    else if (peakHourNum >= 18 && peakHourNum < 22) return 'evening';
    else return 'night';
  }

  /**
   * Enhanced Contextual Routing
   */
  routeWithContextualIntelligence(input, attachments, contextualProfile, options) {
    // Get base routing decision
    const baseRoute = super.analyzeNeuralPattern(input, attachments, options);
    
    // Apply contextual optimizations
    const contextualOptimizations = this.applyContextualOptimizations(baseRoute, contextualProfile);
    
    // Model performance in this context
    const contextualPerformance = this.evaluateModelPerformanceInContext(
      baseRoute.core.id, 
      contextualProfile
    );
    
    // User preference alignment
    const userAlignment = this.assessUserPreferenceAlignment(
      baseRoute, 
      contextualProfile.userProfile
    );

    // Final routing decision with context
    let finalRoute = baseRoute;

    // Override routing based on contextual intelligence
    if (contextualOptimizations.shouldUpgrade && this.isReasoningCoreAvailable()) {
      finalRoute = {
        pathway: 'contextual_quality_upgrade',
        core: this.neuralCores.reasoning,
        complexity: baseRoute.complexity,
        reason: `Contextual analysis suggests quality upgrade: ${contextualOptimizations.reason}`,
        contextInfluence: contextualOptimizations,
        adaptiveOptimization: true
      };
    } else if (contextualOptimizations.shouldDowngrade) {
      finalRoute = {
        pathway: 'contextual_efficiency_optimization',
        core: this.neuralCores.primary,
        complexity: baseRoute.complexity,
        reason: `Contextual optimization for efficiency: ${contextualOptimizations.reason}`,
        contextInfluence: contextualOptimizations,
        adaptiveOptimization: true
      };
    }

    // Add contextual metadata
    finalRoute.contextualIntelligence = {
      contentProfile: contextualProfile.contentProfile,
      userAlignment,
      contextualPerformance,
      topicContinuity: contextualProfile.topicContinuity,
      optimizationApplied: contextualOptimizations
    };

    return finalRoute;
  }

  /**
   * Contextual Optimization Logic
   */
  applyContextualOptimizations(baseRoute, contextualProfile) {
    const optimizations = {
      shouldUpgrade: false,
      shouldDowngrade: false,
      reason: '',
      confidence: 0
    };

    // Check if user typically prefers detailed responses
    if (contextualProfile.userProfile.preferredResponseStyle === 'detailed' &&
        baseRoute.core.id === this.neuralCores.primary.id &&
        contextualProfile.contentProfile.responseType === 'comprehensive_analysis') {
      
      optimizations.shouldUpgrade = true;
      optimizations.reason = 'User prefers detailed responses and content requires comprehensive analysis';
      optimizations.confidence = 0.8;
    }

    // Check if topic continuation benefits from same model
    if (contextualProfile.topicContinuity.topicEvolution === 'deep_continuation') {
      const lastSuccessfulModel = this.getLastSuccessfulModelForUser(
        contextualProfile.userProfile.userId
      );
      
      if (lastSuccessfulModel && lastSuccessfulModel !== baseRoute.core.id) {
        optimizations.shouldUpgrade = lastSuccessfulModel === this.neuralCores.reasoning.id;
        optimizations.shouldDowngrade = lastSuccessfulModel === this.neuralCores.primary.id;
        optimizations.reason = 'Topic continuation suggests maintaining model consistency';
        optimizations.confidence = 0.6;
      }
    }

    // Check if content type has strong model preference
    const contentTypePreference = this.getModelPreferenceForContentType(
      contextualProfile.contentProfile.primaryCategory
    );
    
    if (contentTypePreference && contentTypePreference.confidence > 0.7) {
      if (contentTypePreference.preferredModel === 'reasoning' && 
          baseRoute.core.id === this.neuralCores.primary.id) {
        optimizations.shouldUpgrade = true;
        optimizations.reason = `Content type '${contextualProfile.contentProfile.primaryCategory}' performs better with reasoning core`;
        optimizations.confidence = contentTypePreference.confidence;
      }
    }

    return optimizations;
  }

  /**
   * Context Memory Management
   */
  updateConversationalContext(userId, conversationId, contextData) {
    const key = `${userId}:${conversationId}`;
    
    if (!this.contextualIntelligence.conversationMemory.has(key)) {
      this.contextualIntelligence.conversationMemory.set(key, []);
    }
    
    const conversation = this.contextualIntelligence.conversationMemory.get(key);
    conversation.push(contextData);
    
    // Maintain conversation history limit
    if (conversation.length > this.contextualIntelligence.maxContextHistory) {
      conversation.shift();
    }
    
    this.contextualIntelligence.conversationMemory.set(key, conversation);
  }

  getConversationHistory(userId, conversationId) {
    const key = `${userId}:${conversationId}`;
    return this.contextualIntelligence.conversationMemory.get(key) || [];
  }

  getUserProfile(userId) {
    if (!this.contextualIntelligence.userProfiles.has(userId)) {
      this.contextualIntelligence.userProfiles.set(userId, {
        userId,
        preferredResponseStyle: 'adaptive',
        preferredComplexity: 'adaptive',
        topicalInterests: [],
        interactionHistory: [],
        modelSuccessRates: {},
        createdAt: Date.now(),
        lastActive: Date.now()
      });
    }
    
    const profile = this.contextualIntelligence.userProfiles.get(userId);
    profile.lastActive = Date.now();
    return profile;
  }

  /**
   * Learning and Adaptation
   */
  learnFromInteraction(userId, conversationId, contextualProfile, response, success) {
    // Update user profile
    const userProfile = this.getUserProfile(userId);
    
    userProfile.interactionHistory.push({
      timestamp: Date.now(),
      contentProfile: contextualProfile.contentProfile,
      success,
      modelUsed: response?.model,
      processingTime: response?.metadata?.processingTime
    });
    
    // Update model success rates for user
    if (response?.model) {
      if (!userProfile.modelSuccessRates[response.model]) {
        userProfile.modelSuccessRates[response.model] = { attempts: 0, successes: 0 };
      }
      
      userProfile.modelSuccessRates[response.model].attempts++;
      if (success) {
        userProfile.modelSuccessRates[response.model].successes++;
      }
    }
    
    // Update content pattern performance
    const contentType = contextualProfile.contentProfile.primaryCategory;
    if (!this.contextualIntelligence.contentPatterns.has(contentType)) {
      this.contextualIntelligence.contentPatterns.set(contentType, {
        totalInteractions: 0,
        successfulInteractions: 0,
        modelPerformance: {}
      });
    }
    
    const contentPattern = this.contextualIntelligence.contentPatterns.get(contentType);
    contentPattern.totalInteractions++;
    if (success) contentPattern.successfulInteractions++;
    
    if (response?.model) {
      if (!contentPattern.modelPerformance[response.model]) {
        contentPattern.modelPerformance[response.model] = { attempts: 0, successes: 0 };
      }
      contentPattern.modelPerformance[response.model].attempts++;
      if (success) contentPattern.modelPerformance[response.model].successes++;
    }
    
    // Maintain profile history limits
    if (userProfile.interactionHistory.length > 100) {
      userProfile.interactionHistory.shift();
    }
  }

  /**
   * Contextual Analysis Helpers
   */
  getLastSuccessfulModelForUser(userId) {
    const userProfile = this.getUserProfile(userId);
    const recentSuccesses = userProfile.interactionHistory
      .filter(interaction => interaction.success)
      .slice(-5);
    
    if (recentSuccesses.length === 0) return null;
    
    // Return most frequently successful model in recent history
    const modelCounts = {};
    recentSuccesses.forEach(interaction => {
      modelCounts[interaction.modelUsed] = (modelCounts[interaction.modelUsed] || 0) + 1;
    });
    
    return Object.keys(modelCounts).length > 0 
      ? Object.keys(modelCounts).reduce((a, b) => 
          modelCounts[a] > modelCounts[b] ? a : b
        )
      : null;
  }

  getModelPreferenceForContentType(contentType) {
    const contentPattern = this.contextualIntelligence.contentPatterns.get(contentType);
    if (!contentPattern || contentPattern.totalInteractions < 10) {
      return null;
    }
    
    let bestModel = null;
    let bestSuccessRate = 0;
    
    Object.entries(contentPattern.modelPerformance).forEach(([model, performance]) => {
      if (performance.attempts >= 5) {
        const successRate = performance.successes / performance.attempts;
        if (successRate > bestSuccessRate) {
          bestSuccessRate = successRate;
          bestModel = model;
        }
      }
    });
    
    if (bestModel && bestSuccessRate > 0.7) {
      return {
        preferredModel: this.getModelTypeFromId(bestModel),
        confidence: bestSuccessRate,
        sampleSize: contentPattern.modelPerformance[bestModel].attempts
      };
    }
    
    return null;
  }

  /**
   * Model Performance in Context
   */
  getModelPerformanceInContext(contentProfile, userProfile) {
    const performance = {
      contextualScore: 0.5,
      reliabilityInContext: 0.5,
      speedInContext: 0.5,
      qualityInContext: 0.5,
      recommendedModel: null,
      confidence: 0.5
    };

    if (!contentProfile || !userProfile) {
      return performance;
    }

    // Get content type performance data
    const contentType = contentProfile.primaryCategory;
    const contentPattern = this.contextualIntelligence.contentPatterns.get(contentType);
    
    if (contentPattern && contentPattern.totalInteractions > 5) {
      // Calculate performance scores for each model in this content type
      const modelScores = {};
      
      Object.entries(contentPattern.modelPerformance).forEach(([model, stats]) => {
        if (stats.attempts >= 3) {
          const successRate = stats.successes / stats.attempts;
          modelScores[model] = {
            successRate,
            sampleSize: stats.attempts,
            reliability: Math.min(successRate * 1.2, 1.0)
          };
        }
      });

      // Find best performing model for this content type
      let bestModel = null;
      let bestScore = 0;
      
      Object.entries(modelScores).forEach(([model, score]) => {
        if (score.successRate > bestScore && score.sampleSize >= 3) {
          bestScore = score.successRate;
          bestModel = model;
        }
      });
      
      if (bestModel) {
        performance.recommendedModel = bestModel;
        performance.contextualScore = bestScore;
        performance.reliabilityInContext = modelScores[bestModel].reliability;
        performance.confidence = Math.min(modelScores[bestModel].sampleSize / 10, 1.0);
      }
    }

    // Factor in user's historical model performance
    if (userProfile.modelSuccessRates) {
      const userModelPerformance = {};
      
      Object.entries(userProfile.modelSuccessRates).forEach(([model, stats]) => {
        if (stats.attempts >= 3) {
          userModelPerformance[model] = stats.successes / stats.attempts;
        }
      });
      
      // Blend content type performance with user performance
      if (performance.recommendedModel && userModelPerformance[performance.recommendedModel]) {
        const userSuccessRate = userModelPerformance[performance.recommendedModel];
        performance.contextualScore = (performance.contextualScore + userSuccessRate) / 2;
        performance.confidence = Math.min(performance.confidence + 0.2, 1.0);
      }
    }

    // Adjust based on content complexity and user preferences
    const complexityLevel = contentProfile.complexityLevel;
    const userComplexityPreference = userProfile.preferredComplexity || 'adaptive';
    
    if (complexityLevel === 'expert' || complexityLevel === 'advanced') {
      if (performance.recommendedModel === this.neuralCores.reasoning.id) {
        performance.qualityInContext = Math.min(performance.qualityInContext + 0.3, 1.0);
      }
    }

    // Consider response type requirements
    if (contentProfile.responseType === 'comprehensive_analysis' || 
        contentProfile.responseType === 'step_by_step') {
      if (performance.recommendedModel === this.neuralCores.reasoning.id) {
        performance.qualityInContext = Math.min(performance.qualityInContext + 0.2, 1.0);
      }
    }

    return performance;
  }

  /**
   * Evaluate Model Performance in Specific Context
   */
  evaluateModelPerformanceInContext(modelId, contextualProfile) {
    const evaluation = {
      performanceScore: 0.5,
      suitabilityScore: 0.5,
      riskScore: 0.5,
      expectedQuality: 'standard',
      expectedSpeed: 'normal',
      recommendations: []
    };

    if (!modelId || !contextualProfile) {
      return evaluation;
    }

    const contentProfile = contextualProfile.contentProfile;
    const userProfile = contextualProfile.userProfile;
    
    // Base model characteristics
    const modelInfo = this.getModelInfo(modelId);
    if (!modelInfo) {
      evaluation.riskScore = 0.8;
      evaluation.recommendations.push('Model information not available');
      return evaluation;
    }

    // Evaluate suitability for content type
    const contentType = contentProfile.primaryCategory;
    const contentPattern = this.contextualIntelligence.contentPatterns.get(contentType);
    
    if (contentPattern && contentPattern.modelPerformance[modelId]) {
      const modelStats = contentPattern.modelPerformance[modelId];
      if (modelStats.attempts >= 3) {
        const successRate = modelStats.successes / modelStats.attempts;
        evaluation.suitabilityScore = successRate;
        
        if (successRate > 0.8) evaluation.expectedQuality = 'high';
        else if (successRate > 0.6) evaluation.expectedQuality = 'good';
        else if (successRate < 0.4) evaluation.expectedQuality = 'low';
      }
    }

    // Evaluate based on complexity requirements
    const complexityLevel = contentProfile.complexityLevel;
    if (complexityLevel === 'expert' || complexityLevel === 'advanced') {
      if (modelId === this.neuralCores.reasoning.id) {
        evaluation.performanceScore = Math.min(evaluation.performanceScore + 0.3, 1.0);
        evaluation.recommendations.push('Well-suited for complex analytical tasks');
      } else {
        evaluation.performanceScore = Math.max(evaluation.performanceScore - 0.2, 0.1);
        evaluation.recommendations.push('Consider reasoning core for complex tasks');
      }
    }

    // Evaluate for user preferences
    if (userProfile && userProfile.modelSuccessRates && userProfile.modelSuccessRates[modelId]) {
      const userStats = userProfile.modelSuccessRates[modelId];
      if (userStats.attempts >= 3) {
        const userSuccessRate = userStats.successes / userStats.attempts;
        evaluation.performanceScore = (evaluation.performanceScore + userSuccessRate) / 2;
        
        if (userSuccessRate > 0.8) {
          evaluation.recommendations.push('Strong historical performance for this user');
        } else if (userSuccessRate < 0.5) {
          evaluation.recommendations.push('Consider alternative model based on user history');
        }
      }
    }

    // Model-specific evaluations
    if (modelId === this.neuralCores.primary.id) {
      evaluation.expectedSpeed = 'fast';
      evaluation.riskScore = 0.1; // Very reliable
      if (contentProfile.responseType === 'quick_answer') {
        evaluation.suitabilityScore = Math.min(evaluation.suitabilityScore + 0.2, 1.0);
      }
    } else if (modelId === this.neuralCores.reasoning.id) {
      evaluation.expectedSpeed = 'slower';
      evaluation.riskScore = 0.3; // Less reliable but higher quality
      if (contentProfile.analysisRequired > 1 || contentProfile.complexityLevel === 'advanced') {
        evaluation.suitabilityScore = Math.min(evaluation.suitabilityScore + 0.3, 1.0);
      }
    } else if (modelId === this.neuralCores.vision.id) {
      if (contentProfile.hasVisualContent) {
        evaluation.suitabilityScore = Math.min(evaluation.suitabilityScore + 0.4, 1.0);
        evaluation.recommendations.push('Optimal for visual content processing');
      } else {
        evaluation.suitabilityScore = Math.max(evaluation.suitabilityScore - 0.3, 0.1);
        evaluation.recommendations.push('Not recommended for text-only tasks');
      }
    }

    // Calculate overall performance score
    evaluation.performanceScore = (
      evaluation.suitabilityScore * 0.4 +
      (1 - evaluation.riskScore) * 0.3 +
      evaluation.performanceScore * 0.3
    );

    return evaluation;
  }

  getModelInfo(modelId) {
    // Find model in neuralCores
    const coreEntries = Object.values(this.neuralCores);
    return coreEntries.find(core => core.id === modelId) || null;
  }

  getModelTypeFromId(modelId) {
    if (modelId === this.neuralCores.reasoning.id) return 'reasoning';
    if (modelId === this.neuralCores.vision.id) return 'vision';
    return 'primary';
  }

  /**
   * Assess User Preference Alignment
   */
  assessUserPreferenceAlignment(routingDecision, userProfile) {
    const alignment = {
      overallScore: 0.5,
      modelPreferenceAlignment: 0.5,
      complexityAlignment: 0.5,
      styleAlignment: 0.5,
      speedAlignment: 0.5,
      qualityAlignment: 0.5,
      recommendations: [],
      confidenceLevel: 0.5
    };

    if (!routingDecision || !userProfile) {
      alignment.recommendations.push('Insufficient data for preference alignment');
      return alignment;
    }

    const proposedModel = routingDecision.core.id;
    const routeComplexity = routingDecision.complexity || 'medium';

    // Model preference alignment
    if (userProfile.modelSuccessRates && Object.keys(userProfile.modelSuccessRates).length > 0) {
      const userModelPerformance = {};
      let totalAttempts = 0;
      
      Object.entries(userProfile.modelSuccessRates).forEach(([model, stats]) => {
        if (stats.attempts >= 2) {
          userModelPerformance[model] = stats.successes / stats.attempts;
          totalAttempts += stats.attempts;
        }
      });

      if (userModelPerformance[proposedModel]) {
        alignment.modelPreferenceAlignment = userModelPerformance[proposedModel];
        
        if (userModelPerformance[proposedModel] > 0.8) {
          alignment.recommendations.push('Strong historical performance with this model');
        } else if (userModelPerformance[proposedModel] < 0.4) {
          alignment.recommendations.push('Consider alternative model based on user history');
          
          // Suggest better alternative
          const bestModel = Object.keys(userModelPerformance).length > 0 
            ? Object.keys(userModelPerformance).reduce((a, b) => 
                userModelPerformance[a] > userModelPerformance[b] ? a : b
              )
            : null;
          
          if (bestModel !== proposedModel && userModelPerformance[bestModel] > 0.7) {
            alignment.recommendations.push(`Consider ${this.getModelTypeFromId(bestModel)} model instead`);
          }
        }
      }

      alignment.confidenceLevel = Math.min(totalAttempts / 20, 1.0);
    }

    // Complexity preference alignment
    const userPreferredComplexity = userProfile.preferredComplexity || 'adaptive';
    if (userPreferredComplexity !== 'adaptive') {
      const complexityMap = {
        'low': ['beginner', 'simple'],
        'medium': ['intermediate', 'moderate'],
        'high': ['advanced', 'expert']
      };

      const routeComplexityCategory = this.categorizeComplexity(routeComplexity);
      const preferredComplexityCategory = this.categorizeComplexity(userPreferredComplexity);

      if (routeComplexityCategory === preferredComplexityCategory) {
        alignment.complexityAlignment = 1.0;
        alignment.recommendations.push('Complexity level matches user preference');
      } else if (Math.abs(
        this.getComplexityScore(routeComplexityCategory) - 
        this.getComplexityScore(preferredComplexityCategory)
      ) === 1) {
        alignment.complexityAlignment = 0.7;
      } else {
        alignment.complexityAlignment = 0.3;
        alignment.recommendations.push(`Consider adjusting complexity to ${userPreferredComplexity} level`);
      }
    }

    // Response style alignment
    if (userProfile.preferredResponseStyle && userProfile.preferredResponseStyle !== 'adaptive') {
      const routeStyle = this.inferResponseStyleFromRoute(routingDecision);
      if (routeStyle === userProfile.preferredResponseStyle) {
        alignment.styleAlignment = 1.0;
      } else {
        alignment.styleAlignment = 0.6;
        alignment.recommendations.push(`User prefers ${userProfile.preferredResponseStyle} style responses`);
      }
    }

    // Speed vs Quality preference alignment
    if (userProfile.interactionHistory && userProfile.interactionHistory.length > 5) {
      const recentInteractions = userProfile.interactionHistory.slice(-10);
      const avgProcessingTime = recentInteractions.reduce((sum, interaction) => 
        sum + (interaction.processingTime || 2000), 0
      ) / recentInteractions.length;

      // Infer speed preference from historical data
      let speedPreference = 'balanced';
      if (avgProcessingTime < 1500) speedPreference = 'fast';
      else if (avgProcessingTime > 3000) speedPreference = 'quality';

      // Assess alignment with routing decision
      if (proposedModel === this.neuralCores.primary.id) {
        // Primary core is fast
        alignment.speedAlignment = speedPreference === 'fast' ? 1.0 : 
                                   speedPreference === 'balanced' ? 0.8 : 0.6;
      } else if (proposedModel === this.neuralCores.reasoning.id) {
        // Reasoning core is slower but higher quality
        alignment.speedAlignment = speedPreference === 'quality' ? 1.0 :
                                   speedPreference === 'balanced' ? 0.7 : 0.4;
        alignment.qualityAlignment = 1.0;
      }

      if (alignment.speedAlignment < 0.6) {
        alignment.recommendations.push(`User typically prefers ${speedPreference} responses`);
      }
    }

    // Topic interest alignment
    if (userProfile.topicalInterests && userProfile.topicalInterests.length > 0) {
      // This would need to be populated from previous context analysis
      alignment.recommendations.push('Consider user\'s topic interests for content optimization');
    }

    // Calculate overall alignment score
    const weights = {
      modelPreferenceAlignment: 0.3,
      complexityAlignment: 0.25,
      styleAlignment: 0.2,
      speedAlignment: 0.15,
      qualityAlignment: 0.1
    };

    alignment.overallScore = Object.keys(weights).reduce((score, key) => 
      score + (alignment[key] * weights[key]), 0
    );

    // Provide overall recommendation
    if (alignment.overallScore > 0.8) {
      alignment.recommendations.unshift('Excellent alignment with user preferences');
    } else if (alignment.overallScore > 0.6) {
      alignment.recommendations.unshift('Good alignment with user preferences');
    } else if (alignment.overallScore < 0.4) {
      alignment.recommendations.unshift('Consider optimizing for better user preference alignment');
    }

    return alignment;
  }

  categorizeComplexity(complexity) {
    const complexityMappings = {
      'low': 'beginner',
      'simple': 'beginner',
      'beginner': 'beginner',
      'medium': 'intermediate',
      'moderate': 'intermediate',
      'intermediate': 'intermediate',
      'high': 'advanced',
      'complex': 'advanced',
      'advanced': 'advanced',
      'expert': 'expert'
    };

    return complexityMappings[complexity.toLowerCase()] || 'intermediate';
  }

  inferResponseStyleFromRoute(routingDecision) {
    // Infer response style based on routing decision
    if (routingDecision.core.id === this.neuralCores.reasoning.id) {
      return 'detailed';
    } else if (routingDecision.pathway.includes('quick') || routingDecision.pathway.includes('fast')) {
      return 'concise';
    } else {
      return 'balanced';
    }
  }

  /**
   * Enhanced Status with Contextual Intelligence
   */
  getContextualSystemStatus() {
    const baseStatus = super.getNeuralSystemStatus();
    
    return {
      ...baseStatus,
      contextualIntelligence: {
        activeConversations: this.contextualIntelligence.conversationMemory.size,
        trackedUsers: this.contextualIntelligence.userProfiles.size,
        contentPatterns: this.contextualIntelligence.contentPatterns.size,
        learningEnabled: this.contextualIntelligence.userBehaviorLearning,
        topicTrackingEnabled: this.contextualIntelligence.topicTrackingEnabled
      }
    };
  }
}

/**
 * Global Contextual NeuroFusion-3.1 Instance
 */
export const contextualNeuroFusion31 = new ContextualNeuroFusion31({
  enableNeuralAnalytics: true,
  enableAdaptiveFusion: true,
  enableVisionFallback: true,
  enablePredictiveRouting: true,
  neuralDebugMode: process.env.NODE_ENV === 'development',
  learningMode: true
});

/**
 * Enhanced React Hook with Contextual Awareness
 */
export const useContextualNeuroFusion31 = (userId, conversationId) => {
  const [neuralStatus, setNeuralStatus] = useState(
    contextualNeuroFusion31.getContextualSystemStatus()
  );
  
  const processContextualRequest = async (input, attachments = [], options = {}) => {
    const enhancedOptions = {
      ...options,
      userId,
      conversationId
    };
    
    const result = await contextualNeuroFusion31.processContextualRequest(
      input, 
      attachments, 
      enhancedOptions
    );
    
    setNeuralStatus(contextualNeuroFusion31.getContextualSystemStatus());
    return result;
  };
  
  const getUserInsights = () => {
    return contextualNeuroFusion31.getUserProfile(userId);
  };
  
  const getConversationInsights = () => {
    return contextualNeuroFusion31.getConversationHistory(userId, conversationId);
  };
  
  return {
    processRequest: processContextualRequest,
    neuralStatus,
    getUserInsights,
    getConversationInsights,
    systemName: contextualNeuroFusion31.systemName,
    version: contextualNeuroFusion31.version
  };
};

export default contextualNeuroFusion31;