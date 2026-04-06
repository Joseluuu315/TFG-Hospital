'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Building2, LogOut, Settings } from 'lucide-react';
import { getRoleLabel, navItems } from '@/components/dashboard/nav-items';
import { getDisplayName, getInitials } from '@/lib/formatters';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const filteredItems = navItems.filter((item) => hasRole(item.roles));

  const fullName = getDisplayName(user);
  const initial = getInitials(user);
  const avatarUrl = (user as { imageURL?: string; avatar?: string } | null)?.imageURL
    ?? (user as { imageURL?: string; avatar?: string } | null)?.avatar
    ?? null;

  return (
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-full flex-col">

          {/* Header */}
          <div className="flex items-center gap-3 border-b px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Trassierra</span>
              <span className="text-xs text-sidebar-foreground/70">Sistema Hospitalario</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                  <Link
                      key={item.href}
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
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">

              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium overflow-hidden">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="h-9 w-9 rounded-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          (e.currentTarget.parentElement as HTMLElement).innerText = initial;
                        }}
                    />
                ) : (
                    <span>{initial}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{fullName || 'Usuario'}</p>
                <p className="truncate text-xs text-sidebar-foreground/70">{getRoleLabel(user?.role)}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
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
      </aside>
  );
}
