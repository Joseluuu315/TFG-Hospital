'use client';

import { useId, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Worker {
  id: string;
  nombre: string;
  apellidos: string;
  departamento: string;
}

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  currentUserId: string;
  onCreatePrivateChat: (userId: string) => void;
  onCreateGroupChat?: (name: string, memberIds: string[]) => void;
  isAdmin?: boolean;
}

export function NewChatDialog({
                                open,
                                onOpenChange,
                                workers,
                                currentUserId,
                                onCreatePrivateChat,
                                onCreateGroupChat,
                                isAdmin = false,
                              }: NewChatDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'private' | 'group'>('private');
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const privateSearchId = useId();
  const groupNameId = useId();
  const resultsId = useId();

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredWorkers = useMemo(
      () => workers.filter(
          (w) => w.id !== currentUserId && (
              w.nombre.toLowerCase().includes(normalizedQuery) ||
              w.apellidos.toLowerCase().includes(normalizedQuery) ||
              w.departamento.toLowerCase().includes(normalizedQuery)
          )
      ),
      [workers, currentUserId, normalizedQuery]
  );

  const handleCreatePrivate = (userId: string) => {
    onCreatePrivateChat(userId);
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedMembers.length > 0 && onCreateGroupChat) {
      onCreateGroupChat(groupName.trim(), selectedMembers);
      setGroupName('');
      setSelectedMembers([]);
      setSearchQuery('');
      onOpenChange(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getInitials = (w: Worker) =>
      `${w.nombre[0] ?? ''}${w.apellidos[0] ?? ''}`.toUpperCase();

  const WorkerRow = ({ worker, onClick, checked }: {
    worker: Worker;
    onClick?: () => void;
    checked?: boolean;
  }) => (
      <div
          onClick={onClick}
          className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
              checked ? 'bg-slate-900' : 'hover:bg-slate-50'
          )}
      >
        {checked !== undefined && (
            <Checkbox
                checked={checked}
                onCheckedChange={() => toggleMember(worker.id)}
                className="shrink-0"
                aria-label={`Seleccionar ${worker.nombre}`}
            />
        )}
        <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white',
            'bg-gradient-to-br from-slate-600 to-slate-800'
        )}>
          {getInitials(worker)}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-medium', checked ? 'text-white' : 'text-slate-800')}>
            {worker.nombre} {worker.apellidos}
          </p>
          <p className={cn('truncate text-xs', checked ? 'text-slate-400' : 'text-slate-400')}>
            {worker.departamento}
          </p>
        </div>
      </div>
  );

  const SearchBox = ({ id }: { id: string }) => (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <Input
            id={id}
            placeholder="Buscar por nombre o departamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-8 text-xs placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-cyan-400"
            aria-describedby={resultsId}
        />
      </div>
  );

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-base font-semibold text-slate-800">Nueva conversación</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {isAdmin
                  ? 'Inicia un chat privado o crea un grupo de trabajo'
                  : 'Selecciona un compañero para iniciar una conversación'}
            </DialogDescription>
          </DialogHeader>

          {isAdmin ? (
              <div className="flex flex-col">
                {/* Tab switcher */}
                <div className="flex gap-1 border-b border-slate-100 px-5 py-3">
                  {(['private', 'group'] as const).map((tab) => (
                      <button
                          key={tab}
                          onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
                          className={cn(
                              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                              activeTab === tab
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                          )}
                      >
                        {tab === 'private'
                            ? <><MessageCircle className="h-3.5 w-3.5" /> Privado</>
                            : <><Users className="h-3.5 w-3.5" /> Grupo</>
                        }
                      </button>
                  ))}
                </div>

                <div className="px-5 py-4 space-y-3">
                  {activeTab === 'private' && (
                      <>
                        <SearchBox id={privateSearchId} />
                        <ScrollArea className="h-64">
                          <div className="space-y-0.5 pr-1">
                            {filteredWorkers.length > 0
                                ? filteredWorkers.map((w) => (
                                    <WorkerRow key={w.id} worker={w} onClick={() => handleCreatePrivate(w.id)} />
                                ))
                                : <EmptyState />
                            }
                          </div>
                        </ScrollArea>
                      </>
                  )}

                  {activeTab === 'group' && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor={groupNameId} className="text-xs font-medium text-slate-700">
                            Nombre del grupo
                          </Label>
                          <Input
                              id={groupNameId}
                              placeholder="Ej: Equipo de Urgencias"
                              value={groupName}
                              onChange={(e) => setGroupName(e.target.value)}
                              className="h-9 rounded-xl border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-cyan-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-700">
                            Miembros
                            {selectedMembers.length > 0 && (
                                <span className="ml-2 rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">
                          {selectedMembers.length} seleccionados
                        </span>
                            )}
                          </Label>
                          <SearchBox id={`group-search-${groupNameId}`} />
                        </div>
                        <ScrollArea className="h-44">
                          <div className="space-y-0.5 pr-1">
                            {filteredWorkers.length > 0
                                ? filteredWorkers.map((w) => (
                                    <WorkerRow
                                        key={w.id}
                                        worker={w}
                                        checked={selectedMembers.includes(w.id)}
                                        onClick={() => toggleMember(w.id)}
                                    />
                                ))
                                : <EmptyState />
                            }
                          </div>
                        </ScrollArea>
                        <Button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || selectedMembers.length === 0}
                            className="w-full rounded-xl bg-slate-900 hover:bg-slate-700"
                            size="sm"
                        >
                          Crear grupo con {selectedMembers.length} miembro{selectedMembers.length !== 1 ? 's' : ''}
                        </Button>
                      </>
                  )}
                </div>
              </div>
          ) : (
              <div className="px-5 py-4 space-y-3">
                <SearchBox id={privateSearchId} />
                <ScrollArea className="h-64">
                  <div className="space-y-0.5 pr-1">
                    {filteredWorkers.length > 0
                        ? filteredWorkers.map((w) => (
                            <WorkerRow key={w.id} worker={w} onClick={() => handleCreatePrivate(w.id)} />
                        ))
                        : <EmptyState />
                    }
                  </div>
                </ScrollArea>
              </div>
          )}

          <p id={resultsId} className="sr-only" aria-live="polite">
            {filteredWorkers.length} trabajadores disponibles
          </p>
        </DialogContent>
      </Dialog>
  );
}

function EmptyState() {
  return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
        <Users className="mb-2 h-8 w-8" />
        <p className="text-xs">No se encontraron trabajadores</p>
      </div>
  );
}