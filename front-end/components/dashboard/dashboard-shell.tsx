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
        <main className={cn('p-6 space-y-6', className)}>{children}</main>
      </div>
    </div>
  );
}
