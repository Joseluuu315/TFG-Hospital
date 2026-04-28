'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  hospitalSettingsApi,
  schedulingApi,
  shiftTypesApi,
  usersApi,
  type HospitalSettings,
  type ShiftAssignment,
  type ShiftRequirement,
  type ShiftType,
  type User,
} from '@/lib/api';
import { toast } from 'sonner';
import {
  Settings2,
  ClipboardList,
  TimerReset,
  UsersRound,
  AlertCircle,
  X,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

const DEPARTMENTS = [
  'UCI',
  'Urgencias',
  'Pediatria',
  'Cardiologia',
  'Neurologia',
  'Administracion',
  'Laboratorio',
];

const defaultSettings: HospitalSettings = {
  hospitalId: '',
  maxWeeklyHours: 40,
  minRestHours: 12,
  maxConsecutiveDays: 6,
  maxConsecutiveNights: 3,
  fairnessWeight: 1,
  autoRecalculate: true,
  nightBonusPct: 0.25,
  holidayBonusPct: 0.5,
  overtimeMultiplier: 1.5,
};

const defaultShiftType: ShiftType = {
  code: '',
  name: '',
  startTime: '08:00',
  endTime: '16:00',
  crossesMidnight: false,
};

const defaultRequirement = {
  date: '',
  department: '',
  shiftTypeCode: '',
  requiredWorkers: 1,
};

export default function AdminOperationsPage() {
  const { user } = useAuth();
  const hospitalId = String(user?.hospitalId ?? '');
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<HospitalSettings>(defaultSettings);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [shiftTypeForm, setShiftTypeForm] = useState<ShiftType>(defaultShiftType);
  const [requirementForm, setRequirementForm] = useState(defaultRequirement);
  const [autoAssignRange, setAutoAssignRange] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });
  const [existingAssignments, setExistingAssignments] = useState<ShiftAssignment[]>([]);
  const [existingRequirements, setExistingRequirements] = useState<ShiftRequirement[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isCreatingShiftType, setIsCreatingShiftType] = useState(false);
  const [isCreatingRequirement, setIsCreatingRequirement] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  useEffect(() => {
    if (!hospitalId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [settingsRes, shiftTypesRes, usersRes] = await Promise.all([
          hospitalSettingsApi.get(hospitalId),
          shiftTypesApi.getByHospital(hospitalId),
          usersApi.getAll(),
        ]);
        setSettings(settingsRes.data);
        setShiftTypes(shiftTypesRes.data);
        setWorkers(
          usersRes.data.filter(
            (c) => c.role === 'WORKER' && String(c.hospitalId) === hospitalId,
          ),
        );
      } catch (error) {
        console.error(error);
        setSettings({ ...defaultSettings, hospitalId });
        toast.error('No se pudieron cargar las operaciones del hospital');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [hospitalId]);

  const loadDataForRange = useCallback(async () => {
    if (!hospitalId) return;
    setIsLoadingAssignments(true);
    try {
      const [assignRes, reqRes] = await Promise.all([
        schedulingApi.getAssignments(hospitalId, autoAssignRange.startDate, autoAssignRange.endDate),
        schedulingApi.getRequirements(hospitalId, autoAssignRange.startDate, autoAssignRange.endDate),
      ]);
      setExistingAssignments(assignRes.data);
      setExistingRequirements(reqRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [hospitalId, autoAssignRange.startDate, autoAssignRange.endDate]);

  useEffect(() => {
    void loadDataForRange();
  }, [loadDataForRange]);

  if (isLoading) return <DashboardLoading />;

  const updateSettings = <K extends keyof HospitalSettings>(key: K, value: HospitalSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    if (!hospitalId) return;
    setIsSavingSettings(true);
    try {
      const response = await hospitalSettingsApi.update(hospitalId, { ...settings, hospitalId });
      setSettings(response.data);
      toast.success('Configuracion guardada');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar la configuracion');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateShiftType = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hospitalId) return;
    setIsCreatingShiftType(true);
    try {
      const response = await shiftTypesApi.create(hospitalId, shiftTypeForm);
      setShiftTypes((prev) => [...prev, response.data]);
      setShiftTypeForm(defaultShiftType);
      toast.success('Tipo de turno creado');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo crear el tipo de turno');
    } finally {
      setIsCreatingShiftType(false);
    }
  };

  const handleCreateRequirement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hospitalId) return;
    if (!requirementForm.shiftTypeCode) {
      toast.error('Selecciona un tipo de turno');
      return;
    }
    if (!requirementForm.department) {
      toast.error('Selecciona un departamento');
      return;
    }
    setIsCreatingRequirement(true);
    try {
      await schedulingApi.createRequirement(hospitalId, requirementForm);
      toast.success('Demanda de turno registrada');
      setRequirementForm(defaultRequirement);
      void loadDataForRange();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo registrar la demanda');
    } finally {
      setIsCreatingRequirement(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!hospitalId) return;
    setIsAutoAssigning(true);
    try {
      const response = await schedulingApi.autoAssign(hospitalId, autoAssignRange);
      toast.success(`Asignados ${response.data.length} turnos correctamente`);
      await loadDataForRange();
    } catch (error: unknown) {
      console.error(error);
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo ejecutar la asignacion';
      toast.error(msg);
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleCancelAssignment = async (shiftId: string) => {
    if (!hospitalId) return;
    try {
      await schedulingApi.cancelAssignment(hospitalId, shiftId);
      setExistingAssignments((prev) => prev.filter((a) => a.id !== shiftId));
      toast.success('Asignación cancelada');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cancelar la asignación');
    }
  };

  const handleDeleteRequirement = async (reqId: string) => {
    if (!hospitalId) return;
    try {
      await schedulingApi.deleteRequirement(hospitalId, reqId);
      setExistingRequirements((prev) => prev.filter((r) => r.id !== reqId));
      toast.success('Demanda eliminada');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar la demanda');
    }
  };

  const handleDeleteShiftType = async (code: string) => {
    if (!hospitalId) return;
    try {
      await shiftTypesApi.delete(hospitalId, code);
      setShiftTypes((prev) => prev.filter((st) => st.code !== code));
      toast.success('Tipo de turno eliminado');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar el tipo de turno');
    }
  };

  const shiftTypeCodes = shiftTypes.map((st) => st.code);

  return (
    <DashboardShell
      title="Operaciones Hospitalarias"
      description="Configura reglas, define tipos de turno y ejecuta la asignacion de turnos"
    >
      {/* Metricas resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trabajadores activos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">{workers.length}</div>
            <UsersRound className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tipos de turno</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">{shiftTypes.length}</div>
            <TimerReset className="h-5 w-5 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Asignaciones en rango</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">{existingAssignments.length}</div>
            <ClipboardList className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      {/* Reglas del hospital */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Reglas del hospital
          </CardTitle>
          <CardDescription>Estas reglas alimentan tanto el planificador de turnos como la nomina avanzada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Horas maximas semanales</Label>
              <Input type="number" value={settings.maxWeeklyHours} onChange={(e) => updateSettings('maxWeeklyHours', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Descanso minimo entre turnos (h)</Label>
              <Input type="number" value={settings.minRestHours} onChange={(e) => updateSettings('minRestHours', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Dias consecutivos maximos</Label>
              <Input type="number" value={settings.maxConsecutiveDays} onChange={(e) => updateSettings('maxConsecutiveDays', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Noches consecutivas maximas</Label>
              <Input type="number" value={settings.maxConsecutiveNights} onChange={(e) => updateSettings('maxConsecutiveNights', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Peso de fairness</Label>
              <Input type="number" step="0.1" value={settings.fairnessWeight} onChange={(e) => updateSettings('fairnessWeight', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Multiplicador de horas extra</Label>
              <Input type="number" step="0.1" value={settings.overtimeMultiplier} onChange={(e) => updateSettings('overtimeMultiplier', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Plus nocturno (%)</Label>
              <Input type="number" step="0.01" value={settings.nightBonusPct} onChange={(e) => updateSettings('nightBonusPct', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Plus festivo (%)</Label>
              <Input type="number" step="0.01" value={settings.holidayBonusPct} onChange={(e) => updateSettings('holidayBonusPct', Number(e.target.value))} />
            </div>
            <div className="flex items-end justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Recalcular automaticamente</p>
                <p className="text-sm text-muted-foreground">Replanifica ante bajas y cambios</p>
              </div>
              <Switch checked={settings.autoRecalculate} onCheckedChange={(checked) => updateSettings('autoRecalculate', checked)} />
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
            {isSavingSettings ? 'Guardando...' : 'Guardar reglas'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Tipos de turno */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de turno</CardTitle>
            <CardDescription>Define manana, tarde, noche o cualquier patron especial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleCreateShiftType} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Codigo</Label>
                <Input
                  value={shiftTypeForm.code}
                  onChange={(e) => setShiftTypeForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={shiftTypeForm.name}
                  onChange={(e) => setShiftTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Hora inicio</Label>
                <Input type="time" value={shiftTypeForm.startTime} onChange={(e) => setShiftTypeForm((prev) => ({ ...prev, startTime: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Hora fin</Label>
                <Input type="time" value={shiftTypeForm.endTime} onChange={(e) => setShiftTypeForm((prev) => ({ ...prev, endTime: e.target.value }))} required />
              </div>
              <div className="flex items-end justify-between rounded-lg border p-4 md:col-span-2">
                <div>
                  <p className="font-medium">Cruza medianoche</p>
                  <p className="text-sm text-muted-foreground">Activalo para turno noche o guardias largas</p>
                </div>
                <Switch checked={shiftTypeForm.crossesMidnight} onCheckedChange={(checked) => setShiftTypeForm((prev) => ({ ...prev, crossesMidnight: checked }))} />
              </div>
              <Button type="submit" className="md:col-span-2" disabled={isCreatingShiftType}>
                {isCreatingShiftType ? 'Creando...' : 'Crear tipo de turno'}
              </Button>
            </form>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Noche</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay tipos de turno creados aun.
                      </TableCell>
                    </TableRow>
                  ) : (
                    shiftTypes.map((st) => (
                      <TableRow key={st.id ?? st.code}>
                        <TableCell className="font-medium">{st.code}</TableCell>
                        <TableCell>{st.name}</TableCell>
                        <TableCell>{st.startTime} - {st.endTime}</TableCell>
                        <TableCell>
                          <Badge variant={st.crossesMidnight ? 'default' : 'secondary'}>
                            {st.crossesMidnight ? 'Si' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteShiftType(st.code)}
                            aria-label="Eliminar tipo de turno"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Demanda y asignacion */}
        <Card>
          <CardHeader>
            <CardTitle>Demanda y asignacion</CardTitle>
            <CardDescription>Registra necesidades por dia y ejecuta la asignacion del rango seleccionado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Advertencia si no hay tipos de turno */}
            {shiftTypes.length === 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Primero crea al menos un tipo de turno antes de registrar demandas.</span>
              </div>
            )}

            <form onSubmit={handleCreateRequirement} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={requirementForm.date}
                  onChange={(e) => setRequirementForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={requirementForm.department}
                  onValueChange={(value) => setRequirementForm((prev) => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de turno</Label>
                <Select
                  value={requirementForm.shiftTypeCode}
                  onValueChange={(value) => setRequirementForm((prev) => ({ ...prev, shiftTypeCode: value }))}
                  disabled={shiftTypes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={shiftTypes.length === 0 ? 'Sin tipos disponibles' : 'Seleccionar turno'} />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTypeCodes.map((code) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trabajadores requeridos</Label>
                <Input
                  type="number"
                  min={1}
                  value={requirementForm.requiredWorkers}
                  onChange={(e) => setRequirementForm((prev) => ({ ...prev, requiredWorkers: Number(e.target.value) }))}
                  required
                />
              </div>
              <Button type="submit" className="md:col-span-2" disabled={isCreatingRequirement || shiftTypes.length === 0}>
                {isCreatingRequirement ? 'Guardando...' : 'Registrar demanda'}
              </Button>
            </form>

            {/* Rango de asignacion */}
            <div className="space-y-3 rounded-lg border p-4">
              <p className="font-medium text-sm">Asignacion por rango de fechas</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Input
                    type="date"
                    value={autoAssignRange.startDate}
                    onChange={(e) => setAutoAssignRange((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Input
                    type="date"
                    value={autoAssignRange.endDate}
                    onChange={(e) => setAutoAssignRange((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleAutoAssign} disabled={isAutoAssigning} className="w-full">
                {isAutoAssigning ? 'Procesando...' : 'Ejecutar asignacion'}
              </Button>
            </div>

            {/* Tabla de asignaciones del rango */}
            <div className="rounded-lg border">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground">
                  Demandas registradas ({existingRequirements.length})
                </p>
                <Button variant="ghost" size="sm" onClick={loadDataForRange} disabled={isLoadingAssignments}>
                  {isLoadingAssignments ? 'Cargando...' : 'Actualizar'}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Requeridos</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingRequirements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No hay demandas en este rango de fechas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    existingRequirements.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{formatDate(req.date)}</TableCell>
                        <TableCell>{req.department}</TableCell>
                        <TableCell>{req.shiftTypeCode}</TableCell>
                        <TableCell>{req.requiredWorkers}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => req.id && handleDeleteRequirement(req.id)}
                            aria-label="Eliminar demanda"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Tabla de asignaciones del rango */}
            <div className="rounded-lg border">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground">
                  Asignaciones en el rango ({existingAssignments.length})
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trabajador</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No hay asignaciones en este rango de fechas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    existingAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.workerFullName}</TableCell>
                        <TableCell>{formatDate(assignment.startAt)}</TableCell>
                        <TableCell>{assignment.shiftTypeCode}</TableCell>
                        <TableCell>
                          <Badge variant={assignment.source === 'AUTO' ? 'default' : 'outline'}>
                            {assignment.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleCancelAssignment(assignment.id)}
                            aria-label="Cancelar asignación"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
