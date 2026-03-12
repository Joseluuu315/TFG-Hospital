'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Send, MoreVertical, Users, Building2, HeadphonesIcon, MessageCircle, Info } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Chat, ChatMessage, ChatType } from '@/lib/api';

interface ChatWindowProps {
  chat: Chat;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onShowInfo?: () => void;
}

const chatTypeIcons: Record<ChatType, React.ElementType> = {
  PRIVATE: MessageCircle,
  GROUP: Users,
  HOSPITAL: Building2,
  SUPPORT: HeadphonesIcon,
};

const chatTypeGradients: Record<ChatType, string> = {
  PRIVATE:  'from-violet-500 to-purple-600',
  GROUP:    'from-cyan-500 to-blue-600',
  HOSPITAL: 'from-emerald-500 to-teal-600',
  SUPPORT:  'from-amber-500 to-orange-600',
};

export function ChatWindow({ chat, messages, currentUserId, onSendMessage, onShowInfo }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef     = useRef<HTMLDivElement>(null);
  const textareaRef        = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef      = useRef(true); // ✅ rastrea si el usuario está al fondo
  const messageInputId     = useId();
  const messageHintId      = useId();

  // ✅ Solo scrollea al fondo si el usuario ya estaba allí
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize del textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [newMessage]);

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  // ✅ Detecta si el usuario está cerca del fondo (umbral 80px)
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      // Al enviar, forzamos scroll al fondo
      isAtBottomRef.current = true;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const Icon = chatTypeIcons[chat.type];
  const gradient = chatTypeGradients[chat.type];

  return (
      <div className="flex h-full flex-col overflow-hidden bg-white">

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                gradient
            )}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{chat.name}</h3>
              <p className="text-xs text-slate-400">{chat.participantNames.length} participantes</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {onShowInfo && (
                <Button
                    variant="ghost" size="icon" onClick={onShowInfo}
                    aria-label="Ver información del chat"
                    className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Info className="h-4 w-4" />
                </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost" size="icon"
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
                    <DropdownMenuItem className="text-destructive">Eliminar conversación</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Messages ── */}
        {/* ✅ div nativo con overflow-y-auto en lugar de ScrollArea — permite capturar onScroll */}
        <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 px-4 py-4"
        >
          <div
              className="space-y-4"
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
                      const isOwn      = message.senderId === currentUserId;
                      const prevSame   = dateMessages[index - 1]?.senderId === message.senderId;
                      const nextSame   = dateMessages[index + 1]?.senderId === message.senderId;
                      const showAvatar = !isOwn && !prevSame;
                      const showName   = !isOwn && !prevSame;

                      const initials = message.senderName
                          .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

                      const ownRadius = cn(
                          'rounded-2xl',
                          !prevSame && 'rounded-tr-sm',
                          !nextSame && 'rounded-br-sm'
                      );
                      const otherRadius = cn(
                          'rounded-2xl',
                          !prevSame && 'rounded-tl-sm',
                          !nextSame && 'rounded-bl-sm'
                      );

                      return (
                          <div
                              key={message.id}
                              className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}
                          >
                            {!isOwn && (
                                <div className={cn('w-7 shrink-0', !showAvatar && 'invisible')}>
                                  <div
                                      className={cn(
                                          'flex h-7 w-7 items-center justify-center rounded-full overflow-hidden',
                                          'text-[10px] font-bold text-white bg-gradient-to-br',
                                          chatTypeGradients[chat.type]
                                      )}
                                      aria-hidden="true"
                                  >
                                    {(message as any).senderImageURL ? (
                                        <img
                                            src={(message as any).senderImageURL}
                                            alt={message.senderName}
                                            className="h-7 w-7 rounded-full object-cover"
                                            onError={(e) => {
                                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                                              (e.currentTarget.parentElement as HTMLElement).innerText = initials;
                                            }}
                                        />
                                    ) : initials}
                                  </div>
                                </div>
                            )}

                            <div className={cn('flex max-w-[68%] flex-col', isOwn ? 'items-end' : 'items-start')}>
                              {showName && (
                                  <p className="mb-0.5 px-1 text-[10px] font-semibold text-slate-500">
                                    {message.senderName}
                                  </p>
                              )}
                              <div className={cn(
                                  'px-3.5 py-2 shadow-sm',
                                  isOwn
                                      ? cn('bg-slate-900 text-white', ownRadius)
                                      : cn('bg-white text-slate-800 border border-slate-200', otherRadius)
                              )}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                                <time
                                    dateTime={message.timestamp}
                                    className="mt-0.5 block text-right text-[10px] text-slate-400"
                                >
                                  {formatMessageTime(message.timestamp)}
                                </time>
                              </div>
                            </div>
                          </div>
                      );
                    })}
                  </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input ── */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
          <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-end gap-2"
          >
            <label htmlFor={messageInputId} className="sr-only">Escribir mensaje</label>
            <Textarea
                ref={textareaRef}
                id={messageInputId}
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="flex-1 resize-none overflow-y-auto rounded-xl border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-cyan-400"
                style={{ minHeight: '40px', maxHeight: '120px' }}
                aria-describedby={messageHintId}
            />
            <Button
                type="submit"
                disabled={!newMessage.trim()}
                size="icon"
                aria-label="Enviar mensaje"
                className={cn(
                    'h-10 w-10 shrink-0 rounded-xl transition-all',
                    newMessage.trim()
                        ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p id={messageHintId} className="mt-1.5 text-[10px] text-slate-400">
            Enter para enviar · Shift+Enter para nueva línea
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
  if (date.toDateString() === today.toDateString()) return formatDateSeparator('Hoy');
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}