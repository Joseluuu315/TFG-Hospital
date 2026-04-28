'use client';

import type { Chat, ChatMessage, User } from '@/lib/api';

export interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  role?: User['role'];
}

export interface UserPresence {
  isOnline: boolean;
  lastSeenAt: string | null;
}

export type ChatDeliveryState = 'sending' | 'delivered' | 'error';

export interface UiChatMessage extends ChatMessage {
  clientState?: ChatDeliveryState;
  localId?: string;
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
      email: user.email,
      phone: user.phone,
      department: user.department,
      jobTitle: user.jobTitle,
      role: user.role,
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

export function normalizeChatMessages(messages: ChatMessage[]): UiChatMessage[] {
  return sortUiMessages(messages.map((message) => ({ ...message, clientState: 'delivered' as const })));
}

export function mergeChatMessages(remoteMessages: ChatMessage[], currentMessages: UiChatMessage[]): UiChatMessage[] {
  const normalizedRemoteMessages = normalizeChatMessages(remoteMessages);
  const transientMessages = currentMessages.filter(
    (message) => message.clientState === 'sending' || message.clientState === 'error'
  );

  const mergedMessages = [
    ...normalizedRemoteMessages,
    ...transientMessages.filter(
      (message) => !normalizedRemoteMessages.some((remoteMessage) => String(remoteMessage.id) === String(message.id))
    ),
  ];

  return sortUiMessages(mergedMessages);
}

export function sortUiMessages(messages: UiChatMessage[]) {
  return [...messages].sort((left, right) => {
    const leftTime = new Date(left.timestamp).getTime();
    const rightTime = new Date(right.timestamp).getTime();
    if (leftTime === rightTime) return String(left.id).localeCompare(String(right.id));
    return leftTime - rightTime;
  });
}
