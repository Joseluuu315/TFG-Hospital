import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: nextRefreshToken } = response.data as AuthResponse;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', nextRefreshToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export type UserRole = 'ROOT' | 'HOSPITAL_ADMIN' | 'WORKER';
export type HospitalStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW';
export type AnnouncementPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type CalendarEventType = 'SHIFT' | 'HOLIDAY' | 'DAY_OFF' | 'SICK_LEAVE' | 'VACATION';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PayrollStatus = 'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED';
export type ChatType = 'PRIVATE' | 'GROUP' | 'HOSPITAL' | 'SUPPORT';
export type ShiftAssignmentSource = 'MANUAL' | 'AUTO' | 'RECALCULATED';
export type ShiftAssignmentStatus = 'ASSIGNED' | 'WORKED' | 'CANCELLED';
export type PayrollAdjustmentType = 'BONUS' | 'PENALTY';
export type PayrollItemType =
  | 'BASE_HOURS'
  | 'NIGHT_BONUS'
  | 'HOLIDAY_BONUS'
  | 'OVERTIME'
  | 'UNPAID_ABSENCE'
  | 'MANUAL_BONUS'
  | 'MANUAL_PENALTY';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  authorId: string;
  publishedAt: string;
  expiresAt?: string;
  active: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  taxId: string;
  status: HospitalStatus;
  superAdminId?: string;
  announcements: Announcement[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  type: CalendarEventType;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  userId?: string;
  hospitalId?: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType?: string;
  paid?: boolean;
  status: LeaveRequestStatus;
  reviewComment?: string;
  reviewedBy?: string;
  requestedAt: string;
  reviewedAt?: string;
}

export interface User {
  id: string | number;
  firstName?: string;
  lastName?: string;
  nombre?: string;
  apellidos?: string;
  imageURL?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  dni?: string;
  role: UserRole;
  enabled?: boolean;
  accountNonLocked?: boolean;
  hospitalId?: string | number;
  hospitalName?: string;
  department?: string;
  jobTitle?: string;
  hireDate?: string;
  baseSalary?: number;
  calendarEvents?: CalendarEvent[];
  leaveRequests?: LeaveRequest[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Payroll {
  id: string;
  workerId: string;
  workerFullName: string;
  hospitalId: string;
  period: string;
  grossSalary: number;
  socialSecurityWorker: number;
  incomeTaxWithholding: number;
  otherDeductions: number;
  netSalary: number;
  overtimeAmount: number;
  bonusAmount: number;
  pdfPath?: string;
  status: PayrollStatus;
  acknowledgedAt?: string;
  issuedAt: string;
}

export interface PayrollItem {
  id: string;
  payrollId: string;
  workerId: string;
  hospitalId: string;
  type: PayrollItemType;
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
}

export interface PayrollAdjustment {
  id?: string;
  hospitalId: string;
  workerId: string;
  period: string;
  type: PayrollAdjustmentType;
  description: string;
  amount: number;
  createdBy: string;
  createdAt?: string;
}

export interface HospitalSettings {
  hospitalId: string;
  maxWeeklyHours: number;
  minRestHours: number;
  maxConsecutiveDays: number;
  maxConsecutiveNights: number;
  fairnessWeight: number;
  autoRecalculate: boolean;
  nightBonusPct: number;
  holidayBonusPct: number;
  overtimeMultiplier: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkerContract {
  id?: string;
  hospitalId: string;
  workerId: string;
  hourlyRate: number;
  weeklyHours: number;
  nightBonusPct: number;
  holidayBonusPct: number;
  overtimeMultiplier: number;
  effectiveFrom: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShiftType {
  id?: string;
  hospitalId?: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  crossesMidnight: boolean;
}

export interface ShiftRequirement {
  id?: string;
  date: string;
  department: string;
  shiftTypeCode: string;
  requiredWorkers: number;
}

export interface ShiftAssignment {
  id: string;
  hospitalId: string;
  workerId: string;
  workerFullName: string;
  department: string;
  shiftTypeCode: string;
  startAt: string;
  endAt: string;
  status: ShiftAssignmentStatus;
  source: ShiftAssignmentSource;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  hospitalId: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  description?: string;
  participants: string[];
  participantNames: string[];
  createdBy: string;
  hospitalId?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface WorkGroup {
  id: string;
  name: string;
  description: string;
  hospitalId: string;
  members: string[];
  memberNames: string[];
  createdBy: string;
  chatId: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}

export interface GlobalStats {
  totalHospitals: number;
  activeHospitals: number;
  suspendedHospitals: number;
  totalUsers: number;
  usersByRole: {
    ROOT: number;
    HOSPITAL_ADMIN: number;
    WORKER: number;
  };
  payrollsByMonth: { month: string; count: number; total: number }[];
}

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  refresh: (refreshToken: string) => api.post<AuthResponse>('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
  requestPasswordReset: (data: ForgotPasswordRequest) => api.post<MessageResponse>('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordRequest) => api.post<MessageResponse>('/auth/reset-password', data),
};

export const hospitalsApi = {
  getAll: () => api.get<Hospital[]>('/hospitals'),
  getById: (id: string) => api.get<Hospital>(`/hospitals/${id}`),
  create: (data: Partial<Hospital> & { adminEmail: string }) => api.post<Hospital>('/hospitals', data),
  update: (id: string, data: Partial<Hospital>) => api.put<Hospital>(`/hospitals/${id}`, data),
  updateStatus: (id: string, status: HospitalStatus) => api.patch<Hospital>(`/hospitals/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/hospitals/${id}`),
  addAnnouncement: (hospitalId: string, data: Partial<Announcement>) =>
    api.post<Announcement>(`/hospitals/${hospitalId}/announcements`, data),
  updateAnnouncement: (hospitalId: string, announcementId: string, data: Partial<Announcement>) =>
    api.put<Announcement>(`/hospitals/${hospitalId}/announcements/${announcementId}`, data),
  deleteAnnouncement: (hospitalId: string, announcementId: string) =>
    api.delete(`/hospitals/${hospitalId}/announcements/${announcementId}`),
};

export const hospitalSettingsApi = {
  get: (hospitalId: string) => api.get<HospitalSettings>(`/hospitals/${hospitalId}/settings`),
  update: (hospitalId: string, data: HospitalSettings) =>
    api.put<HospitalSettings>(`/hospitals/${hospitalId}/settings`, data),
};

export const shiftTypesApi = {
  getByHospital: (hospitalId: string) => api.get<ShiftType[]>(`/hospitals/${hospitalId}/shift-types`),
  create: (hospitalId: string, data: ShiftType) =>
    api.post<ShiftType>(`/hospitals/${hospitalId}/shift-types`, data),
  delete: (hospitalId: string, code: string) =>
    api.delete(`/hospitals/${hospitalId}/shift-types/${code}`),
};

export const schedulingApi = {
  createRequirement: (hospitalId: string, data: ShiftRequirement) =>
    api.post<ShiftRequirement>(`/hospitals/${hospitalId}/shift-requirements`, data),
  getRequirements: (hospitalId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<ShiftRequirement[]>(`/hospitals/${hospitalId}/shift-requirements${query}`);
  },
  deleteRequirement: (hospitalId: string, requirementId: string) =>
    api.delete(`/hospitals/${hospitalId}/shift-requirements/${requirementId}`),
  autoAssign: (hospitalId: string, data: { startDate: string; endDate: string }) =>
    api.post<ShiftAssignment[]>(`/hospitals/${hospitalId}/shifts/auto-assign`, data),
  getAssignments: (hospitalId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<ShiftAssignment[]>(`/hospitals/${hospitalId}/shifts${query}`);
  },
  createManual: (
    hospitalId: string,
    data: {
      workerId: string;
      date: string;
      type: string;
      shiftTypeCode?: string;
      notes?: string;
    },
  ) => api.post<ShiftAssignment>(`/hospitals/${hospitalId}/shifts/manual`, data),
  cancelAssignment: (hospitalId: string, shiftId: string) =>
    api.delete(`/hospitals/${hospitalId}/shifts/${shiftId}`),
  getMyShifts: () => api.get<ShiftAssignment[]>('/users/me/shifts'),
};

export const workerContractsApi = {
  getActive: (workerId: string) => api.get<WorkerContract>(`/workers/${workerId}/contract`),
  upsert: (
    hospitalId: string,
    data: {
      workerId: string;
      hourlyRate: number;
      weeklyHours: number;
      nightBonusPct?: number;
      holidayBonusPct?: number;
      overtimeMultiplier?: number;
      effectiveFrom?: string;
    },
  ) => api.put<WorkerContract>(`/hospitals/${hospitalId}/workers/contracts`, data),
};

export const adminStatsApi = {
  getGlobalStats: () => api.get<GlobalStats>('/admin/stats'),
};

export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User> & { password: string; hospitalId: string }) => api.post<User>('/users', data),
  update: (id: string, data: Partial<User> & { password?: string }) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getMyCalendar: (month: string) => api.get<CalendarEvent[]>(`/users/me/calendar?month=${month}`),
  createLeaveRequest: (data: { startDate: string; endDate: string; reason: string }) =>
    api.post<LeaveRequest>('/users/me/leave-requests', data),
  getMyLeaveRequests: () => api.get<LeaveRequest[]>('/users/me/leave-requests'),
  addCalendarEvent: (
    userId: string,
    data: { date: string; type: string; startTime?: string; endTime?: string; notes?: string },
  ) => api.post<CalendarEvent>(`/users/${userId}/calendar-events`, data),
  removeCalendarEvent: (userId: string, eventId: string) =>
    api.delete(`/users/${userId}/calendar-events/${eventId}`),
};

export const leaveRequestsApi = {
  getPending: () => api.get<{ user: User; request: LeaveRequest }[]>('/leave-requests?status=PENDING'),
  review: (userId: string, requestId: string, data: { status: LeaveRequestStatus; reviewComment?: string }) =>
    api.patch<LeaveRequest>(`/leave-requests/${userId}/${requestId}`, data),
};

export const payrollsApi = {
  getAll: () => api.get<Payroll[]>('/payrolls'),
  getMyPayrolls: () => api.get<Payroll[]>('/payrolls?workerId=me'),
  getById: (id: string) => api.get<Payroll>(`/payrolls/${id}`),
  create: (data: Partial<Payroll>) => api.post<Payroll>('/payrolls', data),
  updateStatus: (id: string, status: PayrollStatus) => api.patch<Payroll>(`/payrolls/${id}/status`, { status }),
  downloadPdf: (id: string) => api.get(`/payrolls/${id}/pdf`, { responseType: 'blob' }),
};

export const advancedPayrollApi = {
  generate: (hospitalId: string, data: { workerId: string; period: string }) =>
    api.post<Payroll>(`/hospitals/${hospitalId}/payrolls/generate`, data),
  getItems: (payrollId: string) => api.get<PayrollItem[]>(`/payrolls/${payrollId}/items`),
  createAdjustment: (data: PayrollAdjustment) => api.post<PayrollAdjustment>('/payroll-adjustments', data),
};

export const auditLogsApi = {
  getByHospital: (hospitalId: string) => api.get<AuditLog[]>(`/hospitals/${hospitalId}/audit-logs`),
};

export const chatApi = {
  getMyChats: () => api.get<Chat[]>('/chats'),
  getMessages: (chatId: string) => api.get<ChatMessage[]>(`/chats/${chatId}/messages`),
  sendMessage: (chatId: string, content: string) => api.post<ChatMessage>(`/chats/${chatId}/messages`, { content }),
  createPrivateChat: (userId: string) => api.post<Chat>('/chats/private', { userId }),
  markAsRead: (chatId: string) => api.patch(`/chats/${chatId}/read`),
};

export const workGroupsApi = {
  getAll: () => api.get<WorkGroup[]>('/work-groups'),
  getById: (id: string) => api.get<WorkGroup>(`/work-groups/${id}`),
  create: (data: { name: string; description: string; members: string[] }) => api.post<WorkGroup>('/work-groups', data),
  update: (id: string, data: Partial<WorkGroup>) => api.put<WorkGroup>(`/work-groups/${id}`, data),
  delete: (id: string) => api.delete(`/work-groups/${id}`),
  addMember: (groupId: string, userId: string) => api.post(`/work-groups/${groupId}/members`, { userId }),
  removeMember: (groupId: string, userId: string) => api.delete(`/work-groups/${groupId}/members/${userId}`),
};
