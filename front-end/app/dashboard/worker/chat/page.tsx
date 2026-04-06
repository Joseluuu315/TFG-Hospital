'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatWindow } from '@/components/chat/chat-window';
import { NewChatDialog } from '@/components/chat/new-chat-dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MessageCircle, Plus, Wifi, WifiOff } from 'lucide-react';
import { chatApi, usersApi, type Chat, type ChatMessage, type User } from '@/lib/api';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [error, setError] = useState('');
  const [isLive, setIsLive] = useState(false);

  const refreshChats = useCallback(async () => {
    const [chatResponse, usersResponse] = await Promise.all([
      chatApi.getMyChats(),
      usersApi.getAll(),
    ]);
    setChats(chatResponse.data);
    setSelectedChat((current) => {
      if (!current) return chatResponse.data[0] || null;
      return chatResponse.data.find((c) => c.id === current.id) || chatResponse.data[0] || null;
    });
    setWorkers(
        usersResponse.data
            .filter((w) => w.role === 'WORKER' && String(w.id) !== String(user?.id))
            .map(toWorker)
    );
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
        if (isMounted) { setError('No se pudieron cargar las conversaciones.'); setIsLive(false); }
      }
    };

    loadData();
    const interval = setInterval(loadData, CHAT_REFRESH_MS);
    return () => { isMounted = false; clearInterval(interval); };
  }, [user?.id, refreshChats]);

  useEffect(() => {
    if (!selectedChat) return;
    let isMounted = true;

    const loadMessages = async () => {
      try {
        const response = await chatApi.getMessages(selectedChat.id);
        if (!isMounted) return;
        setMessages(response.data);
        await chatApi.markAsRead(selectedChat.id);
        setChats((prev) =>
            prev.map((chat) => chat.id === selectedChat.id ? { ...chat, unreadCount: 0 } : chat)
        );
      } catch (err) { console.error('Error loading messages', err); }
    };

    loadMessages();
    const interval = setInterval(loadMessages, MESSAGE_REFRESH_MS);
    return () => { isMounted = false; clearInterval(interval); };
  }, [selectedChat]);

  const handleSendMessage = async (content: string) => {
    if (!selectedChat || !user) return;
    try {
      const response = await chatApi.sendMessage(selectedChat.id, content);
      const message = response.data;
      setMessages((prev) => [...prev, message]);
      setChats((prev) =>
          prev.map((chat) =>
              chat.id === selectedChat.id
                  ? { ...chat, lastMessage: content, lastMessageTime: message.timestamp, unreadCount: 0 }
                  : chat
          )
      );
    } catch (err) { console.error('Error sending message', err); }
  };

  const handleCreatePrivateChat = async (targetUserId: string) => {
    if (!user) return;
    try {
      const response = await chatApi.createPrivateChat(targetUserId);
      const chat = response.data;
      setChats((prev) => [chat, ...prev.filter((c) => c.id !== chat.id)]);
      setSelectedChat(chat);
      setMessages([]);
      setShowNewChatDialog(false);
    } catch (err) { console.error('Error creando chat privado', err); }
  };

  const unreadCount = chats.filter((c) => c.unreadCount > 0).length;

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
        <div className="flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[calc(100vh-4rem)]">
        {/* Top bar */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Mis mensajes</p>
              <p className="text-xs text-slate-400">
                {unreadCount > 0 ? `${unreadCount} conversación${unreadCount > 1 ? 'es' : ''} con mensajes nuevos` : 'Todo al día'}
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

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Sidebar */}
          <div className="w-full shrink-0 border-b border-slate-100 md:w-72 md:border-b-0 md:border-r">
            <ChatSidebar
                chats={chats}
                selectedChatId={selectedChat?.id || null}
                onSelectChat={setSelectedChat}
                onNewChat={() => setShowNewChatDialog(true)}
                showNewChatButton={false}
                userRole={user?.role}
            />
          </div>

          {/* Área de chat */}
          <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/30">
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
                    currentUserId={String(user?.id)}
                    onSendMessage={handleSendMessage}
                />
            ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-400">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <MessageCircle className="h-7 w-7" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-600">Selecciona una conversación</p>
                    <p className="text-sm">O inicia una nueva con un compañero</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowNewChatDialog(true)}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Nueva conversación
                  </Button>
                </div>
            )}
          </div>
        </div>

        <NewChatDialog
            open={showNewChatDialog}
            onOpenChange={setShowNewChatDialog}
            workers={workers}
            currentUserId={String(user?.id || '')}
            onCreatePrivateChat={handleCreatePrivateChat}
            isAdmin={user?.role === 'HOSPITAL_ADMIN' || user?.role === 'ROOT'}
        />
      </div>
    </DashboardShell>
  );
}

function toWorker(user: User): Worker {
  return {
    id: String(user.id),
    nombre: (user as any).nombre || (user as any).firstName || '',
    apellidos: (user as any).apellidos || (user as any).lastName || '',
    departamento: (user as any).department || 'Sin departamento',
  };
}
