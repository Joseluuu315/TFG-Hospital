'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { hospitalsApi, usersApi, type Hospital, type User, type UserRole } from '@/lib/api';
import { formatDate, getDisplayName, getInitials } from '@/lib/formatters';
import { ArrowLeft, MoreHorizontal, Plus, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';

const departments = [
  'Administracion',
  'UCI',
  'Urgencias',
  'Pediatria',
  'Cardiologia',
  'Neurologia',
  'Laboratorio',
];

const jobTitles = [
  'Administrador del hospital',
  'Coordinador',
  'Medico',
  'Enfermera',
  'Auxiliar',
  'Tecnico',
];

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dni: '',
  department: '',
  jobTitle: '',
  baseSalary: '',
  password: '',
  role: 'WORKER' as UserRole,
};

type UserFormState = typeof initialForm;

export default function RootHospitalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hospitalId = Array.isArray(params.id) ? params.id[0] : String(params.id ?? '');
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<UserFormState>(initialForm);

  const admins = useMemo(
    () => users.filter((user) => user.role === 'HOSPITAL_ADMIN'),
    [users],
  );
  const workers = useMemo(
    () => users.filter((user) => user.role === 'WORKER'),
    [users],
  );

  const loadHospitalData = useCallback(async () => {
    if (!hospitalId) {
      setIsLoading(false);
      return;
    }
    try {
      const [hospitalRes, usersRes] = await Promise.all([
        hospitalsApi.getById(hospitalId),
        usersApi.getAll(),
      ]);
      setHospital(hospitalRes.data);
      setUsers(usersRes.data.filter((user) => String(user.hospitalId) === hospitalId));
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cargar el hospital');
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    void loadHospitalData();
  }, [loadHospitalData]);

  const updateForm = (field: keyof UserFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingUser(null);
  };

  const openCreateDialog = (role: UserRole) => {
    resetForm();
    setForm((current) => ({
      ...current,
      role,
      department: role === 'HOSPITAL_ADMIN' ? 'Administracion' : '',
      jobTitle: role === 'HOSPITAL_ADMIN' ? 'Administrador del hospital' : '',
    }));
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      dni: user.dni || '',
      department: user.department || '',
      jobTitle: user.jobTitle || '',
      baseSalary: String(user.baseSalary || ''),
      password: '',
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hospitalId) return;
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const response = await usersApi.update(String(editingUser.id), {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          dni: form.dni,
          department: form.department,
          jobTitle: form.jobTitle,
          baseSalary: Number(form.baseSalary || 0),
          password: form.password || undefined,
          role: form.role,
        });
        setUsers((current) => current.map((user) => (user.id === editingUser.id ? response.data : user)));
        toast.success('Usuario actualizado');
      } else {
        const response = await usersApi.create({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          dni: form.dni,
          department: form.department,
          jobTitle: form.jobTitle,
          baseSalary: Number(form.baseSalary || 0),
          password: form.password,
          hospitalId,
          role: form.role,
        });
        setUsers((current) => [response.data, ...current]);
        toast.success(form.role === 'HOSPITAL_ADMIN' ? 'Administrador creado' : 'Trabajador creado');
      }
      closeDialog();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      await usersApi.update(String(user.id), { enabled: !user.enabled });
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, enabled: !item.enabled } : item)),
      );
      toast.success('Estado actualizado');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo actualizar el estado');
    }
  };

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (!hospital) {
    return (
      <DashboardShell title="Hospital no encontrado">
        <Button variant="outline" onClick={() => router.push('/dashboard/root/hospitals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a hospitales
        </Button>
      </DashboardShell>
    );
  }

  const renderUserTable = (items: User[]) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay usuarios en esta categoría.</p>
      ) : items.map((user) => (
        <div key={String(user.id)} className="flex items-center justify-between rounded-lg border bg-background/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              {getInitials(user)}
            </div>
            <div>
              <p className="font-medium">{getDisplayName(user)}</p>
              <p className="text-xs text-muted-foreground">
                {user.email} · {user.department || 'Sin departamento'} · {user.jobTitle || 'Sin cargo'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={user.enabled ? 'default' : 'secondary'} className={user.enabled ? 'bg-emerald-500/15 text-emerald-600' : ''}>
              {user.enabled ? 'Activo' : 'Inactivo'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void toggleUserStatus(user)}>
                  {user.enabled ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <DashboardShell
      title={hospital.name}
      description="Gestión del hospital desde superadmin: administradores, trabajadores y estado operativo"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard/root/hospitals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openCreateDialog('HOSPITAL_ADMIN')}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Nuevo admin
          </Button>
          <Button onClick={() => openCreateDialog('WORKER')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo trabajador
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{hospital.status}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{admins.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trabajadores</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{workers.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alta</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{formatDate(hospital.createdAt)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ficha del hospital</CardTitle>
          <CardDescription>{hospital.address}, {hospital.city}, {hospital.province} · {hospital.taxId}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Administradores hospitalarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderUserTable(admins)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Trabajadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderUserTable(workers)}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar usuario' : `Crear ${form.role === 'HOSPITAL_ADMIN' ? 'administrador' : 'trabajador'}`}</DialogTitle>
            <DialogDescription>
              Este usuario quedará vinculado a {hospital.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="py-4">
              {!editingUser && (
                <Field>
                  <FieldLabel>Rol</FieldLabel>
                  <Select value={form.role} onValueChange={(value: UserRole) => setForm((current) => ({
                    ...current,
                    role: value,
                    department: value === 'HOSPITAL_ADMIN' ? 'Administracion' : current.department,
                    jobTitle: value === 'HOSPITAL_ADMIN' ? 'Administrador del hospital' : current.jobTitle,
                  }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOSPITAL_ADMIN">Admin hospital</SelectItem>
                      <SelectItem value="WORKER">Trabajador</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Nombre</FieldLabel>
                  <Input value={form.firstName} onChange={(e) => updateForm('firstName', e.target.value)} required />
                </Field>
                <Field>
                  <FieldLabel>Apellidos</FieldLabel>
                  <Input value={form.lastName} onChange={(e) => updateForm('lastName', e.target.value)} required />
                </Field>
              </div>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} required />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Teléfono</FieldLabel>
                  <Input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>DNI</FieldLabel>
                  <Input value={form.dni} onChange={(e) => updateForm('dni', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Departamento</FieldLabel>
                  <Select value={form.department} onValueChange={(value) => updateForm('department', value)}>
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
                  <FieldLabel>Cargo</FieldLabel>
                  <Select value={form.jobTitle} onValueChange={(value) => updateForm('jobTitle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTitles.map((jobTitle) => (
                        <SelectItem key={jobTitle} value={jobTitle}>
                          {jobTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel>Salario base mensual</FieldLabel>
                <Input type="number" value={form.baseSalary} onChange={(e) => updateForm('baseSalary', e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>{editingUser ? 'Nueva contraseña' : 'Contraseña inicial'}</FieldLabel>
                <Input type="password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} required={!editingUser} />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
