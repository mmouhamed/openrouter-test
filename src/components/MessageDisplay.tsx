'use client';

import { ChatMessage } from '@/contexts/ChatContext';

interface MessageDisplayProps {
  message: ChatMessage;
  getModelInfo: (modelId: string) => any;
  onCopy: (content: string) => void;
}

export default function MessageDisplay({ message, getModelInfo, onCopy }: MessageDisplayProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Advanced content parsing with intelligent structure detection
  const parseContent = (content: string) => {
    let formattedContent = content;
    
    // First, protect code blocks from other formatting
    const codeBlocks: string[] = [];
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)\n?```/g;
    formattedContent = formattedContent.replace(codeBlockRegex, (match, language, code) => {
      const index = codeBlocks.length;
      codeBlocks.push(`<div class="code-block-container"><div class="code-block-header"><span class="code-language">${language || 'text'}</span><button class="copy-code-btn" onclick="navigator.clipboard.writeText(\`${code.trim().replace(/`/g, '\\`')}\`)">Copy</button></div><pre class="code-block"><code class="language-${language || 'text'}">${code.trim()}</code></pre></div>`);
      return `__CODE_BLOCK_${index}__`;
    });

    // Detect and format headings (both # style and **Question:** style)
    formattedContent = formattedContent.replace(/^#{1,6}\s+(.+)$/gm, (match, text) => {
      const level = match.indexOf(' ') - 1;
      return `<h${Math.min(level, 3)} class="message-heading message-h${level}">${text}</h${Math.min(level, 3)}>`;
    });

    // Format question-style headings like "What is quantum computing?"
    formattedContent = formattedContent.replace(/^([A-Z][^?!.]*[?!])\s*$/gm, '<h3 class="message-question">$1</h3>');
    
    // Format bold questions/statements like "**What can quantum computing do?**"
    formattedContent = formattedContent.replace(/\*\*([^*]+[?!])\*\*/g, '<h3 class="message-question">$1</h3>');
    
    // Format section headers like "Key concepts:" or "Classical computing vs. Quantum computing"
    formattedContent = formattedContent.replace(/^([A-Z][^:]*):$/gm, '<h4 class="message-section">$1</h4>');
    formattedContent = formattedContent.replace(/^([A-Z][^.!?]*(?:vs?\.|versus|compared to|vs)[^.!?]*[^:])$/gm, '<h4 class="message-section">$1</h4>');

    // Format numbered lists
    formattedContent = formattedContent.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="numbered-item"><span class="number-badge">$1</span><div class="numbered-content">$2</div></div>');
    
    // Format bullet points
    formattedContent = formattedContent.replace(/^[-*+]\s+(.+)$/gm, '<div class="bullet-item"><span class="bullet-point">•</span><div class="bullet-content">$1</div></div>');

    // Format bold text (but not questions that we already handled)
    formattedContent = formattedContent.replace(/\*\*([^*]+)\*\*/g, '<strong class="message-bold">$1</strong>');

    // Format italic text
    formattedContent = formattedContent.replace(/\*([^*]+)\*/g, '<em class="message-italic">$1</em>');

    // Format inline code
    formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Format links
    formattedContent = formattedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="message-link">$1 <svg class="link-icon" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M9 3H5M9 3V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>');

    // Format paragraphs
    formattedContent = formattedContent.replace(/\n\n+/g, '</p><p class="message-paragraph">');
    formattedContent = `<p class="message-paragraph">${formattedContent}</p>`;

    // Restore code blocks
    codeBlocks.forEach((codeBlock, index) => {
      formattedContent = formattedContent.replace(`__CODE_BLOCK_${index}__`, codeBlock);
    });

    // Clean up empty paragraphs and fix paragraph breaks around special elements
    formattedContent = formattedContent.replace(/<p class="message-paragraph"><\/p>/g, '');
    formattedContent = formattedContent.replace(/<p class="message-paragraph">(<h[1-6])/g, '$1');
    formattedContent = formattedContent.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    formattedContent = formattedContent.replace(/<p class="message-paragraph">(<div class="(?:numbered-item|bullet-item)")/g, '$1');
    formattedContent = formattedContent.replace(/(<\/div>)<\/p>/g, '$1');

    return formattedContent;
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group mb-8 relative">
      {/* Message Container with subtle background */}
      <div className="flex space-x-4 p-6 rounded-2xl bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-800/30 dark:to-gray-800/20 border border-gray-100/50 dark:border-gray-700/30 hover:shadow-lg hover:shadow-gray-200/20 dark:hover:shadow-gray-900/20 transition-all duration-300">
        
        {/* Enhanced AI Avatar */}
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-base font-medium text-white drop-shadow-sm">
              {getModelInfo(message.model || '').icon || '🤖'}
            </span>
          </div>
          {/* Subtle glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-xl blur-sm opacity-20 -z-10"></div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Enhanced Message Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {getModelInfo(message.model || '').name || 'AI Assistant'}
              </span>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                  {getModelInfo(message.model || '').provider || 'AI'}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
            
            {message.usage && (
              <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-100/50 dark:bg-gray-700/30 px-3 py-1 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>{message.usage.total_tokens} tokens</span>
              </div>
            )}
          </div>

          {/* Enhanced Message Content */}
          <div className="message-content">
            <div dangerouslySetInnerHTML={{ __html: parseContent(message.content) }} />
          </div>

          {/* Enhanced Message Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-600/30">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onCopy(message.content)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 group"
                title="Copy message"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Copy</span>
              </button>
              
              <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 group">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="font-medium">Share</span>
              </button>
            </div>

            {/* Reaction buttons */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button className="p-2 hover:bg-green-100/80 dark:hover:bg-green-900/30 rounded-lg transition-colors duration-200 group" title="Good response">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
              <button className="p-2 hover:bg-red-100/80 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200 group" title="Poor response">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2M17 4H19a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}