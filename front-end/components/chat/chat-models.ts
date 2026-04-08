'use client';

import type { Chat, User } from '@/lib/api';

export interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  department?: string;
}

export interface UserPresence {
  isOnline: boolean;
  lastSeenAt: string | null;
}

export function getUserDisplayName(user: Partial<User>): string {
  const firstName = user.nombre || user.firstName || '';
  const lastName = user.apellidos || user.lastName || '';
  return `${firstName} ${lastName}`.trim() || user.email || `Usuario ${String(user.id ?? '')}`.trim();
}

export function buildParticipantDirectory(users: User[]): Record<string, ChatParticipant> {
  return users.reduce<Record<string, ChatParticipant>>((acc, user) => {
    const id = String(user.id);
    acc[id] = {
      id,
      name: getUserDisplayName(user),
      avatarUrl: (user as User & { imageUrl?: string; avatarUrl?: string }).avatarUrl || (user as User & { imageUrl?: string }).imageUrl,
      department: user.department,
    };
    return acc;
  }, {});
}

export function getChatPeer(chat: Chat, currentUserId: string, participants: Record<string, ChatParticipant>) {
  const peerId = chat.participants.find((participantId) => participantId !== currentUserId);
  if (!peerId) return null;
  return participants[peerId] || {
    id: peerId,
    name: chat.participantNames.find((name) => name) || chat.name,
  };
}

export function getConversationTitle(chat: Chat, currentUserId: string, participants: Record<string, ChatParticipant>) {
  if (chat.type !== 'PRIVATE') return chat.name;
  return getChatPeer(chat, currentUserId, participants)?.name || chat.name;
}
