'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Search, Download, Send, Eye } from 'lucide-react';
import { payrollsApi, usersApi, type Payroll, type User } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

const mockPayrolls: Payroll[] = [
  {
    id: '1',
    workerId: '1',
    workerFullName: 'Maria Garcia Lopez',
    hospitalId: '1',
    period: '2025-06',
    grossSalary: 2500,
    socialSecurityWorker: 158.75,
    incomeTaxWithholding: 375,
    otherDeductions: 0,
    netSalary: 1966.25,
    overtimeAmount: 0,
    bonusAmount: 0,
    status: 'ISSUED',
    issuedAt: '2025-06-25T10:00:00',
  },
  {
    id: '2',
    workerId: '2',
    workerFullName: 'Juan Martinez Ruiz',
    hospitalId: '1',
    period: '2025-06',
    grossSalary: 4500,
    socialSecurityWorker: 285.75,
    incomeTaxWithholding: 900,
    otherDeductions: 0,
    netSalary: 3314.25,
    overtimeAmount: 200,
    bonusAmount: 0,
    status: 'DRAFT',
    issuedAt: '2025-06-25T10:00:00',
  },
  {
    id: '3',
    workerId: '3',
    workerFullName: 'Ana Fernandez Diaz',
    hospitalId: '1',
    period: '2025-06',
    grossSalary: 4200,
    socialSecurityWorker: 266.70,
    incomeTaxWithholding: 756,
    otherDeductions: 50,
    netSalary: 3127.30,
    overtimeAmount: 0,
    bonusAmount: 100,
    status: 'ACKNOWLEDGED',
    acknowledgedAt: '2025-06-26T14:30:00',
    issuedAt: '2025-06-25T10:00:00',
  },
];

const mockWorkers: User[] = [
  { id: '1', firstName: 'Maria', lastName: 'Garcia Lopez', email: 'maria@hospital.com', role: 'WORKER', enabled: true, accountNonLocked: true, baseSalary: 2500, createdAt: '', updatedAt: '' },
  { id: '2', firstName: 'Juan', lastName: 'Martinez Ruiz', email: 'juan@hospital.com', role: 'WORKER', enabled: true, accountNonLocked: true, baseSalary: 4500, createdAt: '', updatedAt: '' },
  { id: '3', firstName: 'Ana', lastName: 'Fernandez Diaz', email: 'ana@hospital.com', role: 'WORKER', enabled: true, accountNonLocked: true, baseSalary: 4200, createdAt: '', updatedAt: '' },
];

export default function PayrollsPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('2025-06');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    workerId: '',
    period: '2025-06',
    grossSalary: '',
    overtimeAmount: '0',
    bonusAmount: '0',
    otherDeductions: '0',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [payrollsRes, workersRes] = await Promise.all([
        payrollsApi.getAll(),
        usersApi.getAll(),
      ]);
      setPayrolls(payrollsRes.data);
      setWorkers(workersRes.data.filter(u => u.role === 'WORKER'));
    } catch {
      console.log('[averonix] Backend no disponible, usando datos de ejemplo');
      setPayrolls(mockPayrolls);
      setWorkers(mockWorkers);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNetSalary = () => {
    const gross = Number(formData.grossSalary) || 0;
    const overtime = Number(formData.overtimeAmount) || 0;
    const bonus = Number(formData.bonusAmount) || 0;
    const total = gross + overtime + bonus;
    const ss = total * 0.0635;
    const irpf = total * 0.15;
    const other = Number(formData.otherDeductions) || 0;
    return total - ss - irpf - other;
  };

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedWorker = workers.find(w => w.id === formData.workerId);
    const gross = Number(formData.grossSalary);
    const overtime = Number(formData.overtimeAmount);
    const bonus = Number(formData.bonusAmount);
    const total = gross + overtime + bonus;

    const payrollData: Partial<Payroll> = {
      workerId: formData.workerId,
      workerFullName: `${selectedWorker?.firstName} ${selectedWorker?.lastName}`,
      period: formData.period,
      grossSalary: gross,
      socialSecurityWorker: total * 0.0635,
      incomeTaxWithholding: total * 0.15,
      otherDeductions: Number(formData.otherDeductions),
      overtimeAmount: overtime,
      bonusAmount: bonus,
      netSalary: calculateNetSalary(),
      status: 'DRAFT',
    };

    try {
      await payrollsApi.create(payrollData);
      toast.success('Nomina creada correctamente');
      setIsCreateDialogOpen(false);
      fetchData();
    } catch {
      // Mock para prototipo
      const newPayroll: Payroll = {
        id: String(Date.now()),
        ...payrollData,
        hospitalId: '1',
        issuedAt: new Date().toISOString(),
      } as Payroll;
      setPayrolls([newPayroll, ...payrolls]);
      toast.success('Nomina creada correctamente (modo demo)');
      setIsCreateDialogOpen(false);
    } finally {
      setIsSubmitting(false);
      setFormData({ workerId: '', period: '2025-06', grossSalary: '', overtimeAmount: '0', bonusAmount: '0', otherDeductions: '0' });
    }
  };

  const handlePublishPayroll = async (payrollId: string) => {
    try {
      await payrollsApi.updateStatus(payrollId, 'ISSUED');
      setPayrolls(payrolls.map(p => p.id === payrollId ? { ...p, status: 'ISSUED' } : p));
      toast.success('Nomina publicada correctamente');
    } catch {
      setPayrolls(payrolls.map(p => p.id === payrollId ? { ...p, status: 'ISSUED' } : p));
      toast.success('Nomina publicada correctamente (modo demo)');
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
          title="Gestion de Nominas" 
          description="Emite y gestiona las nominas de los trabajadores" 
        />
        
        <main className="p-6 space-y-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por trabajador..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-06">Junio 2025</SelectItem>
                  <SelectItem value="2025-05">Mayo 2025</SelectItem>
                  <SelectItem value="2025-04">Abril 2025</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
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

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Nomina
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Crear Nomina</DialogTitle>
                  <DialogDescription>
                    Introduce los datos de la nomina para el trabajador seleccionado.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePayroll}>
                  <FieldGroup className="py-4">
                    <Field>
                      <FieldLabel htmlFor="workerId">Trabajador</FieldLabel>
                      <Select value={formData.workerId} onValueChange={(v) => {
                        const worker = workers.find(w => w.id === v);
                        setFormData({ ...formData, workerId: v, grossSalary: String(worker?.baseSalary || '') });
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar trabajador" />
                        </SelectTrigger>
                        <SelectContent>
                          {workers.map((worker) => (
                            <SelectItem key={worker.id} value={worker.id}>
                              {worker.firstName} {worker.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="period">Periodo</FieldLabel>
                      <Input
                        id="period"
                        type="month"
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="grossSalary">Salario Bruto (EUR)</FieldLabel>
                      <Input
                        id="grossSalary"
                        type="number"
                        value={formData.grossSalary}
                        onChange={(e) => setFormData({ ...formData, grossSalary: e.target.value })}
                        required
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="overtimeAmount">Horas Extra (EUR)</FieldLabel>
                        <Input
                          id="overtimeAmount"
                          type="number"
                          value={formData.overtimeAmount}
                          onChange={(e) => setFormData({ ...formData, overtimeAmount: e.target.value })}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="bonusAmount">Bonus (EUR)</FieldLabel>
                        <Input
                          id="bonusAmount"
                          type="number"
                          value={formData.bonusAmount}
                          onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="otherDeductions">Otras Deducciones (EUR)</FieldLabel>
                      <Input
                        id="otherDeductions"
                        type="number"
                        value={formData.otherDeductions}
                        onChange={(e) => setFormData({ ...formData, otherDeductions: e.target.value })}
                      />
                    </Field>
                    {formData.grossSalary && (
                      <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Salario Bruto Total:</span>
                          <span className="font-medium">
                            {(Number(formData.grossSalary) + Number(formData.overtimeAmount) + Number(formData.bonusAmount)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>- Seguridad Social (6.35%):</span>
                          <span>
                            {((Number(formData.grossSalary) + Number(formData.overtimeAmount) + Number(formData.bonusAmount)) * 0.0635).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>- IRPF (15%):</span>
                          <span>
                            {((Number(formData.grossSalary) + Number(formData.overtimeAmount) + Number(formData.bonusAmount)) * 0.15).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Salario Neto:</span>
                          <span className="text-emerald-600">
                            {calculateNetSalary().toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </span>
                        </div>
                      </div>
                    )}
                  </FieldGroup>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <><Spinner className="mr-2" /> Creando...</> : 'Crear Nomina'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Payrolls Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Listado de Nominas ({filteredPayrolls.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
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
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                            {payroll.workerFullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-medium">{payroll.workerFullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(payroll.period + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {(payroll.grossSalary + payroll.overtimeAmount + payroll.bonusAmount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        -{(payroll.socialSecurityWorker + payroll.incomeTaxWithholding + payroll.otherDeductions).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {payroll.netSalary.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payroll.status === 'DRAFT' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-600"
                              onClick={() => handlePublishPayroll(payroll.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {payroll.status !== 'DRAFT' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredPayrolls.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No se encontraron nominas</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Intenta cambiar los filtros o crear una nueva nomina
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
