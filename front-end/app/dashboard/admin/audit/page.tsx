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
        toast.error('No se pudo cargar la auditoría');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [hospitalId]);

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <DashboardShell
      title="Auditoría"
      description="Trazabilidad de cambios sensibles sobre turnos, hospitales y nóminas"
    >
      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>ID entidad</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay actividad auditada todavía.
                    </TableCell>
                  </TableRow>
                ) : logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell className="font-mono text-xs">{log.entityId}</TableCell>
                    <TableCell>{log.actorUserId || 'Sistema'}</TableCell>
                    <TableCell className="max-w-[420px] truncate">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
