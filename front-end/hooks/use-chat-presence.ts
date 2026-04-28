'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UserPresence } from '@/components/chat/chat-models';
import { usersApi, type UserPresenceStatus } from '@/lib/api';

const HEARTBEAT_INTERVAL_MS = 10000;
const PRESENCE_REFRESH_MS = 12000;

export function useChatPresence(userIds: string[], currentUserId?: string) {
  const stableIds = useMemo(() => Array.from(new Set(userIds.filter(Boolean))), [userIds]);
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});

  useEffect(() => {
    if (!stableIds.length) return;
    let cancelled = false;

    const loadPresence = async () => {
      try {
        const response = await usersApi.getPresence(stableIds);
        if (cancelled) return;
        setPresenceMap(toPresenceMap(response.data, currentUserId));
      } catch {
        if (cancelled) return;
        setPresenceMap((current) => current);
      }
    };

    const publishHeartbeat = async () => {
      if (!currentUserId || document.hidden) return;
      try {
        await usersApi.heartbeatPresence();
      } catch {
        // Ignore transient connectivity issues; polling will reconcile presence.
      }
    };

    void publishHeartbeat();
    void loadPresence();

    const heartbeatInterval = window.setInterval(() => {
      void publishHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const refreshInterval = window.setInterval(() => {
      void loadPresence();
    }, PRESENCE_REFRESH_MS);

    const handleVisibilityChange = () => {
      if (document.hidden) return;
      void publishHeartbeat();
      void loadPresence();
    };

    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('online', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeatInterval);
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('online', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUserId, stableIds]);

  return stableIds.length ? presenceMap : {};
}

function toPresenceMap(items: UserPresenceStatus[], currentUserId?: string) {
  return items.reduce<Record<string, UserPresence>>((acc, item) => {
    const userId = String(item.userId);
    acc[userId] = {
      isOnline: userId === currentUserId ? true : item.online,
      lastSeenAt: item.lastSeenAt || null,
    };
    return acc;
  }, {});
}
