'use client';

import { MessageSquare } from 'lucide-react';

export const ChatListEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        채팅방이 없습니다
      </h3>
      <p className="text-sm text-gray-500">
        새 채팅 버튼을 눌러 대화를 시작하세요
      </p>
    </div>
  );
};
