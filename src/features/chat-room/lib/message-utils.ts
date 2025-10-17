import type { Message } from '@/features/chat-room/backend/schema';

/**
 * 메시지 중복 제거
 */
export const deduplicateMessages = (messages: Message[]): Message[] => {
  const seen = new Set<string>();
  return messages.filter((msg) => {
    if (seen.has(msg.id)) return false;
    seen.add(msg.id);
    return true;
  });
};

/**
 * 메시지 병합 (기존 + 신규)
 */
export const mergeMessages = (
  existing: Message[],
  incoming: Message[]
): Message[] => {
  const merged = new Map<string, Message>();

  existing.forEach((msg) => merged.set(msg.id, msg));
  incoming.forEach((msg) => merged.set(msg.id, msg));

  return Array.from(merged.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

/**
 * 메시지 시간순 정렬 (오래된 것부터)
 */
export const sortMessagesByTime = (messages: Message[]): Message[] => {
  return [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

/**
 * 메시지 ID 배열 생성 (정렬된 순서)
 */
export const getMessageOrder = (messages: Message[]): string[] => {
  return sortMessagesByTime(messages).map((msg) => msg.id);
};
