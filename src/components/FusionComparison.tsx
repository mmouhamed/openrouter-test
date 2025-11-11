'use client';

import React, { useState } from 'react';

interface FusionComparisonProps {
  fusionData: {
    strategy: string;
    modelsUsed: string[];
    individualResponses: Array<{
      model: string;
      modelName: string;
      response: string;
      confidence: number;
      processingTime: number;
      role: 'primary' | 'creative' | 'technical' | 'analytical';
      status: 'success' | 'error' | 'timeout';
    }>;
    processingTime: number;
    confidence: number;
    qualityScore: number;
  };
  fusedResponse: string;
}

export default function FusionComparison({ fusionData, fusedResponse }: FusionComparisonProps) {
  const [activeTab, setActiveTab] = useState<'fused' | 'individual' | 'comparison'>('fused');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'primary': return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20';
      case 'creative': return 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20';
      case 'technical': return 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/20';
      case 'analytical': return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/20';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'primary': return '🧠';
      case 'creative': return '✨';
      case 'technical': return '🤖';
      case 'analytical': return '⚡';
      default: return '🔧';
    }
  };

  const successfulResponses = fusionData.individualResponses.filter(r => r.status === 'success');
  const avgIndividualConfidence = successfulResponses.reduce((sum, r) => sum + r.confidence, 0) / successfulResponses.length;

  return (
    <div className="mt-4 border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 border-b border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <span>🧬</span>
              <span>Multi-Model Fusion Analysis</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {fusionData.strategy} • {fusionData.modelsUsed.length} models • {fusionData.processingTime}ms
            </p>
          </div>
          
          {/* Quality Metrics */}
          <div className="flex space-x-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">
                {Math.round(fusionData.confidence * 100)}%
              </div>
              <div className="text-gray-500 dark:text-gray-400">Confidence</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">
                {fusionData.qualityScore}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Quality</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('fused')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'fused'
              ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🧬 Fused Response
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'individual'
              ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🤖 Individual Models ({successfulResponses.length})
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'comparison'
              ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          📊 Comparison
        </button>
      </div>

      <div className="p-6">
        {/* Fused Response Tab */}
        {activeTab === 'fused' && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span>✨</span>
                <span className="font-medium text-green-700 dark:text-green-300">
                  Enhanced Fusion Response
                </span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  ({Math.round((fusionData.confidence - avgIndividualConfidence) * 100)}% improvement)
                </span>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300">
                {fusedResponse}
              </div>
            </div>
          </div>
        )}

        {/* Individual Models Tab */}
        {activeTab === 'individual' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fusionData.individualResponses.map((response, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedModel === response.model
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedModel(selectedModel === response.model ? null : response.model)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span>{getRoleIcon(response.role)}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {response.modelName}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(response.role)}`}>
                        {response.role}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{Math.round(response.confidence * 100)}%</span>
                      <span>•</span>
                      <span>{response.processingTime}ms</span>
                      <div className={`w-2 h-2 rounded-full ${response.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                  
                  {selectedModel === response.model && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {response.response || (
                          <div className="text-red-500 text-sm">
                            Error: {response.status === 'error' ? 'Model failed to respond' : 'Request timed out'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {successfulResponses.length}/{fusionData.individualResponses.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{Math.round((fusionData.confidence - avgIndividualConfidence) * 100)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Confidence Boost</div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {fusionData.qualityScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Quality Score</div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {fusionData.processingTime}ms
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
              </div>
            </div>

            {/* Model Performance Chart */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Individual Model Performance</h4>
              {fusionData.individualResponses.map((response, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 w-32">
                    <span>{getRoleIcon(response.role)}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {response.modelName}
                    </span>
                  </div>
                  
                  {response.status === 'success' ? (
                    <>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${response.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                        {Math.round(response.confidence * 100)}%
                      </span>
                    </>
                  ) : (
                    <div className="flex-1 text-sm text-red-500">
                      Failed ({response.status})
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Fusion Benefits */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                <span>🎯</span>
                <span>Fusion Benefits</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <span>✅</span>
                  <span>Multiple perspectives combined</span>
                </div>
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <span>✅</span>
                  <span>Error correction from ensemble</span>
                </div>
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <span>✅</span>
                  <span>Enhanced creativity and accuracy</span>
                </div>
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <span>✅</span>
                  <span>Comprehensive knowledge synthesis</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}