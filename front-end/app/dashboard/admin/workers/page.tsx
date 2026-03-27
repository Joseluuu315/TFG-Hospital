  'use client';

  import React, { useEffect, useState } from 'react';
  import { Sidebar } from '@/components/dashboard/sidebar';
  import { Header } from '@/components/dashboard/header';
  import { useRouter } from "next/navigation";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Badge } from '@/components/ui/badge';
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
  import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
  import { Users, Plus, Search, MoreHorizontal, Edit, Trash2, Mail, Phone, Calendar } from 'lucide-react';
  import { usersApi, type User } from '@/lib/api';
  import { Spinner } from '@/components/ui/spinner';
  import { toast } from 'sonner';


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

  const departments = ['UCI', 'Urgencias', 'Pediatria', 'Cardiologia', 'Neurologia', 'Administracion', 'Laboratorio'];
  const jobTitles = ['Medico', 'Enfermera', 'Auxiliar', 'Pediatra', 'Cirujano', 'Tecnico', 'Auxiliar Administrativo'];

  export default function WorkersPage() {
    const router = useRouter();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<User | null>(null);
    const [workers, setWorkers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dni: '',
      department: '',
      jobTitle: '',
      baseSalary: '',
      password: '',
    });

    useEffect(() => {
      fetchWorkers().then(r => {});
    }, []);

    const fetchWorkers = async () => {
      try {
        const response = await usersApi.getAll();
        setWorkers(response.data.filter(u => u.role === 'WORKER'));
      } catch {
        console.log('[averonix] Backend no disponible, usando datos de ejemplo');
        setWorkers(mockWorkers);
      } finally {
        setIsLoading(false);
      }
    };

    const handleCreateWorker = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        await usersApi.create({
          ...formData,
          baseSalary: Number(formData.baseSalary),
          role: 'WORKER',
        });
        toast.success('Trabajador creado correctamente');
        setIsCreateDialogOpen(false);
        resetForm();
        await fetchWorkers();
      } catch {
        // Mock para prototipo
        const newWorker: User = {
          id: String(Date.now()),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dni: formData.dni,
          department: formData.department,
          jobTitle: formData.jobTitle,
          baseSalary: Number(formData.baseSalary),
          role: 'WORKER',
          enabled: true,
          accountNonLocked: true,
          hospitalId: '1',
          hireDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setWorkers([newWorker, ...workers]);
        toast.success('Trabajador creado correctamente (modo demo)');
        setIsCreateDialogOpen(false);
        resetForm();
      } finally {
        setIsSubmitting(false);
      }
    };

    const resetForm = () => {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dni: '',
        department: '',
        jobTitle: '',
        baseSalary: '',
        password: '',
      });
    };

    const filteredWorkers = workers.filter((worker) => {
      const fullName = `${worker.firstName} ${worker.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                           worker.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || worker.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });

    const toggleWorkerStatus = (id: string | number) => {
      setWorkers((prev) =>
          prev.map((worker) =>
              worker.id === id ? { ...worker, enabled: !worker.enabled } : worker
          )
      );

      toast.success("Estado del trabajador actualizado");
    };

    const openCalendar = (id: string | number) => {
      router.push(`/dashboard/workers/${id}/calendar`);
    };

    const handleEditWorker = (worker: User) => {
      setEditingWorker(worker);

      setFormData({
        firstName: worker.firstName || "",
        lastName: worker.lastName || "",
        email: worker.email || "",
        phone: worker.phone || "",
        dni: worker.dni || "",
        department: worker.department || "",
        jobTitle: worker.jobTitle || "",
        baseSalary: String(worker.baseSalary || ""),
        password: "",
      });

      setIsEditDialogOpen(true);
    };
    const updateWorker = () => {
      if (!editingWorker) return;

      setWorkers((prev) =>
          prev.map((w) =>
              w.id === editingWorker.id
                  ? {
                    ...w,
                    ...formData,
                    baseSalary: Number(formData.baseSalary),
                  }
                  : w
          )
      );

      toast.success("Trabajador actualizado");
      setIsEditDialogOpen(false);
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
            title="Gestion de Trabajadores"
            description="Administra los empleados de tu hospital"
          />

          <main className="p-6 space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar trabajador..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
                    <FieldGroup className="py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="firstName">Nombre</FieldLabel>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="lastName">Apellidos</FieldLabel>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="phone">Telefono</FieldLabel>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="dni">DNI</FieldLabel>
                          <Input
                            id="dni"
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                            required
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="department">Departamento</FieldLabel>
                          <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="jobTitle">Cargo</FieldLabel>
                          <Select value={formData.jobTitle} onValueChange={(v) => setFormData({ ...formData, jobTitle: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {jobTitles.map((job) => (
                                <SelectItem key={job} value={job}>{job}</SelectItem>
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
                          onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Minimo 8 caracteres"
                          required
                        />
                      </Field>
                    </FieldGroup>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <><Spinner className="mr-2" /> Creando...</> : 'Contratar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Workers Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Listado de Trabajadores ({filteredWorkers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
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
                    {filteredWorkers.map((worker) => (
                      <TableRow key={worker.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                              {worker.firstName?.[0]}{worker.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium">{worker.firstName} {worker.lastName}</p>
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
                        <TableCell>
                          {worker.baseSalary?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={worker.enabled ? 'default' : 'secondary'} className={worker.enabled ? 'bg-emerald-500/15 text-emerald-600' : ''}>
                            {worker.enabled ? 'Activo' : 'Inactivo'}
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
                                  onClick={() => toggleWorkerStatus(worker.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {worker.enabled ? "Dar de baja" : "Activar"}
                              </DropdownMenuItem>

                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

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
          </main>
        </div>
      </div>
    );
  }
