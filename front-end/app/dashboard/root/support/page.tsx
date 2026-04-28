'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatWindow } from '@/components/chat/chat-window';
import { ChatInfoSheet } from '@/components/chat/chat-info-sheet';
import {
  buildParticipantDirectory,
  getUserDisplayName,
  mergeChatMessages,
  type UiChatMessage,
} from '@/components/chat/chat-models';
import { useChatPresence } from '@/hooks/use-chat-presence';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Building2, Clock, CheckCircle2, Wifi } from 'lucide-react';
import { chatApi, usersApi, type Chat, type User } from '@/lib/api';
import { toast } from 'sonner';

const CHAT_REFRESH_MS = 4000;

export default function RootSupportPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const hasUser = Boolean(user?.id);
  const visibleChats = useMemo(() => (hasUser ? chats : []), [chats, hasUser]);
  const visibleSelectedChat = hasUser ? selectedChat : null;
  const visibleMessages = hasUser ? messages : [];

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const loadChats = async () => {
      try {
        const [chatResponse, usersResponse] = await Promise.all([
          chatApi.getMyChats(),
          usersApi.getAll(),
        ]);
        if (cancelled) return;
        const supportChats = chatResponse.data.filter((chat) => chat.type === 'SUPPORT');
        setChats(supportChats);
        setDirectoryUsers(usersResponse.data);
        setSelectedChat((current) => {
          if (!current) return supportChats[0] || null;
          return supportChats.find((c) => c.id === current.id) || supportChats[0] || null;
        });
      } catch (error) {
        console.error('Error cargando soporte', error);
        toast.error('No se pudieron cargar los canales de soporte.');
      }
    };

    loadChats();
    const interval = setInterval(loadChats, CHAT_REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedChat) return;
    let cancelled = false;

    const loadMessages = async () => {
      try {
        const response = await chatApi.getMessages(selectedChat.id);
        if (cancelled) return;
        setMessages((current) => mergeChatMessages(response.data, current));
        await chatApi.markAsRead(selectedChat.id);
      } catch (error) { console.error('Error cargando mensajes de soporte', error); }
    };

    loadMessages();
    const interval = setInterval(loadMessages, CHAT_REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [selectedChat]);

  const handleSendMessage = async (content: string) => {
    if (!selectedChat || !user) return;
    const localId = `local-${Date.now()}`;
    const optimisticMessage: UiChatMessage = {
      id: localId,
      localId,
      chatId: selectedChat.id,
      senderId: String(user.id),
      senderName: getUserDisplayName(user) || 'Tú',
      content,
      timestamp: new Date().toISOString(),
      read: true,
      clientState: 'sending',
    };
    const previousChat = chats.find((chat) => chat.id === selectedChat.id) || null;

    setMessages((current) => [...current, optimisticMessage]);
    setChats((current) =>
      current.map((chat) =>
        chat.id === selectedChat.id
          ? { ...chat, lastMessage: content, lastMessageTime: optimisticMessage.timestamp, unreadCount: 0 }
          : chat
      )
    );

    try {
      const response = await chatApi.sendMessage(selectedChat.id, content);
      const nextMessage = response.data;
      setMessages((current) =>
        current.map((currentMessage) =>
          currentMessage.localId === localId
            ? { ...nextMessage, clientState: 'delivered' as const }
            : currentMessage
        )
      );
      setChats((current) =>
          current.map((chat) =>
              chat.id === selectedChat.id
                  ? { ...chat, lastMessage: content, lastMessageTime: nextMessage.timestamp, unreadCount: 0 }
                  : chat
          )
      );
    } catch (error) {
      console.error('Error respondiendo soporte', error);
      setMessages((current) =>
        current.map((currentMessage) =>
          currentMessage.localId === localId
            ? { ...currentMessage, clientState: 'error' as const }
            : currentMessage
        )
      );
      if (previousChat) {
        setChats((current) => current.map((chat) => (chat.id === previousChat.id ? previousChat : chat)));
      }
      toast.error('No se pudo enviar la respuesta.');
    }
  };

  const totalChats = visibleChats.length;
  const pendingChats = visibleChats.filter((c) => c.unreadCount > 0).length;
  const resolvedChats = visibleChats.filter((c) => c.unreadCount === 0).length;
  const currentUserId = String(user?.id || '');
  const participants = useMemo(() => buildParticipantDirectory(directoryUsers), [directoryUsers]);
  const trackedPresenceIds = useMemo(
    () => Array.from(new Set(visibleChats.flatMap((chat) => chat.participants))).concat(currentUserId).filter(Boolean),
    [currentUserId, visibleChats]
  );
  const presenceByUserId = useChatPresence(trackedPresenceIds, currentUserId);

  return (
    <DashboardShell
      title="Soporte"
      description="Supervisa incidencias y conversaciones con hospitales."
    >
      <div className="space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-slate-900 to-emerald-950 p-5 text-white shadow-lg sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.2),_transparent_55%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-medium uppercase tracking-widest text-emerald-300">Sede central</span>
              </div>
              <h1 className="text-xl font-semibold">Soporte hospitalario</h1>
              <p className="text-sm text-slate-400">Actualizacion cada 4 segundos</p>
            </div>
            <Badge className="rounded-full border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300 hover:bg-emerald-500/20">
              <Wifi className="mr-1.5 h-3 w-3" />
              Canales activos
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard
              title="Hospitales conectados"
              value={totalChats}
              hint="Canales activos"
              icon={<Building2 className="h-4 w-4" />}
              color="slate"
          />
          <StatCard
              title="Pendientes"
              value={pendingChats}
              hint="Con mensajes sin leer"
              icon={<Clock className="h-4 w-4" />}
              color="amber"
          />
          <StatCard
              title="Resueltos"
              value={resolvedChats}
              hint="Sin alertas abiertas"
              icon={<CheckCircle2 className="h-4 w-4" />}
              color="emerald"
          />
        </div>

        {/* Chat area */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <p className="font-medium text-slate-800">Canales de soporte</p>
            <p className="text-xs text-slate-400">Conversaciones entre administradores y sede central</p>
          </div>
          <div className="flex flex-col overflow-hidden lg:h-[calc(100vh-26rem)] lg:flex-row">
            <div className="max-h-96 w-full flex-shrink-0 overflow-hidden border-b border-slate-100 lg:max-h-none lg:w-[23rem] lg:border-b-0 lg:border-r">
              <ChatSidebar
                  chats={visibleChats}
                  selectedChatId={visibleSelectedChat?.id || null}
                  onSelectChat={setSelectedChat}
                  showNewChatButton={false}
                  userRole="ROOT"
                  currentUserId={currentUserId}
                  participants={participants}
                  presenceByUserId={presenceByUserId}
              />
            </div>
            <div className="flex-1 bg-slate-50/40" role="region" aria-label="Chat de soporte">
              {visibleSelectedChat ? (
                  <ChatWindow
                      chat={visibleSelectedChat}
                      messages={visibleMessages}
                      currentUserId={currentUserId}
                      onSendMessage={handleSendMessage}
                      onShowInfo={() => setShowInfoSheet(true)}
                      conversationHint={visibleSelectedChat.description}
                      participants={participants}
                      presenceByUserId={presenceByUserId}
                  />
              ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-slate-600">Selecciona un hospital</p>
                      <p className="text-sm">Elige un canal para revisar incidencias</p>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>

        <ChatInfoSheet
          open={showInfoSheet}
          onOpenChange={setShowInfoSheet}
          chat={visibleSelectedChat}
          currentUserId={currentUserId}
          participants={participants}
          presenceByUserId={presenceByUserId}
        />
      </div>
    </DashboardShell>
  );
}

function StatCard({
                    title, value, hint, icon, color,
                  }: {
  title: string;
  value: number;
  hint: string;
  icon: ReactNode;
  color: 'slate' | 'amber' | 'emerald';
}) {
  const colors = {
    slate:   { bg: 'bg-slate-50',   icon: 'bg-slate-100 text-slate-500',   value: 'text-slate-800' },
    amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',   value: 'text-amber-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-700' },
  }[color];

  return (
      <div className={`rounded-2xl border border-slate-200 ${colors.bg} p-4`}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <div className={`rounded-lg p-1.5 ${colors.icon}`}>{icon}</div>
        </div>
        <p className={`mt-2 text-3xl font-bold ${colors.value}`}>{value}</p>
        <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      </div>
  );
}
