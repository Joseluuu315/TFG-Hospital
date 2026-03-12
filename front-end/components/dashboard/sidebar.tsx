'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Building2,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Bell,
  Settings,
  LogOut,
  ClipboardList,
  BarChart3,
  CalendarDays,
  MessageCircle,
  HeadphonesIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('ROOT' | 'HOSPITAL_ADMIN' | 'WORKER')[];
}

const navItems: NavItem[] = [
  // ROOT items
  { href: '/dashboard/root',           label: 'Dashboard',     icon: LayoutDashboard, roles: ['ROOT'] },
  { href: '/dashboard/root/hospitals', label: 'Hospitales',    icon: Building2,       roles: ['ROOT'] },
  { href: '/dashboard/root/support',   label: 'Soporte',       icon: HeadphonesIcon,  roles: ['ROOT'] },
  { href: '/dashboard/root/stats',     label: 'Estadisticas',  icon: BarChart3,       roles: ['ROOT'] },

  // HOSPITAL_ADMIN items
  { href: '/dashboard/admin',                   label: 'Dashboard',      icon: LayoutDashboard, roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/workers',           label: 'Trabajadores',   icon: Users,           roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/payrolls',          label: 'Nominas',        icon: FileText,        roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/leave-requests',    label: 'Solicitudes',    icon: ClipboardList,   roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/chat',              label: 'Comunicaciones', icon: MessageCircle,   roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/announcements',     label: 'Anuncios',       icon: Bell,            roles: ['HOSPITAL_ADMIN'] },

  // WORKER items
  { href: '/dashboard/worker',                  label: 'Dashboard',      icon: LayoutDashboard, roles: ['WORKER'] },
  { href: '/dashboard/worker/calendar',         label: 'Mi Calendario',  icon: CalendarDays,    roles: ['WORKER'] },
  { href: '/dashboard/worker/payrolls',         label: 'Mis Nominas',    icon: FileText,        roles: ['WORKER'] },
  { href: '/dashboard/worker/leave-requests',   label: 'Dias Libres',    icon: Calendar,        roles: ['WORKER'] },
  { href: '/dashboard/worker/chat',             label: 'Mensajes',       icon: MessageCircle,   roles: ['WORKER'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const filteredItems = navItems.filter((item) => hasRole(item.roles));

  const u = user as any;
  const fullName = `${u?.firstName ?? u?.nombre ?? ''} ${u?.lastName ?? u?.apellidos ?? ''}`.trim();
  const initial = (u?.firstName?.[0] ?? u?.nombre?.[0] ?? '?').toUpperCase();
  const avatarUrl = u?.imageURL ?? u?.avatar ?? null;

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'ROOT':           return 'Super Admin';
      case 'HOSPITAL_ADMIN': return 'Admin Hospital';
      case 'WORKER':         return 'Trabajador';
      default:               return 'Usuario';
    }
  };

  return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-sidebar text-sidebar-foreground">
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
                <p className="truncate text-sm font-medium">{fullName}</p>
                <p className="truncate text-xs text-sidebar-foreground/70">{getRoleLabel()}</p>
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