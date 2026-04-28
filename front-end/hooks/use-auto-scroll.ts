'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';

interface UseAutoScrollOptions {
  dependencyKey: string | number;
  resetKey?: string;
  threshold?: number;
}

interface ScrollMetrics {
  scrollHeight: number;
  scrollTop: number;
}

export function useAutoScroll({ dependencyKey, resetKey, threshold = 72 }: UseAutoScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const metricsRef = useRef<ScrollMetrics>({ scrollHeight: 0, scrollTop: 0 });

  const syncMetrics = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    metricsRef.current = {
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    };
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
      requestAnimationFrame(syncMetrics);
    });
  }, [syncMetrics]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    stickToBottomRef.current = distanceToBottom <= threshold;
    syncMetrics();
  }, [syncMetrics, threshold]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const previousMetrics = metricsRef.current;
    const heightDelta = container.scrollHeight - previousMetrics.scrollHeight;

    if (stickToBottomRef.current) {
      scrollToBottom(previousMetrics.scrollHeight === 0 ? 'auto' : 'smooth');
      return;
    }

    if (heightDelta > 0) {
      container.scrollTop = previousMetrics.scrollTop + heightDelta;
    }

    syncMetrics();
  }, [dependencyKey, scrollToBottom, syncMetrics]);

  useLayoutEffect(() => {
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
