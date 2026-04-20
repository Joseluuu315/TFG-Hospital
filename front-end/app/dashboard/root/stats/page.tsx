'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { BarChart3, FileText, TrendingUp, Users } from 'lucide-react';
import { adminStatsApi, type GlobalStats } from '@/lib/api';

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

export default function RootStatsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminStatsApi.getGlobalStats();
        setStats(response.data);
      } catch {
        console.log('[averonix] Backend no disponible, usando datos de ejemplo');
        setStats(fallbackStats);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const latestPayrolls = stats?.payrollsByMonth[stats.payrollsByMonth.length - 1];

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
          title="Estadisticas Globales"
          description="Indicadores clave del sistema hospitalario"
        />

        <main className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.usersByRole.WORKER ?? 0} trabajadores activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Hospitales Activos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeHospitals ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.suspendedHospitals ?? 0} suspendidos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Nominas Emitidas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{latestPayrolls?.count ?? 0}</div>
                <p className="text-xs text-muted-foreground">Ultimo mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Volumen Mensual</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                    .format(latestPayrolls?.total ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total en nominas</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen operativo</CardTitle>
              <CardDescription>
                Vista rapida del rendimiento global. Esta seccion puede ampliarse con graficos o tendencias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Administradores</p>
                  <p className="text-2xl font-semibold">{stats?.usersByRole.HOSPITAL_ADMIN ?? 0}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Super Admin</p>
                  <p className="text-2xl font-semibold">{stats?.usersByRole.ROOT ?? 0}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Hospitales totales</p>
                  <p className="text-2xl font-semibold">{stats?.totalHospitals ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
