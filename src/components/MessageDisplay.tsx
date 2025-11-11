'use client';

import { ChatMessage } from '@/contexts/ChatContext';
import ImagePreview from './ImagePreview';

interface MessageDisplayProps {
  message: ChatMessage;
  getModelInfo: (modelId: string) => { name?: string; description?: string; icon?: string };
  onCopy: (content: string) => void;
}

export default function MessageDisplay({ message, getModelInfo: _getModelInfo, onCopy }: MessageDisplayProps) {
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
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%]">
          {/* Show attachments if they exist */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-3">
              <ImagePreview 
                attachments={message.attachments} 
                onRemove={() => {}} 
                showRemoveButton={false}
              />
            </div>
          )}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
            <div className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group mb-6">
      <div className="flex space-x-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-lg px-4 py-3 transition-colors">
        {/* Clean AI Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Simple header */}
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 dark:text-white">
              ChatQora
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Message content */}
          <div className="message-content prose dark:prose-invert max-w-none">
            {/* Show attachments if they exist */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-4">
                <ImagePreview 
                  attachments={message.attachments} 
                  onRemove={() => {}} 
                  showRemoveButton={false}
                />
              </div>
            )}
            <div className="text-gray-800 dark:text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: parseContent(message.content) }} />
          </div>

          {/* Simple actions */}
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onCopy(message.content)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Copy message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            
            <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Good response">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            
            <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Poor response">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.60L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2M17 4H19a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}