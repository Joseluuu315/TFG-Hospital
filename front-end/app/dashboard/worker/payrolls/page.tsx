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
import { advancedPayrollApi, payrollsApi, type Payroll, type PayrollItem } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatMonthYear } from '@/lib/formatters';

export default function WorkerPayrollsPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await payrollsApi.getMyPayrolls();
        setPayrolls(response.data);
      } catch (error) {
        console.error(error);
        toast.error('No se pudieron cargar tus nóminas');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleDownload = async (payroll: Payroll) => {
    try {
      await payrollsApi.downloadPdf(payroll.id);
      toast.success('Descarga iniciada');
      if (payroll.status !== 'ACKNOWLEDGED') {
        setPayrolls((current) => current.map((item) => (item.id === payroll.id ? { ...item, status: 'ACKNOWLEDGED' } : item)));
      }
    } catch (error) {
      console.error(error);
      toast.error('No se pudo descargar la nómina');
    }
  };

  const openPayroll = async (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsDetailOpen(true);
    try {
      const response = await advancedPayrollApi.getItems(payroll.id);
      setPayrollItems(response.data);
    } catch (error) {
      console.error(error);
      setPayrollItems([]);
      toast.error('No se pudieron cargar los conceptos');
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

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <DashboardShell title="Mis nóminas" description="Consulta tu histórico y el detalle de cada concepto">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total neto anual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(payrolls.reduce((total, payroll) => total + payroll.netSalary, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nóminas disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrolls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Última nómina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrolls[0] ? formatCurrency(payrolls[0].netSalary) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de nóminas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
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
                    <TableCell className="font-medium">{formatMonthYear(`${payroll.period}-01`)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payroll.grossSalary)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">-{formatCurrency(payroll.socialSecurityWorker + payroll.incomeTaxWithholding + payroll.otherDeductions)}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">{formatCurrency(payroll.netSalary)}</TableCell>
                    <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void openPayroll(payroll)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void handleDownload(payroll)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalle de nómina {selectedPayroll ? `- ${formatMonthYear(`${selectedPayroll.period}-01`)}` : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Bruto</CardTitle></CardHeader>
                  <CardContent className="text-xl font-semibold">{formatCurrency(selectedPayroll.grossSalary)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Deducciones</CardTitle></CardHeader>
                  <CardContent className="text-xl font-semibold text-destructive">
                    {formatCurrency(selectedPayroll.socialSecurityWorker + selectedPayroll.incomeTaxWithholding + selectedPayroll.otherDeductions)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Neto</CardTitle></CardHeader>
                  <CardContent className="text-xl font-semibold text-emerald-600">{formatCurrency(selectedPayroll.netSalary)}</CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Conceptos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Unitario</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No hay conceptos detallados disponibles.
                          </TableCell>
                        </TableRow>
                      ) : payrollItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitAmount)}</TableCell>
                          <TableCell className={`text-right font-medium ${item.totalAmount >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                            {formatCurrency(item.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
