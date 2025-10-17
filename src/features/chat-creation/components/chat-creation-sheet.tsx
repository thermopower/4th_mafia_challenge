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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSearchInput } from './user-search-input';
import { SelectedUserChips } from './selected-user-chips';
import { GroupNameInput } from './group-name-input';
import { useCreateChatMutation } from '../hooks/use-create-chat-mutation';
import type { UserSearchItem } from '@/features/user-search/lib/dto';

type Props = {
  trigger: React.ReactNode;
};

type ChatType = 'direct' | 'group';

export const ChatCreationSheet = ({ trigger }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [chatType, setChatType] = useState<ChatType>('direct');
  const [selectedUsers, setSelectedUsers] = useState<UserSearchItem[]>([]);
  const [groupName, setGroupName] = useState('');
  const { mutate: createChat, isPending } = useCreateChatMutation();

  const isGroup = chatType === 'group';
  const canCreate =
    (chatType === 'direct' && selectedUsers.length === 1) ||
    (chatType === 'group' && selectedUsers.length >= 2 && groupName.trim().length > 0);

  const handleSelectUser = (user: UserSearchItem) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      // 1:1 채팅 모드에서는 1명만 선택 가능
      if (chatType === 'direct') {
        setSelectedUsers([user]);
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleCreate = () => {
    createChat(
      {
        type: chatType,
        name: isGroup ? groupName : null,
        user_ids: selectedUsers.map((u) => u.id),
      },
      {
        onSuccess: (data) => {
          setOpen(false);
          setSelectedUsers([]);
          setGroupName('');
          setChatType('direct');
          router.push(`/chat/${data.chat_room_id}`);
        },
      }
    );
  };

  const handleTabChange = (value: string) => {
    setChatType(value as ChatType);
  };

  const getValidationMessage = () => {
    if (chatType === 'direct' && selectedUsers.length === 0) {
      return '대화할 사용자를 선택해주세요';
    }
    if (chatType === 'group' && selectedUsers.length < 2) {
      return '그룹 채팅은 2명 이상 선택해야 합니다';
    }
    if (chatType === 'group' && selectedUsers.length >= 2 && !groupName.trim()) {
      return '그룹 이름을 입력해주세요';
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>새 채팅 시작</SheetTitle>
        </SheetHeader>
        <Tabs value={chatType} onValueChange={handleTabChange} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">1:1 채팅</TabsTrigger>
            <TabsTrigger value="group">그룹 채팅</TabsTrigger>
          </TabsList>
          <TabsContent value={chatType} className="mt-4 space-y-4">
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
            {validationMessage && (
              <p className="text-sm text-gray-500">{validationMessage}</p>
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
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
