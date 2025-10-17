'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUserSearch } from '../hooks/use-user-search';
import type { UserSearchItem } from '@/features/user-search/lib/dto';

type Props = {
  selectedUserIds: string[];
  onSelectUser: (user: UserSearchItem) => void;
};

export const UserSearchInput = ({ selectedUserIds, onSelectUser }: Props) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: users, isLoading } = useUserSearch(debouncedQuery);

  const filteredUsers = users?.filter(
    (user) => !selectedUserIds.includes(user.id)
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="사용자 검색 (닉네임 또는 이메일)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      {isLoading && query.trim() && (
        <p className="text-sm text-gray-500">검색 중...</p>
      )}
      {filteredUsers && filteredUsers.length > 0 && (
        <div className="max-h-60 overflow-y-auto border rounded-md">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                onSelectUser(user);
                setQuery('');
              }}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer"
            >
              <img
                src={user.profileImageUrl}
                alt={user.nickname}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{user.nickname}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {filteredUsers && filteredUsers.length === 0 && debouncedQuery.trim() && (
        <p className="text-sm text-gray-500">검색 결과가 없습니다</p>
      )}
    </div>
  );
};
