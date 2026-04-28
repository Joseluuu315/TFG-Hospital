'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChatAvatar } from '@/components/chat/chat-avatar';
import {
  getChatPeer,
  getConversationTitle,
  type ChatParticipant,
  type UserPresence,
} from '@/components/chat/chat-models';
import type { Chat, WorkGroup } from '@/lib/api';
import { Building2, HeadphonesIcon, Mail, MessageCircle, Phone, Users } from 'lucide-react';

interface ChatInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat | null;
  currentUserId?: string;
  participants?: Record<string, ChatParticipant>;
  presenceByUserId?: Record<string, UserPresence>;
  group?: WorkGroup | null;
}

const chatTypeIcon = {
  PRIVATE: MessageCircle,
  GROUP: Users,
  HOSPITAL: Building2,
  SUPPORT: HeadphonesIcon,
} as const;

const chatTypeLabel = {
  PRIVATE: 'Conversacion privada',
  GROUP: 'Grupo de trabajo',
  HOSPITAL: 'Canal del hospital',
  SUPPORT: 'Canal de soporte',
} as const;

export function ChatInfoSheet({
  open,
  onOpenChange,
  chat,
  currentUserId = '',
  participants = {},
  presenceByUserId = {},
  group,
}: ChatInfoSheetProps) {
  if (!chat) return null;

  const Icon = chatTypeIcon[chat.type];
  const title = getConversationTitle(chat, currentUserId, participants);
  const peer = getChatPeer(chat, currentUserId, participants);
  const description = group?.description || chat.description || getDefaultDescription(chat.type);
  const memberEntries = chat.participants.map((participantId, index) => ({
    id: participantId,
    ...(participants[participantId] ?? {}),
    name: participants[participantId]?.name || chat.participantNames[index] || `Usuario ${participantId}`,
  }));
  const creator = participants[chat.createdBy];
  const activeMembers = memberEntries.filter((member) => presenceByUserId[member.id]?.isOnline).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-full gap-0 border-l p-0 sm:max-w-md lg:max-w-lg"
      >
        <SheetHeader className="border-b px-5 py-5">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="truncate text-left text-base">{title}</SheetTitle>
                <Badge variant="outline" className="rounded-full">
                  {chatTypeLabel[chat.type]}
                </Badge>
              </div>
              <SheetDescription className="text-left leading-5">
                {description}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 px-5 py-5">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Participantes" value={String(memberEntries.length)} />
              <InfoCard label="Activos" value={String(activeMembers)} />
            </div>

            {chat.type === 'PRIVATE' && peer ? (
              <section className="space-y-4">
                <SectionTitle>Contacto</SectionTitle>
                <div className="rounded-2xl border bg-slate-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <ChatAvatar
                      name={peer.name}
                      imageUrl={peer.avatarUrl}
                      isOnline={presenceByUserId[peer.id]?.isOnline}
                      sizeClassName="h-11 w-11"
                    />
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-slate-900">{peer.name}</p>
                      {peer.jobTitle && <p className="text-sm text-slate-600">{peer.jobTitle}</p>}
                      {peer.department && <p className="text-sm text-slate-500">{peer.department}</p>}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    {peer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{peer.email}</span>
                      </div>
                    )}
                    {peer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{peer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className="space-y-4">
                <SectionTitle>Miembros</SectionTitle>
                <div className="space-y-2">
                  {memberEntries.map((member) => {
                    const isCurrentUser = member.id === currentUserId;
                    const isOnline = presenceByUserId[member.id]?.isOnline;

                    return (
                      <div
                        key={member.id}
                        className="flex items-start gap-3 rounded-2xl border bg-white p-3"
                      >
                        <ChatAvatar
                          name={member.name}
                          imageUrl={member.avatarUrl}
                          isOnline={isOnline}
                          sizeClassName="h-10 w-10"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {member.name}
                            </p>
                            {isCurrentUser && (
                              <Badge variant="secondary" className="rounded-full">
                                Tu usuario
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {member.jobTitle && <span>{member.jobTitle}</span>}
                            {member.department && <span>{member.department}</span>}
                          </div>
                          {member.email && (
                            <p className="truncate text-xs text-slate-500">{member.email}</p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={isOnline ? 'border-emerald-200 text-emerald-700' : 'text-slate-500'}
                        >
                          {isOnline ? 'Activo' : 'Sin actividad'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <SectionTitle>Detalle del chat</SectionTitle>
              <div className="rounded-2xl border bg-slate-50/70 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3 py-2">
                  <span className="text-slate-500">Tipo</span>
                  <span className="font-medium text-slate-800">{chatTypeLabel[chat.type]}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t py-2">
                  <span className="text-slate-500">Nombre</span>
                  <span className="truncate text-right font-medium text-slate-800">{chat.name}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t py-2">
                  <span className="text-slate-500">Mensajes sin leer</span>
                  <span className="font-medium text-slate-800">{chat.unreadCount}</span>
                </div>
                {(creator?.name || group?.createdBy) && (
                  <div className="flex items-center justify-between gap-3 border-t py-2">
                    <span className="text-slate-500">Creado por</span>
                    <span className="truncate text-right font-medium text-slate-800">
                      {creator?.name || group?.createdBy}
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold tracking-[0.01em] text-slate-900">{children}</h3>;
}

function getDefaultDescription(type: Chat['type']) {
  switch (type) {
    case 'PRIVATE':
      return 'Conversacion directa entre dos usuarios.';
    case 'GROUP':
      return 'Canal compartido para coordinacion interna.';
    case 'HOSPITAL':
      return 'Canal general para comunicaciones del hospital.';
    case 'SUPPORT':
      return 'Canal de atencion y seguimiento.';
    default:
      return 'Informacion no disponible.';
  }
}
