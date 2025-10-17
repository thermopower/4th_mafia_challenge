'use client';

import { ChatListProvider } from '@/features/chat-list/context/chat-list-context';
import { ChatListPanel } from '@/features/chat-list/components/chat-list-panel';
import { ChatCreationSheet } from '@/features/chat-creation/components/chat-creation-sheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export default function ChatListPage() {
  const { user } = useCurrentUser();

  return (
    <ChatListProvider>
      <div className="flex flex-col h-screen">
        <header className="flex justify-between items-center p-4 border-b">
          <h1 className="text-xl font-bold">채팅</h1>
          <ChatCreationSheet
            trigger={
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                새 채팅
              </Button>
            }
          />
        </header>
        <main className="flex-1 overflow-hidden">
          <ChatListPanel currentUserId={user?.id} />
        </main>
      </div>
    </ChatListProvider>
  );
}
