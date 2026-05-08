'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, MessageCircle, Users, Settings, Plus, Trash2 } from 'lucide-react';
import { chatApi, usersApi, workGroupsApi, type Chat, type User, type WorkGroup } from '@/lib/api';
import { toast } from 'sonner';

interface WorkerOption {
  id: string;
  nombre: string;
  apellidos: string;
  departamento: string;
}

const CHAT_REFRESH_MS = 4000;
const GROUP_REFRESH_MS = 7000;

export default function AdminChatPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [chats, setChats] = useState<Chat[]>([]);
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [mobileView, setMobileView] = useState<'sidebar' | 'window'>('sidebar');
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WorkGroup | null>(null);
  const [editingMembers, setEditingMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const loadAll = async () => {
      try {
        const [chatResponse, groupResponse, usersResponse] = await Promise.all([
          chatApi.getMyChats(),
          workGroupsApi.getAll(),
          usersApi.getAll(),
        ]);
        if (cancelled) return;
        const nextChats = chatResponse.data;
        setChats(nextChats);
        setWorkGroups(groupResponse.data);
        setWorkers(
            usersResponse.data
                .filter((w) => w.role === 'WORKER' && String(w.hospitalId) === String(user.hospitalId))
                .map(toWorkerOption)
        );
        setDirectoryUsers(usersResponse.data);
        setSelectedChat((current) => {
          if (!current) return nextChats[0] || null;
          return nextChats.find((c) => c.id === current.id) || nextChats[0] || null;
        });
      } catch (error) {
        console.error('Error cargando comunicaciones', error);
        toast.error('No se pudieron cargar los chats y grupos.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAll();
    const interval = setInterval(loadAll, GROUP_REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id, user?.hospitalId]);

  useEffect(() => {
    if (!selectedChat) { setMessages([]); return; }
    let cancelled = false;

    const loadMessages = async () => {
      try {
        const response = await chatApi.getMessages(selectedChat.id);
        if (cancelled) return;
        setMessages((current) => mergeChatMessages(response.data, current));
        await chatApi.markAsRead(selectedChat.id);
        setChats((current) =>
            current.map((chat) => chat.id === selectedChat.id ? { ...chat, unreadCount: 0 } : chat)
        );
      } catch (error) { console.error('Error cargando mensajes', error); }
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
      const message = response.data;
      setMessages((current) =>
        current.map((currentMessage) =>
          currentMessage.localId === localId
            ? { ...message, clientState: 'delivered' as const }
            : currentMessage
        )
      );
      setChats((current) =>
          current.map((chat) =>
              chat.id === selectedChat.id
                  ? { ...chat, lastMessage: content, lastMessageTime: message.timestamp, unreadCount: 0 }
                  : chat
          )
      );
    } catch (error) {
      console.error('Error enviando mensaje', error);
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
      toast.error('No se pudo enviar el mensaje.');
    }
  };

  const handleCreatePrivateChat = async (userId: string) => {
    try {
      const response = await chatApi.createPrivateChat(userId);
      const chat = response.data;
      setChats((current) => [chat, ...current.filter((item) => item.id !== chat.id)]);
      setSelectedChat(chat);
      setActiveTab('chat');
      setShowNewChatDialog(false);
    } catch (error) { console.error('Error creando chat privado', error); toast.error('No se pudo abrir el chat privado.'); }
  };

  const handleCreateGroupChat = async (name: string, memberIds: string[]) => {
    try {
      const response = await workGroupsApi.create({
        name,
        description: `Grupo coordinado por ${(user as any)?.nombre || (user as any)?.firstName || 'Administracion'}`,
        members: memberIds,
      });
      const newGroup = response.data;
      setWorkGroups((current) => [newGroup, ...current]);
      const chatsResponse = await chatApi.getMyChats();
      setChats(chatsResponse.data);
      const linkedChat = chatsResponse.data.find((chat) => chat.id === newGroup.chatId);
      if (linkedChat) { setSelectedChat(linkedChat); setActiveTab('chat'); }
      setShowNewChatDialog(false);
      toast.success('Grupo creado y conectado al chat.');
    } catch (error) { console.error('Error creando grupo', error); toast.error('No se pudo crear el grupo.'); }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const group = workGroups.find((item) => item.id === groupId);
    if (!group) return;
    try {
      await workGroupsApi.delete(groupId);
      setWorkGroups((current) => current.filter((item) => item.id !== groupId));
      setChats((current) => current.filter((chat) => chat.id !== group.chatId));
      if (selectedChat?.id === group.chatId) setSelectedChat(null);
      toast.success('Grupo eliminado.');
    } catch (error) { console.error('Error eliminando grupo', error); toast.error('No se pudo eliminar el grupo.'); }
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setMobileView('window');
  };

  const handleOpenGroupChat = (group: WorkGroup) => {
    const linkedChat = chats.find((chat) => chat.id === group.chatId);
    if (!linkedChat) { toast.error('El chat del grupo aun no esta disponible.'); return; }
    setSelectedChat(linkedChat);
    setActiveTab('chat');
  };

  const handleSaveMembers = async () => {
    if (!editingGroup) return;
    try {
      const response = await workGroupsApi.update(editingGroup.id, {
        name: editingGroup.name,
        description: editingGroup.description,
        members: editingMembers,
      });
      const updatedGroup = response.data;
      setWorkGroups((current) => current.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
      const chatsResponse = await chatApi.getMyChats();
      setChats(chatsResponse.data);
      setEditingGroup(null);
      toast.success('Miembros actualizados.');
    } catch (error) { console.error('Error actualizando miembros', error); toast.error('No se pudieron guardar los cambios del grupo.'); }
  };

  const unreadChats = chats.filter((c) => c.unreadCount > 0).length;
  const currentUserId = String(user?.id || '');
  const participants = useMemo(() => buildParticipantDirectory(directoryUsers), [directoryUsers]);
  const selectedGroup = useMemo(
    () => workGroups.find((group) => group.chatId === selectedChat?.id) || null,
    [selectedChat?.id, workGroups]
  );
  const selectedConversationHint = selectedGroup?.description || selectedChat?.description;
  const trackedPresenceIds = useMemo(
      () => Array.from(new Set(chats.flatMap((chat) => chat.participants))).concat(currentUserId).filter(Boolean),
      [chats, currentUserId]
  );
  const presenceByUserId = useChatPresence(trackedPresenceIds, currentUserId);

  return (
    <DashboardShell
      title="Comunicaciones"
      description="Gestiona mensajes y grupos del hospital."
    >
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-slate-100 p-1">
            <TabsTrigger value="chat" className="shrink-0 rounded-lg px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MessageCircle className="mr-2 h-3.5 w-3.5" />
              Mensajes
              {unreadChats > 0 && (
                  <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">
                {unreadChats}
              </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="shrink-0 rounded-lg px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="mr-2 h-3.5 w-3.5" />
              Grupos
            </TabsTrigger>
          </TabsList>

          {/* TAB: CHAT */}
          <TabsContent value="chat" className="mt-4">
            <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100dvh-11.5rem)] lg:flex-row" style={{minHeight: 'calc(100dvh - 14rem)'}}>
              {/* Sidebar: visible en móvil sólo si mobileView === 'sidebar' */}
              <div className={`w-full shrink-0 overflow-hidden border-b border-slate-100 lg:w-[23rem] lg:border-b-0 lg:border-r lg:flex lg:flex-col ${mobileView === 'window' ? 'hidden lg:flex' : 'flex flex-col'}`}>
                <ChatSidebar
                    chats={chats}
                    selectedChatId={selectedChat?.id || null}
                    onSelectChat={handleSelectChat}
                    onNewChat={() => setShowNewChatDialog(true)}
                    showNewChatButton
                    userRole={user?.role}
                    currentUserId={currentUserId}
                    participants={participants}
                    presenceByUserId={presenceByUserId}
                />
              </div>
              {/* Chat window: visible en móvil sólo si mobileView === 'window' */}
              <div className={`min-h-0 flex-col overflow-hidden bg-slate-50/50 ${mobileView === 'sidebar' ? 'hidden lg:flex lg:flex-1' : 'flex flex-1'}`}>
                {/* Botón volver — sólo en móvil */}
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
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                        <MessageCircle className="h-7 w-7" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-600">Selecciona una conversacion</p>
                        <p className="text-sm">Elige un chat de la lista o crea uno nuevo</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowNewChatDialog(true)}>
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Nueva conversacion
                      </Button>
                    </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB: GRUPOS */}
          <TabsContent value="groups" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {workGroups.length} grupo{workGroups.length !== 1 ? 's' : ''} - miembros y chats vinculados
              </p>
              <Button size="sm" onClick={() => setShowNewChatDialog(true)} className="rounded-xl">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Nuevo grupo
              </Button>
            </div>

            {workGroups.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  <Users className="h-8 w-8" />
                  <p className="text-sm">No hay grupos creados todavia</p>
                  <Button size="sm" variant="outline" onClick={() => setShowNewChatDialog(true)}>Crear primer grupo</Button>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {workGroups.map((group) => {
                    const isLinked = chats.some((c) => c.id === group.chatId);
                    return (
                        <div
                            key={group.id}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                        >
                          {/* Header del grupo */}
                          <div className="mb-4 flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
                                <Users className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800">{group.name}</p>
                                <p className="truncate text-xs text-slate-400">{group.description}</p>
                              </div>
                            </div>
                            <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="shrink-0 rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                                aria-label="Eliminar grupo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Avatares de miembros */}
                          <div className="mb-4 flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {group.memberNames.slice(0, 5).map((name, i) => (
                                  <div
                                      key={i}
                                      title={name}
                                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-slate-400 to-slate-600 text-[10px] font-semibold text-white"
                                  >
                                    {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                              ))}
                              {group.memberNames.length > 5 && (
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-semibold text-slate-500">
                                    +{group.memberNames.length - 5}
                                  </div>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">{group.members.length} miembros</span>
                            {isLinked && (
                                <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Chat activo
                        </span>
                            )}
                          </div>

                          {/* Acciones */}
                          <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 rounded-xl border-slate-200 text-xs hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                onClick={() => handleOpenGroupChat(group)}
                            >
                              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                              Abrir chat
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 rounded-xl border-slate-200 text-xs hover:border-slate-300 hover:bg-slate-50"
                                onClick={() => {
                                  setEditingGroup(group);
                                  setEditingMembers(group.members.filter((id) => id !== String(user?.id)));
                                }}
                            >
                              <Settings className="mr-1.5 h-3.5 w-3.5" />
                              Miembros
                            </Button>
                          </div>
                        </div>
                    );
                  })}
                </div>
            )}
          </TabsContent>
        </Tabs>

        <NewChatDialog
            open={showNewChatDialog}
            onOpenChange={setShowNewChatDialog}
            workers={workers}
            currentUserId={String(user?.id || '')}
            onCreatePrivateChat={handleCreatePrivateChat}
            onCreateGroupChat={handleCreateGroupChat}
            isAdmin
        />

        <ChatInfoSheet
          open={showInfoSheet}
          onOpenChange={setShowInfoSheet}
          chat={selectedChat}
          currentUserId={currentUserId}
          participants={participants}
          presenceByUserId={presenceByUserId}
          group={selectedGroup}
        />

        {/* Dialog editar miembros */}
        <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Gestionar miembros</DialogTitle>
              <DialogDescription>
                Selecciona los integrantes del grupo <strong>{editingGroup?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-72 pr-2">
              <div className="space-y-1.5">
                {workers.map((worker) => {
                  const checked = editingMembers.includes(worker.id);
                  return (
                      <label
                          key={worker.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                              checked ? 'border-cyan-200 bg-cyan-50' : 'border-slate-100 hover:bg-slate-50'
                          }`}
                      >
                        <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                                setEditingMembers((current) =>
                                    current.includes(worker.id)
                                        ? current.filter((id) => id !== worker.id)
                                        : [...current, worker.id]
                                )
                            }
                        />
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-xs font-semibold text-white">
                          {worker.nombre[0]}{worker.apellidos[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{worker.nombre} {worker.apellidos}</p>
                          <p className="text-xs text-slate-400">{worker.departamento}</p>
                        </div>
                      </label>
                  );
                })}
              </div>
            </ScrollArea>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingGroup(null)}>Cancelar</Button>
              <Button size="sm" onClick={handleSaveMembers} disabled={!editingGroup || loading}>
                Guardar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}

function toWorkerOption(user: User): WorkerOption {
  return {
    id: String(user.id),
    nombre: (user as any).nombre || (user as any).firstName || '',
    apellidos: (user as any).apellidos || (user as any).lastName || '',
    departamento: (user as any).department || 'Sin departamento',
  };
}
