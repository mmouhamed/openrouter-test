'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  ExternalLink, 
  Image as ImageIcon,
  Play,
  Pause,
  BarChart3,
  PieChart,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Info,
  Star
} from 'lucide-react';
import Image from 'next/image';
import { imageEnhancementService } from '@/services/imageEnhancementService';

interface RichMessageRendererProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  messageId: string;
  enableImageSearch?: boolean;
  enableInteractiveElements?: boolean;
}

interface EnhancedImage {
  url: string;
  alt: string;
  caption?: string;
  source?: string;
  relevanceScore?: number;
}

export default function RichMessageRenderer({ 
  content, 
  role, 
  messageId, 
  enableImageSearch = true, 
  enableInteractiveElements = true 
}: RichMessageRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const enhanceWithImages = useCallback(async (text: string) => {
    if (isLoadingImages) return;
    
    setIsLoadingImages(true);
    try {
      if (imageEnhancementService.shouldEnhanceWithImages(text)) {
        const images = await imageEnhancementService.enhanceContentWithImages(text, {
          maxImages: 2,
          includeIllustrations: true,
          includePhotos: true
        });
        setEnhancedImages(images);
      }
    } catch (error) {
      console.error('Image enhancement failed:', error);
    } finally {
      setIsLoadingImages(false);
    }
  }, [isLoadingImages]);

  // Auto-enhance content with images for assistant messages
  useEffect(() => {
    if (role === 'assistant' && enableImageSearch) {
      enhanceWithImages(content);
    }
  }, [content, role, enableImageSearch, enhanceWithImages]);

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  const renderCollapsibleSection = (title: string, children: React.ReactNode, sectionId: string) => {
    const isCollapsed = collapsedSections.has(sectionId);
    
    return (
      <div className="my-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(sectionId)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
        {!isCollapsed && (
          <div className="p-4 bg-white dark:bg-gray-800">
            {children}
          </div>
        )}
      </div>
    );
  };

  const renderTabs = (content: string) => {
    const tabMatches = content.match(/\[TAB:\s*([^\]]+)\]([\s\S]*?)(?=\[TAB:|$)/g);
    if (!tabMatches || tabMatches.length < 2) return null;

    const tabs = tabMatches.map(match => {
      const titleMatch = match.match(/\[TAB:\s*([^\]]+)\]/);
      const contentMatch = match.replace(/\[TAB:\s*([^\]]+)\]/, '').trim();
      return {
        title: titleMatch ? titleMatch[1] : 'Tab',
        content: contentMatch
      };
    });

    if (!activeTab && tabs.length > 0) {
      setActiveTab(tabs[0].title);
    }

    return (
      <div className="my-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(tab.title)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.title
                  ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>
        <div className="p-4 bg-white dark:bg-gray-800">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <ReactMarkdown>
              {tabs.find(tab => tab.title === activeTab)?.content || ''}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  const renderCallout = (type: 'info' | 'warning' | 'success' | 'tip', content: string) => {
    const configs = {
      info: {
        icon: <Info size={20} />,
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        iconColor: 'text-blue-600 dark:text-blue-400'
      },
      warning: {
        icon: <AlertCircle size={20} />,
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      },
      success: {
        icon: <CheckCircle size={20} />,
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-800 dark:text-green-200',
        iconColor: 'text-green-600 dark:text-green-400'
      },
      tip: {
        icon: <Lightbulb size={20} />,
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-800 dark:text-purple-200',
        iconColor: 'text-purple-600 dark:text-purple-400'
      }
    };

    const config = configs[type];

    return (
      <div className={`my-4 p-4 rounded-lg border ${config.bg} ${config.border}`}>
        <div className="flex items-start space-x-3">
          <div className={config.iconColor}>
            {config.icon}
          </div>
          <div className={`flex-1 ${config.text}`}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEnhancedImages = () => {
    if (enhancedImages.length === 0) return null;

    return (
      <div className="my-6">
        <div className="flex items-center space-x-2 mb-4">
          <ImageIcon size={20} className="text-gray-600 dark:text-gray-400" />
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Related Visuals</h4>
          {isLoadingImages && (
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enhancedImages.map((image, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative aspect-video">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {image.relevanceScore && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {Math.round(image.relevanceScore * 100)}% match
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {image.caption}
                </p>
                {image.source && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Source: {image.source}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const customComponents = {
    code: ({ inline, className, children, ...props }: { 
      inline?: boolean; 
      className?: string; 
      children: React.ReactNode; 
      [key: string]: unknown; 
    }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeId = `${messageId}-${Math.random().toString(36).substr(2, 9)}`;

      if (!inline && language) {
        return (
          <div className="my-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language.toUpperCase()}
              </span>
              <button
                onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), codeId)}
                className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {copiedCode === codeId ? (
                  <>
                    <Check size={16} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      }

      return (
        <code
          className="bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    
    a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 underline decoration-purple-300 hover:decoration-purple-500 transition-colors inline-flex items-center gap-1"
      >
        {children}
        <ExternalLink size={12} />
      </a>
    ),

    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {children}
      </h1>
    ),

    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-6">
        {children}
      </h2>
    ),

    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">
        {children}
      </h3>
    ),

    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-purple-50 dark:bg-purple-900/20 text-gray-700 dark:text-gray-300 italic">
        {children}
      </blockquote>
    ),

    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-inside space-y-1 my-4 text-gray-700 dark:text-gray-300">
        {children}
      </ul>
    ),

    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-inside space-y-1 my-4 text-gray-700 dark:text-gray-300">
        {children}
      </ol>
    ),

    table: ({ children }: { children: React.ReactNode }) => (
      <div className="table-container my-6 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
          {children}
        </table>
      </div>
    ),

    thead: ({ children }: { children: React.ReactNode }) => (
      <thead className="bg-gray-50 dark:bg-gray-800">
        {children}
      </thead>
    ),

    th: ({ children }: { children: React.ReactNode }) => (
      <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700">
        {children}
      </th>
    ),

    td: ({ children }: { children: React.ReactNode }) => (
      <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800">
        {children}
      </td>
    ),
  };

  // Process content for special formatting
  let processedContent = content;
  
  // Convert pipe-separated content to proper markdown tables
  const enhanceTextFormatting = (text: string): string => {
    let enhanced = text;
    
    // Look for pipe-separated content and convert to tables
    // Pattern to match content with multiple pipes (table-like data)
    const lines = enhanced.split('\n');
    const processedLines: string[] = [];
    let inTableMode = false;
    let tableRows: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line has multiple pipes (potential table row)
      const pipeCount = (line.match(/\|/g) || []).length;
      
      if (pipeCount >= 2 && line.trim().length > 0) {
        // This looks like table data
        if (!inTableMode) {
          inTableMode = true;
          tableRows = [];
        }
        
        // Split by pipes and clean up
        const cells = line.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0);
        
        if (cells.length >= 2) {
          // Convert to proper table row format
          tableRows.push('| ' + cells.join(' | ') + ' |');
        }
      } else {
        // Not a table row - process any accumulated table first
        if (inTableMode && tableRows.length > 0) {
          // Add the table to processed lines
          if (tableRows.length === 1) {
            // Single row - treat as header
            processedLines.push('');
            processedLines.push(tableRows[0]);
            processedLines.push('|' + tableRows[0].split('|').slice(1, -1).map(() => ' --- ').join('|') + '|');
            processedLines.push('');
          } else {
            // Multiple rows - first is header
            processedLines.push('');
            processedLines.push(tableRows[0]);
            processedLines.push('|' + tableRows[0].split('|').slice(1, -1).map(() => ' --- ').join('|') + '|');
            processedLines.push(...tableRows.slice(1));
            processedLines.push('');
          }
          tableRows = [];
        }
        
        inTableMode = false;
        processedLines.push(line);
      }
    }
    
    // Handle any remaining table at the end
    if (inTableMode && tableRows.length > 0) {
      if (tableRows.length === 1) {
        processedLines.push('');
        processedLines.push(tableRows[0]);
        processedLines.push('|' + tableRows[0].split('|').slice(1, -1).map(() => ' --- ').join('|') + '|');
        processedLines.push('');
      } else {
        processedLines.push('');
        processedLines.push(tableRows[0]);
        processedLines.push('|' + tableRows[0].split('|').slice(1, -1).map(() => ' --- ').join('|') + '|');
        processedLines.push(...tableRows.slice(1));
        processedLines.push('');
      }
    }
    
    enhanced = processedLines.join('\n');
    
    // Clean up excessive line breaks
    enhanced = enhanced.replace(/\n{4,}/g, '\n\n');
    
    return enhanced;
  };
  
  processedContent = enhanceTextFormatting(processedContent);
  
  // Convert pipe-separated data to proper markdown tables
  const convertPipeDataToTable = (text: string): string => {
    // Look for lines that start with | and contain multiple | separated values
    const lines = text.split('\n');
    let inTable = false;
    let tableLines: string[] = [];
    const result: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line looks like table data (starts with |, has multiple |)
      if (line.match(/^\|.*\|.*\|/)) {
        if (!inTable) {
          inTable = true;
          tableLines = [];
        }
        
        // Parse the line into cells
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim()).filter(cell => cell);
        if (cells.length >= 2) {
          tableLines.push('| ' + cells.join(' | ') + ' |');
        }
      } else {
        // If we were in a table and now we're not, process the table
        if (inTable && tableLines.length >= 2) {
          // Add header separator after first row
          const processedTable = [
            tableLines[0],
            '|' + tableLines[0].split('|').slice(1, -1).map(() => ' --- ').join('|') + '|',
            ...tableLines.slice(1)
          ];
          result.push('', ...processedTable, '');
        }
        
        inTable = false;
        tableLines = [];
        result.push(line);
      }
    }
    
    // Handle table at end of content
    if (inTable && tableLines.length >= 2) {
      const processedTable = [
        tableLines[0],
        '|' + tableLines[0].split('|').slice(1, -1).map(() => ' --- ').join('|') + '|',
        ...tableLines.slice(1)
      ];
      result.push('', ...processedTable, '');
    }
    
    return result.join('\n');
  };
  
  processedContent = convertPipeDataToTable(processedContent);
  
  // Handle callouts
  processedContent = processedContent.replace(
    /\[!(INFO|WARNING|SUCCESS|TIP)\]\s*([\s\S]*?)(?=\n\n|\n\[!|\n$|$)/g,
    (match, type, content) => {
      const calloutType = type.toLowerCase() as 'info' | 'warning' | 'success' | 'tip';
      // Store for later rendering
      return `__CALLOUT_${type}__${content}__END_CALLOUT__`;
    }
  );

  // Split content by callouts for custom rendering
  const contentParts = processedContent.split(/(__CALLOUT_\w+__[\s\S]*?__END_CALLOUT__)/);

  return (
    <div className="rich-message-content">
      {role === 'assistant' && renderEnhancedImages()}
      
      {contentParts.map((part, index) => {
        if (part.match(/^__CALLOUT_(\w+)__([\s\S]*?)__END_CALLOUT__$/)) {
          const match = part.match(/^__CALLOUT_(\w+)__([\s\S]*?)__END_CALLOUT__$/);
          if (match) {
            const [, type, content] = match;
            return renderCallout(type.toLowerCase() as 'info' | 'warning' | 'success' | 'tip', content.trim());
          }
        }

        // Check for tabs
        if (part.includes('[TAB:') && enableInteractiveElements) {
          return <div key={index}>{renderTabs(part)}</div>;
        }

        return (
          <div key={index}>
            <div className="prose prose-gray dark:prose-invert max-w-none prose-lg leading-relaxed">
              <ReactMarkdown
                components={customComponents}
              >
                {part}
              </ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}