'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Settings, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getRoleLabel, navItems } from '@/components/dashboard/nav-items';

export function MobileSidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const filteredItems = navItems.filter((item) => hasRole(item.roles));

  const u = user as any;
  const fullName = `${u?.firstName ?? u?.nombre ?? ''} ${u?.lastName ?? u?.apellidos ?? ''}`.trim();
  const initial = (u?.firstName?.[0] ?? u?.nombre?.[0] ?? '?').toUpperCase();
  const avatarUrl = u?.imageURL ?? u?.avatar ?? null;
  const [avatarError, setAvatarError] = useState(false);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-sidebar text-sidebar-foreground w-72 p-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Trassierra</span>
              <span className="text-xs text-sidebar-foreground/70">Sistema Hospitalario</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
                {avatarUrl && !avatarError ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                    onError={() => setAvatarError(true)}
                    unoptimized
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{fullName}</p>
                <p className="truncate text-xs text-sidebar-foreground/70">{getRoleLabel(user?.role)}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  asChild
                >
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Ajustes
                  </Link>
                </Button>
              </SheetClose>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-sidebar-foreground/70 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
