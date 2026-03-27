'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group';
import { MobileSidebar } from '@/components/dashboard/mobile-sidebar';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <MobileSidebar />
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <InputGroup className="hidden md:flex w-64">
            <InputGroupAddon>
              <Search className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Buscar..." />
          </InputGroup>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-background">
              4
            </span>
          </Button>

          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Bienvenido,</span>
            <span className="font-medium">{user?.firstName} {user?.lastName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
