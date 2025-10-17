'use client';

import { ChatListProvider } from '@/features/chat-list/context/chat-list-context';
import { ChatListPanel } from '@/features/chat-list/components/chat-list-panel';
import { ChatCreationSheet } from '@/features/chat-creation/components/chat-creation-sheet';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, User } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLogoutMutation } from '@/features/auth/hooks/useLogoutMutation';
import Image from 'next/image';

export default function ChatListPage() {
  const { user } = useCurrentUser();
  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logoutMutation.mutate();
    }
  };

  return (
    <ChatListProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <header className="flex justify-between items-center p-4 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">채팅</h1>
            {user && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                {user.profileImageUrl ? (
                  <Image
                    src={user.profileImageUrl}
                    alt={user.nickname}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span>{user.nickname}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ChatCreationSheet
              trigger={
                <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  새 채팅
                </Button>
              }
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <ChatListPanel currentUserId={user?.id} />
        </main>
      </div>
    </ChatListProvider>
  );
}
