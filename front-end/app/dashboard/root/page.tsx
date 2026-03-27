'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { adminStatsApi, hospitalsApi, type GlobalStats, type Hospital } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

const fallbackStats: GlobalStats = {
  totalHospitals: 12,
  activeHospitals: 10,
  suspendedHospitals: 2,
  totalUsers: 842,
  usersByRole: {
    ROOT: 1,
    HOSPITAL_ADMIN: 11,
    WORKER: 830,
  },
  payrollsByMonth: [
    { month: '2026-01', count: 780, total: 1850000 },
    { month: '2026-02', count: 792, total: 1890000 },
    { month: '2026-03', count: 805, total: 1940000 },
  ],
};

const fallbackHospitals: Hospital[] = [
  {
    id: '1',
    name: 'Hospital Reina Sofia',
    address: 'Av. de la Salud, 123',
    city: 'Cordoba',
    province: 'Cordoba',
    taxId: 'B12345678',
    status: 'ACTIVE',
    announcements: [],
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2025-12-01T12:00:00Z',
  },
  {
    id: '2',
    name: 'Hospital Regional Sur',
    address: 'Calle de la Salud, 45',
    city: 'Sevilla',
    province: 'Sevilla',
    taxId: 'B87654321',
    status: 'PENDING_REVIEW',
    announcements: [],
    createdAt: '2025-08-02T08:30:00Z',
    updatedAt: '2026-01-10T09:45:00Z',
  },
];

export default function RootDashboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Intentar cargar datos reales
        const [statsRes, hospitalsRes] = await Promise.all([
          adminStatsApi.getGlobalStats(),
          hospitalsApi.getAll(),
        ]);
        setStats(statsRes.data);
        setHospitals(hospitalsRes.data);
      } catch {
        // Usar datos mock si el backend no esta disponible
        console.log('[averonix] Backend no disponible, usando datos de ejemplo');
        setStats(fallbackStats);
        setHospitals(fallbackHospitals);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25">Activo</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspendido</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="secondary">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
          title="Panel de Super Admin" 
          description="Vision global del sistema hospitalario" 
        />
        
        <main className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Hospitales</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalHospitals}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeHospitals} activos, {stats?.suspendedHospitals} suspendidos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.usersByRole.WORKER} trabajadores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Nominas Emitidas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.payrollsByMonth[stats.payrollsByMonth.length - 1]?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Volumen Mensual</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
                    stats?.payrollsByMonth[stats.payrollsByMonth.length - 1]?.total || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total en nominas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Hospitals */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Hospitals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Hospitales Recientes
                </CardTitle>
                <CardDescription>
                  Ultimos hospitales registrados en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hospitals.slice(0, 5).map((hospital) => (
                    <div
                      key={hospital.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{hospital.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {hospital.city}, {hospital.province}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(hospital.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actividad del Sistema
                </CardTitle>
                <CardDescription>
                  Eventos recientes en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'Nuevo hospital registrado', detail: 'Hospital Regional Sur', time: 'Hace 2 horas', type: 'info' },
                    { action: 'Nominas emitidas', detail: 'Hospital Central - 45 nominas', time: 'Hace 4 horas', type: 'success' },
                    { action: 'Solicitud pendiente', detail: '3 solicitudes de dias libres', time: 'Hace 6 horas', type: 'warning' },
                    { action: 'Hospital suspendido', detail: 'Clinica Norte por impago', time: 'Hace 1 dia', type: 'error' },
                    { action: 'Nuevo admin asignado', detail: 'Clinica San Rafael', time: 'Hace 2 dias', type: 'info' },
                  ].map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`mt-1 h-2 w-2 rounded-full ${
                        event.type === 'success' ? 'bg-emerald-500' :
                        event.type === 'warning' ? 'bg-amber-500' :
                        event.type === 'error' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{event.detail}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{event.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                Alertas del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
                <li>• 2 hospitales requieren revision de documentacion</li>
                <li>• 1 hospital tiene pagos pendientes hace mas de 30 dias</li>
                <li>• 5 trabajadores sin asignar turno para el proximo mes</li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
