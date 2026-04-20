'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import { Spinner } from '@/components/ui/spinner';

interface DashboardLoadingProps {
  label?: string;
}

export function DashboardLoading({ label = 'Cargando...' }: DashboardLoadingProps) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="md:ml-64 flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="h-8 w-8" />
          <span className="text-sm">{label}</span>
        </div>
      </div>
    </div>
  );
}
