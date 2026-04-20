'use client';

import type React from 'react';
import {
  Building2,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Bell,
  ClipboardList,
  BarChart3,
  CalendarDays,
  MessageCircle,
  HeadphonesIcon,
  Settings2,
  ClipboardPenLine,
  ShieldCheck,
} from 'lucide-react';

export type UserRole = 'ROOT' | 'HOSPITAL_ADMIN' | 'WORKER';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

export const navItems: NavItem[] = [
  // ROOT items
  { href: '/dashboard/root',           label: 'Dashboard',     icon: LayoutDashboard, roles: ['ROOT'] },
  { href: '/dashboard/root/hospitals', label: 'Hospitales',    icon: Building2,       roles: ['ROOT'] },
  { href: '/dashboard/root/support',   label: 'Soporte',       icon: HeadphonesIcon,  roles: ['ROOT'] },
  { href: '/dashboard/root/stats',     label: 'Estadisticas',  icon: BarChart3,       roles: ['ROOT'] },

  // HOSPITAL_ADMIN items
  { href: '/dashboard/admin',                   label: 'Dashboard',      icon: LayoutDashboard, roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/workers',           label: 'Trabajadores',   icon: Users,           roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/operations',        label: 'Operaciones',    icon: ClipboardPenLine,roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/payrolls',          label: 'Nominas',        icon: FileText,        roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/leave-requests',    label: 'Solicitudes',    icon: ClipboardList,   roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/audit',             label: 'Auditoria',      icon: ShieldCheck,     roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/chat',              label: 'Comunicaciones', icon: MessageCircle,   roles: ['HOSPITAL_ADMIN'] },
  { href: '/dashboard/admin/announcements',     label: 'Anuncios',       icon: Bell,            roles: ['HOSPITAL_ADMIN'] },

  // WORKER items
  { href: '/dashboard/worker',                  label: 'Dashboard',      icon: LayoutDashboard, roles: ['WORKER'] },
  { href: '/dashboard/worker/calendar',         label: 'Mis Turnos',     icon: CalendarDays,    roles: ['WORKER'] },
  { href: '/dashboard/worker/payrolls',         label: 'Mis Nominas',    icon: FileText,        roles: ['WORKER'] },
  { href: '/dashboard/worker/leave-requests',   label: 'Dias Libres',    icon: Calendar,        roles: ['WORKER'] },
  { href: '/dashboard/worker/chat',             label: 'Mensajes',       icon: MessageCircle,   roles: ['WORKER'] },
  { href: '/dashboard/settings',                label: 'Ajustes',        icon: Settings2,       roles: ['ROOT', 'HOSPITAL_ADMIN', 'WORKER'] },
];

export function getRoleLabel(role?: string) {
  switch (role) {
    case 'ROOT':           return 'Super Admin';
    case 'HOSPITAL_ADMIN': return 'Admin Hospital';
    case 'WORKER':         return 'Trabajador';
    default:               return 'Usuario';
  }
}
