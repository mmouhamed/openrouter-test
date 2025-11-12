import ImprovedChatInterface from '@/components/ImprovedChatInterface';
import Sidebar from '@/components/Sidebar';

export default function ImprovedChatPage() {
  return (
    <div className="h-screen overflow-hidden flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <ImprovedChatInterface />
      </div>
    </div>
  );
}