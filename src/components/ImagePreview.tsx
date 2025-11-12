'use client';

import { useState } from 'react';
import { Attachment } from '@/types/chat';

interface ImagePreviewProps {
  attachments: Attachment[];
  onRemove: (attachmentId: string) => void;
  showRemoveButton?: boolean;
}

export default function ImagePreview({ attachments, onRemove, showRemoveButton = true }: ImagePreviewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (attachments.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="relative group bg-gray-100 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start space-x-3">
              {/* Thumbnail */}
              <div className="relative">
                <img
                  src={attachment.url}
                  alt={attachment.fileName}
                  className="w-16 h-16 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(attachment.url)}
                />
                {showRemoveButton && (
                  <button
                    onClick={() => onRemove(attachment.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                    title="Remove image"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(attachment.fileSize)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {attachment.mimeType}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full-size image modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Full size image"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}