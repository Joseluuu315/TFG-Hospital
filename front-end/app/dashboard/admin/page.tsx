'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Calendar, Bell, Clock, CheckCircle, XCircle } from 'lucide-react';
import { leaveRequestsApi, usersApi, type User, type LeaveRequest } from '@/lib/api';
import { MOCK_WORKERS, MOCK_LEAVE_REQUESTS, MOCK_ANNOUNCEMENTS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDate, getDisplayName, getInitials } from '@/lib/formatters';
import { toast } from 'sonner';

const mockWorkers: User[] = MOCK_WORKERS.map((worker) => ({
  id: String(worker.id),
  firstName: worker.nombre,
  lastName: worker.apellidos,
  email: worker.email,
  role: 'WORKER' as const,
  enabled: worker.activo,
  accountNonLocked: true,
  hospitalId: String(worker.hospitalId),
  department: worker.departamento,
  jobTitle: worker.categoria,
  createdAt: worker.fechaAlta,
  updatedAt: worker.fechaAlta,
}));

const mockLeaveRequests: { user: User; request: LeaveRequest }[] = MOCK_LEAVE_REQUESTS
  .filter((request) => request.estado === 'PENDIENTE')
  .map((request) => ({
    user: mockWorkers.find((worker) => worker.id === String(request.workerId)) || mockWorkers[0],
    request: {
      id: String(request.id),
      startDate: request.fechaInicio,
      endDate: request.fechaFin,
      reason: request.motivo,
      status: 'PENDING' as const,
      requestedAt: request.fechaSolicitud,
    },
  }));

const mockAnnouncements = MOCK_ANNOUNCEMENTS;

const STAT_TONES = {
  emerald: 'bg-emerald-500/15 text-emerald-600',
  blue: 'bg-blue-500/15 text-blue-600',
  amber: 'bg-amber-500/15 text-amber-600',
  violet: 'bg-violet-500/15 text-violet-600',
} as const;

const ANNOUNCEMENT_STYLES = {
  ALTA: { dot: 'bg-red-500', badge: 'border-red-200 text-red-700', label: 'Alta' },
  MEDIA: { dot: 'bg-amber-500', badge: 'border-amber-200 text-amber-700', label: 'Media' },
  BAJA: { dot: 'bg-blue-500', badge: 'border-blue-200 text-blue-700', label: 'Baja' },
} as const;

const formatDateRange = (startDate: string, endDate: string) =>
  `${formatDate(startDate)} - ${formatDate(endDate)}`;

export default function AdminDashboard() {
  const [workers, setWorkers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<
    { user: User; request: LeaveRequest }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, requestsRes] = await Promise.all([
          usersApi.getAll(),
          leaveRequestsApi.getPending(),
        ]);
        setWorkers(workersRes.data.filter((user) => user.role === 'WORKER'));
        setPendingRequests(requestsRes.data);
      } catch {
        console.log('[averonix] Backend no disponible, usando datos de ejemplo');
        setWorkers(mockWorkers);
        setPendingRequests(mockLeaveRequests);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <DashboardLoading />;
  }

  const handleReviewRequest = async (
    userId: string | number | undefined,
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    if (!userId) {
      toast.error('No se pudo identificar al trabajador.');
      return;
    }

    setProcessingRequestId(requestId);
    try {
      await leaveRequestsApi.review(String(userId), requestId, { status });
      setPendingRequests((prev) => prev.filter((item) => item.request.id !== requestId));
      toast.success(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'}`);
    } catch {
      setPendingRequests((prev) => prev.filter((item) => item.request.id !== requestId));
      toast.success(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'} (modo demo)`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const stats = [
    {
      title: 'Trabajadores',
      value: workers.length,
      description: 'Empleados activos',
      icon: Users,
      tone: 'emerald',
    },
    {
      title: 'Nominas Pendientes',
      value: 12,
      description: 'Por emitir este mes',
      icon: FileText,
      tone: 'amber',
    },
    {
      title: 'Solicitudes',
      value: pendingRequests.length,
      description: 'Dias libres pendientes',
      icon: Calendar,
      tone: 'blue',
    },
    {
      title: 'Anuncios Activos',
      value: 3,
      description: 'Publicados',
      icon: Bell,
      tone: 'violet',
    },
  ] as const;

  const recentWorkers = workers.slice(0, 5);

  return (
    <DashboardShell
      title="Panel de Administrador"
      description="Gestiona tu hospital y trabajadores"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${STAT_TONES[stat.tone]}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Solicitudes Pendientes
              </CardTitle>
              <CardDescription>Solicitudes de dias libres por revisar</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/leave-requests">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay solicitudes pendientes
              </p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(({ user, request }) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border bg-background/70 p-4 transition hover:border-muted-foreground/20 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {getInitials(user)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getDisplayName(user)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateRange(request.startDate, request.endDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">{request.reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleReviewRequest(user.id, request.id, 'APPROVED')}
                        disabled={processingRequestId === request.id}
                        aria-label="Aprobar solicitud"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReviewRequest(user.id, request.id, 'REJECTED')}
                        disabled={processingRequestId === request.id}
                        aria-label="Rechazar solicitud"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Trabajadores Recientes
              </CardTitle>
              <CardDescription>Ultimos empleados registrados</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/workers">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentWorkers.map((worker) => {
                const isActive = !!worker.enabled;
                return (
                  <div
                    key={worker.id}
                    className="flex items-center justify-between rounded-lg border bg-background/70 p-3 transition hover:border-muted-foreground/20 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {getInitials(worker)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getDisplayName(worker)}</p>
                        <p className="text-xs text-muted-foreground">
                          {worker.jobTitle} - {worker.department}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className={isActive ? 'bg-emerald-500/15 text-emerald-600' : ''}
                    >
                      {isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Anuncios Activos
            </CardTitle>
            <CardDescription>Comunicados publicados para los trabajadores</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin/announcements">Gestionar</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnnouncements.map((announcement) => {
              const styles =
                ANNOUNCEMENT_STYLES[announcement.prioridad as keyof typeof ANNOUNCEMENT_STYLES]
                ?? ANNOUNCEMENT_STYLES.BAJA;
              return (
                <div
                  key={announcement.id}
                  className="flex items-center justify-between rounded-lg border bg-background/70 p-3 transition hover:border-muted-foreground/20 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${styles.dot}`} />
                    <div>
                      <p className="font-medium text-sm">{announcement.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        Publicado el {formatDate(announcement.fechaPublicacion)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={styles.badge}>
                    {styles.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
