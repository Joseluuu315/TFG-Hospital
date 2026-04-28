'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UserPresence } from '@/components/chat/chat-models';

const STORAGE_KEY = 'chat-presence-heartbeats-v2';
const CHANNEL_NAME = 'chat-presence-sync';
const HEARTBEAT_INTERVAL_MS = 10000;
const ONLINE_TTL_MS = HEARTBEAT_INTERVAL_MS * 3;

type PresenceHeartbeatMap = Record<string, string>;

export function useChatPresence(userIds: string[], currentUserId?: string) {
  const stableIds = useMemo(() => Array.from(new Set(userIds.filter(Boolean))), [userIds]);
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});

  useEffect(() => {
    if (!stableIds.length) return;

    const syncPresence = () => {
      const heartbeats = pruneHeartbeats(readHeartbeats());
      setPresenceMap(resolvePresence(stableIds, heartbeats, currentUserId));
    };

    const channel =
      typeof window !== 'undefined' && 'BroadcastChannel' in window
        ? new BroadcastChannel(CHANNEL_NAME)
        : null;

    const publishPresence = (forceOnline = false) => {
      if (!currentUserId) return;

      const nextHeartbeats = pruneHeartbeats(readHeartbeats());
      if (forceOnline || !document.hidden) {
        nextHeartbeats[currentUserId] = new Date().toISOString();
      }

      writeHeartbeats(nextHeartbeats);
      channel?.postMessage({ type: 'presence-sync', userId: currentUserId });
      setPresenceMap(resolvePresence(stableIds, nextHeartbeats, currentUserId));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== STORAGE_KEY) return;
      syncPresence();
    };

    const handleVisibilityChange = () => {
      publishPresence(true);
    };

    channel?.addEventListener('message', syncPresence);
    syncPresence();
    publishPresence(true);

    const interval = window.setInterval(() => {
      if (currentUserId && navigator.onLine) {
        publishPresence();
        return;
      }
      syncPresence();
    }, HEARTBEAT_INTERVAL_MS);

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('online', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('online', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      channel?.removeEventListener('message', syncPresence);
      channel?.close();
    };
  }, [currentUserId, stableIds]);

  return stableIds.length ? presenceMap : {};
}

function resolvePresence(
  stableIds: string[],
  heartbeats: PresenceHeartbeatMap,
  currentUserId?: string
): Record<string, UserPresence> {
  return stableIds.reduce<Record<string, UserPresence>>((acc, id) => {
    const lastSeenAt = heartbeats[id] ?? null;
    const isCurrentUser = currentUserId === id;
    const isOnline = isCurrentUser
      ? typeof document !== 'undefined'
        ? !document.hidden
        : true
      : Boolean(lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() <= ONLINE_TTL_MS);

    acc[id] = {
      isOnline,
      lastSeenAt: lastSeenAt || null,
    };
    return acc;
  }, {});
}

function pruneHeartbeats(heartbeats: PresenceHeartbeatMap) {
  const now = Date.now();
  return Object.entries(heartbeats).reduce<PresenceHeartbeatMap>((acc, [userId, timestamp]) => {
    const time = new Date(timestamp).getTime();
    if (Number.isFinite(time) && now - time <= ONLINE_TTL_MS * 2) {
      acc[userId] = timestamp;
    }
    return acc;
  }, {});
}

function readHeartbeats() {
  if (typeof window === 'undefined') return {};
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    return storedValue ? (JSON.parse(storedValue) as PresenceHeartbeatMap) : {};
  } catch {
    return {};
  }
}

function writeHeartbeats(heartbeats: PresenceHeartbeatMap) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(heartbeats));
}
