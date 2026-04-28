'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChatAvatar } from '@/components/chat/chat-avatar';
import { getChatPeer, getConversationTitle, type ChatParticipant, type UserPresence } from '@/components/chat/chat-models';
import { MessageBubble } from '@/components/chat/message-bubble';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { Send, MoreVertical, Users, Building2, HeadphonesIcon, MessageCircle, Info } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Chat, ChatMessage, ChatType } from '@/lib/api';

interface ChatWindowProps {
  chat: Chat;
  messages: ChatMessage[];
  currentUserId?: string;
  onSendMessage: (content: string) => void;
  onShowInfo?: () => void;
  participants?: Record<string, ChatParticipant>;
  presenceByUserId?: Record<string, UserPresence>;
}

const chatTypeIcons: Record<ChatType, React.ElementType> = {
  PRIVATE: MessageCircle,
  GROUP: Users,
  HOSPITAL: Building2,
  SUPPORT: HeadphonesIcon,
};

const chatTypeGradients: Record<ChatType, string> = {
  PRIVATE: 'from-violet-500 to-purple-600',
  GROUP: 'from-cyan-500 to-blue-600',
  HOSPITAL: 'from-emerald-500 to-teal-600',
  SUPPORT: 'from-amber-500 to-orange-600',
};

export function ChatWindow({
  chat,
  messages,
  currentUserId = '',
  onSendMessage,
  onShowInfo,
  participants = {},
  presenceByUserId = {},
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageInputId = useId();
  const messageHintId = useId();
  const { containerRef, endRef, handleScroll } = useAutoScroll({
    dependencyKey: messages.length,
    resetKey: chat.id,
  });

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [newMessage]);

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);
  const peer = getChatPeer(chat, currentUserId, participants);
  const displayTitle = getConversationTitle(chat, currentUserId, participants);
  const onlineParticipants = chat.participants.filter(
    (participantId) => participantId !== currentUserId && presenceByUserId[participantId]?.isOnline
  ).length;
  const statusText = chat.type === 'PRIVATE'
    ? peer
      ? presenceByUserId[peer.id]?.isOnline
        ? 'Activo ahora'
        : formatPresenceLabel(presenceByUserId[peer.id]?.lastSeenAt)
      : 'Sin actividad'
    : `${onlineParticipants} participantes activos`;

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const Icon = chatTypeIcons[chat.type];
  const gradient = chatTypeGradients[chat.type];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          {chat.type === 'PRIVATE' && peer ? (
            <ChatAvatar
              name={peer.name}
              imageUrl={peer.avatarUrl}
              isOnline={presenceByUserId[peer.id]?.isOnline}
              gradientClassName={gradient}
              sizeClassName="h-10 w-10"
              textClassName="text-xs"
            />
          ) : (
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm',
              gradient
            )}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{displayTitle}</h3>
            <p className="text-xs text-slate-400">
              {chat.type === 'PRIVATE' ? statusText : `${chat.participantNames.length} participantes - ${statusText}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {onShowInfo && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowInfo}
              aria-label="Ver informacion del chat"
              className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Opciones del chat"
                className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem>Ver participantes</DropdownMenuItem>
              <DropdownMenuItem>Buscar mensajes</DropdownMenuItem>
              {chat.type === 'PRIVATE' && (
                <DropdownMenuItem className="text-destructive">Eliminar conversacion</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(241,245,249,0.92)_100%)] px-3 py-4 sm:px-4 [scrollbar-color:rgba(14,165,233,0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb:hover]:bg-cyan-400/80 [&::-webkit-scrollbar-track]:bg-transparent"
      >
        <div
          className="mx-auto flex max-w-4xl flex-col gap-4"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="Historial de mensajes"
        >
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <Badge
                  variant="secondary"
                  className="rounded-full border-0 bg-slate-200 px-3 text-[10px] font-medium text-slate-500"
                >
                  {formatDateSeparator(date)}
                </Badge>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-1.5">
                {dateMessages.map((message, index) => {
                  const isOwn = message.senderId === currentUserId;
                  const prevSame = dateMessages[index - 1]?.senderId === message.senderId;
                  const nextSame = dateMessages[index + 1]?.senderId === message.senderId;
                  const showAvatar = !isOwn && !prevSame;
                  const showName = !isOwn && !prevSame;
                  const sender = participants[message.senderId];

                  return (
                    <MessageBubble
                      key={message.id}
                      senderName={sender?.name || message.senderName}
                      senderImageUrl={sender?.avatarUrl || (message as ChatMessage & { senderImageURL?: string }).senderImageURL}
                      content={message.content}
                      timestamp={message.timestamp}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showName={showName}
                      compactTop={prevSame}
                      compactBottom={nextSame}
                      isSenderOnline={presenceByUserId[message.senderId]?.isOnline}
                      gradientClassName={chatTypeGradients[chat.type]}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-3 sm:px-4">
        <form
          onSubmit={(event) => { event.preventDefault(); handleSend(); }}
          className="flex items-end gap-2"
        >
          <label htmlFor={messageInputId} className="sr-only">Escribir mensaje</label>
          <Textarea
            ref={textareaRef}
            id={messageInputId}
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 resize-none overflow-y-auto rounded-2xl border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-cyan-400"
            style={{ minHeight: '40px', maxHeight: '120px' }}
            aria-describedby={messageHintId}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            size="icon"
            aria-label="Enviar mensaje"
            className={cn(
              'h-10 w-10 shrink-0 rounded-2xl transition-all',
              newMessage.trim()
                ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-700'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p id={messageHintId} className="mt-1.5 text-[10px] text-slate-400">
          Enter para enviar / Shift+Enter para nueva linea
        </p>
      </div>
    </div>
  );
}

function groupMessagesByDate(messages: ChatMessage[]): Record<string, ChatMessage[]> {
  return messages.reduce((acc, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(message);
    return acc;
  }, {} as Record<string, ChatMessage[]>);
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatPresenceLabel(lastSeenAt?: string | null) {
  if (!lastSeenAt) return 'Sin actividad';
  const minutes = Math.max(1, Math.round((Date.now() - new Date(lastSeenAt).getTime()) / 60000));
  if (minutes < 2) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return 'Sin actividad';
}
