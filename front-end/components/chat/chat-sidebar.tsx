'use client';

import { useId, useMemo, useState } from 'react';
import { SidebarUser } from '@/components/chat/sidebar-user';
import { getChatPeer, getConversationTitle, type ChatParticipant, type UserPresence } from '@/components/chat/chat-models';
import { Input } from '@/components/ui/input';
import { MessageCircle, Users, Building2, HeadphonesIcon, Search, Plus } from 'lucide-react';
import type { Chat, ChatType } from '@/lib/api';

interface ChatSidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  onNewChat?: () => void;
  showNewChatButton?: boolean;
  userRole?: string;
  currentUserId?: string;
  participants?: Record<string, ChatParticipant>;
  presenceByUserId?: Record<string, UserPresence>;
}

const chatTypeIcons: Record<ChatType, React.ElementType> = {
  PRIVATE: MessageCircle,
  GROUP: Users,
  HOSPITAL: Building2,
  SUPPORT: HeadphonesIcon,
};

const chatTypeLabels: Record<ChatType, string> = {
  PRIVATE: 'Privado',
  GROUP: 'Grupo',
  HOSPITAL: 'Hospital',
  SUPPORT: 'Soporte',
};

const chatTypeColors: Record<ChatType, string> = {
  PRIVATE: 'from-violet-500 to-purple-600',
  GROUP: 'from-cyan-500 to-blue-600',
  HOSPITAL: 'from-emerald-500 to-teal-600',
  SUPPORT: 'from-amber-500 to-orange-600',
};

export function ChatSidebar({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
  showNewChatButton = true,
  userRole,
  currentUserId = '',
  participants = {},
  presenceByUserId = {},
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputId = useId();
  const searchStatusId = useId();
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredChats = useMemo(
    () => chats.filter((chat) => getConversationTitle(chat, currentUserId, participants).toLowerCase().includes(normalizedQuery)),
    [chats, currentUserId, normalizedQuery, participants]
  );

  const groupedChats = useMemo(
    () =>
      filteredChats.reduce((acc, chat) => {
        if (!acc[chat.type]) acc[chat.type] = [];
        acc[chat.type].push(chat);
        return acc;
      }, {} as Record<ChatType, Chat[]>),
    [filteredChats]
  );

  const typeOrder: ChatType[] = ['HOSPITAL', 'GROUP', 'PRIVATE', 'SUPPORT'];
  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-white" aria-label="Listado de chats">
      <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">Conversaciones</span>
            {totalUnread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-white">
                {totalUnread}
              </span>
            )}
          </div>
          {showNewChatButton && onNewChat && (
            <button
              onClick={onNewChat}
              aria-label="Crear nuevo chat"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-cyan-50 hover:text-cyan-600"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            id={searchInputId}
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-cyan-400"
            aria-describedby={searchStatusId}
          />
          <span id={searchStatusId} className="sr-only">
            {filteredChats.length} conversaciones disponibles
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 [scrollbar-color:rgba(14,165,233,0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb:hover]:bg-cyan-400/80 [&::-webkit-scrollbar-track]:bg-transparent">
        {typeOrder.map((type) => {
          const typeChats = groupedChats[type];
          if (!typeChats || typeChats.length === 0) return null;
          if (type === 'SUPPORT' && userRole !== 'HOSPITAL_ADMIN' && userRole !== 'ROOT') return null;

          const Icon = chatTypeIcons[type];
          const sectionId = `${type.toLowerCase()}-section`;

          return (
            <div key={type} className="mb-4">
              <div id={sectionId} className="mb-2 flex items-center gap-2 px-2 py-1">
                <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {chatTypeLabels[type]}
                </span>
              </div>

              <div className="space-y-1.5" role="list" aria-labelledby={sectionId}>
                {typeChats.map((chat) => {
                  const isSelected = selectedChatId === chat.id;
                  const peer = getChatPeer(chat, currentUserId, participants);
                  const displayName = getConversationTitle(chat, currentUserId, participants);
                  const onlineParticipants = chat.participants.filter(
                    (participantId) => participantId !== currentUserId && presenceByUserId[participantId]?.isOnline
                  ).length;
                  const statusText = chat.type === 'PRIVATE'
                    ? peer
                      ? presenceByUserId[peer.id]?.isOnline
                        ? 'Activo'
                        : formatLastSeen(presenceByUserId[peer.id]?.lastSeenAt)
                      : 'Sin datos'
                    : `${onlineParticipants} activos`;

                  return (
                    <SidebarUser
                      key={chat.id}
                      onClick={() => onSelectChat(chat)}
                      selected={isSelected}
                      name={displayName}
                      subtitle={chat.lastMessage || statusText}
                      timestamp={chat.lastMessageTime}
                      unreadCount={chat.unreadCount}
                      avatarUrl={peer?.avatarUrl}
                      isOnline={chat.type === 'PRIVATE' ? presenceByUserId[peer?.id || '']?.isOnline : onlineParticipants > 0}
                      gradientClassName={chatTypeColors[chat.type]}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center" role="status">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <MessageCircle className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">Sin conversaciones</p>
            {showNewChatButton && onNewChat && (
              <button
                onClick={onNewChat}
                className="mt-2 text-xs text-cyan-600 hover:underline"
              >
                Crear una nueva
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function formatLastSeen(lastSeenAt?: string | null) {
  if (!lastSeenAt) return 'Sin actividad';
  const lastSeenDate = new Date(lastSeenAt);
  const minutes = Math.max(1, Math.round((Date.now() - lastSeenDate.getTime()) / 60000));
  if (minutes < 2) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return lastSeenDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}
