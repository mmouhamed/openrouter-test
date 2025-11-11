'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Attachment } from '@/contexts/ChatContext';

interface DragDropUploadProps {
  onFileUpload: (attachment: Attachment) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export default function DragDropUpload({ onFileUpload, disabled, children }: DragDropUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dragCounter = useRef(0);

  const uploadFile = useCallback(async (file: File) => {
    if (!file || disabled) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onFileUpload(data.attachment);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onFileUpload, disabled]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    dragCounter.current = 0;

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('Please drop image files only');
      return;
    }

    // Upload the first image file
    uploadFile(imageFiles[0]);
  }, [disabled, isUploading, uploadFile]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (disabled || isUploading) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          uploadFile(file);
        }
        break;
      }
    }
  }, [disabled, isUploading, uploadFile]);

  // Add paste event listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <div
      className={`relative ${isDragOver && !disabled ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      {/* Drag overlay */}
      {isDragOver && !disabled && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-100/90 dark:bg-blue-900/90 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">📎</div>
            <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              Drop image here to upload
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Supports PNG, JPG, GIF, WebP
            </p>
          </div>
        </div>
      )}
      
      {/* Upload overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploading image...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}