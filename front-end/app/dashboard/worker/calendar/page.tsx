'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { schedulingApi, usersApi, type LeaveRequest, type ShiftAssignment } from '@/lib/api';
import { cn } from '@/lib/utils';

const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [shiftsRes, leaveRes] = await Promise.all([
          schedulingApi.getMyShifts(),
          usersApi.getMyLeaveRequests(),
        ]);
        setShifts(shiftsRes.data);
        setLeaveRequests(leaveRes.data);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const leaveDays = useMemo(() => {
    const mapped = new Map<string, LeaveRequest[]>();
    leaveRequests.forEach((request) => {
      let current = new Date(request.startDate);
      const end = new Date(request.endDate);
      while (current <= end) {
        const key = current.toISOString().slice(0, 10);
        const currentValues = mapped.get(key) ?? [];
        mapped.set(key, [...currentValues, request]);
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      }
    });
    return mapped;
  }, [leaveRequests]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getDateKey = (day: number) =>
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getShiftsForDate = (day: number) => shifts.filter((shift) => shift.startAt.startsWith(getDateKey(day)));
  const getLeavesForDate = (day: number) => leaveDays.get(getDateKey(day)) ?? [];

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    setSelectedDate(null);
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === currentDate.getFullYear()
    && today.getMonth() === currentDate.getMonth()
    && today.getDate() === day;

  const selectedShifts = selectedDate ? shifts.filter((shift) => shift.startAt.startsWith(selectedDate)) : [];
  const selectedLeaves = selectedDate ? leaveDays.get(selectedDate) ?? [] : [];

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <DashboardShell title="Mis turnos" description="Consulta planificación, vacaciones y días aprobados">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 grid grid-cols-7">
              {weekDays.map((day) => (
                <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dateStr = getDateKey(day);
                const dayShifts = getShiftsForDate(day);
                const dayLeaves = getLeavesForDate(day);
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      'relative aspect-square rounded-lg border p-1 transition-colors',
                      isToday(day) && 'border-primary',
                      isSelected && 'border-primary bg-primary/10',
                      !isSelected && !isToday(day) && 'border-transparent hover:bg-muted',
                    )}
                  >
                    <div className={cn('text-sm font-medium', isToday(day) && 'text-primary')}>{day}</div>
                    <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                      {dayShifts.slice(0, 2).map((shift) => (
                        <div key={shift.id} className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      ))}
                      {dayLeaves.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                Turno asignado
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                Día libre o ausencia
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Selecciona un día'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <div className="py-8 text-center">
                <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Haz clic en un día para ver sus detalles.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedShifts.map((shift) => (
                  <div key={shift.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge className="bg-blue-500 text-white">{shift.shiftTypeCode}</Badge>
                      <span className="text-xs text-muted-foreground">{shift.department}</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {new Date(shift.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.endAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Fuente: {shift.source}</p>
                  </div>
                ))}

                {selectedLeaves.map((leave) => (
                  <div key={leave.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge className="bg-emerald-500 text-white">{leave.leaveType || 'VACATION'}</Badge>
                      <span className="text-xs text-muted-foreground">{leave.status}</span>
                    </div>
                    <p className="text-sm font-medium">{leave.reason}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{leave.paid ? 'Remunerado' : 'No remunerado'}</p>
                  </div>
                ))}

                {selectedShifts.length === 0 && selectedLeaves.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No hay actividad para este día.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
