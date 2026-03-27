'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { usersApi, type LeaveRequest } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

const mockLeaveRequests: LeaveRequest[] = [
  { id: '1', startDate: '2025-07-15', endDate: '2025-07-20', reason: 'Vacaciones familiares', status: 'PENDING', requestedAt: '2025-06-10T10:30:00' },
  { id: '2', startDate: '2025-06-05', endDate: '2025-06-05', reason: 'Cita medica', status: 'APPROVED', requestedAt: '2025-05-28T14:15:00', reviewedAt: '2025-05-29T09:00:00' },
  { id: '3', startDate: '2025-05-20', endDate: '2025-05-22', reason: 'Asuntos personales', status: 'REJECTED', reviewComment: 'Periodo de alta demanda, no es posible conceder dias libres', requestedAt: '2025-05-10T11:00:00', reviewedAt: '2025-05-12T16:30:00' },
  { id: '4', startDate: '2025-04-10', endDate: '2025-04-12', reason: 'Mudanza', status: 'APPROVED', requestedAt: '2025-03-25T09:00:00', reviewedAt: '2025-03-26T10:00:00' },
];

export default function WorkerLeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const response = await usersApi.getMyLeaveRequests();
      setLeaveRequests(response.data);
    } catch {
      console.log('[averonix] Backend no disponible, usando datos de ejemplo');
      setLeaveRequests(mockLeaveRequests);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await usersApi.createLeaveRequest(formData);
      toast.success('Solicitud enviada correctamente');
      setIsCreateDialogOpen(false);
      setFormData({ startDate: '', endDate: '', reason: '' });
      fetchLeaveRequests();
    } catch {
      // Mock para prototipo
      const newRequest: LeaveRequest = {
        id: String(Date.now()),
        ...formData,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      };
      setLeaveRequests([newRequest, ...leaveRequests]);
      toast.success('Solicitud enviada correctamente (modo demo)');
      setIsCreateDialogOpen(false);
      setFormData({ startDate: '', endDate: '', reason: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 gap-1">
            <CheckCircle className="h-3 w-3" />
            Aprobada
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rechazada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-8 w-8 text-muted-foreground" />;
      case 'APPROVED':
        return <CheckCircle className="h-8 w-8 text-emerald-500" />;
      case 'REJECTED':
        return <XCircle className="h-8 w-8 text-destructive" />;
      default:
        return <AlertCircle className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const pendingCount = leaveRequests.filter(r => r.status === 'PENDING').length;
  const approvedCount = leaveRequests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'REJECTED').length;

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
          title="Solicitud de Dias Libres" 
          description="Gestiona tus solicitudes de vacaciones y dias libres" 
        />
        
        <main className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dias Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">22</div>
                <p className="text-xs text-muted-foreground">De 30 anuales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aprobadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rechazadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Create Request Button */}
          <div className="flex justify-end">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Solicitud
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Solicitar Dias Libres</DialogTitle>
                  <DialogDescription>
                    Selecciona las fechas y explica el motivo de tu solicitud.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRequest}>
                  <FieldGroup className="py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="startDate">Fecha Inicio</FieldLabel>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="endDate">Fecha Fin</FieldLabel>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
                          required
                        />
                      </Field>
                    </div>
                    {formData.startDate && formData.endDate && (
                      <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                        Total: <span className="font-medium">{calculateDays(formData.startDate, formData.endDate)} dias</span>
                      </div>
                    )}
                    <Field>
                      <FieldLabel htmlFor="reason">Motivo</FieldLabel>
                      <Textarea
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Explica el motivo de tu solicitud..."
                        rows={3}
                        required
                      />
                    </Field>
                  </FieldGroup>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <><Spinner className="mr-2" /> Enviando...</> : 'Enviar Solicitud'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Requests List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Mis Solicitudes
              </CardTitle>
              <CardDescription>
                Historial de todas tus solicitudes de dias libres
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaveRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No tienes solicitudes</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crea tu primera solicitud de dias libres
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="hidden sm:flex shrink-0">
                          {getStatusIcon(request.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {new Date(request.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                {request.startDate !== request.endDate && (
                                  <> - {new Date(request.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</>
                                )}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({calculateDays(request.startDate, request.endDate)} {calculateDays(request.startDate, request.endDate) === 1 ? 'dia' : 'dias'})
                              </span>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>
                              Solicitado: {new Date(request.requestedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {request.reviewedAt && (
                              <span>
                                Revisado: {new Date(request.reviewedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {request.reviewComment && (
                            <div className="mt-3 p-3 rounded-lg bg-muted text-sm">
                              <span className="font-medium">Comentario:</span> {request.reviewComment}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
