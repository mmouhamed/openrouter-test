/**
 * Chat Page - AI Powered Conversations with Sidebar Navigation
 */

import AppLayout from '@/components/AppLayout';
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <AppLayout>
      <ChatInterface />
    </AppLayout>
  );
}

export const metadata = {
  title: 'Chat - AI Powered Conversations',
  description: 'Experience intelligent conversations with our 3-model AI fusion system.',
  keywords: 'AI chat, intelligent interface, machine learning, multi-model AI, conversation',
};