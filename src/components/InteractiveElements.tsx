'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause, 
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  Share2,
  BookOpen,
  Code,
  FileText,
  Image as ImageIcon,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'info' | 'warning' | 'success';
  id?: string;
}

export function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = false, 
  variant = 'default',
  id 
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantStyles = {
    default: {
      header: 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
      border: 'border-gray-200 dark:border-gray-700'
    },
    info: {
      header: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      border: 'border-blue-200 dark:border-blue-800'
    },
    warning: {
      header: 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    success: {
      header: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={`my-4 border ${styles.border} rounded-lg overflow-hidden shadow-sm`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${styles.header}`}
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="text-gray-600 dark:text-gray-400">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      {isOpen && (
        <div id={id} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

interface TabsProps {
  tabs: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }>;
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className="my-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
      <div className="flex overflow-x-auto bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.title}</span>
          </button>
        ))}
      </div>
      <div className="p-6 bg-white dark:bg-gray-800">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}

interface CodePlaygroundProps {
  code: string;
  language: string;
  editable?: boolean;
  title?: string;
}

export function CodePlayground({ code, language, editable = false, title }: CodePlaygroundProps) {
  const [currentCode, setCurrentCode] = useState(code);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    
    // Simulate code execution (in production, this would call a sandboxed execution environment)
    setTimeout(() => {
      if (language === 'javascript') {
        try {
          // Very basic JS execution for demo purposes only
          const result = eval(currentCode);
          setOutput(String(result));
        } catch (error) {
          setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        setOutput(`Simulated output for ${language} code`);
      }
      setIsRunning(false);
    }, 1000);
  };

  const resetCode = () => {
    setCurrentCode(code);
    setOutput('');
  };

  const downloadCode = () => {
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Code size={18} className="text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title || `${language.toUpperCase()} Code`}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {language === 'javascript' && (
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md text-sm transition-colors"
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          )}
          <button
            onClick={resetCode}
            className="flex items-center space-x-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
          <button
            onClick={copyCode}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={downloadCode}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
          >
            <Download size={14} />
            <span>Download</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
      
      <div className={`${isExpanded ? 'h-96' : 'h-48'} transition-all duration-300`}>
        {editable ? (
          <textarea
            ref={textareaRef}
            value={currentCode}
            onChange={(e) => setCurrentCode(e.target.value)}
            className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
            style={{ fontFamily: 'Monaco, Menlo, Consolas, monospace' }}
          />
        ) : (
          <pre className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto">
            <code>{currentCode}</code>
          </pre>
        )}
      </div>
      
      {output && (
        <div className="px-4 py-3 bg-black text-green-400 text-sm font-mono border-t border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Activity size={14} />
            <span className="font-semibold">Output:</span>
          </div>
          <pre className="whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}

interface ProgressStepperProps {
  steps: Array<{
    title: string;
    description?: string;
    status: 'completed' | 'current' | 'upcoming';
  }>;
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="my-6">
      <div className="flex flex-col space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step.status === 'completed'
                    ? 'bg-green-600 text-white'
                    : step.status === 'current'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {step.status === 'completed' ? (
                  <Check size={16} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-8 mt-2 ${
                    step.status === 'completed'
                      ? 'bg-green-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <h3
                className={`text-lg font-semibold ${
                  step.status === 'upcoming'
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {step.title}
              </h3>
              {step.description && (
                <p
                  className={`mt-1 text-sm ${
                    step.status === 'upcoming'
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface QuickInfoCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function QuickInfoCard({ 
  title, 
  value, 
  description, 
  trend, 
  icon, 
  color = 'blue' 
}: QuickInfoCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
  };

  const trendIcons = {
    up: <ChevronUp size={16} className="text-green-600" />,
    down: <ChevronDown size={16} className="text-red-600" />,
    neutral: <span className="w-4 h-4" />
  };

  return (
    <div className={`p-4 border rounded-lg ${colorStyles[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h4 className="text-sm font-medium">{title}</h4>
        </div>
        {trend && trendIcons[trend]}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {description && <p className="text-sm opacity-75">{description}</p>}
    </div>
  );
}

interface ComparisonTableProps {
  items: Array<{
    name: string;
    features: Record<string, boolean | string | number>;
  }>;
  highlightBest?: boolean;
}

export function ComparisonTable({ items, highlightBest = true }: ComparisonTableProps) {
  if (items.length === 0) return null;

  const featureKeys = Object.keys(items[0].features);

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
              Feature
            </th>
            {items.map((item, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700"
              >
                {item.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureKeys.map((feature, featureIndex) => (
            <tr key={feature} className={featureIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                {feature}
              </td>
              {items.map((item, itemIndex) => {
                const value = item.features[feature];
                const isBoolean = typeof value === 'boolean';
                
                return (
                  <td
                    key={itemIndex}
                    className="px-4 py-3 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                  >
                    {isBoolean ? (
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-sm ${
                        value ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {value ? '✓' : '✗'}
                      </span>
                    ) : (
                      <span>{value}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}