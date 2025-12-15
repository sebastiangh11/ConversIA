
export enum AppointmentStatus {
  BOOKED = 'BOOKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  PENDING = 'PENDING'
}

export enum MessageSender {
  CLIENT = 'CLIENT',
  BUSINESS = 'BUSINESS', // Bot or Human
  SYSTEM = 'SYSTEM'
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  firstSeen: string;
  lastSeen: string;
  totalAppointments: number;
  notes?: string;
  tags?: string[];
  preferredContactMethod?: 'WHATSAPP' | 'PHONE' | 'EMAIL';
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  isClass: boolean; // Multi-slot
  capacity?: number;
}

export interface ClassSession {
  id: string;
  serviceId: string;
  serviceName: string;
  startTime: string;
  durationMinutes: number;
  providerName: string;
  room: string;
  maxCapacity: number;
  currentAttendees: number;
  description?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string; // Denormalized for ease
  serviceId: string;
  serviceName: string;
  classSessionId?: string; // Link to specific class slot
  startTime: string; // ISO String
  endTime: string; // ISO String
  providerName: string;
  room?: string;
  status: AppointmentStatus;
  currentAttendees?: number; // For classes (snapshot or denormalized)
  maxCapacity?: number; // For classes
  notes?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  text: string;
  sender: MessageSender;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'NEW' | 'ACTIVE' | 'ARCHIVED';
  relatedAppointmentId?: string; // Link to the active appointment being discussed
}

export interface WorkingDay {
  open: string; // "09:00"
  close: string; // "17:00"
  isOpen: boolean;
  isSplit?: boolean; // Toggle for split shift
  open2?: string; // "18:00"
  close2?: string; // "21:00"
}

export interface WorkingHours {
  monday: WorkingDay;
  tuesday: WorkingDay;
  wednesday: WorkingDay;
  thursday: WorkingDay;
  friday: WorkingDay;
  saturday: WorkingDay;
  sunday: WorkingDay;
}

export interface DayOff {
  date: string; // YYYY-MM-DD
  description: string;
}

export interface BusinessSettings {
  name: string;
  description: string;
  timezone: string;
  whatsappNumber: string;
  reminder24h: boolean;
  reminder1h: boolean;
  workingHours: WorkingHours;
  daysOff: DayOff[];
  concurrentSlots: number; // How many simultaneous appointments (non-class)
  aiPrompt: string; // System instruction for the bot
}