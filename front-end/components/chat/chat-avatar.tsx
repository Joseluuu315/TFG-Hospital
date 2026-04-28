'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChatAvatarProps {
  name: string;
  imageUrl?: string;
  gradientClassName?: string;
  isOnline?: boolean;
  sizeClassName?: string;
  textClassName?: string;
}

export function ChatAvatar({
  name,
  imageUrl,
  gradientClassName = 'from-cyan-500 to-blue-600',
  isOnline,
  sizeClassName = 'h-10 w-10',
  textClassName = 'text-xs',
}: ChatAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const initials = name
    .split(' ')
    .map((segment) => segment[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br font-semibold text-white shadow-sm',
          gradientClassName,
          sizeClassName,
          textClassName
        )}
        aria-hidden="true"
      >
        {imageUrl && failedImageUrl !== imageUrl ? (
          <Image
            key={imageUrl}
            src={imageUrl}
            alt={name}
            width={40}
            height={40}
            className="h-full w-full object-cover"
            onError={() => setFailedImageUrl(imageUrl)}
            unoptimized
          />
        ) : (
          initials
        )}
      </div>
      {typeof isOnline === 'boolean' && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm',
            isOnline ? 'bg-emerald-500' : 'bg-slate-300'
          )}
          aria-label={isOnline ? 'Usuario conectado' : 'Usuario desconectado'}
          title={isOnline ? 'Activo' : 'Sin actividad'}
        />
      )}
    </div>
  );
}
