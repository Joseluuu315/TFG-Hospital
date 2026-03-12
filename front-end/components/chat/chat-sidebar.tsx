'use client';

import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Users, Building2, HeadphonesIcon, Search, Plus } from 'lucide-react';
import type { Chat, ChatType } from '@/lib/api';

interface ChatSidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  onNewChat?: () => void;
  showNewChatButton?: boolean;
  userRole?: string;
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
  GROUP:   'from-cyan-500 to-blue-600',
  HOSPITAL:'from-emerald-500 to-teal-600',
  SUPPORT: 'from-amber-500 to-orange-600',
};

export function ChatSidebar({
                              chats,
                              selectedChatId,
                              onSelectChat,
                              onNewChat,
                              showNewChatButton = true,
                              userRole,
                            }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputId = useId();
  const searchStatusId = useId();
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredChats = useMemo(
      () => chats.filter((chat) => chat.name.toLowerCase().includes(normalizedQuery)),
      [chats, normalizedQuery]
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
      <aside className="flex h-full flex-col bg-white" aria-label="Listado de chats">
        {/* Header */}
        <div className="shrink-0 px-4 pt-4 pb-3">
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
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-cyan-50 hover:text-cyan-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
                id={searchInputId}
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg border-slate-200 bg-slate-50 pl-8 text-xs placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-cyan-400"
                aria-describedby={searchStatusId}
            />
            <span id={searchStatusId} className="sr-only">
            {filteredChats.length} conversaciones disponibles
          </span>
          </div>
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1 px-2 pb-2">
          {typeOrder.map((type) => {
            const typeChats = groupedChats[type];
            if (!typeChats || typeChats.length === 0) return null;
            if (type === 'SUPPORT' && userRole !== 'HOSPITAL_ADMIN' && userRole !== 'ROOT') return null;

            const Icon = chatTypeIcons[type];
            const sectionId = `${type.toLowerCase()}-section`;

            return (
                <div key={type} className="mb-3">
                  {/* Section label */}
                  <div
                      id={sectionId}
                      className="mb-1 flex items-center gap-1.5 px-2 py-1"
                  >
                    <Icon className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {chatTypeLabels[type]}
                </span>
                  </div>

                  <div className="space-y-0.5" role="list" aria-labelledby={sectionId}>
                    {typeChats.map((chat) => {
                      const isSelected = selectedChatId === chat.id;
                      const initials = chat.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

                      return (
                          <button
                              key={chat.id}
                              onClick={() => onSelectChat(chat)}
                              type="button"
                              aria-current={isSelected ? 'true' : undefined}
                              className={cn(
                                  'group w-full rounded-xl px-3 py-2.5 text-left transition-all',
                                  isSelected
                                      ? 'bg-slate-900 shadow-sm'
                                      : 'hover:bg-slate-50'
                              )}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Avatar */}
                              <div className={cn(
                                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white shadow-sm bg-gradient-to-br',
                                  chatTypeColors[chat.type]
                              )}>
                                {initials}
                              </div>

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                            <span className={cn(
                                'truncate text-xs font-semibold',
                                isSelected ? 'text-white' : 'text-slate-800'
                            )}>
                              {chat.name}
                            </span>
                                  {chat.lastMessageTime && (
                                      <time
                                          dateTime={chat.lastMessageTime}
                                          className={cn(
                                              'shrink-0 text-[10px]',
                                              isSelected ? 'text-slate-400' : 'text-slate-400'
                                          )}
                                      >
                                        {formatTime(chat.lastMessageTime)}
                                      </time>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-1 mt-0.5">
                                  {chat.lastMessage ? (
                                      <p className={cn(
                                          'truncate text-[11px]',
                                          isSelected ? 'text-slate-400' : 'text-slate-500'
                                      )}>
                                        {chat.lastMessage}
                                      </p>
                                  ) : (
                                      <span />
                                  )}
                                  {chat.unreadCount > 0 && (
                                      <span className="shrink-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-white">
                                {chat.unreadCount}
                              </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
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
                <p className="text-xs font-medium text-slate-500">Sin conversaciones</p>
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
        </ScrollArea>
      </aside>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Ayer';
  if (days < 7) return date.toLocaleDateString('es-ES', { weekday: 'short' });
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}