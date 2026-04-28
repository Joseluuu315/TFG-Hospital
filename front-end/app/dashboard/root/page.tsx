'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  AlertCircle,
  Building2,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react';
import { adminStatsApi, hospitalsApi, type GlobalStats, type Hospital } from '@/lib/api';
import {
  buildRootActivityFeed,
  buildRootAlerts,
  formatRelativeTime,
  sortByNewest,
} from '@/lib/dashboard-insights';

const REFRESH_INTERVAL_MS = 30000;

export default function RootDashboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const [statsResult, hospitalsResult] = await Promise.allSettled([
        adminStatsApi.getGlobalStats(),
        hospitalsApi.getAll(),
      ]);

      if (cancelled) return;

      let hasError = false;

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data);
      } else {
        hasError = true;
      }

      if (hospitalsResult.status === 'fulfilled') {
        setHospitals(hospitalsResult.value.data);
      } else {
        hasError = true;
      }

      setError(hasError ? 'No se pudo completar la carga del resumen global. Se muestran solo los bloques disponibles.' : '');
      setIsLoading(false);
    };

    loadData();
    const interval = window.setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const recentHospitals = useMemo(
    () => sortByNewest(hospitals, (hospital) => hospital.createdAt).slice(0, 5),
    [hospitals]
  );
  const activityItems = useMemo(() => buildRootActivityFeed(hospitals), [hospitals]);
  const alerts = useMemo(() => buildRootAlerts(stats, hospitals), [stats, hospitals]);
  const latestPayroll = stats?.payrollsByMonth.at(-1);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex-1">
        <Header
          title="Panel de Supervision"
          description="Estado operativo global de la red hospitalaria"
        />

        <main className="mx-auto w-full max-w-[1600px] space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {error && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Carga parcial</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <RootDashboardSkeleton />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Hospitales"
                  value={stats?.totalHospitals ?? hospitals.length}
                  description={`${stats?.activeHospitals ?? hospitals.filter((hospital) => hospital.status === 'ACTIVE').length} activos`}
                  icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                />
                <MetricCard
                  title="Usuarios"
                  value={stats?.totalUsers ?? 0}
                  description={`${stats?.usersByRole.WORKER ?? 0} trabajadores`}
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
                <MetricCard
                  title="Nominas emitidas"
                  value={latestPayroll?.count ?? 0}
                  description="Ultimo cierre mensual"
                  icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                />
                <MetricCard
                  title="Volumen mensual"
                  value={formatCurrencyCompact(latestPayroll?.total)}
                  description="Importe agregado"
                  icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Hospitales recientes
                    </CardTitle>
                    <CardDescription>Altas y centros actualizados recientemente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentHospitals.length === 0 ? (
                      <EmptyState text="No hay hospitales disponibles." />
                    ) : (
                      <div className="space-y-4">
                        {recentHospitals.map((hospital) => (
                          <div
                            key={hospital.id}
                            className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
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
                            <div className="flex items-center gap-3">
                              {getStatusBadge(hospital.status)}
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(hospital.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Actividad reciente
                    </CardTitle>
                    <CardDescription>Eventos derivados de hospitales y anuncios publicados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activityItems.length === 0 ? (
                      <EmptyState text="Todavia no hay eventos recientes." />
                    ) : (
                      <div className="space-y-4">
                        {activityItems.map((event) => (
                          <div key={event.id} className="flex items-start gap-3">
                            <div className={`mt-1 h-2 w-2 rounded-full ${resolveToneClass(event.tone)}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{event.title}</p>
                              <p className="truncate text-xs text-muted-foreground">{event.detail}</p>
                            </div>
                            <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                              {formatRelativeTime(event.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                    Alertas operativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.length === 0 ? (
                    <p className="text-sm text-amber-700 dark:text-amber-400">Sin alertas activas.</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
                      {alerts.map((alert) => (
                        <li key={alert.id}>
                          <span className="font-medium">{alert.title}:</span> {alert.detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function RootDashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
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
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <Skeleton key={rowIndex} className="h-16 w-full rounded-xl" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

function getStatusBadge(status: Hospital['status']) {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25">Activo</Badge>;
    case 'SUSPENDED':
      return <Badge variant="destructive">Suspendido</Badge>;
    case 'PENDING_REVIEW':
      return <Badge variant="secondary">Pendiente</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function resolveToneClass(tone: 'info' | 'success' | 'warning' | 'danger') {
  if (tone === 'success') return 'bg-emerald-500';
  if (tone === 'warning') return 'bg-amber-500';
  if (tone === 'danger') return 'bg-red-500';
  return 'bg-blue-500';
}

function formatCurrencyCompact(value?: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}
