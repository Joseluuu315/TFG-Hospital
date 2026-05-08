'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Eye, Calculator, Calendar, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
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
        toast.error('No se pudieron cargar tus nóminas');
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
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none">Nueva</Badge>;
      case 'ACKNOWLEDGED':
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none">Vista</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) return <DashboardLoading />;

  const totalNet = payrolls.reduce((total, payroll) => total + payroll.netSalary, 0);
  const latestPayroll = payrolls[0];

  return (
      <DashboardShell
          title="Mis nóminas"
          description="Histórico de retribuciones y desglose detallado"
          className="max-w-none w-full px-4 md:px-6 lg:px-8"
      >
        <div className="space-y-6">
          {/* Estadísticas - Grid Adaptativo */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card className="border-none shadow-sm bg-background/60 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Total Anual (Neto)</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-emerald-600">{formatCurrency(totalNet)}</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-background/60 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Documentos</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{payrolls.length} nóminas</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-background/60 backdrop-blur sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Último Periodo</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="flex items-baseline gap-3">
                <div className="text-2xl font-bold tracking-tight">
                  {latestPayroll ? formatCurrency(latestPayroll.netSalary) : '—'}
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                {latestPayroll ? formatMonthYear(`${latestPayroll.period}-01`) : ''}
              </span>
              </CardContent>
            </Card>
          </div>

          {/* Listado Principal */}
          <Card className="border-none shadow-md overflow-hidden bg-background">
            <CardHeader className="border-b bg-muted/20 px-4 md:px-6 py-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Historial de pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payrolls.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">No hay registros disponibles.</div>
              ) : (
                  <>
                    {/* Vista Móvil/Tablet pequeña: Lista de Cards */}
                    <div className="grid grid-cols-1 md:hidden divide-y divide-border">
                      {payrolls.map((payroll) => (
                          <div
                              key={payroll.id}
                              className="p-4 active:bg-muted/50 transition-colors flex flex-col gap-3"
                              onClick={() => void openPayroll(payroll)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-base">{formatMonthYear(`${payroll.period}-01`)}</p>
                                <p className="text-xs text-muted-foreground">Neto: <span className="text-emerald-600 font-bold">{formatCurrency(payroll.netSalary)}</span></p>
                              </div>
                              {getStatusBadge(payroll.status)}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); void openPayroll(payroll); }}>
                                <Eye className="h-3.5 w-3.5 mr-1" /> Detalles
                              </Button>
                              <Button size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); void handleDownload(payroll); }}>
                                <Download className="h-3.5 w-3.5 mr-1" /> PDF
                              </Button>
                            </div>
                          </div>
                      ))}
                    </div>

                    {/* Vista Tablet/PC: Tabla Progresiva */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="pl-6">Periodo</TableHead>
                            <TableHead className="text-right">Bruto</TableHead>
                            <TableHead className="text-right hidden lg:table-cell">Deducciones</TableHead>
                            <TableHead className="text-right">Neto</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="pr-6 text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payrolls.map((payroll) => (
                              <TableRow key={payroll.id} className="group hover:bg-muted/20">
                                <TableCell className="pl-6 font-semibold">{formatMonthYear(`${payroll.period}-01`)}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(payroll.grossSalary)}</TableCell>
                                <TableCell className="text-right text-destructive/80 hidden lg:table-cell">
                                  -{formatCurrency(payroll.socialSecurityWorker + payroll.incomeTaxWithholding + payroll.otherDeductions)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-bold text-emerald-600">{formatCurrency(payroll.netSalary)}</span>
                                </TableCell>
                                <TableCell className="text-center">{getStatusBadge(payroll.status)}</TableCell>
                                <TableCell className="pr-6 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => void openPayroll(payroll)} title="Ver detalles">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => void handleDownload(payroll)} title="Descargar PDF">
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
        </div>

        {/* Modal Optimizado para todos los dispositivos */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-full md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[1200px] w-full p-0 h-[100dvh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col border-none shadow-2xl">
            <DialogHeader className="p-4 md:p-6 border-b bg-muted/20 flex-row items-center justify-between space-y-0">
              <DialogTitle className="text-xl font-black">
                Nómina {selectedPayroll ? formatMonthYear(`${selectedPayroll.period}-01`) : ''}
              </DialogTitle>
            </DialogHeader>

            {selectedPayroll && (
                <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/30">
                  <div className="p-4 md:p-8 space-y-6">

                    {/* Resumen Superior Móvil (Tarjetas de totales) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl border bg-background shadow-sm flex flex-row sm:flex-col justify-between items-center sm:items-start">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Bruto</span>
                        <span className="text-lg font-bold">{formatCurrency(selectedPayroll.grossSalary)}</span>
                      </div>
                      <div className="p-4 rounded-xl border bg-background shadow-sm flex flex-row sm:flex-col justify-between items-center sm:items-start">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Retenciones</span>
                        <span className="text-lg font-bold text-destructive">
                      -{formatCurrency(selectedPayroll.socialSecurityWorker + selectedPayroll.incomeTaxWithholding + selectedPayroll.otherDeductions)}
                    </span>
                      </div>
                      <div className="p-4 rounded-xl border-2 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm flex flex-row sm:flex-col justify-between items-center sm:items-start">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest">Neto a percibir</span>
                        <span className="text-2xl font-black text-emerald-600">{formatCurrency(selectedPayroll.netSalary)}</span>
                      </div>
                    </div>

                    {/* Sección de Conceptos - Responsiva */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2 px-1">
                        <Calculator className="h-4 w-4" /> Desglose detallado
                      </h3>

                      {/* Vista Tablet/Móvil: Conceptos como lista de items ricos */}
                      <div className="block lg:hidden space-y-2">
                        {payrollItems.length === 0 ? (
                            <p className="text-center py-10 text-muted-foreground">Cargando desglose...</p>
                        ) : (
                            payrollItems.map((item) => (
                                <div key={item.id} className="bg-background border rounded-lg p-3 flex justify-between items-center gap-4">
                                  <div className="space-y-1 flex-1">
                                    <p className="text-sm font-bold leading-tight">{item.description}</p>
                                    <div className="flex gap-3 text-[11px] text-muted-foreground font-medium">
                                      <span>Cant: {item.quantity}</span>
                                      <span>Precio: {formatCurrency(item.unitAmount)}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-bold ${item.totalAmount < 0 ? 'text-destructive' : 'text-foreground'}`}>
                                      {formatCurrency(item.totalAmount)}
                                    </p>
                                  </div>
                                </div>
                            ))
                        )}
                      </div>

                      {/* Vista Desktop: Tabla completa */}
                      <div className="hidden lg:block rounded-xl border bg-background overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead className="py-4 pl-6">Concepto retributivo</TableHead>
                              <TableHead className="text-right">Unidades</TableHead>
                              <TableHead className="text-right">Precio Unitario</TableHead>
                              <TableHead className="text-right pr-6">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payrollItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="py-4 pl-6 font-medium max-w-md">{item.description}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{item.quantity}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(item.unitAmount)}</TableCell>
                                  <TableCell className={`text-right pr-6 font-bold ${item.totalAmount < 0 ? 'text-destructive' : ''}`}>
                                    {formatCurrency(item.totalAmount)}
                                  </TableCell>
                                </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
            )}

            {/* Footer del Modal */}
            <div className="p-4 md:p-6 border-t bg-background flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="w-full sm:w-auto order-2 sm:order-1" onClick={() => setIsDetailOpen(false)}>
                Cerrar
              </Button>
              <Button className="w-full sm:w-auto order-1 sm:order-2 flex-1 sm:flex-none" onClick={() => selectedPayroll && handleDownload(selectedPayroll)}>
                <Download className="h-4 w-4 mr-2" /> Descargar Nómina (PDF)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardShell>
  );
}