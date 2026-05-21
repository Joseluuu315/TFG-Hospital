'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Mail,
  Phone,
  Calendar,
  BadgeEuro, Delete,
} from 'lucide-react';
import { usersApi, workerContractsApi, type User, type WorkerContract } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { formatCurrency, getDisplayName, getInitials } from '@/lib/formatters';

const departments = [
  'UCI',
  'Urgencias',
  'Pediatria',
  'Cardiologia',
  'Neurologia',
  'Administracion',
  'Laboratorio',
];

const jobTitles = [
  'Medico',
  'Enfermera',
  'Auxiliar',
  'Pediatra',
  'Cirujano',
  'Tecnico',
  'Auxiliar Administrativo',
];

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dni: '',
  department: '',
  jobTitle: '',
  baseSalary: '',
  password: '',
};

const initialContractForm = {
  workerId: '',
  hourlyRate: '',
  weeklyHours: '40',
  nightBonusPct: '0.25',
  holidayBonusPct: '0.50',
  overtimeMultiplier: '1.50',
  effectiveFrom: new Date().toISOString().slice(0, 10),
};

type WorkerFormData = typeof initialFormData;
type ContractFormData = typeof initialContractForm;

export default function WorkersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const hospitalId = String(user?.hospitalId ?? '');
  const [workers, setWorkers] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Record<string, WorkerContract>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [contractWorker, setContractWorker] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingContract, setIsSavingContract] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [formData, setFormData] = useState<WorkerFormData>(initialFormData);
  const [contractForm, setContractForm] = useState<ContractFormData>(initialContractForm);

  const fetchWorkers = useCallback(async () => {
    if (!hospitalId) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await usersApi.getAll();
      const hospitalWorkers = response.data.filter(
          (candidate) => candidate.role === 'WORKER' && String(candidate.hospitalId) === hospitalId,
      );
      setWorkers(hospitalWorkers);

      const contractEntries = await Promise.all(
          hospitalWorkers.map(async (worker) => {
            try {
              const contractRes = await workerContractsApi.getActive(String(worker.id));
              return [String(worker.id), contractRes.data] as const;
            } catch {
              return null;
            }
          }),
      );

      setContracts(
          Object.fromEntries(contractEntries.filter((entry): entry is readonly [string, WorkerContract] => entry !== null)),
      );
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar los trabajadores');
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    void fetchWorkers();
  }, [fetchWorkers]);

  const updateForm = (field: keyof WorkerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => setFormData(initialFormData);

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    resetForm();
    setPasswordError('');
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingWorker(null);
    resetForm();
    setPasswordError('');
  };

  const closeContractDialog = () => {
    setIsContractDialogOpen(false);
    setContractWorker(null);
    setContractForm(initialContractForm);
  };

  const buildWorkerPayload = (includePassword: boolean) => {
    const payload: Partial<User> & { password?: string; hospitalId: string } = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      dni: formData.dni.trim(),
      department: formData.department,
      jobTitle: formData.jobTitle,
      baseSalary: Number(formData.baseSalary || 0),
      role: 'WORKER',
      hospitalId,
    };

    if ((includePassword && formData.password.trim()) || formData.password.trim()) {
      payload.password = formData.password;
    }

    return payload;
  };

  const handleCreateWorker = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await usersApi.create(buildWorkerPayload(true));
      toast.success('Trabajador creado correctamente');
      closeCreateDialog();
      await fetchWorkers();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo crear el trabajador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateWorker = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingWorker) return;
    setIsSubmitting(true);
    try {
      const response = await usersApi.update(String(editingWorker.id), buildWorkerPayload(false));
      setWorkers((prev) => prev.map((worker) => (worker.id === editingWorker.id ? response.data : worker)));
      toast.success('Trabajador actualizado correctamente');
      closeEditDialog();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo actualizar el trabajador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleWorkerStatus = async (worker: User) => {
    const nextStatus = !worker.enabled;
    try {
      await usersApi.update(String(worker.id), { enabled: nextStatus });
      setWorkers((prev) => prev.map((item) => (item.id === worker.id ? { ...item, enabled: nextStatus } : item)));
      toast.success('Estado del trabajador actualizado');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo actualizar el estado');
    }
  };

  const openCalendar = (id: string | number) => {
    router.push(`/dashboard/admin/workers/${id}/calendar`);
  };

  const handleDeleteWorker = async (worker: User) => {
    if (!window.confirm(`¿Seguro que quieres eliminar a ${getDisplayName(worker)}?`)) return;

    setIsSubmitting(true);
    try {
      await usersApi.deleteWorker(String(worker.id));
      setWorkers((prev) => prev.filter((w) => w.id !== worker.id));
      toast.success('Eliminado correctamente');
    } catch (error: any) {
      const statusCode = error.response?.status;
      const serverMessage = error.response?.data?.message;
      console.error('Status Code:', statusCode);
      console.error('Error Full:', error);

      if (serverMessage) {
        toast.error(serverMessage);
      } else if (statusCode === 500) {
        toast.error('Error de servidor al eliminar el trabajador.');
      } else if (statusCode === 403) {
        toast.error('No tienes permisos suficientes para borrar trabajadores.');
      } else {
        toast.error('No se pudo eliminar el trabajador.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWorker = (worker: User) => {
    setEditingWorker(worker);
    setFormData({
      firstName: worker.firstName || '',
      lastName: worker.lastName || '',
      email: worker.email || '',
      phone: worker.phone || '',
      dni: worker.dni || '',
      department: worker.department || '',
      jobTitle: worker.jobTitle || '',
      baseSalary: String(worker.baseSalary || ''),
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenContract = (worker: User) => {
    const activeContract = contracts[String(worker.id)];
    setContractWorker(worker);
    setContractForm({
      workerId: String(worker.id),
      hourlyRate: activeContract ? String(activeContract.hourlyRate) : '',
      weeklyHours: activeContract ? String(activeContract.weeklyHours) : '40',
      nightBonusPct: activeContract ? String(activeContract.nightBonusPct) : '0.25',
      holidayBonusPct: activeContract ? String(activeContract.holidayBonusPct) : '0.50',
      overtimeMultiplier: activeContract ? String(activeContract.overtimeMultiplier) : '1.50',
      effectiveFrom: activeContract?.effectiveFrom ?? new Date().toISOString().slice(0, 10),
    });
    setIsContractDialogOpen(true);
  };

  const handleSaveContract = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!contractWorker || !hospitalId) return;
    setIsSavingContract(true);
    try {
      const response = await workerContractsApi.upsert(hospitalId, {
        workerId: String(contractWorker.id),
        hourlyRate: Number(contractForm.hourlyRate),
        weeklyHours: Number(contractForm.weeklyHours),
        nightBonusPct: Number(contractForm.nightBonusPct),
        holidayBonusPct: Number(contractForm.holidayBonusPct),
        overtimeMultiplier: Number(contractForm.overtimeMultiplier),
        effectiveFrom: contractForm.effectiveFrom,
      });
      setContracts((current) => ({ ...current, [String(contractWorker.id)]: response.data }));
      toast.success('Contrato actualizado');
      closeContractDialog();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo actualizar el contrato');
    } finally {
      setIsSavingContract(false);
    }
  };

  const filteredWorkers = workers.filter((worker) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesSearch =
        !normalizedQuery
        || getDisplayName(worker).toLowerCase().includes(normalizedQuery)
        || worker.email.toLowerCase().includes(normalizedQuery)
        || (worker.dni ?? '').toLowerCase().includes(normalizedQuery);
    const matchesDepartment = departmentFilter === 'all' || worker.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const activeWorkers = filteredWorkers.filter((worker) => worker.enabled).length;
  const inactiveWorkers = filteredWorkers.length - activeWorkers;
  const workersWithoutContract = filteredWorkers.filter((worker) => !contracts[String(worker.id)]).length;

  const handlePasswordChange = (value: string, isEditMode: boolean) => {
    updateForm('password', value);

    if (value === '') {
      setPasswordError('');
      return;
    }

    const hasMinLength = value.length >= 10;
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*]/.test(value);

    const errors: string[] = [];
    if (!hasMinLength) errors.push('mínimo 10 caracteres');
    if (!hasUppercase) errors.push('una mayúscula');
    if (!hasNumber) errors.push('un número');
    if (!hasSpecial) errors.push('un símbolo especial (!@#$%^&*)');

    setPasswordError(errors.length > 0 ? `Faltan: ${errors.join(', ')}.` : '');
  };

  const renderWorkerFormFields = (isEditMode: boolean) => (
      <FieldGroup className="py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="firstName">Nombre</FieldLabel>
            <Input id="firstName" value={formData.firstName} onChange={(event) => updateForm('firstName', event.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Apellidos</FieldLabel>
            <Input id="lastName" value={formData.lastName} onChange={(event) => updateForm('lastName', event.target.value)} required />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" value={formData.email} onChange={(event) => updateForm('email', event.target.value)} required />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="phone">Telefono</FieldLabel>
            <Input id="phone" value={formData.phone} onChange={(event) => updateForm('phone', event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="dni">DNI</FieldLabel>
            <Input id="dni" value={formData.dni} onChange={(event) => updateForm('dni', event.target.value)} required />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="department">Departamento</FieldLabel>
            <Select value={formData.department} onValueChange={(value) => updateForm('department', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="jobTitle">Cargo</FieldLabel>
            <Select value={formData.jobTitle} onValueChange={(value) => updateForm('jobTitle', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {jobTitles.map((job) => (
                    <SelectItem key={job} value={job}>
                      {job}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="baseSalary">Salario base mensual (EUR)</FieldLabel>
          <Input id="baseSalary" type="number" value={formData.baseSalary} onChange={(event) => updateForm('baseSalary', event.target.value)} required />
        </Field>
        <Field>
          {isEditMode ? (
              <div>
                <FieldLabel htmlFor="password">Nueva contrasena</FieldLabel>
                <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(event) => handlePasswordChange(event.target.value, isEditMode)}
                    placeholder="Dejar en blanco si no cambia"
                    className={passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {passwordError && (
                    <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                      {passwordError}
                    </p>
                )}
              </div>
          ) : (
              <div>
                <FieldLabel htmlFor="password">Contrasena inicial</FieldLabel>
                <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(event) => handlePasswordChange(event.target.value, isEditMode)}
                    placeholder="Opcional, recomendable para demo"
                    className={passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {passwordError ? (
                    <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                      {passwordError}
                    </p>
                ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Si lo dejas vacio, el sistema generara una temporal y enviara correo si esta configurado.
                    </p>
                )}
              </div>
          )}
        </Field>
      </FieldGroup>
  );

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
      <DashboardShell title="Gestión de trabajadores" description="Alta, edición, contratos y seguimiento de empleados">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trabajadores activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{activeWorkers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-700">{inactiveWorkers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sin contrato activo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{workersWithoutContract}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters + Create button */}
        <div className="flex flex-col gap-4 rounded-xl border bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="Buscar trabajador..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create worker dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo trabajador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo trabajador</DialogTitle>
                <DialogDescription>Rellena los datos del empleado. Las credenciales se enviarán por correo.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWorker}>
                {renderWorkerFormFields(false)}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeCreateDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !!passwordError}>
                    {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Crear trabajador
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Workers list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Listado de trabajadores ({filteredWorkers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile cards */}
            <div className="space-y-4 md:hidden">
              {filteredWorkers.map((worker) => {
                const isActive = !!worker.enabled;
                const contract = contracts[String(worker.id)];
                return (
                    <div key={worker.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                            {getInitials(worker)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{getDisplayName(worker)}</p>
                            <p className="text-xs text-muted-foreground">{worker.dni}</p>
                          </div>
                        </div>
                        <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-emerald-500/15 text-emerald-600' : ''}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="break-all">{worker.email}</span>
                        </div>
                        {worker.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4 shrink-0" />
                              <span>{worker.phone}</span>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {worker.department && <Badge variant="outline">{worker.department}</Badge>}
                          {worker.jobTitle && <Badge variant="secondary">{worker.jobTitle}</Badge>}
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Contrato</p>
                          {contract ? (
                              <p className="mt-1 font-medium">
                                {formatCurrency(contract.hourlyRate)}/h · {contract.weeklyHours}h semana
                              </p>
                          ) : (
                              <p className="mt-1 text-sm text-amber-600">Sin contrato activo</p>
                          )}
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Salario base</p>
                          <p className="mt-1 font-medium">{formatCurrency(worker.baseSalary)}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Button variant="outline" size="sm" onClick={() => openCalendar(worker.id)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Calendario
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenContract(worker)}>
                          <BadgeEuro className="mr-2 h-4 w-4" />
                          Contrato
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditWorker(worker)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleWorkerStatus(worker)}>
                          {isActive ? 'Dar de baja' : 'Reactivar'}
                        </Button>
                        <Button variant="destructive" size="sm" className="sm:col-span-2" onClick={() => handleDeleteWorker(worker)}>
                          <Delete className="mr-2 h-4 w-4" />
                          Borrar trabajador
                        </Button>
                      </div>
                    </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Salario</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkers.map((worker) => {
                    const isActive = !!worker.enabled;
                    const contract = contracts[String(worker.id)];
                    return (
                        <TableRow key={worker.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                {getInitials(worker)}
                              </div>
                              <div>
                                <p className="font-medium">{getDisplayName(worker)}</p>
                                <p className="text-xs text-muted-foreground">{worker.dni}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {worker.email}
                              </div>
                              {worker.phone && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {worker.phone}
                                  </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{worker.department}</TableCell>
                          <TableCell>{worker.jobTitle}</TableCell>
                          <TableCell>{formatCurrency(worker.baseSalary)}</TableCell>
                          <TableCell>
                            {contract ? (
                                <div className="text-sm">
                                  <p className="font-medium">{formatCurrency(contract.hourlyRate)}/h</p>
                                  <p className="text-muted-foreground">{contract.weeklyHours}h semana</p>
                                </div>
                            ) : (
                                <Badge variant="secondary">Sin contrato</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-emerald-500/15 text-emerald-600' : ''}>
                              {isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openCalendar(worker.id)}>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Ver calendario
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenContract(worker)}>
                                  <BadgeEuro className="mr-2 h-4 w-4" />
                                  Gestionar contrato
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditWorker(worker)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteWorker(worker)}>
                                  <Delete className="mr-2 h-4 w-4" />
                                  Borrar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleWorkerStatus(worker)}>
                                  {isActive ? 'Dar de baja' : 'Reactivar'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredWorkers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium">No se encontraron trabajadores</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Cambia filtros o registra un empleado nuevo.</p>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Edit worker dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar trabajador</DialogTitle>
              <DialogDescription>Modifica los datos del empleado.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateWorker}>
              {renderWorkerFormFields(true)}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEditDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || !!passwordError}>
                  {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Contract dialog */}
        <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Contrato — {contractWorker ? getDisplayName(contractWorker) : ''}
              </DialogTitle>
              <DialogDescription>Establece las condiciones económicas del trabajador.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveContract}>
              <FieldGroup className="py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="hourlyRate">Tarifa por hora (€)</FieldLabel>
                    <Input
                        id="hourlyRate"
                        type="number"
                        step="0.01"
                        value={contractForm.hourlyRate}
                        onChange={(e) => setContractForm((prev) => ({ ...prev, hourlyRate: e.target.value }))}
                        required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="weeklyHours">Horas semanales</FieldLabel>
                    <Input
                        id="weeklyHours"
                        type="number"
                        value={contractForm.weeklyHours}
                        onChange={(e) => setContractForm((prev) => ({ ...prev, weeklyHours: e.target.value }))}
                        required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="nightBonusPct">Bonus nocturno (%)</FieldLabel>
                    <Input
                        id="nightBonusPct"
                        type="number"
                        step="0.01"
                        value={contractForm.nightBonusPct}
                        onChange={(e) => setContractForm((prev) => ({ ...prev, nightBonusPct: e.target.value }))}
                        required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="holidayBonusPct">Bonus festivo (%)</FieldLabel>
                    <Input
                        id="holidayBonusPct"
                        type="number"
                        step="0.01"
                        value={contractForm.holidayBonusPct}
                        onChange={(e) => setContractForm((prev) => ({ ...prev, holidayBonusPct: e.target.value }))}
                        required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="overtimeMultiplier">Multiplicador horas extra</FieldLabel>
                    <Input
                        id="overtimeMultiplier"
                        type="number"
                        step="0.01"
                        value={contractForm.overtimeMultiplier}
                        onChange={(e) => setContractForm((prev) => ({ ...prev, overtimeMultiplier: e.target.value }))}
                        required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="effectiveFrom">Vigente desde</FieldLabel>
                    <Input
                        id="effectiveFrom"
                        type="date"
                        value={contractForm.effectiveFrom}
                        onChange={(e) => setContractForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                        required
                    />
                  </Field>
                </div>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeContractDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSavingContract}>
                  {isSavingContract ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Guardar contrato
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardShell>
  );
}
