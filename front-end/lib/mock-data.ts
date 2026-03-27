export const MOCK_USERS = {
  root: {
    id: 1,
    email: "superadmin@trassierra.com",
    password: "admin123",
    nombre: "Carlos",
    apellidos: "Rodriguez Martinez",
    dni: "12345678A",
    role: "ROOT" as const,
    token: "mock-jwt-token-root-12345",
  },
  admin: {
    id: 2,
    email: "admin@hospital-reina-sofia.com",
    password: "admin123",
    nombre: "Maria",
    apellidos: "Garcia Lopez",
    dni: "87654321B",
    role: "HOSPITAL_ADMIN" as const,
    hospitalId: 1,
    hospitalName: "Hospital Reina Sofia",
    token: "mock-jwt-token-admin-67890",
  },
  worker: {
    id: 3,
    email: "trabajador@hospital-reina-sofia.com",
    password: "worker123",
    nombre: "Juan",
    apellidos: "Perez Sanchez",
    dni: "11223344C",
    role: "WORKER" as const,
    hospitalId: 1,
    hospitalName: "Hospital Reina Sofia",
    categoria: "Enfermero",
    token: "mock-jwt-token-worker-11111",
  },
};

export const MOCK_HOSPITALS = [
  {
    id: 1,
    nombre: "Hospital Reina Sofia",
    direccion: "Av. Menendez Pidal, s/n",
    ciudad: "Cordoba",
    provincia: "Cordoba",
    codigoPostal: "14004",
    telefono: "957010000",
    email: "info@hrs.es",
    activo: true,
    totalTrabajadores: 245,
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    nombre: "Hospital Universitario Virgen del Rocio",
    direccion: "Av. Manuel Siurot, s/n",
    ciudad: "Sevilla",
    provincia: "Sevilla",
    codigoPostal: "41013",
    telefono: "955012000",
    email: "info@hvr.es",
    activo: true,
    totalTrabajadores: 312,
    createdAt: "2024-02-20",
  },
  {
    id: 3,
    nombre: "Hospital Regional de Malaga",
    direccion: "Av. Carlos Haya, s/n",
    ciudad: "Malaga",
    provincia: "Malaga",
    codigoPostal: "29010",
    telefono: "951290000",
    email: "info@hrm.es",
    activo: true,
    totalTrabajadores: 198,
    createdAt: "2024-03-10",
  },
  {
    id: 4,
    nombre: "Hospital San Juan de Dios",
    direccion: "C/ San Juan de Dios, 15",
    ciudad: "Granada",
    provincia: "Granada",
    codigoPostal: "18001",
    telefono: "958020000",
    email: "info@hsjd.es",
    activo: false,
    totalTrabajadores: 87,
    createdAt: "2024-01-05",
  },
];

export const MOCK_WORKERS = [
  {
    id: 3,
    nombre: "Juan",
    apellidos: "Perez Sanchez",
    dni: "11223344C",
    email: "juan.perez@hospital-reina-sofia.com",
    telefono: "666111222",
    categoria: "Enfermero",
    departamento: "Urgencias",
    fechaAlta: "2023-06-15",
    salarioBase: 2200,
    activo: true,
    hospitalId: 1,
  },
  {
    id: 4,
    nombre: "Ana",
    apellidos: "Martinez Ruiz",
    dni: "22334455D",
    email: "ana.martinez@hospital-reina-sofia.com",
    telefono: "666222333",
    categoria: "Medico",
    departamento: "Cardiologia",
    fechaAlta: "2022-03-20",
    salarioBase: 3500,
    activo: true,
    hospitalId: 1,
  },
  {
    id: 5,
    nombre: "Pedro",
    apellidos: "Gomez Fernandez",
    dni: "33445566E",
    email: "pedro.gomez@hospital-reina-sofia.com",
    telefono: "666333444",
    categoria: "Auxiliar",
    departamento: "Pediatria",
    fechaAlta: "2024-01-10",
    salarioBase: 1600,
    activo: true,
    hospitalId: 1,
  },
  {
    id: 6,
    nombre: "Laura",
    apellidos: "Sanchez Torres",
    dni: "44556677F",
    email: "laura.sanchez@hospital-reina-sofia.com",
    telefono: "666444555",
    categoria: "Enfermero",
    departamento: "UCI",
    fechaAlta: "2021-09-01",
    salarioBase: 2400,
    activo: true,
    hospitalId: 1,
  },
  {
    id: 7,
    nombre: "Miguel",
    apellidos: "Lopez Diaz",
    dni: "55667788G",
    email: "miguel.lopez@hospital-reina-sofia.com",
    telefono: "666555666",
    categoria: "Medico",
    departamento: "Traumatologia",
    fechaAlta: "2020-05-15",
    salarioBase: 3800,
    activo: false,
    hospitalId: 1,
  },
];

export const MOCK_PAYROLLS = [
  {
    id: 1,
    workerId: 3,
    workerName: "Juan Perez Sanchez",
    mes: 2,
    anio: 2026,
    salarioBase: 2200,
    complementos: 150,
    horasExtra: 280,
    deducciones: 420,
    irpf: 15.5,
    seguridadSocial: 6.35,
    totalBruto: 2630,
    totalNeto: 2057.5,
    estado: "PAGADA",
    fechaPago: "2026-02-28",
  },
  {
    id: 2,
    workerId: 3,
    workerName: "Juan Perez Sanchez",
    mes: 1,
    anio: 2026,
    salarioBase: 2200,
    complementos: 100,
    horasExtra: 0,
    deducciones: 380,
    irpf: 15.5,
    seguridadSocial: 6.35,
    totalBruto: 2300,
    totalNeto: 1798.5,
    estado: "PAGADA",
    fechaPago: "2026-01-31",
  },
  {
    id: 3,
    workerId: 4,
    workerName: "Ana Martinez Ruiz",
    mes: 2,
    anio: 2026,
    salarioBase: 3500,
    complementos: 300,
    horasExtra: 500,
    deducciones: 720,
    irpf: 24,
    seguridadSocial: 6.35,
    totalBruto: 4300,
    totalNeto: 2994.5,
    estado: "PENDIENTE",
    fechaPago: null,
  },
];

export const MOCK_LEAVE_REQUESTS = [
  {
    id: 1,
    workerId: 3,
    workerName: "Juan Perez Sanchez",
    tipo: "VACACIONES",
    fechaInicio: "2026-04-01",
    fechaFin: "2026-04-15",
    motivo: "Vacaciones de Semana Santa",
    estado: "PENDIENTE",
    fechaSolicitud: "2026-03-01",
    comentarioAdmin: null,
  },
  {
    id: 2,
    workerId: 4,
    workerName: "Ana Martinez Ruiz",
    tipo: "ASUNTOS_PROPIOS",
    fechaInicio: "2026-03-20",
    fechaFin: "2026-03-20",
    motivo: "Cita medica personal",
    estado: "APROBADA",
    fechaSolicitud: "2026-03-05",
    comentarioAdmin: "Aprobada sin problemas",
  },
  {
    id: 3,
    workerId: 5,
    workerName: "Pedro Gomez Fernandez",
    tipo: "BAJA_MEDICA",
    fechaInicio: "2026-03-10",
    fechaFin: "2026-03-17",
    motivo: "Gripe con complicaciones",
    estado: "APROBADA",
    fechaSolicitud: "2026-03-10",
    comentarioAdmin: "Recuperese pronto",
  },
  {
    id: 4,
    workerId: 6,
    workerName: "Laura Sanchez Torres",
    tipo: "VACACIONES",
    fechaInicio: "2026-07-01",
    fechaFin: "2026-07-31",
    motivo: "Vacaciones de verano",
    estado: "PENDIENTE",
    fechaSolicitud: "2026-03-08",
    comentarioAdmin: null,
  },
];

export const MOCK_CALENDAR_EVENTS = [
  {
    id: 1,
    workerId: 3,
    fecha: "2026-03-09",
    tipo: "TURNO",
    turno: "MANANA",
    horaInicio: "07:00",
    horaFin: "15:00",
    descripcion: "Turno de manana - Urgencias",
  },
  {
    id: 2,
    workerId: 3,
    fecha: "2026-03-10",
    tipo: "TURNO",
    turno: "MANANA",
    horaInicio: "07:00",
    horaFin: "15:00",
    descripcion: "Turno de manana - Urgencias",
  },
  {
    id: 3,
    workerId: 3,
    fecha: "2026-03-11",
    tipo: "TURNO",
    turno: "TARDE",
    horaInicio: "15:00",
    horaFin: "23:00",
    descripcion: "Turno de tarde - Urgencias",
  },
  {
    id: 4,
    workerId: 3,
    fecha: "2026-03-12",
    tipo: "TURNO",
    turno: "TARDE",
    horaInicio: "15:00",
    horaFin: "23:00",
    descripcion: "Turno de tarde - Urgencias",
  },
  {
    id: 5,
    workerId: 3,
    fecha: "2026-03-13",
    tipo: "LIBRE",
    turno: null,
    horaInicio: null,
    horaFin: null,
    descripcion: "Dia libre",
  },
  {
    id: 6,
    workerId: 3,
    fecha: "2026-03-14",
    tipo: "LIBRE",
    turno: null,
    horaInicio: null,
    horaFin: null,
    descripcion: "Dia libre",
  },
  {
    id: 7,
    workerId: 3,
    fecha: "2026-03-15",
    tipo: "TURNO",
    turno: "NOCHE",
    horaInicio: "23:00",
    horaFin: "07:00",
    descripcion: "Turno de noche - Urgencias",
  },
];

export const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    titulo: "Nuevo protocolo COVID-19",
    contenido: "Se informa a todo el personal que a partir del dia 15 de marzo entra en vigor el nuevo protocolo de actuacion frente a casos sospechosos de COVID-19. Por favor, revisen el documento adjunto y confirmen su lectura.",
    fechaPublicacion: "2026-03-01",
    autor: "Maria Garcia Lopez",
    prioridad: "ALTA",
    activo: true,
  },
  {
    id: 2,
    titulo: "Horarios de verano",
    contenido: "Les comunicamos que los horarios de verano entraran en vigor el 1 de junio. Los turnos de manana comenzaran a las 06:30 y los de tarde a las 14:30.",
    fechaPublicacion: "2026-02-28",
    autor: "Maria Garcia Lopez",
    prioridad: "MEDIA",
    activo: true,
  },
  {
    id: 3,
    titulo: "Formacion obligatoria - RCP",
    contenido: "Recordamos que todos los trabajadores deben completar la formacion de RCP antes del 31 de marzo. Las sesiones se realizaran en el aula 3 del edificio de formacion.",
    fechaPublicacion: "2026-02-20",
    autor: "Maria Garcia Lopez",
    prioridad: "ALTA",
    activo: true,
  },
];

export type ChatType = "PRIVATE" | "GROUP" | "HOSPITAL" | "SUPPORT";

export interface ChatMessage {
  id: number;
  chatId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  id: number;
  type: ChatType;
  name: string;
  description?: string;
  participants: number[];
  participantNames: string[];
  createdBy: number;
  hospitalId?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  avatar?: string;
}

export interface WorkGroup {
  id: number;
  name: string;
  description: string;
  hospitalId: number;
  members: number[];
  memberNames: string[];
  createdBy: number;
  chatId: number;
  createdAt: string;
}

export const MOCK_HOSPITAL_CHAT: Chat = {
  id: 100,
  type: "HOSPITAL",
  name: "Hospital Reina Sofia - General",
  description: "Chat general para todo el personal del hospital",
  participants: [2, 3, 4, 5, 6],
  participantNames: ["Maria Garcia", "Juan Perez", "Ana Martinez", "Pedro Gomez", "Laura Sanchez"],
  createdBy: 2,
  hospitalId: 1,
  lastMessage: "Recordad la reunion de manana a las 10:00",
  lastMessageTime: "2026-03-09T14:30:00",
  unreadCount: 3,
};

export const MOCK_WORK_GROUPS: WorkGroup[] = [
  {
    id: 1,
    name: "Equipo Urgencias",
    description: "Coordinacion del equipo de urgencias",
    hospitalId: 1,
    members: [3, 6],
    memberNames: ["Juan Perez", "Laura Sanchez"],
    createdBy: 2,
    chatId: 101,
    createdAt: "2026-01-15",
  },
  {
    id: 2,
    name: "Equipo Cardiologia",
    description: "Comunicacion interna de cardiologia",
    hospitalId: 1,
    members: [4],
    memberNames: ["Ana Martinez"],
    createdBy: 2,
    chatId: 102,
    createdAt: "2026-02-01",
  },
  {
    id: 3,
    name: "Turno Noche",
    description: "Coordinacion del personal de turno nocturno",
    hospitalId: 1,
    members: [3, 5, 6],
    memberNames: ["Juan Perez", "Pedro Gomez", "Laura Sanchez"],
    createdBy: 2,
    chatId: 103,
    createdAt: "2026-02-10",
  },
];

export const MOCK_GROUP_CHATS: Chat[] = [
  {
    id: 101,
    type: "GROUP",
    name: "Equipo Urgencias",
    description: "Coordinacion del equipo de urgencias",
    participants: [2, 3, 6],
    participantNames: ["Maria Garcia (Admin)", "Juan Perez", "Laura Sanchez"],
    createdBy: 2,
    hospitalId: 1,
    lastMessage: "Laura, puedes cubrir el turno del sabado?",
    lastMessageTime: "2026-03-09T10:15:00",
    unreadCount: 1,
  },
  {
    id: 102,
    type: "GROUP",
    name: "Equipo Cardiologia",
    description: "Comunicacion interna de cardiologia",
    participants: [2, 4],
    participantNames: ["Maria Garcia (Admin)", "Ana Martinez"],
    createdBy: 2,
    hospitalId: 1,
    lastMessage: "El paciente de la habitacion 302 necesita seguimiento",
    lastMessageTime: "2026-03-08T16:45:00",
    unreadCount: 0,
  },
  {
    id: 103,
    type: "GROUP",
    name: "Turno Noche",
    description: "Coordinacion del personal de turno nocturno",
    participants: [2, 3, 5, 6],
    participantNames: ["Maria Garcia (Admin)", "Juan Perez", "Pedro Gomez", "Laura Sanchez"],
    createdBy: 2,
    hospitalId: 1,
    lastMessage: "Confirmado cambio de turno para el viernes",
    lastMessageTime: "2026-03-09T08:00:00",
    unreadCount: 2,
  },
];

export const MOCK_PRIVATE_CHATS: Chat[] = [
  {
    id: 201,
    type: "PRIVATE",
    name: "Ana Martinez",
    participants: [3, 4],
    participantNames: ["Juan Perez", "Ana Martinez"],
    createdBy: 3,
    hospitalId: 1,
    lastMessage: "Gracias por la ayuda ayer!",
    lastMessageTime: "2026-03-09T09:30:00",
    unreadCount: 0,
  },
  {
    id: 202,
    type: "PRIVATE",
    name: "Laura Sanchez",
    participants: [3, 6],
    participantNames: ["Juan Perez", "Laura Sanchez"],
    createdBy: 6,
    hospitalId: 1,
    lastMessage: "Te veo en el descanso?",
    lastMessageTime: "2026-03-09T12:00:00",
    unreadCount: 1,
  },
];

export const MOCK_SUPPORT_CHATS: Chat[] = [
  {
    id: 301,
    type: "SUPPORT",
    name: "Soporte Tecnico - Hospital Reina Sofia",
    description: "Canal de soporte con administracion central",
    participants: [1, 2],
    participantNames: ["Carlos Rodriguez (Super Admin)", "Maria Garcia (Admin)"],
    createdBy: 2,
    hospitalId: 1,
    lastMessage: "El problema con las nominas ha sido solucionado",
    lastMessageTime: "2026-03-08T11:20:00",
    unreadCount: 0,
  },
];

export const MOCK_MESSAGES: Record<number, ChatMessage[]> = {
  100: [
    { id: 1, chatId: 100, senderId: 2, senderName: "Maria Garcia", content: "Buenos dias a todos. Recordad que hoy tenemos inspeccion.", timestamp: "2026-03-09T08:00:00", read: true },
    { id: 2, chatId: 100, senderId: 3, senderName: "Juan Perez", content: "Entendido, gracias por avisar.", timestamp: "2026-03-09T08:05:00", read: true },
    { id: 3, chatId: 100, senderId: 4, senderName: "Ana Martinez", content: "A que hora es la inspeccion?", timestamp: "2026-03-09T08:10:00", read: true },
    { id: 4, chatId: 100, senderId: 2, senderName: "Maria Garcia", content: "A las 11:00 en la entrada principal.", timestamp: "2026-03-09T08:12:00", read: true },
    { id: 5, chatId: 100, senderId: 6, senderName: "Laura Sanchez", content: "Perfecto, alli estare.", timestamp: "2026-03-09T08:15:00", read: true },
    { id: 6, chatId: 100, senderId: 2, senderName: "Maria Garcia", content: "Recordad la reunion de manana a las 10:00", timestamp: "2026-03-09T14:30:00", read: false },
  ],
  101: [
    { id: 10, chatId: 101, senderId: 2, senderName: "Maria Garcia", content: "Equipo, necesito que alguien cubra el turno del sabado.", timestamp: "2026-03-09T09:00:00", read: true },
    { id: 11, chatId: 101, senderId: 6, senderName: "Laura Sanchez", content: "Yo no puedo, tengo cita medica.", timestamp: "2026-03-09T09:30:00", read: true },
    { id: 12, chatId: 101, senderId: 2, senderName: "Maria Garcia", content: "Laura, puedes cubrir el turno del sabado?", timestamp: "2026-03-09T10:15:00", read: false },
  ],
  201: [
    { id: 20, chatId: 201, senderId: 4, senderName: "Ana Martinez", content: "Hola Juan, tienes un momento?", timestamp: "2026-03-09T09:00:00", read: true },
    { id: 21, chatId: 201, senderId: 3, senderName: "Juan Perez", content: "Si, dime que necesitas.", timestamp: "2026-03-09T09:05:00", read: true },
    { id: 22, chatId: 201, senderId: 4, senderName: "Ana Martinez", content: "Puedes ayudarme con el paciente de la 205?", timestamp: "2026-03-09T09:10:00", read: true },
    { id: 23, chatId: 201, senderId: 3, senderName: "Juan Perez", content: "Claro, voy para alla.", timestamp: "2026-03-09T09:12:00", read: true },
    { id: 24, chatId: 201, senderId: 4, senderName: "Ana Martinez", content: "Gracias por la ayuda ayer!", timestamp: "2026-03-09T09:30:00", read: true },
  ],
  301: [
    { id: 30, chatId: 301, senderId: 2, senderName: "Maria Garcia", content: "Hola, tenemos un problema con el sistema de nominas.", timestamp: "2026-03-08T10:00:00", read: true },
    { id: 31, chatId: 301, senderId: 1, senderName: "Carlos Rodriguez", content: "Buenos dias Maria. Que tipo de problema?", timestamp: "2026-03-08T10:05:00", read: true },
    { id: 32, chatId: 301, senderId: 2, senderName: "Maria Garcia", content: "No se generan los PDFs correctamente.", timestamp: "2026-03-08T10:10:00", read: true },
    { id: 33, chatId: 301, senderId: 1, senderName: "Carlos Rodriguez", content: "Entendido, lo reviso ahora mismo.", timestamp: "2026-03-08T10:15:00", read: true },
    { id: 34, chatId: 301, senderId: 1, senderName: "Carlos Rodriguez", content: "El problema con las nominas ha sido solucionado", timestamp: "2026-03-08T11:20:00", read: true },
  ],
};

export function getUserChats(userId: number, userRole: string): Chat[] {
  const chats: Chat[] = [];

  if (MOCK_HOSPITAL_CHAT.participants.includes(userId)) {
    chats.push(MOCK_HOSPITAL_CHAT);
  }

  MOCK_GROUP_CHATS.forEach((chat) => {
    if (chat.participants.includes(userId)) {
      chats.push(chat);
    }
  });

  MOCK_PRIVATE_CHATS.forEach((chat) => {
    if (chat.participants.includes(userId)) {
      const otherName = chat.participantNames.find(
        (name) => !name.includes(MOCK_WORKERS.find((w) => w.id === userId)?.nombre || "")
      );
      chats.push({
        ...chat,
        name: otherName || chat.name,
      });
    }
  });

  if (userRole === "HOSPITAL_ADMIN" || userRole === "ROOT") {
    MOCK_SUPPORT_CHATS.forEach((chat) => {
      if (chat.participants.includes(userId)) {
        chats.push(chat);
      }
    });
  }

  return chats.sort(
    (a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
  );
}

export const MOCK_ROOT_STATS = {
  totalHospitals: 4,
  activeHospitals: 3,
  totalWorkers: 842,
  totalAdmins: 4,
};

export const MOCK_ADMIN_STATS = {
  totalWorkers: 245,
  activeWorkers: 238,
  pendingRequests: 12,
  payrollsPending: 45,
};

export const MOCK_WORKER_STATS = {
  diasTrabajados: 18,
  horasExtras: 12,
  solicitudesPendientes: 1,
  proximoTurno: "Manana 07:00 - 15:00",
};
