export const truncateText = (text: string, maxLength: number): string => {
  const normalized = text.replace(/\n/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength) + '...';
};
