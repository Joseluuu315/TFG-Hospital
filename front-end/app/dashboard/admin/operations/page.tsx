'use client';

import { useEffect, useState } from 'react';
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
import { hospitalSettingsApi, schedulingApi, shiftTypesApi, usersApi, type HospitalSettings, type ShiftAssignment, type ShiftType, type User } from '@/lib/api';
import { toast } from 'sonner';
import { Settings2, Sparkles, TimerReset, UsersRound } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

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
  const [assignedShifts, setAssignedShifts] = useState<ShiftAssignment[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isCreatingShiftType, setIsCreatingShiftType] = useState(false);
  const [isCreatingRequirement, setIsCreatingRequirement] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

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
        setWorkers(usersRes.data.filter((candidate) => candidate.role === 'WORKER' && String(candidate.hospitalId) === hospitalId));
      } catch (error) {
        console.error(error);
        setSettings({ ...defaultSettings, hospitalId });
        setShiftTypes([]);
        setWorkers([]);
        toast.error('No se pudieron cargar las operaciones del hospital');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [hospitalId]);

  if (isLoading) {
    return <DashboardLoading />;
  }

  const updateSettings = <K extends keyof HospitalSettings>(key: K, value: HospitalSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSaveSettings = async () => {
    if (!hospitalId) return;
    setIsSavingSettings(true);
    try {
      const response = await hospitalSettingsApi.update(hospitalId, { ...settings, hospitalId });
      setSettings(response.data);
      toast.success('Configuración guardada');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar la configuración');
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
      setShiftTypes((current) => [...current, response.data]);
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
    setIsCreatingRequirement(true);
    try {
      await schedulingApi.createRequirement(hospitalId, requirementForm);
      toast.success('Demanda de turno registrada');
      setRequirementForm(defaultRequirement);
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
      setAssignedShifts(response.data);
      toast.success(`Asignados ${response.data.length} turnos`);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo ejecutar la autoasignación');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  return (
    <DashboardShell
      title="Operaciones Hospitalarias"
      description="Configura reglas, define tipos de turno y lanza planificación automática"
    >
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Autoasignación</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">{assignedShifts.length}</div>
            <Sparkles className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Reglas del hospital
          </CardTitle>
          <CardDescription>Estas reglas alimentan tanto el planificador de turnos como la nómina avanzada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Horas máximas semanales</Label>
              <Input type="number" value={settings.maxWeeklyHours} onChange={(e) => updateSettings('maxWeeklyHours', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Descanso mínimo entre turnos</Label>
              <Input type="number" value={settings.minRestHours} onChange={(e) => updateSettings('minRestHours', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Días consecutivos máximos</Label>
              <Input type="number" value={settings.maxConsecutiveDays} onChange={(e) => updateSettings('maxConsecutiveDays', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Noches consecutivas máximas</Label>
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
              <Label>Plus nocturno</Label>
              <Input type="number" step="0.01" value={settings.nightBonusPct} onChange={(e) => updateSettings('nightBonusPct', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Plus festivo</Label>
              <Input type="number" step="0.01" value={settings.holidayBonusPct} onChange={(e) => updateSettings('holidayBonusPct', Number(e.target.value))} />
            </div>
            <div className="flex items-end justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Recalcular automáticamente</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Tipos de turno</CardTitle>
            <CardDescription>Define mañana, tarde, noche o cualquier patrón especial de tu hospital.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleCreateShiftType} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={shiftTypeForm.code} onChange={(e) => setShiftTypeForm((current) => ({ ...current, code: e.target.value.toUpperCase() }))} required />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={shiftTypeForm.name} onChange={(e) => setShiftTypeForm((current) => ({ ...current, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Hora inicio</Label>
                <Input type="time" value={shiftTypeForm.startTime} onChange={(e) => setShiftTypeForm((current) => ({ ...current, startTime: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Hora fin</Label>
                <Input type="time" value={shiftTypeForm.endTime} onChange={(e) => setShiftTypeForm((current) => ({ ...current, endTime: e.target.value }))} required />
              </div>
              <div className="flex items-end justify-between rounded-lg border p-4 md:col-span-2">
                <div>
                  <p className="font-medium">Cruza medianoche</p>
                  <p className="text-sm text-muted-foreground">Actívalo para turno noche o guardias largas</p>
                </div>
                <Switch checked={shiftTypeForm.crossesMidnight} onCheckedChange={(checked) => setShiftTypeForm((current) => ({ ...current, crossesMidnight: checked }))} />
              </div>
              <Button type="submit" className="md:col-span-2" disabled={isCreatingShiftType}>
                {isCreatingShiftType ? 'Creando...' : 'Crear tipo de turno'}
              </Button>
            </form>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Noche</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftTypes.map((shiftType) => (
                    <TableRow key={shiftType.id ?? shiftType.code}>
                      <TableCell className="font-medium">{shiftType.code}</TableCell>
                      <TableCell>{shiftType.startTime} - {shiftType.endTime}</TableCell>
                      <TableCell>
                        <Badge variant={shiftType.crossesMidnight ? 'default' : 'secondary'}>
                          {shiftType.crossesMidnight ? 'Sí' : 'No'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demanda y autoasignación</CardTitle>
            <CardDescription>Registra necesidades por día y dispara el planificador automático.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleCreateRequirement} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={requirementForm.date} onChange={(e) => setRequirementForm((current) => ({ ...current, date: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Input value={requirementForm.department} onChange={(e) => setRequirementForm((current) => ({ ...current, department: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Tipo de turno</Label>
                <Input value={requirementForm.shiftTypeCode} onChange={(e) => setRequirementForm((current) => ({ ...current, shiftTypeCode: e.target.value.toUpperCase() }))} required />
              </div>
              <div className="space-y-2">
                <Label>Trabajadores requeridos</Label>
                <Input type="number" min={1} value={requirementForm.requiredWorkers} onChange={(e) => setRequirementForm((current) => ({ ...current, requiredWorkers: Number(e.target.value) }))} required />
              </div>
              <Button type="submit" className="md:col-span-2" disabled={isCreatingRequirement}>
                {isCreatingRequirement ? 'Guardando...' : 'Registrar demanda'}
              </Button>
            </form>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input type="date" value={autoAssignRange.startDate} onChange={(e) => setAutoAssignRange((current) => ({ ...current, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input type="date" value={autoAssignRange.endDate} onChange={(e) => setAutoAssignRange((current) => ({ ...current, endDate: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleAutoAssign} disabled={isAutoAssigning}>
              {isAutoAssigning ? 'Planificando...' : 'Lanzar autoasignación'}
            </Button>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trabajador</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Fuente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedShifts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Aún no hay turnos asignados en esta sesión.
                      </TableCell>
                    </TableRow>
                  ) : assignedShifts.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.workerFullName}</TableCell>
                      <TableCell>{formatDate(assignment.startAt)}</TableCell>
                      <TableCell>{assignment.shiftTypeCode}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.source}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
