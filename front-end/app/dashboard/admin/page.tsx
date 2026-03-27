'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Calendar, Bell, Clock, CheckCircle, XCircle } from 'lucide-react';
import { leaveRequestsApi, usersApi, type User, type LeaveRequest } from '@/lib/api';
import { MOCK_WORKERS, MOCK_LEAVE_REQUESTS, MOCK_ANNOUNCEMENTS } from '@/lib/mock-data';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const mockWorkers: User[] = MOCK_WORKERS.map(w => ({
  id: String(w.id),
  firstName: w.nombre,
  lastName: w.apellidos,
  email: w.email,
  role: 'WORKER' as const,
  enabled: w.activo,
  accountNonLocked: true,
  hospitalId: String(w.hospitalId),
  department: w.departamento,
  jobTitle: w.categoria,
  createdAt: w.fechaAlta,
  updatedAt: w.fechaAlta,
}));

const mockLeaveRequests: { user: User; request: LeaveRequest }[] = MOCK_LEAVE_REQUESTS
  .filter(r => r.estado === 'PENDIENTE')
  .map(r => ({
    user: mockWorkers.find(w => w.id === String(r.workerId)) || mockWorkers[0],
    request: {
      id: String(r.id),
      startDate: r.fechaInicio,
      endDate: r.fechaFin,
      reason: r.motivo,
      status: 'PENDING' as const,
      requestedAt: r.fechaSolicitud,
    },
  }));

const mockAnnouncements = MOCK_ANNOUNCEMENTS;

export default function AdminDashboard() {
  const [workers, setWorkers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ user: User; request: LeaveRequest }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersRes, requestsRes] = await Promise.all([
          usersApi.getAll(),
          leaveRequestsApi.getPending(),
        ]);
        setWorkers(workersRes.data.filter(u => u.role === 'WORKER'));
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
          title="Panel de Administrador" 
          description="Gestiona tu hospital y trabajadores" 
        />
        
        <main className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Trabajadores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Empleados activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Nominas Pendientes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  Por emitir este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  Dias libres pendientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Anuncios Activos</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Publicados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pending Leave Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Solicitudes Pendientes
                  </CardTitle>
                  <CardDescription>
                    Solicitudes de dias libres por revisar
                  </CardDescription>
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
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.startDate).toLocaleDateString('es-ES')} - {new Date(request.endDate).toLocaleDateString('es-ES')}
                            </p>
                            <p className="text-xs text-muted-foreground">{request.reason}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Workers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Trabajadores Recientes
                  </CardTitle>
                  <CardDescription>
                    Ultimos empleados registrados
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/admin/workers">Ver todos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workers.slice(0, 5).map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          {worker.firstName?.[0]}{worker.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{worker.firstName} {worker.lastName}</p>
                          <p className="text-xs text-muted-foreground">
                            {worker.jobTitle} - {worker.department}
                          </p>
                        </div>
                      </div>
                      <Badge variant={worker.enabled ? 'default' : 'secondary'} className={worker.enabled ? 'bg-emerald-500/15 text-emerald-600' : ''}>
                        {worker.enabled ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Announcements Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Anuncios Activos
                </CardTitle>
                <CardDescription>
                  Comunicados publicados para los trabajadores
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/admin/announcements">Gestionar</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        announcement.prioridad === 'ALTA' ? 'bg-red-500' :
                        announcement.prioridad === 'MEDIA' ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{announcement.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          Publicado el {new Date(announcement.fechaPublicacion).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {announcement.prioridad === 'ALTA' ? 'Alta' :
                       announcement.prioridad === 'MEDIA' ? 'Media' : 'Baja'}
                    </Badge>
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
