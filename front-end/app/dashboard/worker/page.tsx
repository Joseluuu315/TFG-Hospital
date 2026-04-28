'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Calendar,
  CalendarDays,
  Clock,
  FileText,
  TriangleAlert,
} from 'lucide-react';
import {
  hospitalsApi,
  payrollsApi,
  schedulingApi,
  usersApi,
  type Announcement,
  type LeaveRequest,
  type LeaveRequestStatus,
  type Payroll,
  type ShiftAssignment,
} from '@/lib/api';
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  formatWeekday,
  getDisplayName,
} from '@/lib/formatters';
import {
  countApprovedLeaveDays,
  getActiveAnnouncements,
  getTodayShifts,
  getUpcomingShifts,
} from '@/lib/dashboard-insights';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const REFRESH_INTERVAL_MS = 20000;

const REQUEST_BADGES: Record<
  LeaveRequestStatus,
  { label: string; variant?: BadgeVariant; className?: string }
> = {
  PENDING: { label: 'Pendiente', variant: 'secondary' },
  APPROVED: { label: 'Aprobada', variant: 'default', className: 'bg-emerald-500/15 text-emerald-600' },
  REJECTED: { label: 'Rechazada', variant: 'destructive' },
};

const ANNOUNCEMENT_STYLES = {
  HIGH: { dot: 'bg-red-500', badge: 'border-red-200 text-red-700', label: 'Alta' },
  MEDIUM: { dot: 'bg-amber-500', badge: 'border-amber-200 text-amber-700', label: 'Media' },
  LOW: { dot: 'bg-blue-500', badge: 'border-blue-200 text-blue-700', label: 'Baja' },
} as const;

const STAT_TONES = {
  blue: 'bg-blue-500/15 text-blue-600',
  emerald: 'bg-emerald-500/15 text-emerald-600',
  amber: 'bg-amber-500/15 text-amber-600',
  violet: 'bg-violet-500/15 text-violet-600',
} as const;

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const loadData = async () => {
      const [shiftsResult, leaveResult, payrollsResult, hospitalResult] = await Promise.allSettled([
        schedulingApi.getMyShifts(),
        usersApi.getMyLeaveRequests(),
        payrollsApi.getMyPayrolls(),
        user.hospitalId ? hospitalsApi.getById(String(user.hospitalId)) : Promise.resolve({ data: { announcements: [] } }),
      ]);

      if (cancelled) return;

      let hasError = false;

      if (shiftsResult.status === 'fulfilled') {
        setShifts(shiftsResult.value.data);
      } else {
        hasError = true;
      }

      if (leaveResult.status === 'fulfilled') {
        setLeaveRequests(leaveResult.value.data);
      } else {
        hasError = true;
      }

      if (payrollsResult.status === 'fulfilled') {
        setPayrolls(payrollsResult.value.data);
      } else {
        hasError = true;
      }

      if (hospitalResult.status === 'fulfilled') {
        setAnnouncements(getActiveAnnouncements(hospitalResult.value.data.announcements || []));
      } else {
        hasError = true;
      }

      setError(hasError ? 'No se pudieron actualizar todos los datos del panel. Se mantienen los bloques disponibles.' : '');
      setIsLoading(false);
    };

    loadData();
    const interval = window.setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user?.id, user?.hospitalId]);

  const todayEvents = useMemo(() => getTodayShifts(shifts), [shifts]);
  const upcomingEvents = useMemo(() => getUpcomingShifts(shifts), [shifts]);
  const pendingLeaveCount = leaveRequests.filter((request) => request.status === 'PENDING').length;
  const approvedLeaveDays = countApprovedLeaveDays(leaveRequests);
  const lastPayroll = payrolls[0];

  if (!user?.id && isLoading) {
    return <DashboardLoading label="Cargando panel..." />;
  }

  const stats = [
    {
      title: 'Turno de hoy',
      icon: Clock,
      tone: 'blue',
      content:
        todayEvents.length > 0 ? (
          <>
            <div className="text-2xl font-bold">
              {formatTimeRange(todayEvents[0].startAt, todayEvents[0].endAt)}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayEvents[0].department} - {todayEvents[0].shiftTypeCode}
            </p>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">Libre</div>
            <p className="text-xs text-muted-foreground">No tienes turno asignado hoy</p>
          </>
        ),
    },
    {
      title: 'Dias aprobados',
      icon: Calendar,
      tone: 'emerald',
      content: (
        <>
          <div className="text-2xl font-bold">{approvedLeaveDays}</div>
          <p className="text-xs text-muted-foreground">Acumulados en tus solicitudes aprobadas</p>
        </>
      ),
    },
    {
      title: 'Solicitudes',
      icon: CalendarDays,
      tone: 'amber',
      content: (
        <>
          <div className="text-2xl font-bold">{pendingLeaveCount}</div>
          <p className="text-xs text-muted-foreground">Pendientes de respuesta</p>
        </>
      ),
    },
    {
      title: 'Ultima nomina',
      icon: FileText,
      tone: 'violet',
      content: (
        <>
          <div className="text-2xl font-bold">{formatCurrency(lastPayroll?.netSalary)}</div>
          <p className="text-xs text-muted-foreground">
            {lastPayroll ? formatMonthYear(`${lastPayroll.period}-01`) : 'Sin nominas emitidas'}
          </p>
        </>
      ),
    },
  ] as const;

  return (
    <DashboardShell
      title={`Hola, ${getDisplayName(user) || 'Trabajador'}`}
      description="Resumen personal de turnos, solicitudes y comunicados"
    >
      {error && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Carga parcial</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <WorkerDashboardSkeleton />
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
                  <CardContent>{stat.content}</CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Proximos turnos
                  </CardTitle>
                  <CardDescription>Secuencia real de turnos pendientes</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/worker/calendar">Ver calendario</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <EmptyState text="No hay turnos proximos." />
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => {
                      const eventDate = new Date(event.startAt);
                      return (
                        <div
                          key={event.id}
                          className="flex flex-col gap-3 rounded-lg border bg-background/70 p-3 transition hover:border-muted-foreground/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="min-w-[50px] text-center">
                              <p className="text-xs text-muted-foreground">{formatWeekday(eventDate)}</p>
                              <p className="text-lg font-bold">{eventDate.getDate()}</p>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{formatTimeRange(event.startAt, event.endAt)}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.department} - {event.shiftTypeCode}
                              </p>
                            </div>
                          </div>
                          <div className="self-start sm:self-auto">
                            {renderBadge({
                              label: event.shiftTypeCode,
                              variant: 'outline',
                              className: 'bg-blue-500/15 text-blue-600',
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Mis solicitudes
                  </CardTitle>
                  <CardDescription>Estado actualizado de tus peticiones</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/worker/leave-requests">Gestionar</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {leaveRequests.length === 0 ? (
                  <EmptyState text="No tienes solicitudes registradas." />
                ) : (
                  <div className="space-y-3">
                    {leaveRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-col gap-3 rounded-lg border bg-background/70 p-3 transition hover:border-muted-foreground/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                          </p>
                          <p className="text-xs text-muted-foreground">{request.reason}</p>
                        </div>
                        <div className="self-start sm:self-auto">
                          {renderBadge(REQUEST_BADGES[request.status])}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card id="announcements">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Anuncios del hospital
              </CardTitle>
              <CardDescription>Comunicados activos publicados desde administracion</CardDescription>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <EmptyState text="No hay anuncios activos ahora mismo." />
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => {
                    const styles =
                      ANNOUNCEMENT_STYLES[announcement.priority as keyof typeof ANNOUNCEMENT_STYLES]
                      ?? ANNOUNCEMENT_STYLES.LOW;
                    return (
                      <div
                        key={announcement.id}
                        className="rounded-lg border bg-background/70 p-4 transition hover:border-muted-foreground/20 hover:shadow-sm"
                      >
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${styles.dot}`} />
                            <h4 className="font-medium">{announcement.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={styles.badge}>
                              {styles.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(announcement.publishedAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{announcement.content}</p>
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

function renderBadge(config: { label: string; variant?: BadgeVariant; className?: string }) {
  return (
    <Badge variant={config.variant ?? 'outline'} className={config.className}>
      {config.label}
    </Badge>
  );
}

function WorkerDashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-36" />
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

function formatTimeRange(startAt: string, endAt: string) {
  return `${new Date(startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${new Date(endAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
}
