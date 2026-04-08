'use client';

import { ChatAvatar } from '@/components/chat/chat-avatar';
import { cn } from '@/lib/utils';

interface SidebarUserProps {
  name: string;
  subtitle: string;
  timestamp?: string;
  unreadCount?: number;
  selected?: boolean;
  onClick: () => void;
  avatarUrl?: string;
  isOnline?: boolean;
  gradientClassName?: string;
}

export function SidebarUser({
  name,
  subtitle,
  timestamp,
  unreadCount = 0,
  selected = false,
  onClick,
  avatarUrl,
  isOnline,
  gradientClassName,
}: SidebarUserProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'group w-full rounded-2xl border px-3 py-3 text-left transition-all duration-200',
        selected
          ? 'border-slate-900 bg-slate-900 shadow-sm'
          : 'border-transparent bg-white/70 hover:border-slate-200 hover:bg-slate-50'
      )}
    >
      <div className="flex items-center gap-3">
        <ChatAvatar
          name={name}
          imageUrl={avatarUrl}
          isOnline={isOnline}
          gradientClassName={gradientClassName}
          sizeClassName="h-11 w-11"
          textClassName="text-[11px]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('truncate text-sm font-semibold', selected ? 'text-white' : 'text-slate-800')}>
              {name}
            </span>
            {timestamp && (
              <time
                dateTime={timestamp}
                className={cn('shrink-0 text-[11px]', selected ? 'text-slate-400' : 'text-slate-400')}
              >
                {formatSidebarTime(timestamp)}
              </time>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className={cn('truncate text-xs', selected ? 'text-slate-300' : 'text-slate-500')}>
              {subtitle}
            </p>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function formatSidebarTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Ayer';
  if (days < 7) return date.toLocaleDateString('es-ES', { weekday: 'short' });
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}
