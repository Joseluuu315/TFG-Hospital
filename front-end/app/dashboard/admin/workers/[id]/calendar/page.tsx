'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Trash2 } from 'lucide-react';
import { usersApi, shiftTypesApi, type CalendarEvent, type ShiftType } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/lib/formatters';
import { toast } from 'sonner';

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const EVENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SHIFT:     { label: 'Turno',      color: 'bg-blue-500',    bg: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  DAY_OFF:   { label: 'Día Libre',  color: 'bg-emerald-500', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  HOLIDAY:   { label: 'Festivo',    color: 'bg-amber-500',   bg: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  VACATION:  { label: 'Vacaciones', color: 'bg-purple-500',  bg: 'bg-purple-500/10 text-purple-700 border-purple-200' },
  SICK_LEAVE:{ label: 'Baja',       color: 'bg-red-500',     bg: 'bg-red-500/10 text-red-700 border-red-200' },
};

const EVENT_TYPES = ['SHIFT', 'DAY_OFF', 'VACATION', 'HOLIDAY'] as const;

const defaultEventForm = {
  type: 'SHIFT' as string,
  shiftTypeCode: '',
  startTime: '',
  endTime: '',
  notes: '',
};

function getDaysInMonth(date: Date): (number | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const days: (number | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function AdminWorkerCalendarPage() {
  const params = useParams();
  const { user: adminUser } = useAuth();
  const hospitalId = String(adminUser?.hospitalId ?? '');
  const workerId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workerName, setWorkerName] = useState('Trabajador');
  const [eventForm, setEventForm] = useState(defaultEventForm);
  const [isSaving, setIsSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!workerId) { setIsLoading(false); return; }
    try {
      const [userRes, shiftTypesRes] = await Promise.all([
        usersApi.getById(workerId),
        hospitalId ? shiftTypesApi.getByHospital(hospitalId) : Promise.resolve({ data: [] as ShiftType[] }),
      ]);
      setWorkerName(getDisplayName(userRes.data) || `Trabajador ${workerId}`);
      setEvents(userRes.data.calendarEvents ?? []);
      setShiftTypes(shiftTypesRes.data);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar los datos del trabajador');
    } finally {
      setIsLoading(false);
    }
  }, [workerId, hospitalId]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (isLoading) return <DashboardLoading />;

  // ── Helpers de fecha ──────────────────────────────────────────────────────

  const toDateStr = (day: number) =>
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === currentDate.getFullYear() &&
    today.getMonth() === currentDate.getMonth() &&
    today.getDate() === day;

  const navigateMonth = (dir: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));
    setSelectedDate(null);
  };

  // ── Eventos del día seleccionado ──────────────────────────────────────────

  const selectedEvents = selectedDate ? events.filter((e) => e.date === selectedDate) : [];

  const getEventsForDay = (day: number) => events.filter((e) => e.date === toDateStr(day));

  // ── Añadir evento ─────────────────────────────────────────────────────────

  const handleAddEvent = async () => {
    if (!selectedDate || !workerId) return;
    if (eventForm.type === 'SHIFT' && !eventForm.shiftTypeCode) {
      toast.error('Selecciona el tipo de turno');
      return;
    }
    setIsSaving(true);
    try {
      const payload: Parameters<typeof usersApi.addCalendarEvent>[1] = {
        date: selectedDate,
        type: eventForm.type,
        notes: eventForm.notes || undefined,
      };
      if (eventForm.type === 'SHIFT') {
        const st = shiftTypes.find((s) => s.code === eventForm.shiftTypeCode);
        payload.startTime = eventForm.startTime || st?.startTime;
        payload.endTime   = eventForm.endTime   || st?.endTime;
        payload.notes     = eventForm.shiftTypeCode + (eventForm.notes ? ` — ${eventForm.notes}` : '');
      }
      const res = await usersApi.addCalendarEvent(workerId, payload);
      setEvents((prev) => [...prev, res.data]);
      setEventForm(defaultEventForm);
      toast.success('Evento añadido al calendario');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo añadir el evento');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Eliminar evento ───────────────────────────────────────────────────────

  const handleRemoveEvent = async (eventId: string) => {
    if (!workerId) return;
    setRemovingId(eventId);
    try {
      await usersApi.removeCalendarEvent(workerId, eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('Evento eliminado');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar el evento');
    } finally {
      setRemovingId(null);
    }
  };

  const days = getDaysInMonth(currentDate);

  return (
    <DashboardShell
      title={`Calendario de ${workerName}`}
      description="Consulta y gestiona los turnos, días libres y vacaciones del trabajador"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendario */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)} aria-label="Mes anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth(1)} aria-label="Mes siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Cabecera días de semana */}
            <div className="grid grid-cols-7 mb-2">
              {WEEK_DAYS.map((d) => (
                <div key={d} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas del mes */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
                const dateStr = toDateStr(day);
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      'aspect-square p-1 rounded-lg border transition-colors relative',
                      isToday(day) && 'border-primary',
                      isSelected && 'bg-primary/10 border-primary',
                      !isSelected && !isToday(day) && 'border-transparent hover:bg-muted',
                    )}
                  >
                    <div className={cn('text-sm font-medium', isToday(day) && 'text-primary')}>
                      {day}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((ev, i) => (
                          <div
                            key={i}
                            className={cn('w-1.5 h-1.5 rounded-full', EVENT_CONFIG[ev.type]?.color ?? 'bg-gray-400')}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
              {EVENT_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <div className={cn('w-3 h-3 rounded-full', EVENT_CONFIG[type].color)} />
                  <span className="text-muted-foreground">{EVENT_CONFIG[type].label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Panel lateral — detalle + asignación */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })
                  : 'Selecciona un día'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Haz clic en un día del calendario para ver los detalles y añadir eventos.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Eventos existentes */}
                  {selectedEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Sin eventos programados
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedEvents.map((ev) => {
                        const cfg = EVENT_CONFIG[ev.type] ?? { label: ev.type, bg: 'bg-muted' };
                        return (
                          <div
                            key={ev.id}
                            className={cn('rounded-lg border p-3 flex items-start justify-between gap-2', cfg.bg)}
                          >
                            <div className="min-w-0">
                              <Badge className="mb-1 text-xs" variant="outline">{cfg.label}</Badge>
                              {ev.startTime && ev.endTime && (
                                <p className="font-semibold text-sm">{ev.startTime} – {ev.endTime}</p>
                              )}
                              {ev.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.notes}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                              disabled={removingId === ev.id}
                              onClick={() => handleRemoveEvent(ev.id)}
                              aria-label="Eliminar evento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Formulario de asignación */}
                  <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Plus className="h-4 w-4" />
                      Añadir evento
                    </p>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={eventForm.type}
                        onValueChange={(v) => setEventForm((prev) => ({ ...prev, type: v, shiftTypeCode: '' }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{EVENT_CONFIG[t].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {eventForm.type === 'SHIFT' && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tipo de turno</Label>
                          <Select
                            value={eventForm.shiftTypeCode}
                            onValueChange={(v) => {
                              const st = shiftTypes.find((s) => s.code === v);
                              setEventForm((prev) => ({
                                ...prev,
                                shiftTypeCode: v,
                                startTime: st?.startTime ?? '',
                                endTime: st?.endTime ?? '',
                              }));
                            }}
                            disabled={shiftTypes.length === 0}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={shiftTypes.length === 0 ? 'Sin tipos disponibles' : 'Seleccionar'} />
                            </SelectTrigger>
                            <SelectContent>
                              {shiftTypes.map((st) => (
                                <SelectItem key={st.code} value={st.code}>
                                  {st.code} — {st.startTime}–{st.endTime}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Hora inicio</Label>
                            <Input
                              type="time"
                              className="h-9"
                              value={eventForm.startTime}
                              onChange={(e) => setEventForm((prev) => ({ ...prev, startTime: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Hora fin</Label>
                            <Input
                              type="time"
                              className="h-9"
                              value={eventForm.endTime}
                              onChange={(e) => setEventForm((prev) => ({ ...prev, endTime: e.target.value }))}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-xs">Notas (opcional)</Label>
                      <Input
                        className="h-9"
                        placeholder="Observaciones..."
                        value={eventForm.notes}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>

                    <Button
                      className="w-full"
                      size="sm"
                      onClick={handleAddEvent}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Guardando...' : 'Añadir al calendario'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
