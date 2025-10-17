import type React from 'react';

/**
 * 스크롤을 하단으로 이동
 */
export const scrollToBottom = (
  containerRef: React.RefObject<HTMLDivElement>,
  smooth = true
) => {
  if (!containerRef.current) return;

  containerRef.current.scrollTo({
    top: containerRef.current.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

/**
 * 하단 스크롤 여부 확인
 */
export const isScrolledToBottom = (
  containerRef: React.RefObject<HTMLDivElement>,
  threshold = 100
): boolean => {
  if (!containerRef.current) return false;

  const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
  return scrollHeight - scrollTop - clientHeight < threshold;
};

/**
 * 특정 메시지로 스크롤
 */
export const scrollToMessage = (messageId: string, smooth = true) => {
  const element = document.getElementById(`message-${messageId}`);
  if (!element) return;

  element.scrollIntoView({
    behavior: smooth ? 'smooth' : 'auto',
    block: 'center',
  });

  // 강조 효과
  element.classList.add('highlight');
  setTimeout(() => element.classList.remove('highlight'), 2000);
};
