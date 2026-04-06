'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Trash2,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { usersApi, type User } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { formatCurrency, getDisplayName, getInitials } from '@/lib/formatters';

const mockWorkers: User[] = [
  {
    id: '1',
    firstName: 'Maria',
    lastName: 'Garcia Lopez',
    email: 'maria.garcia@hospital.com',
    phone: '+34 612 345 678',
    dni: '12345678A',
    role: 'WORKER',
    enabled: true,
    accountNonLocked: true,
    hospitalId: '1',
    department: 'UCI',
    jobTitle: 'Enfermera',
    hireDate: '2024-01-15',
    baseSalary: 2500,
    createdAt: '2024-01-15',
    updatedAt: '2025-06-01',
  },
  {
    id: '2',
    firstName: 'Juan',
    lastName: 'Martinez Ruiz',
    email: 'juan.martinez@hospital.com',
    phone: '+34 623 456 789',
    dni: '23456789B',
    role: 'WORKER',
    enabled: true,
    accountNonLocked: true,
    hospitalId: '1',
    department: 'Urgencias',
    jobTitle: 'Medico',
    hireDate: '2024-02-20',
    baseSalary: 4500,
    createdAt: '2024-02-20',
    updatedAt: '2025-05-28',
  },
  {
    id: '3',
    firstName: 'Ana',
    lastName: 'Fernandez Diaz',
    email: 'ana.fernandez@hospital.com',
    phone: '+34 634 567 890',
    dni: '34567890C',
    role: 'WORKER',
    enabled: true,
    accountNonLocked: true,
    hospitalId: '1',
    department: 'Pediatria',
    jobTitle: 'Pediatra',
    hireDate: '2024-03-10',
    baseSalary: 4200,
    createdAt: '2024-03-10',
    updatedAt: '2025-05-30',
  },
  {
    id: '4',
    firstName: 'Carlos',
    lastName: 'Rodriguez Perez',
    email: 'carlos.rodriguez@hospital.com',
    phone: '+34 645 678 901',
    dni: '45678901D',
    role: 'WORKER',
    enabled: false,
    accountNonLocked: true,
    hospitalId: '1',
    department: 'Administracion',
    jobTitle: 'Auxiliar Administrativo',
    hireDate: '2023-06-01',
    baseSalary: 1800,
    createdAt: '2023-06-01',
    updatedAt: '2025-04-15',
  },
];

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

type WorkerFormData = typeof initialFormData;

export default function WorkersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WorkerFormData>(initialFormData);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await usersApi.getAll();
      setWorkers(response.data.filter((user) => user.role === 'WORKER'));
    } catch {
      console.log('[averonix] Backend no disponible, usando datos de ejemplo');
      setWorkers(mockWorkers);
    } finally {
      setIsLoading(false);
    }
  };

  const updateForm = (field: keyof WorkerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingWorker(null);
    resetForm();
  };

  const buildWorkerPayload = (includePassword: boolean) => {
    const payload: Partial<User> & { password?: string } = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      dni: formData.dni.trim(),
      department: formData.department,
      jobTitle: formData.jobTitle,
      baseSalary: Number(formData.baseSalary || 0),
      role: 'WORKER',
    };

    if (includePassword || formData.password) {
      payload.password = formData.password;
    }

    return payload;
  };

  const handleCreateWorker = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const payload = buildWorkerPayload(true) as Partial<User> & { password: string };
    const { password, ...safePayload } = payload;

    try {
      await usersApi.create(payload);
      toast.success('Trabajador creado correctamente');
      closeCreateDialog();
      await fetchWorkers();
    } catch {
      const newWorker: User = {
        id: String(Date.now()),
        ...safePayload,
        enabled: true,
        accountNonLocked: true,
        hospitalId: '1',
        hireDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User;
      setWorkers([newWorker, ...workers]);
      toast.success('Trabajador creado correctamente (modo demo)');
      closeCreateDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateWorker = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingWorker) return;
    setIsSubmitting(true);

    const payload = buildWorkerPayload(false);
    const { password, ...safePayload } = payload;

    try {
      const response = await usersApi.update(String(editingWorker.id), payload);
      setWorkers((prev) =>
        prev.map((worker) => (worker.id === editingWorker.id ? response.data : worker)),
      );
      toast.success('Trabajador actualizado correctamente');
      closeEditDialog();
    } catch {
      setWorkers((prev) =>
        prev.map((worker) =>
          worker.id === editingWorker.id ? { ...worker, ...safePayload } : worker,
        ),
      );
      toast.success('Trabajador actualizado (modo demo)');
      closeEditDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWorkers = workers.filter((worker) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !normalizedQuery
      || getDisplayName(worker).toLowerCase().includes(normalizedQuery)
      || worker.email.toLowerCase().includes(normalizedQuery)
      || (worker.dni ?? '').toLowerCase().includes(normalizedQuery);
    const matchesDepartment =
      departmentFilter === 'all' || worker.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const toggleWorkerStatus = async (worker: User) => {
    const nextStatus = !worker.enabled;
    try {
      await usersApi.update(String(worker.id), { enabled: nextStatus });
      setWorkers((prev) =>
        prev.map((item) =>
          item.id === worker.id ? { ...item, enabled: nextStatus } : item,
        ),
      );
      toast.success('Estado del trabajador actualizado');
    } catch {
      setWorkers((prev) =>
        prev.map((item) =>
          item.id === worker.id ? { ...item, enabled: nextStatus } : item,
        ),
      );
      toast.success('Estado del trabajador actualizado (modo demo)');
    }
  };

  const openCalendar = (id: string | number) => {
    router.push(`/dashboard/admin/workers/${id}/calendar`);
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

  const renderWorkerFormFields = (isEditMode: boolean) => (
    <FieldGroup className="py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="firstName">Nombre</FieldLabel>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(event) => updateForm('firstName', event.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="lastName">Apellidos</FieldLabel>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(event) => updateForm('lastName', event.target.value)}
            required
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(event) => updateForm('email', event.target.value)}
          required
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="phone">Telefono</FieldLabel>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(event) => updateForm('phone', event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="dni">DNI</FieldLabel>
          <Input
            id="dni"
            value={formData.dni}
            onChange={(event) => updateForm('dni', event.target.value)}
            required
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="department">Departamento</FieldLabel>
          <Select
            value={formData.department}
            onValueChange={(value) => updateForm('department', value)}
          >
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
        <FieldLabel htmlFor="baseSalary">Salario Base Mensual (EUR)</FieldLabel>
        <Input
          id="baseSalary"
          type="number"
          value={formData.baseSalary}
          onChange={(event) => updateForm('baseSalary', event.target.value)}
          placeholder="2500"
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Contrasena Inicial</FieldLabel>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(event) => updateForm('password', event.target.value)}
          placeholder={isEditMode ? 'Dejar en blanco si no cambia' : 'Minimo 8 caracteres'}
          required={!isEditMode}
        />
      </Field>
    </FieldGroup>
  );

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <DashboardShell
      title="Gestion de Trabajadores"
      description="Administra los empleados de tu hospital"
    >
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

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Trabajador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Contratar Trabajador</DialogTitle>
              <DialogDescription>
                Introduce los datos del nuevo empleado. Recibira un email con sus credenciales.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWorker}>
              {renderWorkerFormFields(false)}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeCreateDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" /> Creando...
                    </>
                  ) : (
                    'Contratar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => (open ? setIsEditDialogOpen(true) : closeEditDialog())}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Trabajador</DialogTitle>
            <DialogDescription>Actualiza los datos del empleado seleccionado.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateWorker}>
            {renderWorkerFormFields(true)}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" /> Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Listado de Trabajadores ({filteredWorkers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Salario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers.map((worker) => {
                const isActive = !!worker.enabled;
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
                      <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className={isActive ? 'bg-emerald-500/15 text-emerald-600' : ''}
                      >
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
                          <DropdownMenuItem onClick={() => handleEditWorker(worker)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => toggleWorkerStatus(worker)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isActive ? 'Dar de baja' : 'Activar'}
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
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No se encontraron trabajadores</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Intenta cambiar los filtros o agregar un nuevo empleado
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
