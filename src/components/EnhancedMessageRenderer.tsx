'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

interface EnhancedMessageRendererProps {
  content: string;
  isAssistant: boolean;
}

interface ParsedSection {
  type: 'heading' | 'text' | 'list' | 'code' | 'numbered_list' | 'expandable';
  content: string;
  level?: number;
  items?: string[];
  language?: string;
  title?: string;
  expanded?: boolean;
}

export default function EnhancedMessageRenderer({ content, isAssistant }: EnhancedMessageRendererProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = async (code: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(blockId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const parseContent = (text: string): ParsedSection[] => {
    // First, split by double newlines to get paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    const sections: ParsedSection[] = [];
    let currentSection: ParsedSection | null = null;
    
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;
      
      const lines = paragraph.split('\n');
      let codeBlock = false;
      let codeContent = '';
      let codeLanguage = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Handle code blocks
        if (line.startsWith('```')) {
          if (codeBlock) {
            // End code block
            sections.push({
              type: 'code',
              content: codeContent.trim(),
              language: codeLanguage
            });
            codeBlock = false;
            codeContent = '';
            codeLanguage = '';
          } else {
            // Start code block
            codeBlock = true;
            codeLanguage = line.slice(3).trim();
          }
          continue;
        }

        if (codeBlock) {
          codeContent += line + '\n';
          continue;
        }

        // Handle headings (both # style and **bold:** style)
        if (line.match(/^#{1,6}\s/) || line.match(/^\*\*[^*]+\*\*:?\s*$/)) {
          let level = 2;
          let content = line;
          
          if (line.startsWith('#')) {
            level = line.match(/^#+/)?.[0].length || 1;
            content = line.replace(/^#+\s/, '');
          } else if (line.match(/^\*\*[^*]+\*\*/)) {
            content = line.replace(/^\*\*([^*]+)\*\*:?\s*$/, '$1');
            level = content.includes(':') ? 2 : 3;
          }
          
          sections.push({
            type: 'heading',
            content: content,
            level
          });
          continue;
        }

        // Handle numbered lists (including multi-line)
        if (line.match(/^\d+\.\s/)) {
          const content = line.replace(/^\d+\.\s/, '');
          // Look ahead for continuation lines
          let fullContent = content;
          let j = i + 1;
          while (j < lines.length && lines[j] && !lines[j].match(/^\d+\.\s/) && !lines[j].startsWith('#') && !lines[j].match(/^[-*]\s/)) {
            fullContent += ' ' + lines[j].trim();
            j++;
          }
          i = j - 1; // Skip the lines we consumed
          
          if (currentSection?.type === 'numbered_list') {
            currentSection.items?.push(fullContent);
          } else {
            currentSection = {
              type: 'numbered_list',
              content: '',
              items: [fullContent]
            };
            sections.push(currentSection);
          }
          continue;
        }

        // Handle bullet lists (including multi-line)
        if (line.match(/^[-*•]\s/)) {
          const content = line.replace(/^[-*•]\s/, '');
          // Look ahead for continuation lines
          let fullContent = content;
          let j = i + 1;
          while (j < lines.length && lines[j] && !lines[j].match(/^[-*•]\s/) && !lines[j].match(/^\d+\.\s/) && !lines[j].startsWith('#')) {
            if (lines[j].trim()) {
              fullContent += ' ' + lines[j].trim();
            }
            j++;
          }
          i = j - 1; // Skip the lines we consumed
          
          if (currentSection?.type === 'list') {
            currentSection.items?.push(fullContent);
          } else {
            currentSection = {
              type: 'list',
              content: '',
              items: [fullContent]
            };
            sections.push(currentSection);
          }
          continue;
        }

        // Handle expandable sections
        if (line.match(/^(Details|More info|Additional|Advanced|Note|Important)/i) && line.includes(':')) {
          sections.push({
            type: 'expandable',
            title: line,
            content: '',
            expanded: false
          });
          continue;
        }

        // Handle regular text (accumulate into paragraphs)
        if (line.trim()) {
          currentSection = null;
          // Combine all non-special lines in this paragraph
          const paragraphText = lines.slice(i).join(' ').trim();
          if (paragraphText) {
            sections.push({
              type: 'text',
              content: paragraphText
            });
            break; // We've processed the whole paragraph
          }
        }
      }
      
      // Reset for next paragraph
      currentSection = null;
    }

    return sections;
  };

  const renderSection = (section: ParsedSection, index: number) => {
    const isExpanded = expandedSections.has(index);

    switch (section.type) {
      case 'heading':
        const HeadingTag = `h${Math.min(section.level || 1, 6)}` as keyof JSX.IntrinsicElements;
        const headingClasses = {
          1: 'text-xl font-bold text-gray-900 dark:text-white mb-4 mt-6',
          2: 'text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4',
          3: 'text-md font-medium text-gray-700 dark:text-gray-300 mb-2 mt-3'
        };
        
        return (
          <HeadingTag 
            key={index}
            className={headingClasses[section.level as keyof typeof headingClasses] || headingClasses[3]}
          >
            {section.content}
          </HeadingTag>
        );

      case 'numbered_list':
        return (
          <ol key={index} className="list-decimal list-inside space-y-2 mb-4 ml-4">
            {section.items?.map((item, itemIndex) => (
              <li key={itemIndex} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <span className="ml-2">{item}</span>
              </li>
            ))}
          </ol>
        );

      case 'list':
        return (
          <ul key={index} className="list-disc list-inside space-y-1 mb-4 ml-4">
            {section.items?.map((item, itemIndex) => (
              <li key={itemIndex} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <span className="ml-2">{item}</span>
              </li>
            ))}
          </ul>
        );

      case 'code':
        const blockId = `code-${index}`;
        return (
          <div key={index} className="relative mb-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {section.language || 'Code'}
                </span>
                <button
                  onClick={() => copyToClipboard(section.content, blockId)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  {copiedCode === blockId ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
                  {section.content}
                </code>
              </pre>
            </div>
          </div>
        );

      case 'expandable':
        return (
          <div key={index} className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              onClick={() => toggleSection(index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {section.title}
              </span>
              {isExpanded ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
                {section.content}
              </div>
            )}
          </div>
        );

      case 'text':
      default:
        // Handle bold text and inline formatting
        const formatText = (text: string) => {
          let formatted = text;
          
          // Handle **bold** text
          formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>');
          
          // Handle *italic* text
          formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
          
          // Handle `inline code`
          formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-sm font-mono">$1</code>');
          
          // Handle links [text](url)
          formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>');
          
          return formatted;
        };

        return (
          <p 
            key={index} 
            className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4"
            dangerouslySetInnerHTML={{ __html: formatText(section.content) }}
          />
        );
    }
  };

  if (!isAssistant) {
    return (
      <div className="prose prose-sm max-w-none">
        <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    );
  }

  try {
    const sections = parseContent(content);
    
    if (sections.length === 0) {
      // Fallback to simple formatting if parsing fails
      return (
        <div className="prose prose-sm max-w-none">
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      );
    }

    return (
      <div className="prose prose-sm max-w-none">
        <div className="space-y-2">
          {sections.map((section, index) => renderSection(section, index))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error parsing content:', error);
    // Fallback to simple text display
    return (
      <div className="prose prose-sm max-w-none">
        <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    );
  }
}