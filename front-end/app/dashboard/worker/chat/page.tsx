'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  buildParticipantDirectory,
  getUserDisplayName,
  mergeChatMessages,
  type UiChatMessage,
} from '@/components/chat/chat-models';
import { useAuth } from '@/contexts/auth-context';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatWindow } from '@/components/chat/chat-window';
import { ChatInfoSheet } from '@/components/chat/chat-info-sheet';
import { NewChatDialog } from '@/components/chat/new-chat-dialog';
import { useChatPresence } from '@/hooks/use-chat-presence';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MessageCircle, Plus, Wifi, WifiOff } from 'lucide-react';
import { chatApi, usersApi, type Chat, type User } from '@/lib/api';

interface Worker {
  id: string;
  nombre: string;
  apellidos: string;
  departamento: string;
}

const CHAT_REFRESH_MS = 4000;
const MESSAGE_REFRESH_MS = 3000;

export default function WorkerChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [error, setError] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [mobileView, setMobileView] = useState<'sidebar' | 'window'>('sidebar');

  const refreshChats = useCallback(async () => {
    const [chatResponse, usersResponse] = await Promise.all([
      chatApi.getMyChats(),
      usersApi.getAll(),
    ]);
    setChats(chatResponse.data);
    setSelectedChat((current) => {
      if (!current) return chatResponse.data[0] || null;
      return chatResponse.data.find((chat) => chat.id === current.id) || chatResponse.data[0] || null;
    });
    setWorkers(
      usersResponse.data
        .filter((worker) => worker.role === 'WORKER' && String(worker.id) !== String(user?.id))
        .map(toWorker)
    );
    setDirectoryUsers(usersResponse.data);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    const loadData = async () => {
      setError('');
      try {
        if (!isMounted) return;
        await refreshChats();
        setIsLive(true);
      } catch (err) {
        console.error('Error loading chats', err);
        if (isMounted) {
          setError('No se pudieron cargar las conversaciones.');
          setIsLive(false);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, CHAT_REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.id, refreshChats]);

  useEffect(() => {
    if (!selectedChat) return;
    let isMounted = true;

    const loadMessages = async () => {
      try {
        const response = await chatApi.getMessages(selectedChat.id);
        if (!isMounted) return;
        setMessages((current) => mergeChatMessages(response.data, current));
        await chatApi.markAsRead(selectedChat.id);
        setChats((prev) =>
          prev.map((chat) => chat.id === selectedChat.id ? { ...chat, unreadCount: 0 } : chat)
        );
      } catch (err) {
        console.error('Error loading messages', err);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, MESSAGE_REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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

    setMessages((prev) => [...prev, optimisticMessage]);
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat.id
          ? { ...chat, lastMessage: content, lastMessageTime: optimisticMessage.timestamp, unreadCount: 0 }
          : chat
      )
    );

    try {
      const response = await chatApi.sendMessage(selectedChat.id, content);
      const message = response.data;
      setMessages((prev) =>
        prev.map((currentMessage) =>
          currentMessage.localId === localId
            ? { ...message, clientState: 'delivered' as const }
            : currentMessage
        )
      );
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChat.id
            ? { ...chat, lastMessage: content, lastMessageTime: message.timestamp, unreadCount: 0 }
            : chat
        )
      );
    } catch (err) {
      console.error('Error sending message', err);
      setMessages((prev) =>
        prev.map((currentMessage) =>
          currentMessage.localId === localId
            ? { ...currentMessage, clientState: 'error' as const }
            : currentMessage
        )
      );
      if (previousChat) {
        setChats((prev) => prev.map((chat) => (chat.id === previousChat.id ? previousChat : chat)));
      }
    }
  };

  const handleCreatePrivateChat = async (targetUserId: string) => {
    if (!user) return;
    try {
      const response = await chatApi.createPrivateChat(targetUserId);
      const chat = response.data;
      setChats((prev) => [chat, ...prev.filter((currentChat) => currentChat.id !== chat.id)]);
      setSelectedChat(chat);
      setMobileView('window');
      setMessages([]);
      setShowNewChatDialog(false);
    } catch (err) {
      console.error('Error creando chat privado', err);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setMobileView('window');
  };

  const unreadCount = chats.filter((chat) => chat.unreadCount > 0).length;
  const currentUserId = String(user?.id || '');
  const participants = useMemo(() => buildParticipantDirectory(directoryUsers), [directoryUsers]);
  const selectedConversationHint = selectedChat?.description;
  const trackedPresenceIds = useMemo(
    () => Array.from(new Set(chats.flatMap((chat) => chat.participants))).concat(currentUserId).filter(Boolean),
    [chats, currentUserId]
  );
  const presenceByUserId = useChatPresence(trackedPresenceIds, currentUserId);

  return (
    <DashboardShell
      title="Mensajes"
      description="Gestiona tus conversaciones internas."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/worker">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
        </div>

        <div className="flex min-h-[72dvh] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:h-[calc(100dvh-10.5rem)]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Mis mensajes</p>
                <p className="text-xs text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} conversaciones con mensajes nuevos` : 'Todo al dia'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isLive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}
                role="status"
                aria-live="polite"
              >
                {isLive
                  ? <><Wifi className="h-3 w-3" /> Conectado</>
                  : <><WifiOff className="h-3 w-3" /> Reconectando</>
                }
              </div>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowNewChatDialog(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo chat
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden lg:flex-row">
            {/* Sidebar: oculto en móvil cuando se ve la ventana */}
            <div className={`w-full shrink-0 overflow-hidden border-b border-slate-100 lg:w-[23rem] lg:border-b-0 lg:border-r lg:flex lg:flex-col ${mobileView === 'window' ? 'hidden lg:flex' : 'flex flex-col'}`}>
              <ChatSidebar
                chats={chats}
                selectedChatId={selectedChat?.id || null}
                onSelectChat={handleSelectChat}
                onNewChat={() => setShowNewChatDialog(true)}
                showNewChatButton={false}
                userRole={user?.role}
                currentUserId={currentUserId}
                participants={participants}
                presenceByUserId={presenceByUserId}
              />
            </div>

            {/* Ventana de chat: oculta en móvil cuando se ve el sidebar */}
            <div className={`min-h-0 flex-col overflow-hidden bg-slate-50/30 ${mobileView === 'sidebar' ? 'hidden lg:flex lg:flex-1' : 'flex flex-1'}`}>
              {/* Botón volver — solo en móvil */}
              {mobileView === 'window' && (
                <div className="flex items-center gap-1 border-b border-slate-100 bg-white px-2 py-1.5 lg:hidden">
                  <button
                    onClick={() => setMobileView('sidebar')}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Chats
                  </button>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600" role="alert">
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              {selectedChat ? (
                <ChatWindow
                  chat={selectedChat}
                  messages={messages}
                  currentUserId={currentUserId}
                  onSendMessage={handleSendMessage}
                  onShowInfo={() => setShowInfoSheet(true)}
                  conversationHint={selectedConversationHint}
                  participants={participants}
                  presenceByUserId={presenceByUserId}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-400">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <MessageCircle className="h-7 w-7" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-600">Selecciona una conversacion</p>
                    <p className="text-sm">O inicia una nueva con un companero</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowNewChatDialog(true)}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Nueva conversacion
                  </Button>
                </div>
              )}
            </div>
          </div>

          <NewChatDialog
            open={showNewChatDialog}
            onOpenChange={setShowNewChatDialog}
            workers={workers}
            currentUserId={currentUserId}
            onCreatePrivateChat={handleCreatePrivateChat}
            isAdmin={user?.role === 'HOSPITAL_ADMIN' || user?.role === 'ROOT'}
          />

          <ChatInfoSheet
            open={showInfoSheet}
            onOpenChange={setShowInfoSheet}
            chat={selectedChat}
            currentUserId={currentUserId}
            participants={participants}
            presenceByUserId={presenceByUserId}
          />
        </div>
      </div>
    </DashboardShell>
  );
}

function toWorker(user: User): Worker {
  return {
    id: String(user.id),
    nombre: (user as User & { nombre?: string; firstName?: string }).nombre || (user as User & { firstName?: string }).firstName || '',
    apellidos: (user as User & { apellidos?: string; lastName?: string }).apellidos || (user as User & { lastName?: string }).lastName || '',
    departamento: (user as User & { department?: string }).department || 'Sin departamento',
  };
}
