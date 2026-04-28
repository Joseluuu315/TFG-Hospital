'use client';

import { ChatAvatar } from '@/components/chat/chat-avatar';
import { cn } from '@/lib/utils';

interface SidebarUserProps {
  name: string;
  subtitle: string;
  metaLabel?: string;
  statusLabel?: string;
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
  metaLabel,
  statusLabel,
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
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <span className={cn('block truncate text-sm font-semibold sm:text-[15px]', selected ? 'text-white' : 'text-slate-800')}>
                {name}
              </span>
              {(metaLabel || statusLabel) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {metaLabel && (
                    <span
                      className={cn(
                        'inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                        selected ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      <span className="truncate">{metaLabel}</span>
                    </span>
                  )}
                  {statusLabel && (
                    <span className={cn('text-[11px]', selected ? 'text-slate-300' : 'text-slate-500')}>
                      {statusLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
            {timestamp && (
              <time
                dateTime={timestamp}
                className={cn('shrink-0 pt-0.5 text-[11px]', selected ? 'text-slate-400' : 'text-slate-400')}
              >
                {formatSidebarTime(timestamp)}
              </time>
            )}
          </div>
          <div className="mt-2 flex items-start justify-between gap-2">
            <p className={cn('line-clamp-2 text-xs leading-5', selected ? 'text-slate-300' : 'text-slate-500')}>
              {subtitle}
            </p>
            {unreadCount > 0 && (
              <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-white">
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
