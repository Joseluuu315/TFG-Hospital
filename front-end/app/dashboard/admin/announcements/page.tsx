'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Plus, MoreHorizontal, Edit, Trash2, Eye, EyeOff, Radio } from 'lucide-react';
import { hospitalsApi, type Announcement, type AnnouncementPriority } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

const ANNOUNCEMENT_REFRESH_MS = 8000;

type AnnouncementForm = {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  expiresAt: string;
};

const emptyForm: AnnouncementForm = {
  title: '',
  content: '',
  priority: 'MEDIUM',
  expiresAt: '',
};

export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementForm>(emptyForm);

  useEffect(() => {
    if (!user?.hospitalId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadAnnouncements = async () => {
      try {
        const response = await hospitalsApi.getById(String(user.hospitalId));
        if (cancelled) {
          return;
        }
        setAnnouncements(response.data.announcements || []);
      } catch (error) {
        console.error('Error cargando anuncios', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, ANNOUNCEMENT_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.hospitalId]);

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      expiresAt: announcement.expiresAt ? announcement.expiresAt.slice(0, 10) : '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.hospitalId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        expiresAt: new Date(formData.expiresAt).toISOString(),
        active: editingAnnouncement?.active ?? true,
      };

      if (editingAnnouncement) {
        const response = await hospitalsApi.updateAnnouncement(
          String(user.hospitalId),
          editingAnnouncement.id,
          payload
        );
        setAnnouncements((current) =>
          current.map((item) => (item.id === editingAnnouncement.id ? response.data : item))
        );
        toast.success('Anuncio actualizado.');
      } else {
        console.log("hospitalId:", user.hospitalId);
        console.log("payload:", payload);
        const response = await hospitalsApi.addAnnouncement(String(user.hospitalId), payload);
        setAnnouncements((current) => [response.data, ...current]);
        toast.success('Anuncio publicado.');
      }

      setIsDialogOpen(false);
      setEditingAnnouncement(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error('Error guardando anuncio', error);
      toast.error('No se pudo guardar el anuncio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (announcement: Announcement) => {
    if (!user?.hospitalId) {
      return;
    }

    try {
      const response = await hospitalsApi.updateAnnouncement(String(user.hospitalId), announcement.id, {
        ...announcement,
        active: !announcement.active,
      });
      setAnnouncements((current) =>
        current.map((item) => (item.id === announcement.id ? response.data : item))
      );
      toast.success('Visibilidad actualizada.');
    } catch (error) {
      console.error('Error actualizando visibilidad', error);
      toast.error('No se pudo cambiar la visibilidad.');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!user?.hospitalId) {
      return;
    }

    try {
      await hospitalsApi.deleteAnnouncement(String(user.hospitalId), id);
      setAnnouncements((current) => current.filter((item) => item.id !== id));
      toast.success('Anuncio eliminado.');
    } catch (error) {
      console.error('Error eliminando anuncio', error);
      toast.error('No se pudo eliminar el anuncio.');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="destructive">Alta</Badge>;
      case 'MEDIUM':
        return <Badge variant="default" className="bg-amber-500/15 text-amber-700">Media</Badge>;
      case 'LOW':
        return <Badge variant="secondary">Baja</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const activeCount = announcements.filter((announcement) => announcement.active).length;

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <DashboardShell
      title="Gestion de anuncios"
      description="Publica mensajes que se reflejan en todas las sesiones del hospital."
    >
      <section className="rounded-3xl border bg-gradient-to-r from-orange-50 via-white to-red-50 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Anuncios persistidos en Mongo</h2>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo anuncio
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingAnnouncement ? 'Editar anuncio' : 'Publicar anuncio'}</DialogTitle>
                    <DialogDescription>
                      El comunicado quedara disponible para todas las sesiones del hospital.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <FieldGroup className="py-4">
                      <Field>
                        <FieldLabel htmlFor="title">Titulo</FieldLabel>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Titulo del anuncio"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="content">Contenido</FieldLabel>
                        <Textarea
                          id="content"
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          placeholder="Escribe el contenido del anuncio..."
                          rows={6}
                          required
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="priority">Prioridad</FieldLabel>
                          <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value as AnnouncementPriority })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HIGH">Alta</SelectItem>
                              <SelectItem value="MEDIUM">Media</SelectItem>
                              <SelectItem value="LOW">Baja</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="expiresAt">Fecha limite</FieldLabel>
                          <Input
                            id="expiresAt"
                            type="date"
                            value={formData.expiresAt}
                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                          />
                        </Field>
                      </div>
                    </FieldGroup>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : editingAnnouncement ? 'Actualizar' : 'Publicar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <AnnouncementStat title="Total" value={String(announcements.length)} hint="Anuncios en el hospital" />
        <AnnouncementStat title="Activos" value={String(activeCount)} hint="Visibles para los trabajadores" valueClassName="text-emerald-600" />
        <AnnouncementStat title="Ocultos" value={String(announcements.length - activeCount)} hint="Preparados o archivados" />
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Anuncios publicados
          </CardTitle>
          <CardDescription>Gestiona los comunicados del hospital sin depender de mocks locales.</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No hay anuncios</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Publica el primero y quedara disponible al instante para el resto de sesiones.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`rounded-2xl border p-4 transition-all ${announcement.active ? 'bg-background' : 'bg-slate-50 opacity-70'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          announcement.priority === 'HIGH' ? 'bg-red-500' :
                          announcement.priority === 'MEDIUM' ? 'bg-amber-500' :
                          'bg-sky-500'
                        }`} />
                        <h4 className="font-medium">{announcement.title}</h4>
                        {getPriorityBadge(announcement.priority)}
                        {!announcement.active && (
                          <Badge variant="outline" className="gap-1">
                            <EyeOff className="h-3 w-3" />
                            Oculto
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{announcement.content}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Publicado: {new Date(announcement.publishedAt).toLocaleDateString('es-ES')}</span>
                        {announcement.expiresAt && (
                          <span>Expira: {new Date(announcement.expiresAt).toLocaleDateString('es-ES')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{announcement.active ? 'Visible' : 'Oculto'}</span>
                        <Switch
                          checked={announcement.active}
                          onCheckedChange={() => toggleActive(announcement)}
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(announcement)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(announcement)}>
                            {announcement.active ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                            {announcement.active ? 'Ocultar' : 'Mostrar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteAnnouncement(announcement.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function AnnouncementStat({
  title,
  value,
  hint,
  valueClassName,
}: {
  title: string;
  value: string;
  hint: string;
  valueClassName?: string;
}) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName || ''}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
