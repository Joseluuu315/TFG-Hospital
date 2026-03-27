import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Configura la URL base de tu backend Spring Boot
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Crear instancia de Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para añadir el token JWT a las peticiones
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
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Si el token ha expirado (401) y no es un retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si falla el refresh, limpiar tokens y redirigir al login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// ============ TIPOS ============

export type UserRole = 'ROOT' | 'HOSPITAL_ADMIN' | 'WORKER';
export type HospitalStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW';
export type AnnouncementPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type CalendarEventType = 'SHIFT' | 'HOLIDAY' | 'DAY_OFF' | 'SICK_LEAVE' | 'VACATION';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PayrollStatus = 'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED';
export type ChatType = 'PRIVATE' | 'GROUP' | 'HOSPITAL' | 'SUPPORT';

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
  startDate: string;
  endDate: string;
  reason: string;
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

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
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

// ============ AUTH API ============

export const authApi = {
  login: (data: LoginRequest) => 
    api.post<AuthResponse>('/auth/login', data),
  
  refresh: (refreshToken: string) => 
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),
  
  logout: () => 
    api.post('/auth/logout'),
  
  me: () => 
    api.get<User>('/auth/me'),
};

// ============ HOSPITALS API (ROOT) ============

export const hospitalsApi = {
  getAll: () => 
    api.get<Hospital[]>('/hospitals'),
  
  getById: (id: string) => 
    api.get<Hospital>(`/hospitals/${id}`),
  
  create: (data: Partial<Hospital> & { adminEmail: string }) => 
    api.post<Hospital>('/hospitals', data),
  
  update: (id: string, data: Partial<Hospital>) => 
    api.put<Hospital>(`/hospitals/${id}`, data),
  
  updateStatus: (id: string, status: HospitalStatus) => 
    api.patch<Hospital>(`/hospitals/${id}/status`, { status }),
  
  delete: (id: string) => 
    api.delete(`/hospitals/${id}`),

  // Announcements
  addAnnouncement: (hospitalId: string, data: Partial<Announcement>) =>
    api.post<Announcement>(`/hospitals/${hospitalId}/announcements`, data),
  
  updateAnnouncement: (hospitalId: string, announcementId: string, data: Partial<Announcement>) =>
    api.put<Announcement>(`/hospitals/${hospitalId}/announcements/${announcementId}`, data),
  
  deleteAnnouncement: (hospitalId: string, announcementId: string) =>
    api.delete(`/hospitals/${hospitalId}/announcements/${announcementId}`),
};

// ============ ADMIN STATS API (ROOT) ============

export const adminStatsApi = {
  getGlobalStats: () => 
    api.get<GlobalStats>('/admin/stats'),
};

// ============ USERS API ============

export const usersApi = {
  getAll: () => 
    api.get<User[]>('/users'),
  
  getById: (id: string) => 
    api.get<User>(`/users/${id}`),
  
  create: (data: Partial<User> & { password: string }) => 
    api.post<User>('/users', data),
  
  update: (id: string, data: Partial<User>) => 
    api.put<User>(`/users/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/users/${id}`),
  
  // Calendar
  getMyCalendar: (month: string) => 
    api.get<CalendarEvent[]>(`/users/me/calendar?month=${month}`),
  
  // Leave Requests
  createLeaveRequest: (data: { startDate: string; endDate: string; reason: string }) =>
    api.post<LeaveRequest>('/users/me/leave-requests', data),
  
  getMyLeaveRequests: () =>
    api.get<LeaveRequest[]>('/users/me/leave-requests'),
};

// ============ LEAVE REQUESTS API (HOSPITAL_ADMIN) ============

export const leaveRequestsApi = {
  getPending: () => 
    api.get<{ user: User; request: LeaveRequest }[]>('/leave-requests?status=PENDING'),
  
  review: (userId: string, requestId: string, data: { status: LeaveRequestStatus; reviewComment?: string }) =>
    api.patch<LeaveRequest>(`/leave-requests/${userId}/${requestId}`, data),
};

// ============ PAYROLLS API ============

export const payrollsApi = {
  getAll: () => 
    api.get<Payroll[]>('/payrolls'),
  
  getMyPayrolls: () =>
    api.get<Payroll[]>('/payrolls?workerId=me'),
  
  getById: (id: string) => 
    api.get<Payroll>(`/payrolls/${id}`),
  
  create: (data: Partial<Payroll>) => 
    api.post<Payroll>('/payrolls', data),
  
  updateStatus: (id: string, status: PayrollStatus) => 
    api.patch<Payroll>(`/payrolls/${id}/status`, { status }),
  
  downloadPdf: (id: string) => 
    api.get(`/payrolls/${id}/pdf`, { responseType: 'blob' }),
};

// ============ CHAT API ============

export const chatApi = {
  // Get all chats for current user
  getMyChats: () =>
    api.get<Chat[]>('/chats'),
  
  // Get messages for a chat
  getMessages: (chatId: string) =>
    api.get<ChatMessage[]>(`/chats/${chatId}/messages`),
  
  // Send a message
  sendMessage: (chatId: string, content: string) =>
    api.post<ChatMessage>(`/chats/${chatId}/messages`, { content }),
  
  // Create private chat
  createPrivateChat: (userId: string) =>
    api.post<Chat>('/chats/private', { userId }),
  
  // Mark chat as read
  markAsRead: (chatId: string) =>
    api.patch(`/chats/${chatId}/read`),
};

// ============ WORK GROUPS API (HOSPITAL_ADMIN) ============

export const workGroupsApi = {
  getAll: () =>
    api.get<WorkGroup[]>('/work-groups'),
  
  getById: (id: string) =>
    api.get<WorkGroup>(`/work-groups/${id}`),
  
  create: (data: { name: string; description: string; members: string[] }) =>
    api.post<WorkGroup>('/work-groups', data),
  
  update: (id: string, data: Partial<WorkGroup>) =>
    api.put<WorkGroup>(`/work-groups/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/work-groups/${id}`),
  
  addMember: (groupId: string, userId: string) =>
    api.post(`/work-groups/${groupId}/members`, { userId }),
  
  removeMember: (groupId: string, userId: string) =>
    api.delete(`/work-groups/${groupId}/members/${userId}`),
};
