"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils/time";
import { truncateText } from "@/lib/utils/text";
import type { ChatRoomItem as ChatRoomItemType } from "../lib/dto";

type Props = {
  room: ChatRoomItemType;
  currentUserId?: string;
};

export const ChatRoomItem = ({ room, currentUserId }: Props) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/chat/${room.id}`);
  };

  const displayName =
    room.type === 'direct'
      ? room.participants.find((p) => p.id !== currentUserId)?.nickname ||
        '알 수 없음'
      : room.name ||
        room.participants
          .slice(0, 3)
          .map((p) => p.nickname)
          .join(', ');

  const displayAvatar =
    room.type === 'direct'
      ? room.participants.find((p) => p.id !== currentUserId)?.profileImageUrl
      : room.participants[0]?.profileImageUrl;

  const lastMessagePreview = room.lastMessage?.isDeleted
    ? '삭제된 메시지입니다'
    : truncateText(room.lastMessage?.content || '', 50);

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-4 hover:bg-slate-800/50 cursor-pointer border-b border-slate-700/30 transition-colors"
    >
      <Image
        src={displayAvatar || "https://picsum.photos/seed/default/200/200"}
        alt={displayName}
        width={48}
        height={48}
        className="h-12 w-12 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3
            className={`font-semibold truncate text-slate-100 ${
              room.unreadCount > 0 ? 'font-bold' : ''
            }`}
          >
            {displayName}
          </h3>
          <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
            {formatRelativeTime(room.lastMessage?.createdAt || room.createdAt)}
          </span>
        </div>
        <p className="text-sm text-slate-400 truncate">{lastMessagePreview}</p>
      </div>
      {room.unreadCount > 0 && (
        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
          {room.unreadCount > 999 ? '999+' : room.unreadCount}
        </span>
      )}
    </div>
  );
};
