'use client';

interface MemoryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryDashboard({ isOpen, onClose }: MemoryDashboardProps) {
  if (!isOpen) return null;

  // Return null until ChatContext is available
  return null;
}