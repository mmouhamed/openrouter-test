'use client';

import { useState, useCallback, useRef } from 'react';
import { Attachment } from './DragDropUpload';

interface EnhancedFileUploadProps {
  onFileSelect: (attachment: Attachment) => void;
  disabled?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

interface FilePreview {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document' | 'other';
  size: string;
  status: 'uploading' | 'uploaded' | 'error';
}

export default function EnhancedFileUpload({
  onFileSelect,
  disabled = false,
  multiple = true,
  maxFiles = 10,
  maxFileSize = 10
}: EnhancedFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileType = (file: File): 'image' | 'document' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
    return 'other';
  };

  const getFileIcon = (type: 'image' | 'document' | 'other', fileName: string): string => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'document':
        if (fileName.endsWith('.pdf')) return '📄';
        if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📝';
        if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return '📊';
        return '📋';
      default:
        return '📎';
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (!multiple && fileArray.length > 1) {
      alert('Please select only one file');
      return;
    }

    if (previews.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    for (const file of fileArray) {
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is ${maxFileSize}MB`);
        continue;
      }

      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const type = getFileType(file);
      
      const preview: FilePreview = {
        id,
        file,
        type,
        size: formatFileSize(file.size),
        status: 'uploading'
      };

      // Create image preview for images
      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => 
            prev.map(p => 
              p.id === id 
                ? { ...p, preview: e.target?.result as string }
                : p
            )
          );
        };
        reader.readAsDataURL(file);
      }

      setPreviews(prev => [...prev, preview]);
      
      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(progressInterval);
          
          // Upload complete
          setPreviews(prev => 
            prev.map(p => 
              p.id === id 
                ? { ...p, status: 'uploaded' as const }
                : p
            )
          );
          
          // Create attachment object
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const formData = new FormData();
              formData.append('file', file);

              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) throw new Error('Upload failed');
              
              const result = await response.json();
              
              const attachment: Attachment = {
                id,
                fileName: file.name,
                mimeType: file.type,
                fileSize: file.size,
                url: result.url
              };

              onFileSelect(attachment);
            } catch (error) {
              console.error('Upload error:', error);
              setPreviews(prev => 
                prev.map(p => 
                  p.id === id 
                    ? { ...p, status: 'error' as const }
                    : p
                )
              );
            }
          };
          reader.readAsDataURL(file);
        } else {
          setUploadProgress(prev => ({ ...prev, [id]: progress }));
        }
      }, 100);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePreview = (id: string) => {
    setPreviews(prev => prev.filter(p => p.id !== id));
    setUploadProgress(prev => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const triggerFileSelect = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
          isDragging
            ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="text-4xl mb-3">
            {isDragging ? '⬇️' : '📎'}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {isDragging ? 'Drop files here' : 'Upload files'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Drag & drop or click to select • Images, PDFs, Documents
            <br />
            Max {maxFiles} files • {maxFileSize}MB each
          </p>
        </div>
      </div>

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Attached Files ({previews.length}/{maxFiles})
          </h4>
          
          <div className="grid gap-2">
            {previews.map((preview) => (
              <div
                key={preview.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0 w-10 h-10 relative">
                  {preview.preview ? (
                    <img
                      src={preview.preview}
                      alt={preview.file.name}
                      className="w-10 h-10 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-lg">
                      {getFileIcon(preview.type, preview.file.name)}
                    </div>
                  )}
                  
                  {/* Status indicator */}
                  {preview.status === 'uploading' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                  {preview.status === 'uploaded' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {preview.status === 'error' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {preview.file.name}
                  </h5>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{preview.size}</span>
                    <span>•</span>
                    <span className="capitalize">{preview.type}</span>
                    {preview.status === 'uploading' && uploadProgress[preview.id] && (
                      <>
                        <span>•</span>
                        <span>{Math.round(uploadProgress[preview.id])}%</span>
                      </>
                    )}
                  </div>

                  {/* Progress bar for uploading files */}
                  {preview.status === 'uploading' && (
                    <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress[preview.id] || 0}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePreview(preview.id);
                  }}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}