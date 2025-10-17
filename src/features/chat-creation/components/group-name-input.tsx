'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const GroupNameInput = ({ value, onChange }: Props) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="group-name">그룹 채팅방 이름</Label>
      <Input
        id="group-name"
        type="text"
        placeholder="그룹 이름을 입력하세요"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={50}
      />
    </div>
  );
};
