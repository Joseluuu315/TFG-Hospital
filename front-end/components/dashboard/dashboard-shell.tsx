'use client';

import type { ReactNode } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function DashboardShell({
  title,
  description,
  children,
  className,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="md:ml-64 flex-1">
        <Header title={title} description={description} />
        <main className={cn('mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-4 sm:space-y-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
