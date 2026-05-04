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
import { downloadBlobResponse } from '@/lib/download';
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
        toast.error('No se pudieron cargar tus nominas');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const handleDownload = async (payroll: Payroll) => {
    try {
      const response = await payrollsApi.downloadPdf(payroll.id);
      downloadBlobResponse(response, `nomina-${payroll.period}.pdf`);
      toast.success('PDF descargado');

      if (payroll.status !== 'ACKNOWLEDGED') {
        await payrollsApi.updateStatus(payroll.id, 'ACKNOWLEDGED');
        setPayrolls((current) =>
          current.map((item) => (item.id === payroll.id ? { ...item, status: 'ACKNOWLEDGED' } : item)),
        );
      }
    } catch (error) {
      console.error(error);
      toast.error('No se pudo descargar la nomina');
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

  const totalNet = payrolls.reduce((total, payroll) => total + payroll.netSalary, 0);
  const latestPayroll = payrolls[0];

  return (
    <DashboardShell title="Mis nominas" description="Consulta tu historico y revisa cada concepto con detalle">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total neto anual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalNet)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nominas disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrolls.length}</div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 xl:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ultima nomina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestPayroll ? formatCurrency(latestPayroll.netSalary) : '-'}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {latestPayroll ? formatMonthYear(`${latestPayroll.period}-01`) : 'Sin periodos emitidos'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de nominas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payrolls.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Todavia no tienes nominas disponibles.</p>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {payrolls.map((payroll) => (
                  <div key={payroll.id} className="rounded-xl border bg-background/70 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{formatMonthYear(`${payroll.period}-01`)}</p>
                        <p className="text-xs text-muted-foreground">Resumen del periodo</p>
                      </div>
                      {getStatusBadge(payroll.status)}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Bruto</p>
                        <p className="font-medium">{formatCurrency(payroll.grossSalary)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Neto</p>
                        <p className="font-medium text-emerald-600">{formatCurrency(payroll.netSalary)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Deducciones</p>
                        <p className="font-medium">
                          {formatCurrency(
                            payroll.socialSecurityWorker + payroll.incomeTaxWithholding + payroll.otherDeductions,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => void openPayroll(payroll)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                      </Button>
                      <Button className="flex-1" onClick={() => void handleDownload(payroll)}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
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
                        <TableCell className="text-right whitespace-nowrap">{formatCurrency(payroll.grossSalary)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                          {formatCurrency(
                            payroll.socialSecurityWorker + payroll.incomeTaxWithholding + payroll.otherDeductions,
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-medium text-emerald-600">
                          {formatCurrency(payroll.netSalary)}
                        </TableCell>
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
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="w-[min(96vw,1100px)] max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader>
            <DialogTitle className="px-6 pt-6">
              Detalle de nomina {selectedPayroll ? `- ${formatMonthYear(`${selectedPayroll.period}-01`)}` : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4 overflow-y-auto px-6 pb-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Bruto</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl font-semibold">{formatCurrency(selectedPayroll.grossSalary)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Deducciones</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl font-semibold text-destructive">
                    {formatCurrency(
                      selectedPayroll.socialSecurityWorker
                        + selectedPayroll.incomeTaxWithholding
                        + selectedPayroll.otherDeductions,
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Neto</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl font-semibold text-emerald-600">{formatCurrency(selectedPayroll.netSalary)}</CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Conceptos</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table className="min-w-[760px]">
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
                      ) : (
                        payrollItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="max-w-[420px] whitespace-normal break-words font-medium">
                              {item.description}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">{item.quantity}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.unitAmount)}</TableCell>
                            <TableCell
                              className={`text-right whitespace-nowrap font-medium ${
                                item.totalAmount >= 0 ? 'text-foreground' : 'text-destructive'
                              }`}
                            >
                              {formatCurrency(item.totalAmount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
