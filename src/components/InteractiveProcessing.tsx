'use client';

import { useState, useEffect } from 'react';

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration: number; // in ms
}

interface AIFact {
  title: string;
  description: string;
  icon: string;
}

const PROCESSING_STAGES: ProcessingStage[] = [
  {
    id: 'analyze',
    name: 'Neural Analysis',
    description: 'Analyzing query complexity and content patterns...',
    icon: '🧠',
    duration: 2000
  },
  {
    id: 'route',
    name: 'Intelligent Routing',
    description: 'Selecting optimal neural cores and ensemble strategy...',
    icon: '⚡',
    duration: 1500
  },
  {
    id: 'activate',
    name: 'Core Activation',
    description: 'Activating Phoenix, Oracle, and Iris cores...',
    icon: '🔥',
    duration: 2500
  },
  {
    id: 'process',
    name: 'Neural Processing',
    description: 'Multi-model ensemble processing in progress...',
    icon: '⚙️',
    duration: 5000
  },
  {
    id: 'fusion',
    name: 'Response Fusion',
    description: 'Fusing neural responses for optimal quality...',
    icon: '✨',
    duration: 2000
  }
];

const AI_FACTS: AIFact[] = [
  {
    title: "Neural Ensemble Power",
    description: "Multiple AI models working together can achieve 30-40% better accuracy than single models.",
    icon: "⚡"
  },
  {
    title: "Pattern Recognition",
    description: "Our Phoenix core processes over 8 billion parameters to understand your query patterns.",
    icon: "🔍"
  },
  {
    title: "Vision Intelligence",
    description: "The Iris core can identify thousands of objects, read text, and understand visual relationships.",
    icon: "👁️"
  },
  {
    title: "Reasoning Depth",
    description: "Oracle core uses advanced reasoning with 20 billion parameters for complex problem-solving.",
    icon: "🧠"
  },
  {
    title: "Fusion Technology",
    description: "NeuroFusion combines responses by analyzing quality, relevance, and complementarity.",
    icon: "🔬"
  },
  {
    title: "Response Quality",
    description: "Ensemble processing can improve response quality by up to 60% compared to single models.",
    icon: "📈"
  }
];

interface InteractiveProcessingProps {
  ensembleStrategy?: string;
  hasAttachments?: boolean;
  _estimatedTime?: number;
}

export default function InteractiveProcessing({ 
  ensembleStrategy = 'parallel',
  hasAttachments = false,
  _estimatedTime = 10000 
}: InteractiveProcessingProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [neuralActivity, setNeuralActivity] = useState<number[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Initialize neural activity animation
  useEffect(() => {
    setNeuralActivity(Array(12).fill(0).map(() => Math.random()));
    
    const activityInterval = setInterval(() => {
      setNeuralActivity(prev => prev.map(() => Math.random()));
    }, 150);

    return () => clearInterval(activityInterval);
  }, []);

  // Progress through stages
  useEffect(() => {
    let stageTimer: NodeJS.Timeout;
    const progressTimer: { current?: NodeJS.Timeout } = { current: undefined };
    
    const advanceStage = () => {
      if (currentStage < PROCESSING_STAGES.length - 1) {
        setCurrentStage(prev => prev + 1);
        setProgress(0);
      }
    };

    const updateProgress = () => {
      const stage = PROCESSING_STAGES[currentStage];
      const progressStep = 100 / (stage.duration / 100);
      
      setProgress(prev => {
        const newProgress = prev + progressStep;
        return newProgress >= 100 ? 100 : newProgress;
      });
    };

    // Set stage timer
    if (currentStage < PROCESSING_STAGES.length - 1) {
      stageTimer = setTimeout(advanceStage, PROCESSING_STAGES[currentStage].duration);
    }

    // Update progress
    progressTimer.current = setInterval(updateProgress, 100);

    return () => {
      clearTimeout(stageTimer);
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [currentStage]);

  // Cycle through AI facts
  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % AI_FACTS.length);
    }, 4000);

    return () => clearInterval(factInterval);
  }, []);

  // Track elapsed time
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setTimeElapsed(prev => prev + 100);
    }, 100);

    return () => clearInterval(timeInterval);
  }, []);

  const getStrategyDisplay = () => {
    switch (ensembleStrategy) {
      case 'parallel': return { name: 'Parallel Ensemble', icon: '⚡', color: 'text-purple-600' };
      case 'sequential': return { name: 'Sequential Enhancement', icon: '🔄', color: 'text-blue-600' };
      case 'consensus': return { name: 'Consensus Building', icon: '✅', color: 'text-green-600' };
      case 'synthesis': return { name: 'Advanced Synthesis', icon: '🎯', color: 'text-orange-600' };
      default: return { name: 'Neural Processing', icon: '🔥', color: 'text-gray-600' };
    }
  };

  const strategy = getStrategyDisplay();
  const currentStageData = PROCESSING_STAGES[currentStage];
  const fact = AI_FACTS[currentFact];

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">N</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            NeuroFusion-3.1
          </h3>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm">
          <span className={`${strategy.color} font-medium`}>
            {strategy.icon} {strategy.name}
          </span>
          {hasAttachments && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-purple-600 font-medium">👁️ Vision Active</span>
            </>
          )}
        </div>
      </div>

      {/* Neural Activity Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-1 mb-3">
          {neuralActivity.map((activity, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-blue-400 to-purple-500 rounded-full transition-all duration-150"
              style={{
                height: `${8 + activity * 24}px`,
                opacity: 0.4 + activity * 0.6
              }}
            />
          ))}
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          Neural Activity: {Math.round(neuralActivity.reduce((a, b) => a + b, 0) / neuralActivity.length * 100)}%
        </div>
      </div>

      {/* Current Processing Stage */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="text-2xl">{currentStageData.icon}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {currentStageData.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentStageData.description}
            </p>
          </div>
          <div className="text-xs text-gray-500">
            {(timeElapsed / 1000).toFixed(1)}s
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Stage indicators */}
        <div className="flex justify-between">
          {PROCESSING_STAGES.map((stage, index) => (
            <div
              key={stage.id}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index <= currentStage
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 scale-110'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* AI Fact Display */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-500">
        <div className="text-center">
          <div className="text-2xl mb-3">{fact.icon}</div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">
            {fact.title}
          </h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {fact.description}
          </p>
        </div>
      </div>
    </div>
  );
}