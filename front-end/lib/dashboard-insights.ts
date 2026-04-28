import type {
  Announcement,
  GlobalStats,
  Hospital,
  LeaveRequest,
  ShiftAssignment,
  User,
} from '@/lib/api';

export interface DashboardActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp?: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

export interface DashboardAlertItem {
  id: string;
  title: string;
  detail: string;
  tone: 'info' | 'warning' | 'danger';
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function sortByNewest<T>(items: T[], resolveDate: (item: T) => string | undefined | null) {
  return [...items].sort((left, right) => getTimeValue(resolveDate(right)) - getTimeValue(resolveDate(left)));
}

export function buildRootActivityFeed(hospitals: Hospital[]): DashboardActivityItem[] {
  const hospitalEvents = hospitals.map((hospital) => ({
    id: `hospital-${hospital.id}`,
    title: resolveHospitalEventTitle(hospital),
    detail: hospital.name,
    timestamp: hospital.updatedAt || hospital.createdAt,
    tone: resolveHospitalEventTone(hospital.status),
  }));

  const announcementEvents = hospitals.flatMap((hospital) =>
    (hospital.announcements || []).map((announcement) => ({
      id: `announcement-${announcement.id}`,
      title: 'Anuncio publicado',
      detail: `${hospital.name}: ${announcement.title}`,
      timestamp: announcement.publishedAt,
      tone: resolveAnnouncementTone(announcement.priority),
    }))
  );

  return sortByNewest([...hospitalEvents, ...announcementEvents], (item) => item.timestamp).slice(0, 6);
}

export function buildRootAlerts(stats: GlobalStats | null, hospitals: Hospital[]): DashboardAlertItem[] {
  const pendingHospitals = hospitals.filter((hospital) => hospital.status === 'PENDING_REVIEW').length;
  const suspendedHospitals = hospitals.filter((hospital) => hospital.status === 'SUSPENDED').length;
  const hospitalsWithoutAnnouncements = hospitals.filter(
    (hospital) => (hospital.announcements || []).filter((announcement) => announcement.active).length === 0
  ).length;

  const alerts: DashboardAlertItem[] = [];

  if (pendingHospitals > 0) {
    alerts.push({
      id: 'pending-hospitals',
      title: 'Hospitales pendientes de revision',
      detail: `${pendingHospitals} centro${pendingHospitals === 1 ? '' : 's'} requiere${pendingHospitals === 1 ? '' : 'n'} validacion.`,
      tone: 'warning',
    });
  }

  if (suspendedHospitals > 0) {
    alerts.push({
      id: 'suspended-hospitals',
      title: 'Centros suspendidos',
      detail: `${suspendedHospitals} hospital${suspendedHospitals === 1 ? '' : 'es'} sigue${suspendedHospitals === 1 ? '' : 'n'} bloqueado${suspendedHospitals === 1 ? '' : 's'}.`,
      tone: 'danger',
    });
  }

  if (hospitalsWithoutAnnouncements > 0) {
    alerts.push({
      id: 'silent-hospitals',
      title: 'Comunicacion inactiva',
      detail: `${hospitalsWithoutAnnouncements} hospital${hospitalsWithoutAnnouncements === 1 ? '' : 'es'} no tiene${hospitalsWithoutAnnouncements === 1 ? '' : 'n'} anuncios activos.`,
      tone: 'info',
    });
  }

  if (!alerts.length && stats) {
    alerts.push({
      id: 'healthy-network',
      title: 'Sin incidencias operativas',
      detail: `${stats.activeHospitals} hospitales activos y ${stats.totalUsers} usuarios sincronizados.`,
      tone: 'info',
    });
  }

  return alerts;
}

export function getRecentWorkers(workers: User[], limit = 5) {
  return sortByNewest(
    workers.filter((worker) => worker.role === 'WORKER'),
    (worker) => worker.createdAt || worker.hireDate || worker.updatedAt
  ).slice(0, limit);
}

export function getActiveAnnouncements(announcements: Announcement[]) {
  return sortByNewest(
    announcements.filter((announcement) => announcement.active),
    (announcement) => announcement.publishedAt
  );
}

export function getTodayShifts(shifts: ShiftAssignment[], baseDate = new Date()) {
  const today = baseDate.toISOString().split('T')[0];
  return shifts.filter((shift) => shift.startAt.startsWith(today));
}

export function getUpcomingShifts(shifts: ShiftAssignment[], baseDate = new Date(), limit = 5) {
  return shifts
    .filter((shift) => getTimeValue(shift.startAt) > baseDate.getTime())
    .sort((left, right) => getTimeValue(left.startAt) - getTimeValue(right.startAt))
    .slice(0, limit);
}

export function countApprovedLeaveDays(requests: LeaveRequest[]) {
  return requests
    .filter((request) => request.status === 'APPROVED')
    .reduce((total, request) => total + getInclusiveDaySpan(request.startDate, request.endDate), 0);
}

export function formatRelativeTime(value?: string | null) {
  const time = getTimeValue(value);
  if (!time) return '-';

  const diff = Date.now() - time;
  const minutes = Math.max(1, Math.round(diff / 60000));

  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `Hace ${days} d`;

  return new Date(time).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

function getInclusiveDaySpan(startDate: string, endDate: string) {
  const start = getTimeValue(startDate);
  const end = getTimeValue(endDate);
  if (!start || !end || end < start) return 0;
  return Math.floor((end - start) / DAY_IN_MS) + 1;
}

function resolveHospitalEventTitle(hospital: Hospital) {
  if (hospital.status === 'PENDING_REVIEW') return 'Hospital pendiente de revision';
  if (hospital.status === 'SUSPENDED') return 'Hospital suspendido';
  return 'Hospital actualizado';
}

function resolveHospitalEventTone(status: Hospital['status']): DashboardActivityItem['tone'] {
  if (status === 'SUSPENDED') return 'danger';
  if (status === 'PENDING_REVIEW') return 'warning';
  return 'success';
}

function resolveAnnouncementTone(priority: Announcement['priority']): DashboardActivityItem['tone'] {
  if (priority === 'HIGH') return 'danger';
  if (priority === 'MEDIUM') return 'warning';
  return 'info';
}

function getTimeValue(value?: string | null) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
