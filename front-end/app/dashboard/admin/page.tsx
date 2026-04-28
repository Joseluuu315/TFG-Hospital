'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Calendar,
  Clock,
  FileText,
  TriangleAlert,
  Users,
} from 'lucide-react';
import {
  hospitalsApi,
  leaveRequestsApi,
  payrollsApi,
  usersApi,
  type Announcement,
  type Hospital,
  type LeaveRequest,
  type Payroll,
  type User,
} from '@/lib/api';
import { formatDate, getDisplayName, getInitials } from '@/lib/formatters';
import { getActiveAnnouncements, getRecentWorkers } from '@/lib/dashboard-insights';
import { toast } from 'sonner';

const REFRESH_INTERVAL_MS = 20000;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ user: User; request: LeaveRequest }[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.hospitalId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      const [workersResult, requestsResult, payrollsResult, hospitalResult] = await Promise.allSettled([
        usersApi.getAll(),
        leaveRequestsApi.getPending(),
        payrollsApi.getAll(),
        hospitalsApi.getById(String(user.hospitalId)),
      ]);

      if (cancelled) return;

      let hasError = false;

      if (workersResult.status === 'fulfilled') {
        setWorkers(
          workersResult.value.data.filter(
            (candidate) => candidate.role === 'WORKER' && String(candidate.hospitalId) === String(user.hospitalId)
          )
        );
      } else {
        hasError = true;
      }

      if (requestsResult.status === 'fulfilled') {
        setPendingRequests(
          requestsResult.value.data.filter(
            ({ user: requestUser }) => String(requestUser.hospitalId) === String(user.hospitalId)
          )
        );
      } else {
        hasError = true;
      }

      if (payrollsResult.status === 'fulfilled') {
        setPayrolls(
          payrollsResult.value.data.filter((payroll) => String(payroll.hospitalId) === String(user.hospitalId))
        );
      } else {
        hasError = true;
      }

      if (hospitalResult.status === 'fulfilled') {
        setAnnouncements(getActiveAnnouncements(hospitalResult.value.data.announcements || []));
      } else {
        hasError = true;
      }

      setError(hasError ? 'No se pudieron refrescar todos los bloques del panel. Se muestran los datos disponibles.' : '');
      setIsLoading(false);
    };

    loadData();
    const interval = window.setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user?.hospitalId]);

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
      setPendingRequests((current) => current.filter((item) => item.request.id !== requestId));
      toast.success(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'}.`);
    } catch {
      toast.error('No se pudo actualizar la solicitud.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const recentWorkers = useMemo(() => getRecentWorkers(workers), [workers]);
  const openPayrolls = payrolls.filter((payroll) => payroll.status !== 'ACKNOWLEDGED').length;
  const activeWorkers = workers.filter((worker) => worker.enabled !== false).length;

  const stats = [
    {
      title: 'Trabajadores',
      value: workers.length,
      description: `${activeWorkers} activos`,
      icon: Users,
      tone: 'emerald',
    },
    {
      title: 'Nominas abiertas',
      value: openPayrolls,
      description: 'Pendientes de cierre o validacion',
      icon: FileText,
      tone: 'amber',
    },
    {
      title: 'Solicitudes pendientes',
      value: pendingRequests.length,
      description: 'Dias libres por revisar',
      icon: Calendar,
      tone: 'blue',
    },
    {
      title: 'Anuncios activos',
      value: announcements.length,
      description: 'Publicados para el hospital',
      icon: Bell,
      tone: 'violet',
    },
  ] as const;

  return (
    <DashboardShell
      title="Panel de Administracion"
      description="Operacion diaria del hospital y su equipo"
    >
      {error && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Carga parcial</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <AdminDashboardSkeleton />
      ) : (
        <>
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
                    Solicitudes pendientes
                  </CardTitle>
                  <CardDescription>Peticiones reales pendientes de resolucion</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/admin/leave-requests">Ver todas</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <EmptyState text="No hay solicitudes pendientes." />
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map(({ user: requestUser, request }) => (
                      <div
                        key={request.id}
                        className="flex flex-col gap-4 rounded-lg border bg-background/70 p-4 transition hover:border-muted-foreground/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                            {getInitials(requestUser)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{getDisplayName(requestUser)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">{request.reason}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 self-start sm:self-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewRequest(requestUser.id, request.id, 'APPROVED')}
                            disabled={processingRequestId === request.id}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleReviewRequest(requestUser.id, request.id, 'REJECTED')}
                            disabled={processingRequestId === request.id}
                          >
                            Rechazar
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
                    Altas recientes
                  </CardTitle>
                  <CardDescription>Trabajadores incorporados o actualizados recientemente</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/admin/workers">Ver todos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentWorkers.length === 0 ? (
                  <EmptyState text="No hay trabajadores disponibles." />
                ) : (
                  <div className="space-y-4">
                    {recentWorkers.map((worker) => {
                      const isActive = worker.enabled !== false;
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
                                {worker.jobTitle || 'Sin puesto'} - {worker.department || 'Sin departamento'}
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
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Anuncios activos
                </CardTitle>
                <CardDescription>Comunicados publicados desde el backend del hospital</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/admin/announcements">Gestionar</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <EmptyState text="No hay anuncios activos." />
              ) : (
                <div className="space-y-4">
                  {announcements.slice(0, 5).map((announcement) => {
                    const styles =
                      ANNOUNCEMENT_STYLES[announcement.priority] ?? ANNOUNCEMENT_STYLES.LOW;
                    return (
                      <div
                        key={announcement.id}
                        className="flex items-center justify-between rounded-lg border bg-background/70 p-3 transition hover:border-muted-foreground/20 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${styles.dot}`} />
                          <div>
                            <p className="font-medium text-sm">{announcement.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Publicado el {formatDate(announcement.publishedAt)}
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardShell>
  );
}

function AdminDashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-44" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <Skeleton key={rowIndex} className="h-16 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

const STAT_TONES = {
  emerald: 'bg-emerald-500/15 text-emerald-600',
  blue: 'bg-blue-500/15 text-blue-600',
  amber: 'bg-amber-500/15 text-amber-600',
  violet: 'bg-violet-500/15 text-violet-600',
} as const;

const ANNOUNCEMENT_STYLES = {
  HIGH: { dot: 'bg-red-500', badge: 'border-red-200 text-red-700', label: 'Alta' },
  MEDIUM: { dot: 'bg-amber-500', badge: 'border-amber-200 text-amber-700', label: 'Media' },
  LOW: { dot: 'bg-blue-500', badge: 'border-blue-200 text-blue-700', label: 'Baja' },
} as const;
