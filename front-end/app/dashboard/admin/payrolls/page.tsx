'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, FileText, Plus, Search, Send, SlidersHorizontal } from 'lucide-react';
import {
  advancedPayrollApi,
  payrollsApi,
  usersApi,
  type Payroll,
  type PayrollAdjustment,
  type PayrollItem,
  type User,
} from '@/lib/api';
import { downloadBlobResponse } from '@/lib/download';
import { toast } from 'sonner';
import { formatCurrency, formatMonthYear } from '@/lib/formatters';

const initialGenerateForm = {
  workerId: '',
  period: new Date().toISOString().slice(0, 7),
};

const initialAdjustmentForm = {
  workerId: '',
  period: new Date().toISOString().slice(0, 7),
  type: 'BONUS' as 'BONUS' | 'PENALTY',
  description: '',
  amount: '',
};

export default function PayrollsPage() {
  const { user } = useAuth();
  const hospitalId = String(user?.hospitalId ?? '');
  const actorId = String(user?.id ?? '');
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [selectedItems, setSelectedItems] = useState<PayrollItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [generateForm, setGenerateForm] = useState(initialGenerateForm);
  const [adjustmentForm, setAdjustmentForm] = useState(initialAdjustmentForm);

  const fetchData = useCallback(async () => {
    try {
      const [payrollsRes, workersRes] = await Promise.all([payrollsApi.getAll(), usersApi.getAll()]);
      setPayrolls(payrollsRes.data.filter((item) => item.hospitalId === hospitalId));
      setWorkers(workersRes.data.filter((item) => item.role === 'WORKER' && String(item.hospitalId) === hospitalId));
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar las nóminas');
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleGeneratePayroll = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hospitalId) return;
    setIsSubmitting(true);
    try {
      await advancedPayrollApi.generate(hospitalId, generateForm);
      toast.success('Nómina generada correctamente');
      setIsGenerateOpen(false);
      setGenerateForm(initialGenerateForm);
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo generar la nómina');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAdjustment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hospitalId || !actorId) return;
    setIsSubmitting(true);
    try {
      const payload: PayrollAdjustment = {
        hospitalId,
        workerId: adjustmentForm.workerId,
        period: adjustmentForm.period,
        type: adjustmentForm.type,
        description: adjustmentForm.description,
        amount: Number(adjustmentForm.amount),
        createdBy: actorId,
      };
      await advancedPayrollApi.createAdjustment(payload);
      toast.success('Ajuste guardado');
      setIsAdjustmentOpen(false);
      setAdjustmentForm(initialAdjustmentForm);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar el ajuste');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishPayroll = async (payrollId: string) => {
    setIsPublishing(payrollId);
    try {
      await payrollsApi.updateStatus(payrollId, 'ISSUED');
      setPayrolls((current) => current.map((item) => (item.id === payrollId ? { ...item, status: 'ISSUED' } : item)));
      toast.success('Nómina emitida');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo emitir la nómina');
    } finally {
      setIsPublishing(null);
    }
  };

  const handleDownload = async (payroll: Payroll) => {
    try {
      const response = await payrollsApi.downloadPdf(payroll.id);
      const fallbackFilename = `nomina-${payroll.workerFullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${payroll.period}.pdf`;
      downloadBlobResponse(response, fallbackFilename);
      toast.success('PDF descargado');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo descargar el PDF');
    }
  };

  const openPayrollDetail = async (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsDetailOpen(true);
    try {
      const response = await advancedPayrollApi.getItems(payroll.id);
      setSelectedItems(response.data);
    } catch (error) {
      console.error(error);
      setSelectedItems([]);
      toast.error('No se pudieron cargar las líneas de nómina');
    }
  };

  const filteredPayrolls = payrolls.filter((payroll) => {
    const matchesSearch = payroll.workerFullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPeriod = !periodFilter || payroll.period === periodFilter;
    const matchesStatus = statusFilter === 'all' || payroll.status === statusFilter;
    return matchesSearch && matchesPeriod && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Borrador</Badge>;
      case 'ISSUED':
        return <Badge variant="default" className="bg-blue-500/15 text-blue-600">Emitida</Badge>;
      case 'ACKNOWLEDGED':
        return <Badge variant="default" className="bg-emerald-500/15 text-emerald-600">Confirmada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
      <DashboardShell title="Gestión de nóminas" description="Generación avanzada, ajustes manuales y detalle por conceptos">
        {/* Wrapper principal con Flex para forzar el estiramiento vertical */}
        <div className="flex flex-col gap-4 flex-1 h-full min-h-[calc(100vh-12rem)]">

          {/* Barra superior de filtros - Usamos shrink-0 para que no reduzca su tamaño al estirar la tabla */}
          <div className="flex shrink-0 flex-col gap-4 rounded-xl border bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por trabajador..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Input type="month" className="w-full sm:w-40" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="ISSUED">Emitida</SelectItem>
                  <SelectItem value="ACKNOWLEDGED">Confirmada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Ajuste manual
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Crear ajuste</DialogTitle>
                    <DialogDescription>Bonifica o penaliza un periodo antes de generar la nómina.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAdjustment}>
                    <FieldGroup className="py-4">
                      <Field>
                        <FieldLabel>Trabajador</FieldLabel>
                        <Select value={adjustmentForm.workerId} onValueChange={(value) => setAdjustmentForm((current) => ({ ...current, workerId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar trabajador" />
                          </SelectTrigger>
                          <SelectContent>
                            {workers.map((worker) => (
                                <SelectItem key={worker.id} value={String(worker.id)}>
                                  {worker.firstName} {worker.lastName}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Periodo</FieldLabel>
                        <Input type="month" value={adjustmentForm.period} onChange={(e) => setAdjustmentForm((current) => ({ ...current, period: e.target.value }))} required />
                      </Field>
                      <Field>
                        <FieldLabel>Tipo</FieldLabel>
                        <Select value={adjustmentForm.type} onValueChange={(value: 'BONUS' | 'PENALTY') => setAdjustmentForm((current) => ({ ...current, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BONUS">Bonificación</SelectItem>
                            <SelectItem value="PENALTY">Penalización</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Descripción</FieldLabel>
                        <Input value={adjustmentForm.description} onChange={(e) => setAdjustmentForm((current) => ({ ...current, description: e.target.value }))} required />
                      </Field>
                      <Field>
                        <FieldLabel>Importe</FieldLabel>
                        <Input type="number" step="0.01" value={adjustmentForm.amount} onChange={(e) => setAdjustmentForm((current) => ({ ...current, amount: e.target.value }))} required />
                      </Field>
                    </FieldGroup>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAdjustmentOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : 'Guardar ajuste'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Generar nómina
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Generación avanzada</DialogTitle>
                    <DialogDescription>Usa turnos, ausencias y ajustes manuales del periodo seleccionado.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleGeneratePayroll}>
                    <FieldGroup className="py-4">
                      <Field>
                        <FieldLabel>Trabajador</FieldLabel>
                        <Select value={generateForm.workerId} onValueChange={(value) => setGenerateForm((current) => ({ ...current, workerId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar trabajador" />
                          </SelectTrigger>
                          <SelectContent>
                            {workers.map((worker) => (
                                <SelectItem key={worker.id} value={String(worker.id)}>
                                  {worker.firstName} {worker.lastName}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Periodo</FieldLabel>
                        <Input type="month" value={generateForm.period} onChange={(e) => setGenerateForm((current) => ({ ...current, period: e.target.value }))} required />
                      </Field>
                    </FieldGroup>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsGenerateOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Generando...' : 'Generar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Card principal con `flex-1` y `flex-col` para estirarse al máximo */}
          <Card className="flex flex-1 flex-col shadow-md">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nóminas del hospital ({filteredPayrolls.length})
              </CardTitle>
            </CardHeader>
            {/* Añadimos `flex-1` y `overflow-auto` para que el contenido sea desplazable internamente si es necesario */}
            <CardContent className="flex-1 overflow-auto">
              <div className="grid gap-3 md:hidden">
                {filteredPayrolls.map((payroll) => (
                    <div key={payroll.id} className="rounded-xl border bg-background/70 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{payroll.workerFullName}</p>
                          <p className="text-sm text-muted-foreground">{formatMonthYear(`${payroll.period}-01`)}</p>
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
                          <p className="font-medium">{formatCurrency(payroll.socialSecurityWorker + payroll.incomeTaxWithholding + payroll.otherDeductions)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => void openPayrollDetail(payroll)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </Button>
                        {payroll.status === 'DRAFT' ? (
                            <Button className="flex-1" onClick={() => void handlePublishPayroll(payroll.id)} disabled={isPublishing === payroll.id}>
                              <Send className="mr-2 h-4 w-4" />
                              Emitir
                            </Button>
                        ) : (
                            <Button className="flex-1" onClick={() => void handleDownload(payroll)}>
                              <Download className="mr-2 h-4 w-4" />
                              Descargar
                            </Button>
                        )}
                      </div>
                    </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto h-full">
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trabajador</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Deducciones</TableHead>
                      <TableHead className="text-right">Neto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-32">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayrolls.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell className="font-medium">{payroll.workerFullName}</TableCell>
                          <TableCell>{formatMonthYear(`${payroll.period}-01`)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatCurrency(payroll.grossSalary)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap text-muted-foreground">{formatCurrency(payroll.socialSecurityWorker + payroll.incomeTaxWithholding + payroll.otherDeductions)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap font-medium text-emerald-600">{formatCurrency(payroll.netSalary)}</TableCell>
                          <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void openPayrollDetail(payroll)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {payroll.status === 'DRAFT' ? (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => void handlePublishPayroll(payroll.id)} disabled={isPublishing === payroll.id}>
                                    <Send className="h-4 w-4" />
                                  </Button>
                              ) : (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void handleDownload(payroll)}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="flex flex-col w-[96vw] sm:max-w-5xl max-h-[92dvh] overflow-hidden p-0">
            <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
              <DialogTitle>
                Detalle de nómina {selectedPayroll ? `- ${selectedPayroll.workerFullName} (${formatMonthYear(`${selectedPayroll.period}-01`)})` : ''}
              </DialogTitle>
            </DialogHeader>
            {selectedPayroll && (
                <div className="space-y-4 overflow-y-auto px-4 pb-5 pt-4 sm:px-6">
                  <div className="grid gap-3 grid-cols-3">
                    <Card>
                      <CardHeader className="pb-1 px-3 pt-3"><CardTitle className="text-xs text-muted-foreground">Bruto</CardTitle></CardHeader>
                      <CardContent className="px-3 pb-3 text-lg font-semibold">{formatCurrency(selectedPayroll.grossSalary)}</CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-1 px-3 pt-3"><CardTitle className="text-xs text-muted-foreground">Deducciones</CardTitle></CardHeader>
                      <CardContent className="px-3 pb-3 text-lg font-semibold text-destructive">
                        {formatCurrency(selectedPayroll.socialSecurityWorker + selectedPayroll.incomeTaxWithholding + selectedPayroll.otherDeductions)}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-1 px-3 pt-3"><CardTitle className="text-xs text-muted-foreground">Neto</CardTitle></CardHeader>
                      <CardContent className="px-3 pb-3 text-lg font-semibold text-emerald-600">{formatCurrency(selectedPayroll.netSalary)}</CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Líneas de cálculo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Vista tarjetas — móvil */}
                      <div className="md:hidden divide-y">
                        {selectedItems.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground px-4">No hay conceptos detallados.</p>
                        ) : selectedItems.map((item) => (
                            <div key={item.id} className="px-4 py-3 space-y-1">
                              <p className="text-sm font-medium">{item.description}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{item.quantity} × {formatCurrency(item.unitAmount)}</span>
                                <span className={`font-semibold ${item.totalAmount >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                            {formatCurrency(item.totalAmount)}
                          </span>
                              </div>
                            </div>
                        ))}
                      </div>
                      {/* Vista tabla — desktop */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table className="min-w-[600px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Concepto</TableHead>
                              <TableHead className="text-right">Cantidad</TableHead>
                              <TableHead className="text-right">Unitario</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedItems.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No hay conceptos detallados disponibles.
                                  </TableCell>
                                </TableRow>
                            ) : selectedItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="max-w-[420px] whitespace-normal break-words font-medium">{item.description}</TableCell>
                                  <TableCell className="text-right whitespace-nowrap">{item.quantity}</TableCell>
                                  <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.unitAmount)}</TableCell>
                                  <TableCell className={`text-right whitespace-nowrap font-medium ${item.totalAmount >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                                    {formatCurrency(item.totalAmount)}
                                  </TableCell>
                                </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardShell>
  );
}
