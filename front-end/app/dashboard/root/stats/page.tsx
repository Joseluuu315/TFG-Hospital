'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, FileText, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { adminStatsApi, hospitalsApi, type GlobalStats, type Hospital } from '@/lib/api';

const REFRESH_INTERVAL_MS = 30000;
const chartConfig = {
  total: { label: 'Importe', color: '#0f766e' },
  count: { label: 'Nominas', color: '#0ea5e9' },
} as const;

export default function RootStatsPage() {
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

      setError(hasError ? 'No se pudieron actualizar todos los indicadores. El panel mantiene los datos disponibles.' : '');
      setIsLoading(false);
    };

    loadData();
    const interval = window.setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const latestPayroll = stats?.payrollsByMonth.at(-1);
  const statusBreakdown = useMemo(
    () => ({
      active: hospitals.filter((hospital) => hospital.status === 'ACTIVE').length,
      pending: hospitals.filter((hospital) => hospital.status === 'PENDING_REVIEW').length,
      suspended: hospitals.filter((hospital) => hospital.status === 'SUSPENDED').length,
    }),
    [hospitals]
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex-1">
        <Header
          title="Estadisticas Globales"
          description="Indicadores consolidados del sistema hospitalario"
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
            <RootStatsSkeleton />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total usuarios"
                  value={stats?.totalUsers ?? 0}
                  description={`${stats?.usersByRole.WORKER ?? 0} trabajadores`}
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                  title="Hospitales activos"
                  value={stats?.activeHospitals ?? statusBreakdown.active}
                  description={`${statusBreakdown.pending} pendientes de revision`}
                  icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                  title="Nominas emitidas"
                  value={latestPayroll?.count ?? 0}
                  description="Ultimo mes disponible"
                  icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                  title="Volumen mensual"
                  value={formatCurrencyCompact(latestPayroll?.total)}
                  description="Importe agregado"
                  icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle>Nominas por mes</CardTitle>
                    <CardDescription>Serie mensual servida por `/admin/stats`</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats?.payrollsByMonth.length ? (
                      <ChartContainer config={chartConfig} className="h-[320px] w-full">
                        <BarChart data={stats.payrollsByMonth}>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => String(value).slice(5)}
                          />
                          <YAxis
                            yAxisId="count"
                            tickLine={false}
                            axisLine={false}
                            width={40}
                          />
                          <YAxis
                            yAxisId="total"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            width={72}
                            tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                formatter={(value, name) => {
                                  if (name === 'total') {
                                    return (
                                      <>
                                        <span className="text-muted-foreground">Importe</span>
                                        <span className="font-medium">{formatCurrencyCompact(Number(value))}</span>
                                      </>
                                    );
                                  }

                                  return (
                                    <>
                                      <span className="text-muted-foreground">Nominas</span>
                                      <span className="font-medium">{Number(value).toLocaleString('es-ES')}</span>
                                    </>
                                  );
                                }}
                              />
                            }
                          />
                          <Bar yAxisId="count" dataKey="count" radius={[8, 8, 0, 0]} fill="var(--color-count)" />
                          <Bar yAxisId="total" dataKey="total" radius={[8, 8, 0, 0]} fill="var(--color-total)" />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <p className="py-10 text-center text-sm text-muted-foreground">No hay meses disponibles.</p>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribucion de roles</CardTitle>
                      <CardDescription>Usuarios agrupados por perfil</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: 'Root', value: stats?.usersByRole.ROOT ?? 0, color: 'bg-slate-900' },
                        { label: 'Administradores', value: stats?.usersByRole.HOSPITAL_ADMIN ?? 0, color: 'bg-cyan-500' },
                        { label: 'Trabajadores', value: stats?.usersByRole.WORKER ?? 0, color: 'bg-emerald-500' },
                      ].map((item) => (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span>{item.label}</span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className={`h-2 rounded-full ${item.color}`}
                              style={{
                                width: `${stats?.totalUsers ? Math.max((item.value / stats.totalUsers) * 100, item.value > 0 ? 6 : 0) : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Estado de hospitales</CardTitle>
                      <CardDescription>Resumen del inventario actual</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: 'Activos', value: statusBreakdown.active, color: '#10b981' },
                        { label: 'Pendientes', value: statusBreakdown.pending, color: '#f59e0b' },
                        { label: 'Suspendidos', value: statusBreakdown.suspended, color: '#ef4444' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-xl border p-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <span className="text-sm font-semibold">{item.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({
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

function RootStatsSkeleton() {
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[320px] w-full rounded-xl" />
          </CardContent>
        </Card>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((__, rowIndex) => (
                  <Skeleton key={rowIndex} className="h-12 w-full rounded-xl" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function formatCurrencyCompact(value?: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}
