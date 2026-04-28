'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, FileText, Clock, Bell, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  payrollsApi,
  schedulingApi,
  usersApi,
  hospitalsApi,
  type LeaveRequest,
  type Payroll,
  type Announcement,
  type LeaveRequestStatus,
  type ShiftAssignment,
} from '@/lib/api';
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  formatWeekday,
  getDisplayName,
} from '@/lib/formatters';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const fallbackAnnouncements: Announcement[] = [
  {
    id: 'seed-1',
    title: 'El sistema se renovo hoy',
    content: 'Tu panel ya recoge datos reales desde nuestra API.',
    priority: 'MEDIUM',
    authorId: '1',
    publishedAt: new Date().toISOString(),
    active: true,
  },
];

const STAT_TONES = {
  blue: 'bg-blue-500/15 text-blue-600',
  emerald: 'bg-emerald-500/15 text-emerald-600',
  amber: 'bg-amber-500/15 text-amber-600',
  violet: 'bg-violet-500/15 text-violet-600',
} as const;

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

const renderBadge = (config: { label: string; variant?: BadgeVariant; className?: string }) => (
  <Badge variant={config.variant ?? 'outline'} className={config.className}>
    {config.label}
  </Badge>
);

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(fallbackAnnouncements);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setAnnouncements(fallbackAnnouncements);
    setIsLoading(true);

    const loadData = async () => {
      try {
        const shiftsRes = await schedulingApi.getMyShifts();
        const leaveRes = await usersApi.getMyLeaveRequests();
        const payrollRes = await payrollsApi.getMyPayrolls();
        setShifts(shiftsRes.data);
        setLeaveRequests(leaveRes.data);
        setPayrolls(payrollRes.data);
        if (user?.hospitalId) {
          const hospitalRes = await hospitalsApi.getById(String(user.hospitalId));
          setAnnouncements(hospitalRes.data.announcements || fallbackAnnouncements);
        }
      } catch (error) {
        console.error('Error cargando datos del panel del trabajador:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [user?.id, user?.hospitalId]);

  if (isLoading) {
    return <DashboardLoading />;
  }

  const todayIso = new Date().toISOString().split('T')[0];
  const now = new Date();
  const todayEvents = shifts.filter((shift) => shift.startAt.startsWith(todayIso));
  const upcomingEvents = shifts
    .filter((shift) => new Date(shift.startAt) > now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 5);

  const pendingLeaveCount = leaveRequests.filter((request) => request.status === 'PENDING').length;
  const lastPayroll = payrolls[0];

  const stats = [
    {
      title: 'Turno Hoy',
      icon: Clock,
      tone: 'blue',
      content:
        todayEvents.length > 0 ? (
          <>
            <div className="text-2xl font-bold">
              {new Date(todayEvents[0].startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(todayEvents[0].endAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <p className="text-xs text-muted-foreground">{todayEvents[0].department} · {todayEvents[0].shiftTypeCode}</p>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">Libre</div>
            <p className="text-xs text-muted-foreground">No tienes turno hoy</p>
          </>
        ),
    },
    {
      title: 'Dias Libres',
      icon: Calendar,
      tone: 'emerald',
      content: (
        <>
          <div className="text-2xl font-bold">22</div>
          <p className="text-xs text-muted-foreground">Disponibles este ano</p>
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
          <p className="text-xs text-muted-foreground">Pendientes de aprobar</p>
        </>
      ),
    },
    {
      title: 'Ultima Nomina',
      icon: FileText,
      tone: 'violet',
      content: (
        <>
          <div className="text-2xl font-bold">
            {formatCurrency(lastPayroll?.netSalary)}
          </div>
          <p className="text-xs text-muted-foreground">
            {lastPayroll ? formatMonthYear(`${lastPayroll.period}-01`) : 'Sin nominas'}
          </p>
        </>
      ),
    },
  ] as const;

  return (
    <DashboardShell
      title={`Hola, ${getDisplayName(user) || 'Trabajador'}`}
      description="Tu panel de trabajo personal"
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
                Proximos Turnos
              </CardTitle>
              <CardDescription>Tu calendario de esta semana</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/worker/calendar">Ver calendario</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay eventos proximos
              </p>
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
                        <div className="text-center min-w-[50px]">
                          <p className="text-xs text-muted-foreground">
                            {formatWeekday(eventDate)}
                          </p>
                          <p className="text-lg font-bold">{eventDate.getDate()}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(event.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-muted-foreground">{event.department} · {event.shiftTypeCode}</p>
                        </div>
                      </div>
                      <div className="self-start sm:self-auto">
                        {renderBadge({ label: event.shiftTypeCode, variant: 'outline', className: 'bg-blue-500/15 text-blue-600' })}
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
                Mis Solicitudes
              </CardTitle>
              <CardDescription>Estado de tus solicitudes de dias libres</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/worker/leave-requests">Solicitar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tienes solicitudes activas
              </p>
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
            Anuncios del Hospital
          </CardTitle>
          <CardDescription>Comunicados importantes de la direccion</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <div className="flex items-start justify-between gap-4 mb-2">
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
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
