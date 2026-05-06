'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { auditLogsApi, type AuditLog } from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import { toast } from 'sonner';

export default function AdminAuditPage() {
  const { user } = useAuth();
  const hospitalId = String(user?.hospitalId ?? '');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const response = await auditLogsApi.getByHospital(hospitalId);
        setLogs(response.data);
      } catch (error) {
        console.error(error);
        toast.error('No se pudo cargar la auditoria');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [hospitalId]);

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <DashboardShell
      title="Auditoria"
      description="Trazabilidad de cambios sensibles sobre turnos, hospitales y nominas"
    >
      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Badge variant="outline">0 registros</Badge>
              <p className="mt-3 text-sm text-muted-foreground">No hay actividad auditada todavia.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{log.entityType}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
                      </div>
                      <Badge variant="outline">{log.action}</Badge>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <p><span className="font-medium">Entidad:</span> <span className="break-all">{log.entityId}</span></p>
                      <p><span className="font-medium">Actor:</span> {log.actorUserId || 'Sistema'}</p>
                      <p className="break-words text-muted-foreground">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[920px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Accion</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>ID entidad</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell className="font-mono text-xs">{log.entityId}</TableCell>
                        <TableCell>{log.actorUserId || 'Sistema'}</TableCell>
                        <TableCell className="max-w-[420px] whitespace-normal break-words">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
