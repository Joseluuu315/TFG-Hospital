'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, FileText, Clock, Bell, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { payrollsApi, usersApi, hospitalsApi } from '@/lib/api';
import type { CalendarEvent, LeaveRequest, Payroll, Announcement } from '@/lib/api';

// Convertir datos mock al formato esperado
const fallbackAnnouncements: Announcement[] = [
  {
    id: 'seed-1',
    title: 'El sistema se renovó hoy',
    content: 'Tu panel ya recoge datos reales desde nuestra API.',
    priority: 'MEDIUM',
    authorId: '1',
    publishedAt: new Date().toISOString(),
    active: true,
  },
];

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
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
        const calendarRes = await usersApi.getMyCalendar(new Date().toISOString().slice(0, 7));
        const leaveRes = await usersApi.getMyLeaveRequests();
        const payrollRes = await payrollsApi.getMyPayrolls();
        setCalendarEvents(calendarRes.data);
        setLeaveRequests(leaveRes.data);
        setPayrolls(payrollRes.data);
        if (user?.hospitalId) {
          const hospitalRes = await hospitalsApi.getById(String(user.hospitalId));
          setAnnouncements(hospitalRes.data.announcements || fallbackAnnouncements);
        }
      } catch (error) {
        console.log('[averonix] Error cargando datos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [user?.id, user?.hospitalId]);

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'SHIFT':
        return <Badge variant="default" className="bg-blue-500/15 text-blue-600">Turno</Badge>;
      case 'DAY_OFF':
        return <Badge variant="default" className="bg-emerald-500/15 text-emerald-600">Dia Libre</Badge>;
      case 'HOLIDAY':
        return <Badge variant="default" className="bg-amber-500/15 text-amber-600">Festivo</Badge>;
      case 'VACATION':
        return <Badge variant="default" className="bg-purple-500/15 text-purple-600">Vacaciones</Badge>;
      case 'SICK_LEAVE':
        return <Badge variant="destructive">Baja</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="bg-emerald-500/15 text-emerald-600">Aprobada</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const todayEvents = calendarEvents.filter(e => {
    const today = new Date().toISOString().split('T')[0];
    return e.date === today;
  });

  const upcomingEvents = calendarEvents
    .filter(e => new Date(e.date) > new Date())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="md:ml-64 flex-1 flex items-center justify-center">
          <Spinner className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex-1">
        <Header 
          title={`Hola, ${user?.nombre || 'Trabajador'}`}
          description="Tu panel de trabajo personal" 
        />
        
        <main className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Turno Hoy</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {todayEvents.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      {todayEvents[0].startTime} - {todayEvents[0].endTime}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {todayEvents[0].notes}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">Libre</div>
                    <p className="text-xs text-muted-foreground">No tienes turno hoy</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Dias Libres</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">22</div>
                <p className="text-xs text-muted-foreground">
                  Disponibles este ano
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveRequests.filter(r => r.status === 'PENDING').length}</div>
                <p className="text-xs text-muted-foreground">
                  Pendientes de aprobar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ultima Nomina</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {payrolls[0]?.netSalary.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) || '-'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {payrolls[0] ? new Date(payrolls[0].period + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Sin nominas'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Schedule */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Proximos Turnos
                  </CardTitle>
                  <CardDescription>
                    Tu calendario de esta semana
                  </CardDescription>
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
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-[50px]">
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                            </p>
                            <p className="text-lg font-bold">
                              {new Date(event.date).getDate()}
                            </p>
                          </div>
                          <div>
                            {event.startTime && event.endTime ? (
                              <p className="font-medium text-sm">{event.startTime} - {event.endTime}</p>
                            ) : (
                              <p className="font-medium text-sm">Todo el dia</p>
                            )}
                            <p className="text-xs text-muted-foreground">{event.notes}</p>
                          </div>
                        </div>
                        {getEventTypeBadge(event.type)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leave Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Mis Solicitudes
                  </CardTitle>
                  <CardDescription>
                    Estado de tus solicitudes de dias libres
                  </CardDescription>
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
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(request.startDate).toLocaleDateString('es-ES')} - {new Date(request.endDate).toLocaleDateString('es-ES')}
                          </p>
                          <p className="text-xs text-muted-foreground">{request.reason}</p>
                        </div>
                        {getRequestStatusBadge(request.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Anuncios del Hospital
              </CardTitle>
              <CardDescription>
                Comunicados importantes de la direccion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          announcement.priority === 'HIGH' ? 'bg-red-500' :
                          announcement.priority === 'MEDIUM' ? 'bg-amber-500' :
                          'bg-blue-500'
                        }`} />
                        <h4 className="font-medium">{announcement.title}</h4>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(announcement.publishedAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
