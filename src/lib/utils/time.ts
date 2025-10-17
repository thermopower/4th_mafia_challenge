import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return '어제';
  return format(date, 'yyyy.MM.dd');
};
