
export enum AppointmentStatus {
  BOOKED = 'BOOKED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  PENDING = 'PENDING',
  RESCHEDULED = 'RESCHEDULED'
}

export enum MessageSender {
  CLIENT = 'CLIENT',
  BUSINESS = 'BUSINESS', 
  SYSTEM = 'SYSTEM'
}

export type ConvStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
export type StaffRole = 'NONE' | 'DOCTOR' | 'NURSE' | 'FRONT_DESK';
export type UserRole = 'ADMIN' | 'CLINICIAN' | 'RECEPTIONIST';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface InternalNote {
  id: string;
  text: string;
  timestamp: string;
  author: string;
}

export interface WorkingDay {
  open: string; 
  close: string; 
  isOpen: boolean;
  isSplit?: boolean; 
  open2?: string; 
  close2?: string; 
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

export interface Specialty {
  id: string;
  name: string;
  description?: string;
}

export interface Provider {
  id: string;
  name: string;
  role: 'DOCTOR' | 'NURSE';
  active: boolean;
  status: 'AVAILABLE' | 'IN_CONSULT' | 'ON_BREAK' | 'OFF_DUTY'; // Live operational status
  avatar?: string;
  overrideClinicHours: boolean;
  workingHours?: WorkingHours;
  utilization: number; // 0 to 100
  licenseExpiry: string; // ISO date for compliance tracking
  assignedSpecialtyIds: string[]; // Many-to-many relationship
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  specialtyId: string;
  providerIds: string[]; 
  isClass: boolean; 
  capacity?: number;
}

export interface AuditLog {
  type: 'rescheduled' | 'cancelled' | 'status_change' | 'created' | 'reminder_sent';
  at: string;
  by: string;
  notes?: string;
  reason?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  providerId: string; 
  providerName: string;
  classSessionId?: string; 
  startTime: string; 
  endTime: string; 
  room?: string;
  status: AppointmentStatus;
  source: 'AI' | 'MANUAL';
  threadId?: string; // Link to conversation
  auditTrail?: AuditLog[];
  cancelReason?: string;
}

export interface BusinessSettings {
  name: string;
  description: string;
  timezone: string;
  whatsappNumber: string;
  reminder24h: boolean;
  reminder1h: boolean;
  workingHours: WorkingHours;
  daysOff: { date: string; description: string }[];
  concurrentSlots: number; 
  aiPrompt: string; 
}

export interface ProviderAvailability {
  providerId: string;
  slotsCount: number;
  status: 'AVAILABLE' | 'LIMITED' | 'OFF';
}

export interface TimeSlot {
  time: string;
  available: boolean;
  providers: string[]; // IDs of providers available at this time
}

// Legacy/Context types
export interface Message { id: string; conversationId: string; text: string; sender: MessageSender; timestamp: string; isRead: boolean; isBot?: boolean; }
export interface Conversation { 
  id: string; 
  clientId: string; 
  clientName: string; 
  clientPhone: string; 
  lastMessageText: string; 
  lastMessageTime: string; 
  unreadCount: number; 
  status: ConvStatus; 
  assignedTo: StaffRole; 
  tags: string[]; 
  internalNotes: InternalNote[];
  linkedAppointmentIds: string[]; // Track clinical link
}

export interface Transaction { id: string; clientId: string; clientName: string; serviceId: string; serviceName: string; amount: number; currency: string; status: 'PAID' | 'PENDING'; date: string; stripeTransactionId: string; paymentMethod: 'CARD' | 'WALLET'; }
export interface Payout { id: string; amount: number; status: 'COMPLETED' | 'PENDING'; arrivalDate: string; bankName: string; }
export interface ClassSession { id: string; serviceId: string; serviceName: string; startTime: string; durationMinutes: number; providerName: string; room: string; maxCapacity: number; currentAttendees: number; }
