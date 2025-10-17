"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserSearchItem } from "@/features/user-search/lib/dto";

type Props = {
  selectedUsers: UserSearchItem[];
  onRemove: (userId: string) => void;
};

export const SelectedUserChips = ({ selectedUsers, onRemove }: Props) => {
  if (selectedUsers.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {selectedUsers.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
        >
          <Image
            src={user.profileImageUrl || "https://picsum.photos/seed/user-chip/40/40"}
            alt={user.nickname}
            width={20}
            height={20}
            className="h-5 w-5 rounded-full object-cover"
          />
          <span>{user.nickname}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemove(user.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};
