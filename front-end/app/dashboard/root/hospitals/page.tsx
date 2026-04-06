'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building2, Plus, Search, MoreHorizontal, Edit, Trash2, Ban, CheckCircle, Eye } from 'lucide-react';
import { hospitalsApi, type Hospital, type HospitalStatus } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

const mockHospitals: Hospital[] = [
  {
    id: '1',
    name: 'Hospital Central Trassierra',
    address: 'Av. Principal 123',
    city: 'Cordoba',
    province: 'Cordoba',
    taxId: 'B14123456',
    status: 'ACTIVE',
    announcements: [],
    createdAt: '2024-01-15',
    updatedAt: '2025-06-01',
  },
  {
    id: '2',
    name: 'Clinica San Rafael',
    address: 'Calle Secundaria 45',
    city: 'Sevilla',
    province: 'Sevilla',
    taxId: 'B41789012',
    status: 'ACTIVE',
    announcements: [],
    createdAt: '2024-03-20',
    updatedAt: '2025-05-28',
  },
  {
    id: '3',
    name: 'Hospital Regional Sur',
    address: 'Plaza Mayor 8',
    city: 'Malaga',
    province: 'Malaga',
    taxId: 'B29456789',
    status: 'PENDING_REVIEW',
    announcements: [],
    createdAt: '2025-05-10',
    updatedAt: '2025-05-10',
  },
  {
    id: '4',
    name: 'Clinica Norte',
    address: 'Av. del Norte 200',
    city: 'Granada',
    province: 'Granada',
    taxId: 'B18654321',
    status: 'SUSPENDED',
    announcements: [],
    createdAt: '2023-11-05',
    updatedAt: '2025-04-15',
  },
];

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    province: '',
    taxId: '',
    adminEmail: '',
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const response = await hospitalsApi.getAll();
      setHospitals(response.data);
    } catch {
      console.log('[averonix] Backend no disponible, usando datos de ejemplo');
      setHospitals(mockHospitals);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '', city: '', province: '', taxId: '', adminEmail: '' });
  };

  const openCreateDialog = () => {
    setEditingHospital(null);
    resetForm();
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setFormData({
      name: hospital.name,
      address: hospital.address,
      city: hospital.city,
      province: hospital.province,
      taxId: hospital.taxId,
      adminEmail: '',
    });
    setIsFormDialogOpen(true);
  };

  const openDetailsDialog = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setIsDetailDialogOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setEditingHospital(null);
    resetForm();
  };

  const handleSubmitHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingHospital) {
        const response = await hospitalsApi.update(editingHospital.id, {
          name: formData.name,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          taxId: formData.taxId,
        });
        setHospitals((prev) =>
          prev.map((hospital) => (hospital.id === editingHospital.id ? response.data : hospital))
        );
        toast.success('Hospital actualizado correctamente');
      } else {
        await hospitalsApi.create(formData);
        toast.success('Hospital creado correctamente');
        await fetchHospitals();
      }
      closeFormDialog();
    } catch {
      if (editingHospital) {
        setHospitals((prev) =>
          prev.map((hospital) =>
            hospital.id === editingHospital.id
              ? {
                  ...hospital,
                  name: formData.name,
                  address: formData.address,
                  city: formData.city,
                  province: formData.province,
                  taxId: formData.taxId,
                }
              : hospital,
          ),
        );
        toast.success('Hospital actualizado correctamente (modo demo)');
      } else {
        const newHospital: Hospital = {
          id: String(Date.now()),
          ...formData,
          status: 'PENDING_REVIEW',
          announcements: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setHospitals([newHospital, ...hospitals]);
        toast.success('Hospital creado correctamente (modo demo)');
      }
      closeFormDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHospital = async (hospital: Hospital) => {
    const confirmed = window.confirm(`Eliminar ${hospital.name}? Esta accion no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await hospitalsApi.delete(hospital.id);
      setHospitals((prev) => prev.filter((item) => item.id !== hospital.id));
      toast.success('Hospital eliminado correctamente');
    } catch {
      setHospitals((prev) => prev.filter((item) => item.id !== hospital.id));
      toast.success('Hospital eliminado correctamente (modo demo)');
    }
  };

  const handleStatusChange = async (hospitalId: string, newStatus: HospitalStatus) => {
    try {
      await hospitalsApi.updateStatus(hospitalId, newStatus);
      setHospitals(hospitals.map(h => 
        h.id === hospitalId ? { ...h, status: newStatus } : h
      ));
      toast.success(`Estado actualizado a ${newStatus}`);
    } catch {
      // Mock para prototipo
      setHospitals(hospitals.map(h => 
        h.id === hospitalId ? { ...h, status: newStatus } : h
      ));
      toast.success(`Estado actualizado a ${newStatus} (modo demo)`);
    }
  };

  const filteredHospitals = hospitals.filter((hospital) => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hospital.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || hospital.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25">Activo</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspendido</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="secondary">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <DashboardShell
      title="Gestion de Hospitales"
      description="Administra todos los centros hospitalarios de la red"
    >
      <div className="flex flex-col gap-4 rounded-xl border bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar hospital..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

        </div>

        <Dialog
          open={isFormDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeFormDialog();
            } else {
              setIsFormDialogOpen(true);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Hospital
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingHospital ? 'Editar Hospital' : 'Crear Nuevo Hospital'}</DialogTitle>
              <DialogDescription>
                Introduce los datos del centro hospitalario. Se enviara un email al administrador con sus credenciales.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitHospital}>
              <FieldGroup className="py-4">
                <Field>
                  <FieldLabel htmlFor="name">Nombre del Hospital</FieldLabel>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Hospital Central..."
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="taxId">CIF/NIF</FieldLabel>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="B12345678"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="address">Direccion</FieldLabel>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle Principal 123"
                    required
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="city">Ciudad</FieldLabel>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Cordoba"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="province">Provincia</FieldLabel>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="Cordoba"
                      required
                    />
                  </Field>
                </div>
                {!editingHospital && (
                  <Field>
                    <FieldLabel htmlFor="adminEmail">Email del Administrador</FieldLabel>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      placeholder="admin@hospital.com"
                      required
                    />
                  </Field>
                )}
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeFormDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : editingHospital ? 'Actualizar' : 'Crear Hospital'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredHospitals.map((hospital) => (
          <Card key={hospital.id} className="group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{hospital.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {hospital.taxId}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openDetailsDialog(hospital)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(hospital)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {hospital.status !== 'ACTIVE' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(hospital.id, 'ACTIVE')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                        Activar
                      </DropdownMenuItem>
                    )}
                    {hospital.status !== 'SUSPENDED' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(hospital.id, 'SUSPENDED')}>
                        <Ban className="mr-2 h-4 w-4 text-amber-600" />
                        Suspender
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteHospital(hospital)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{hospital.address}</p>
                <p className="text-muted-foreground">{hospital.city}, {hospital.province}</p>
                <div className="flex items-center justify-between pt-2">
                  {getStatusBadge(hospital.status)}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(hospital.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHospitals.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No se encontraron hospitales</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Intenta cambiar los filtros o crear un nuevo hospital
            </p>
          </div>
        </Card>
      )}

      <Dialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDetailDialogOpen(false);
            setSelectedHospital(null);
          } else {
            setIsDetailDialogOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Hospital</DialogTitle>
            <DialogDescription>
              Informacion general del centro seleccionado.
            </DialogDescription>
          </DialogHeader>
          {selectedHospital && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre</span>
                  <span className="font-medium">{selectedHospital.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CIF/NIF</span>
                  <span className="font-medium">{selectedHospital.taxId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Direccion</span>
                  <span className="font-medium">{selectedHospital.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ciudad</span>
                  <span className="font-medium">{selectedHospital.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provincia</span>
                  <span className="font-medium">{selectedHospital.province}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  {getStatusBadge(selectedHospital.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado</span>
                  <span className="font-medium">{formatDate(selectedHospital.createdAt)}</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
