'use client';

import React from 'react';

interface FusionProgressProps {
  progress: {
    stage: 'initializing' | 'querying' | 'synthesizing' | 'completed' | 'error';
    modelProgress: { [modelId: string]: number };
    synthesisProgress: number;
    message: string;
  };
}

const modelNames: { [key: string]: { name: string; icon: string; color: string } } = {
  'meta-llama/llama-3.3-70b-instruct:free': { name: 'Llama 70B', icon: '🧠', color: 'bg-blue-500' },
  'meta-llama/llama-3.3-8b-instruct:free': { name: 'Llama 8B', icon: '⚡', color: 'bg-green-500' },
  'microsoft/wizardlm-2-8x22b:free': { name: 'WizardLM', icon: '✨', color: 'bg-purple-500' },
  'openai/gpt-oss-20b:free': { name: 'GPT OSS', icon: '🤖', color: 'bg-orange-500' }
};

export default function FusionProgress({ progress }: FusionProgressProps) {
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'initializing': return '🚀';
      case 'querying': return '🔄';
      case 'synthesizing': return '🧬';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⚙️';
    }
  };

  const getStageMessage = (stage: string) => {
    switch (stage) {
      case 'initializing': return 'Initializing Fusion Engine...';
      case 'querying': return 'Querying AI Models in Parallel...';
      case 'synthesizing': return 'Synthesizing Enhanced Response...';
      case 'completed': return 'Fusion Complete!';
      case 'error': return 'Fusion Error';
      default: return 'Processing...';
    }
  };

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
      {/* Stage Header */}
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">{getStageIcon(progress.stage)}</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Multi-Model Fusion
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {progress.message || getStageMessage(progress.stage)}
          </p>
        </div>
      </div>

      {/* Model Progress Bars */}
      {progress.stage === 'querying' && (
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Model Processing:
          </h4>
          {Object.entries(progress.modelProgress).map(([modelId, modelProgress]) => {
            const model = modelNames[modelId];
            if (!model) return null;
            
            return (
              <div key={modelId} className="flex items-center space-x-3">
                <span className="text-lg">{model.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                  {model.name}
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`${model.color} h-2 rounded-full transition-all duration-300 ease-out`}
                    style={{ width: `${modelProgress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                  {modelProgress}%
                </span>
                {modelProgress === 100 && (
                  <span className="text-green-500 text-sm">✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Synthesis Progress */}
      {(progress.stage === 'synthesizing' || progress.stage === 'completed') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              🧬 Response Synthesis:
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {progress.synthesisProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.synthesisProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Fusion Stats (when completed) */}
      {progress.stage === 'completed' && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
            <span>🎉</span>
            <span className="text-sm font-medium">
              Fusion successful! Enhanced response generated from 4 AI models.
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {progress.stage === 'error' && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
            <span>⚠️</span>
            <span className="text-sm">
              {progress.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}