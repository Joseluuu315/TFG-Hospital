'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle, Search } from 'lucide-react';
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MobileSidebar } from '@/components/dashboard/mobile-sidebar';
import { getDisplayName } from '@/lib/formatters';
import { chatApi, hospitalsApi } from '@/lib/api';
import { toast } from 'sonner';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { user } = useAuth();
  const fullName = getDisplayName(user);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const messagesHref =
    user?.role === 'HOSPITAL_ADMIN'
      ? '/dashboard/admin/chat'
      : user?.role === 'WORKER'
        ? '/dashboard/worker/chat'
        : user?.role === 'ROOT'
          ? '/dashboard/root/support'
          : undefined;

  const announcementsHref =
    user?.role === 'HOSPITAL_ADMIN'
      ? '/dashboard/admin/announcements'
      : user?.role === 'WORKER'
        ? '/dashboard/worker#announcements'
        : undefined;

  const messageLabel = user?.role === 'ROOT' ? 'Soporte' : 'Mensajes';
  const totalNotifications = announcementCount + unreadMessagesCount;
  const hasNotificationLinks = Boolean(messagesHref || announcementsHref);
  const formatCount = (count: number) => (count > 99 ? '99+' : String(count));

  useEffect(() => {
    let cancelled = false;

    const loadNotificationCounts = async () => {
      if (!user?.id) {
        if (!cancelled) {
          setAnnouncementCount(0);
          setUnreadMessagesCount(0);
        }
        return;
      }

      let nextAnnouncements = 0;
      let nextUnreadMessages = 0;

      if (user?.hospitalId) {
        try {
          const response = await hospitalsApi.getById(String(user.hospitalId));
          nextAnnouncements = (response.data.announcements || []).filter((item) => item.active).length;
        } catch {
          nextAnnouncements = 0;
        }
      }

      try {
        const response = await chatApi.getMyChats();
        nextUnreadMessages = response.data.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      } catch {
        nextUnreadMessages = 0;
      }

      if (!cancelled) {
        setAnnouncementCount(nextAnnouncements);
        setUnreadMessagesCount(nextUnreadMessages);
      }
    };

    loadNotificationCounts();
    const interval = setInterval(loadNotificationCounts, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id, user?.hospitalId]);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <MobileSidebar />
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <InputGroup className="hidden md:flex w-64">
            <InputGroupAddon>
              <Search className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Buscar..." />
          </InputGroup>

          {hasNotificationLinks ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
                  <Bell className="h-5 w-5" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-background">
                      {formatCount(totalNotifications)}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {messagesHref && (
                  <DropdownMenuItem asChild>
                    <Link href={messagesHref} className="flex w-full items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {messageLabel}
                      <span
                        className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-2 text-[10px] font-semibold ${
                          unreadMessagesCount > 0
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {formatCount(unreadMessagesCount)}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {announcementsHref && (
                  <DropdownMenuItem asChild>
                    <Link href={announcementsHref} className="flex w-full items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Anuncios
                      <span
                        className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-2 text-[10px] font-semibold ${
                          announcementCount > 0
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {formatCount(announcementCount)}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {totalNotifications === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No hay notificaciones nuevas
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => toast.info('No hay notificaciones disponibles')}
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
            </Button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Bienvenido,</span>
            <span className="font-medium">{fullName || 'Usuario'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
