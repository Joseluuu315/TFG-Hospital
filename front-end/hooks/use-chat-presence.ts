'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UserPresence } from '@/components/chat/chat-models';

const STORAGE_KEY = 'chat-presence-state';
const PRESENCE_INTERVAL_MS = 12000;

export function useChatPresence(userIds: string[], currentUserId?: string) {
  const stableIds = useMemo(() => Array.from(new Set(userIds.filter(Boolean))), [userIds]);
  const basePresenceMap = useMemo(() => {
    const storedValue = readPresenceStorage();
    const nextMap = stableIds.reduce<Record<string, UserPresence>>((acc, id) => {
      acc[id] = storedValue[id] || createInitialPresence(id, id === currentUserId);
      return acc;
    }, {});

    if (currentUserId) {
      nextMap[currentUserId] = { isOnline: true, lastSeenAt: new Date().toISOString() };
    }

    return nextMap;
  }, [currentUserId, stableIds]);
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});
  const resolvedPresenceMap = useMemo(
    () => stableIds.reduce<Record<string, UserPresence>>((acc, id) => {
      acc[id] = presenceMap[id] || basePresenceMap[id];
      return acc;
    }, {}),
    [basePresenceMap, presenceMap, stableIds]
  );

  useEffect(() => {
    if (!stableIds.length) return;

    const interval = window.setInterval(() => {
      setPresenceMap((current) => {
        const next = { ...current };

        stableIds.forEach((id) => {
          const existing = next[id] || basePresenceMap[id] || createInitialPresence(id, id === currentUserId);
          if (id === currentUserId) {
            next[id] = { isOnline: true, lastSeenAt: new Date().toISOString() };
            return;
          }

          const shouldToggle = hashString(`${id}-${Math.floor(Date.now() / PRESENCE_INTERVAL_MS)}`) % 4 === 0;
          const isOnline = shouldToggle ? !existing.isOnline : existing.isOnline;
          next[id] = {
            isOnline,
            lastSeenAt: isOnline ? new Date().toISOString() : existing.lastSeenAt || new Date().toISOString(),
          };
        });

        writePresenceStorage(next);
        return next;
      });
    }, PRESENCE_INTERVAL_MS);

    const handleVisibility = () => {
      if (!currentUserId) return;
      setPresenceMap((current) => {
        const next = {
          ...current,
          [currentUserId]: {
            isOnline: !document.hidden,
            lastSeenAt: new Date().toISOString(),
          },
        };
        writePresenceStorage(next);
        return next;
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [basePresenceMap, currentUserId, stableIds]);

  useEffect(() => {
    if (!stableIds.length) return;
    writePresenceStorage(resolvedPresenceMap);
  }, [resolvedPresenceMap, stableIds.length]);

  return resolvedPresenceMap;
}

function createInitialPresence(userId: string, forceOnline = false): UserPresence {
  const online = forceOnline || hashString(userId) % 3 !== 0;
  return {
    isOnline: online,
    lastSeenAt: new Date(Date.now() - (hashString(`seen-${userId}`) % 45) * 60_000).toISOString(),
  };
}

function readPresenceStorage() {
  if (typeof window === 'undefined') return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, UserPresence>) : {};
  } catch {
    return {};
  }
}

function writePresenceStorage(presenceMap: Record<string, UserPresence>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presenceMap));
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}
