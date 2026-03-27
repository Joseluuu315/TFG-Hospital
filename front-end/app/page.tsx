'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirigir segun el rol
        switch (user.role) {
          case 'ROOT':
            router.push('/dashboard/root');
            break;
          case 'HOSPITAL_ADMIN':
            router.push('/dashboard/admin');
            break;
          case 'WORKER':
            router.push('/dashboard/worker');
            break;
          default:
            router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Spinner className="w-8 h-8" />
      <p className="mt-4 text-muted-foreground">Cargando...</p>
    </main>
  );
}
