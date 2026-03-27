'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { CalendarEvent } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const mockCalendarEvents: CalendarEvent[] = [
  { id: '1', date: '2025-06-02', type: 'SHIFT', startTime: '08:00', endTime: '16:00', notes: 'Turno manana' },
  { id: '2', date: '2025-06-03', type: 'SHIFT', startTime: '08:00', endTime: '16:00', notes: 'Turno manana' },
  { id: '3', date: '2025-06-04', type: 'DAY_OFF', notes: 'Dia libre' },
  { id: '4', date: '2025-06-05', type: 'SHIFT', startTime: '16:00', endTime: '00:00', notes: 'Turno tarde' },
  { id: '5', date: '2025-06-06', type: 'SHIFT', startTime: '08:00', endTime: '16:00', notes: 'Turno manana' },
  { id: '6', date: '2025-06-09', type: 'SHIFT', startTime: '08:00', endTime: '16:00', notes: 'Turno manana' },
  { id: '7', date: '2025-06-10', type: 'SHIFT', startTime: '08:00', endTime: '16:00', notes: 'Turno manana' },
  { id: '8', date: '2025-06-11', type: 'DAY_OFF', notes: 'Dia libre' },
  { id: '9', date: '2025-06-12', type: 'SHIFT', startTime: '16:00', endTime: '00:00', notes: 'Turno tarde' },
  { id: '10', date: '2025-06-13', type: 'SHIFT', startTime: '08:00', endTime: '16:00', notes: 'Turno manana' },
  { id: '11', date: '2025-06-16', type: 'SHIFT', startTime: '00:00', endTime: '08:00', notes: 'Turno noche' },
  { id: '12', date: '2025-06-17', type: 'SHIFT', startTime: '00:00', endTime: '08:00', notes: 'Turno noche' },
  { id: '13', date: '2025-06-18', type: 'HOLIDAY', notes: 'Festivo local' },
  { id: '14', date: '2025-06-19', type: 'DAY_OFF', notes: 'Dia libre' },
  { id: '15', date: '2025-06-20', type: 'SHIFT', startTime: '08:00', endTime: '16:00', notes: 'Turno manana' },
  { id: '16', date: '2025-06-23', type: 'VACATION', notes: 'Vacaciones' },
  { id: '17', date: '2025-06-24', type: 'VACATION', notes: 'Vacaciones' },
  { id: '18', date: '2025-06-25', type: 'VACATION', notes: 'Vacaciones' },
];

const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // Junio 2025
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setEvents(mockCalendarEvents);
      setIsLoading(false);
    }, 500);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Ajustar para que la semana empiece en lunes (0 = lunes)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    
    const days: (number | null)[] = [];
    
    // Dias vacios al principio
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'SHIFT':
        return 'bg-blue-500';
      case 'DAY_OFF':
        return 'bg-emerald-500';
      case 'HOLIDAY':
        return 'bg-amber-500';
      case 'VACATION':
        return 'bg-purple-500';
      case 'SICK_LEAVE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    setSelectedDate(null);
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (day: number) => {
    return today.getFullYear() === currentDate.getFullYear() &&
           today.getMonth() === currentDate.getMonth() &&
           today.getDate() === day;
  };

  const selectedDateStr = selectedDate;
  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

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
          title="Mi Calendario" 
          description="Consulta tus turnos y dias libres" 
        />
        
        <main className="p-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendar Grid */}
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
                {/* Week Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayEvents = getEventsForDate(day);
                    const isSelected = selectedDateStr === dateStr;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(dateStr)}
                        className={cn(
                          "aspect-square p-1 rounded-lg border transition-colors relative",
                          isToday(day) && "border-primary",
                          isSelected && "bg-primary/10 border-primary",
                          !isSelected && !isToday(day) && "border-transparent hover:bg-muted"
                        )}
                      >
                        <div className={cn(
                          "text-sm font-medium",
                          isToday(day) && "text-primary"
                        )}>
                          {day}
                        </div>
                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((event, i) => (
                              <div
                                key={i}
                                className={cn("w-1.5 h-1.5 rounded-full", getEventColor(event.type))}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
                  {[
                    { type: 'SHIFT', label: 'Turno', color: 'bg-blue-500' },
                    { type: 'DAY_OFF', label: 'Dia Libre', color: 'bg-emerald-500' },
                    { type: 'HOLIDAY', label: 'Festivo', color: 'bg-amber-500' },
                    { type: 'VACATION', label: 'Vacaciones', color: 'bg-purple-500' },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center gap-2 text-sm">
                      <div className={cn("w-3 h-3 rounded-full", item.color)} />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Day Details */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate 
                    ? new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                    : 'Selecciona un dia'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  selectedEvents.length > 0 ? (
                    <div className="space-y-4">
                      {selectedEvents.map((event) => (
                        <div key={event.id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={cn(
                              "text-white",
                              event.type === 'SHIFT' && "bg-blue-500",
                              event.type === 'DAY_OFF' && "bg-emerald-500",
                              event.type === 'HOLIDAY' && "bg-amber-500",
                              event.type === 'VACATION' && "bg-purple-500",
                              event.type === 'SICK_LEAVE' && "bg-red-500",
                            )}>
                              {event.type === 'SHIFT' && 'Turno'}
                              {event.type === 'DAY_OFF' && 'Dia Libre'}
                              {event.type === 'HOLIDAY' && 'Festivo'}
                              {event.type === 'VACATION' && 'Vacaciones'}
                              {event.type === 'SICK_LEAVE' && 'Baja'}
                            </Badge>
                          </div>
                          {event.startTime && event.endTime && (
                            <p className="text-lg font-semibold">
                              {event.startTime} - {event.endTime}
                            </p>
                          )}
                          {event.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarDays className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        No hay eventos programados para este dia
                      </p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Haz clic en un dia del calendario para ver los detalles
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
