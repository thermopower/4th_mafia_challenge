'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { UserSearchInput } from './user-search-input';
import { SelectedUserChips } from './selected-user-chips';
import { GroupNameInput } from './group-name-input';
import { useCreateChatMutation } from '../hooks/use-create-chat-mutation';
import type { UserSearchItem } from '@/features/user-search/lib/dto';

type Props = {
  trigger: React.ReactNode;
};

export const ChatCreationSheet = ({ trigger }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchItem[]>([]);
  const [groupName, setGroupName] = useState('');
  const { mutate: createChat, isPending } = useCreateChatMutation();

  const isGroup = selectedUsers.length > 1;
  const canCreate =
    selectedUsers.length > 0 && (!isGroup || groupName.trim().length > 0);

  const handleSelectUser = (user: UserSearchItem) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleCreate = () => {
    createChat(
      {
        type: isGroup ? 'group' : 'direct',
        name: isGroup ? groupName : null,
        user_ids: selectedUsers.map((u) => u.id),
      },
      {
        onSuccess: (data) => {
          setOpen(false);
          setSelectedUsers([]);
          setGroupName('');
          router.push(`/chat/${data.chat_room_id}`);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>새 채팅 시작</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <UserSearchInput
            selectedUserIds={selectedUsers.map((u) => u.id)}
            onSelectUser={handleSelectUser}
          />
          <SelectedUserChips
            selectedUsers={selectedUsers}
            onRemove={handleRemoveUser}
          />
          {isGroup && (
            <GroupNameInput value={groupName} onChange={setGroupName} />
          )}
          <Button
            onClick={handleCreate}
            disabled={!canCreate || isPending}
            className="w-full"
          >
            {isPending
              ? '생성 중...'
              : isGroup
                ? '채팅방 만들기'
                : '채팅 시작'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
