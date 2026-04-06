'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group';
import { MobileSidebar } from '@/components/dashboard/mobile-sidebar';
import { getDisplayName } from '@/lib/formatters';
import { hospitalsApi } from '@/lib/api';
import { toast } from 'sonner';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { user } = useAuth();
  const fullName = getDisplayName(user);
  const [notificationCount, setNotificationCount] = useState(0);

  const notificationsHref =
    user?.role === 'HOSPITAL_ADMIN'
      ? '/dashboard/admin/announcements'
      : user?.role === 'WORKER'
        ? '/dashboard/worker#announcements'
        : user?.role === 'ROOT'
          ? '/dashboard/root/support'
          : undefined;

  useEffect(() => {
    let cancelled = false;

    const loadAnnouncementsCount = async () => {
      if (!user?.hospitalId) {
        setNotificationCount(0);
        return;
      }

      try {
        const response = await hospitalsApi.getById(String(user.hospitalId));
        const activeCount = (response.data.announcements || []).filter((item) => item.active).length;
        if (!cancelled) {
          setNotificationCount(activeCount);
        }
      } catch {
        if (!cancelled) {
          setNotificationCount(0);
        }
      }
    };

    loadAnnouncementsCount();
    return () => {
      cancelled = true;
    };
  }, [user?.hospitalId]);

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

          {notificationsHref ? (
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href={notificationsHref} aria-label="Ver notificaciones">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-background">
                    {notificationCount}
                  </span>
                )}
              </Link>
            </Button>
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
