'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { payrollsApi, type Payroll } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatMonthYear } from '@/lib/formatters';

const mockPayrolls: Payroll[] = [
  { id: '1', workerId: '1', workerFullName: 'Maria Garcia', hospitalId: '1', period: '2025-06', grossSalary: 2500, socialSecurityWorker: 158.75, incomeTaxWithholding: 375, otherDeductions: 0, netSalary: 1966.25, overtimeAmount: 0, bonusAmount: 0, status: 'ISSUED', issuedAt: '2025-06-25T10:00:00' },
  { id: '2', workerId: '1', workerFullName: 'Maria Garcia', hospitalId: '1', period: '2025-05', grossSalary: 2500, socialSecurityWorker: 158.75, incomeTaxWithholding: 375, otherDeductions: 0, netSalary: 1966.25, overtimeAmount: 100, bonusAmount: 0, status: 'ACKNOWLEDGED', acknowledgedAt: '2025-05-26T14:30:00', issuedAt: '2025-05-25T10:00:00' },
  { id: '3', workerId: '1', workerFullName: 'Maria Garcia', hospitalId: '1', period: '2025-04', grossSalary: 2500, socialSecurityWorker: 158.75, incomeTaxWithholding: 375, otherDeductions: 50, netSalary: 1916.25, overtimeAmount: 0, bonusAmount: 0, status: 'ACKNOWLEDGED', acknowledgedAt: '2025-04-26T11:00:00', issuedAt: '2025-04-25T10:00:00' },
  { id: '4', workerId: '1', workerFullName: 'Maria Garcia', hospitalId: '1', period: '2025-03', grossSalary: 2500, socialSecurityWorker: 158.75, incomeTaxWithholding: 375, otherDeductions: 0, netSalary: 1966.25, overtimeAmount: 0, bonusAmount: 200, status: 'ACKNOWLEDGED', acknowledgedAt: '2025-03-26T09:00:00', issuedAt: '2025-03-25T10:00:00' },
];

export default function WorkerPayrollsPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const response = await payrollsApi.getMyPayrolls();
      setPayrolls(response.data);
    } catch {
      console.log('[averonix] Backend no disponible, usando datos de ejemplo');
      setPayrolls(mockPayrolls);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (payroll: Payroll) => {
    try {
      await payrollsApi.downloadPdf(payroll.id);
      toast.success('Nomina descargada correctamente');
      // Actualizar estado a ACKNOWLEDGED si no lo estaba
      if (payroll.status !== 'ACKNOWLEDGED') {
        setPayrolls(payrolls.map(p => 
          p.id === payroll.id ? { ...p, status: 'ACKNOWLEDGED' } : p
        ));
      }
    } catch {
      // Mock para prototipo
      toast.success('Nomina descargada correctamente (modo demo)');
      if (payroll.status !== 'ACKNOWLEDGED') {
        setPayrolls(payrolls.map(p => 
          p.id === payroll.id ? { ...p, status: 'ACKNOWLEDGED' } : p
        ));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return <Badge variant="default" className="bg-blue-500/15 text-blue-600">Nueva</Badge>;
      case 'ACKNOWLEDGED':
        return <Badge variant="default" className="bg-emerald-500/15 text-emerald-600">Vista</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalNetYear = payrolls.reduce((acc, p) => acc + p.netSalary, 0);

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <DashboardShell
      title="Mis Nominas"
      description="Consulta y descarga tus nominas mensuales"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Neto Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalNetYear)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nominas Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrolls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ultima Nomina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(payrolls[0]?.netSalary)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Nominas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Deducciones</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">
                      {formatMonthYear(`${payroll.period}-01`)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payroll.grossSalary + payroll.overtimeAmount + payroll.bonusAmount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      -{formatCurrency(payroll.socialSecurityWorker + payroll.incomeTaxWithholding + payroll.otherDeductions)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {formatCurrency(payroll.netSalary)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedPayroll(payroll);
                            setIsDetailOpen(true);
                          }}
                          aria-label="Ver detalle de nomina"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(payroll)}
                          aria-label="Descargar nomina"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {payrolls.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No hay nominas disponibles</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tus nominas apareceran aqui cuando sean emitidas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Detalle de Nomina - {selectedPayroll && formatMonthYear(`${selectedPayroll.period}-01`)}
            </DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">Devengos</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Salario Base</span>
                    <span>{formatCurrency(selectedPayroll.grossSalary)}</span>
                  </div>
                  {selectedPayroll.overtimeAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Horas Extra</span>
                      <span>{formatCurrency(selectedPayroll.overtimeAmount)}</span>
                    </div>
                  )}
                  {selectedPayroll.bonusAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Bonus</span>
                      <span>{formatCurrency(selectedPayroll.bonusAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total Bruto</span>
                    <span>
                      {formatCurrency(
                        selectedPayroll.grossSalary
                          + selectedPayroll.overtimeAmount
                          + selectedPayroll.bonusAmount,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">Deducciones</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Seguridad Social (6.35%)</span>
                    <span>-{formatCurrency(selectedPayroll.socialSecurityWorker)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>IRPF (15%)</span>
                    <span>-{formatCurrency(selectedPayroll.incomeTaxWithholding)}</span>
                  </div>
                  {selectedPayroll.otherDeductions > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Otras Deducciones</span>
                      <span>-{formatCurrency(selectedPayroll.otherDeductions)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-2 border-t text-destructive">
                    <span>Total Deducciones</span>
                    <span>
                      -{formatCurrency(
                        selectedPayroll.socialSecurityWorker
                          + selectedPayroll.incomeTaxWithholding
                          + selectedPayroll.otherDeductions,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Salario Neto</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(selectedPayroll.netSalary)}
                  </span>
                </div>
              </div>

              <Button className="w-full" onClick={() => handleDownload(selectedPayroll)}>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
