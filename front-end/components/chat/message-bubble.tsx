'use client';

import { ChatAvatar } from '@/components/chat/chat-avatar';
import type { ChatDeliveryState } from '@/components/chat/chat-models';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCheck, Clock3 } from 'lucide-react';

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
  deliveryState?: ChatDeliveryState;
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
  deliveryState = 'delivered',
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
        'animate-in fade-in-0 slide-in-from-bottom-1 flex items-end gap-2.5 duration-200',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      {!isOwn && (
        <div className={cn('w-9 shrink-0', !showAvatar && 'invisible')}>
          <ChatAvatar
            name={senderName}
            imageUrl={senderImageUrl}
            isOnline={isSenderOnline}
            gradientClassName={gradientClassName}
            sizeClassName="h-9 w-9"
            textClassName="text-[10px]"
          />
        </div>
      )}

      <div className={cn('flex max-w-[88%] flex-col sm:max-w-[76%] lg:max-w-[72%]', isOwn ? 'items-end' : 'items-start')}>
        {showName && !isOwn && <p className="mb-1.5 px-1 text-xs font-semibold tracking-[0.01em] text-slate-600">{senderName}</p>}
        <div
          className={cn(
            'space-y-2 px-4 py-3 shadow-sm transition-colors',
            isOwn
              ? cn(
                  deliveryState === 'error'
                    ? 'border border-red-200 bg-red-50 text-red-900'
                    : 'bg-slate-900 text-white',
                  ownRadius
                )
              : cn('border border-slate-200 bg-white/95 text-slate-800', otherRadius)
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-6">{content}</p>
          <div className="flex items-center justify-end gap-1.5">
            <time
              dateTime={timestamp}
              className={cn(
                'block text-right text-[10px] font-medium',
                isOwn
                  ? deliveryState === 'error'
                    ? 'text-red-700'
                    : 'text-slate-300'
                  : 'text-slate-400'
              )}
            >
              {new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </time>
            {isOwn && <DeliveryStateIndicator state={deliveryState} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryStateIndicator({ state }: { state: ChatDeliveryState }) {
  if (state === 'sending') {
    return <Clock3 className="h-3.5 w-3.5 text-slate-300" aria-label="Enviando" />;
  }

  if (state === 'error') {
    return <AlertCircle className="h-3.5 w-3.5 text-red-600" aria-label="Error al enviar" />;
  }

  return <CheckCheck className="h-3.5 w-3.5 text-emerald-300" aria-label="Entregado" />;
}
