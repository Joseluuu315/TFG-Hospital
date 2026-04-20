'use client';

import { ChatAvatar } from '@/components/chat/chat-avatar';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  senderName: string;
  senderImageUrl?: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  compactTop: boolean;
  compactBottom: boolean;
  isSenderOnline?: boolean;
  gradientClassName?: string;
}

export function MessageBubble({
  senderName,
  senderImageUrl,
  content,
  timestamp,
  isOwn,
  showAvatar,
  showName,
  compactTop,
  compactBottom,
  isSenderOnline,
  gradientClassName,
}: MessageBubbleProps) {
  const ownRadius = cn(
    'rounded-[22px]',
    compactTop ? 'rounded-tr-md' : 'rounded-tr-[22px]',
    compactBottom ? 'rounded-br-md' : 'rounded-br-[22px]'
  );
  const otherRadius = cn(
    'rounded-[22px]',
    compactTop ? 'rounded-tl-md' : 'rounded-tl-[22px]',
    compactBottom ? 'rounded-bl-md' : 'rounded-bl-[22px]'
  );

  return (
    <div
      className={cn(
        'animate-in fade-in-0 slide-in-from-bottom-1 flex items-end gap-2 duration-200',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      {!isOwn && (
        <div className={cn('w-8 shrink-0', !showAvatar && 'invisible')}>
          <ChatAvatar
            name={senderName}
            imageUrl={senderImageUrl}
            isOnline={isSenderOnline}
            gradientClassName={gradientClassName}
            sizeClassName="h-8 w-8"
            textClassName="text-[10px]"
          />
        </div>
      )}

      <div className={cn('flex max-w-[82%] flex-col sm:max-w-[72%]', isOwn ? 'items-end' : 'items-start')}>
        {showName && !isOwn && <p className="mb-1 px-1 text-[11px] font-medium text-slate-500">{senderName}</p>}
        <div
          className={cn(
            'px-4 py-2.5 shadow-sm transition-colors',
            isOwn
              ? cn('bg-slate-900 text-white', ownRadius)
              : cn('border border-slate-200 bg-white text-slate-800', otherRadius)
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</p>
          <time
            dateTime={timestamp}
            className={cn('mt-1 block text-right text-[10px]', isOwn ? 'text-slate-300' : 'text-slate-400')}
          >
            {new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
      </div>
    </div>
  );
}
