'use client';

import { useCallback, useEffect, useRef } from 'react';

interface UseAutoScrollOptions {
  dependencyKey: string | number;
  resetKey?: string;
  threshold?: number;
}

export function useAutoScroll({ dependencyKey, resetKey, threshold = 72 }: UseAutoScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior, block: 'end' });
    });
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    stickToBottomRef.current = distanceToBottom < threshold;
  }, [threshold]);

  useEffect(() => {
    if (stickToBottomRef.current) scrollToBottom('smooth');
  }, [dependencyKey, scrollToBottom]);

  useEffect(() => {
    stickToBottomRef.current = true;
    scrollToBottom('auto');
  }, [resetKey, scrollToBottom]);

  return {
    containerRef,
    endRef,
    handleScroll,
    scrollToBottom,
  };
}
