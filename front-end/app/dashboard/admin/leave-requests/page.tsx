'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { leaveRequestsApi, type User as UserType, type LeaveRequest } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface RequestWithUser {
  user: UserType;
  request: LeaveRequest;
}

const mockRequests: RequestWithUser[] = [
  {
    user: { id: '1', firstName: 'Maria', lastName: 'Garcia Lopez', email: 'maria@hospital.com', role: 'WORKER', enabled: true, accountNonLocked: true, department: 'UCI', jobTitle: 'Enfermera', createdAt: '', updatedAt: '' },
    request: { id: '1', startDate: '2025-07-15', endDate: '2025-07-20', reason: 'Vacaciones familiares', status: 'PENDING', requestedAt: '2025-06-10T10:30:00' },
  },
  {
    user: { id: '2', firstName: 'Juan', lastName: 'Martinez Ruiz', email: 'juan@hospital.com', role: 'WORKER', enabled: true, accountNonLocked: true, department: 'Urgencias', jobTitle: 'Medico', createdAt: '', updatedAt: '' },
    request: { id: '2', startDate: '2025-07-05', endDate: '2025-07-05', reason: 'Cita medica', status: 'PENDING', requestedAt: '2025-06-08T14:15:00' },
  },
  {
    user: { id: '3', firstName: 'Ana', lastName: 'Fernandez Diaz', email: 'ana@hospital.com', role: 'WORKER', enabled: true, accountNonLocked: true, department: 'Pediatria', jobTitle: 'Pediatra', createdAt: '', updatedAt: '' },
    request: { id: '3', startDate: '2025-06-01', endDate: '2025-06-03', reason: 'Asuntos personales', status: 'APPROVED', requestedAt: '2025-05-20T09:00:00', reviewedAt: '2025-05-21T11:00:00' },
  },
  {
    user: { id: '4', firstName: 'Carlos', lastName: 'Rodriguez', email: 'carlos@hospital.com', role: 'WORKER', enabled: true, accountNonLocked: true, department: 'Administracion', jobTitle: 'Auxiliar', createdAt: '', updatedAt: '' },
    request: { id: '4', startDate: '2025-05-28', endDate: '2025-05-30', reason: 'Boda familiar', status: 'REJECTED', reviewComment: 'Coincide con periodo de alta demanda', requestedAt: '2025-05-15T16:00:00', reviewedAt: '2025-05-16T10:00:00' },
  },
];

export default function AdminLeaveRequestsPage() {
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithUser | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await leaveRequestsApi.getPending();
      setRequests(response.data);
    } catch {
      console.log('[averonix] Backend no disponible, usando datos de ejemplo');
      setRequests(mockRequests);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;
    setIsSubmitting(true);

    try {
      await leaveRequestsApi.review(selectedRequest.user.id, selectedRequest.request.id, {
        status,
        reviewComment: reviewComment || undefined,
      });
      toast.success(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'} correctamente`);
      setRequests(requests.map(r => 
        r.request.id === selectedRequest.request.id 
          ? { ...r, request: { ...r.request, status, reviewComment, reviewedAt: new Date().toISOString() } }
          : r
      ));
    } catch {
      // Mock para prototipo
      setRequests(requests.map(r => 
        r.request.id === selectedRequest.request.id 
          ? { ...r, request: { ...r.request, status, reviewComment, reviewedAt: new Date().toISOString() } }
          : r
      ));
      toast.success(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'} correctamente (modo demo)`);
    } finally {
      setIsSubmitting(false);
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewComment('');
    }
  };

  const openReviewDialog = (item: RequestWithUser) => {
    setSelectedRequest(item);
    setIsReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 gap-1"><CheckCircle className="h-3 w-3" />Aprobada</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const pendingRequests = requests.filter(r => r.request.status === 'PENDING');
  const processedRequests = requests.filter(r => r.request.status !== 'PENDING');

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

  const RequestCard = ({ item, showActions = false }: { item: RequestWithUser; showActions?: boolean }) => (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium shrink-0">
            {item.user.firstName[0]}{item.user.lastName[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">{item.user.firstName} {item.user.lastName}</p>
              {getStatusBadge(item.request.status)}
            </div>
            <p className="text-sm text-muted-foreground">{item.user.jobTitle} - {item.user.department}</p>
            <div className="mt-2">
              <p className="text-sm font-medium">
                {new Date(item.request.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                {item.request.startDate !== item.request.endDate && (
                  <> - {new Date(item.request.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</>
                )}
                <span className="text-muted-foreground font-normal ml-2">
                  ({calculateDays(item.request.startDate, item.request.endDate)} {calculateDays(item.request.startDate, item.request.endDate) === 1 ? 'dia' : 'dias'})
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">{item.request.reason}</p>
            </div>
            {item.request.reviewComment && (
              <div className="mt-2 p-2 rounded bg-muted text-sm">
                <span className="font-medium">Comentario:</span> {item.request.reviewComment}
              </div>
            )}
          </div>
        </div>
        {showActions && item.request.status === 'PENDING' && (
          <div className="flex gap-2 shrink-0">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => openReviewDialog(item)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => openReviewDialog(item)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex-1">
        <Header 
          title="Solicitudes de Dias Libres" 
          description="Gestiona las solicitudes de vacaciones y dias libres" 
        />
        
        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{pendingRequests.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aprobadas (Este mes)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {processedRequests.filter(r => r.request.status === 'APPROVED').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rechazadas (Este mes)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {processedRequests.filter(r => r.request.status === 'REJECTED').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Solicitudes
              </CardTitle>
              <CardDescription>
                Revisa y gestiona las solicitudes de los trabajadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending" className="gap-2">
                    Pendientes
                    {pendingRequests.length > 0 && (
                      <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="processed">Procesadas</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4 space-y-4">
                  {pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CheckCircle className="h-12 w-12 text-emerald-500/50 mb-4" />
                      <h3 className="text-lg font-medium">Todo al dia</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        No hay solicitudes pendientes de revision
                      </p>
                    </div>
                  ) : (
                    pendingRequests.map((item) => (
                      <RequestCard key={item.request.id} item={item} showActions />
                    ))
                  )}
                </TabsContent>
                <TabsContent value="processed" className="mt-4 space-y-4">
                  {processedRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium">Sin historial</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        No hay solicitudes procesadas
                      </p>
                    </div>
                  ) : (
                    processedRequests.map((item) => (
                      <RequestCard key={item.request.id} item={item} />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revisar Solicitud</DialogTitle>
              <DialogDescription>
                {selectedRequest && (
                  <>
                    Solicitud de <strong>{selectedRequest.user.firstName} {selectedRequest.user.lastName}</strong> para{' '}
                    {calculateDays(selectedRequest.request.startDate, selectedRequest.request.endDate)} dia(s) -{' '}
                    {selectedRequest.request.reason}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="comment">Comentario (opcional)</FieldLabel>
              <Textarea
                id="comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Anade un comentario para el trabajador..."
                rows={3}
              />
            </Field>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleReview('REJECTED')}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner className="mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                Rechazar
              </Button>
              <Button 
                onClick={() => handleReview('APPROVED')}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? <Spinner className="mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Aprobar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
