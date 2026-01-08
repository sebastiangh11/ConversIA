
import { 
  Appointment, 
  AppointmentStatus, 
  Client, 
  Conversation, 
  Message, 
  MessageSender, 
  Service,
  BusinessSettings,
  Specialty,
  Provider,
  TimeSlot,
  ProviderAvailability,
  WorkingHours,
  Transaction,
  Payout,
  ClassSession,
  InternalNote,
  AuditLog,
  UserAccount
} from '../types';

const SLOT_INTERVAL = 30; // Minutes

const getAvatar = (seed: string) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

// --- DATA ---

let SETTINGS: BusinessSettings = {
  name: 'ConversIA Medical Hub',
  description: 'AI-powered clinical workflow.',
  timezone: 'America/New_York',
  whatsappNumber: '+15550000',
  reminder24h: true,
  reminder1h: true,
  concurrentSlots: 2,
  aiPrompt: 'Professional medical assistant.',
  workingHours: {
    monday: { open: '09:00', close: '17:00', isOpen: true },
    tuesday: { open: '09:00', close: '17:00', isOpen: true },
    wednesday: { open: '09:00', close: '17:00', isOpen: true },
    thursday: { open: '09:00', close: '17:00', isOpen: true },
    friday: { open: '09:00', close: '17:00', isOpen: true },
    saturday: { open: '10:00', close: '14:00', isOpen: false },
    sunday: { open: '10:00', close: '14:00', isOpen: false },
  },
  daysOff: []
};

let USERS: UserAccount[] = [
  { id: 'u1', name: 'Dr. Sarah Smith', email: 'sarah@conversia.io', role: 'ADMIN', createdAt: '2023-01-01', status: 'ACTIVE', lastLogin: new Date().toISOString() },
  { id: 'u2', name: 'Receptionist Mike', email: 'mike@conversia.io', role: 'RECEPTIONIST', createdAt: '2023-05-12', status: 'ACTIVE' },
];

let PROVIDERS: Provider[] = [
  { 
    id: 'p1', 
    name: 'Dr. Sarah Smith', 
    role: 'DOCTOR', 
    active: true, 
    status: 'AVAILABLE',
    utilization: 45,
    licenseExpiry: '2025-12-01',
    assignedSpecialtyIds: ['spec1'],
    avatar: getAvatar('Sarah'), 
    overrideClinicHours: false 
  },
  { 
    id: 'p2', 
    name: 'Dr. Michael Chen', 
    role: 'DOCTOR', 
    active: true, 
    status: 'IN_CONSULT',
    utilization: 88,
    licenseExpiry: '2024-05-15',
    assignedSpecialtyIds: ['spec1', 'spec2'],
    avatar: getAvatar('Michael'), 
    overrideClinicHours: true, 
    workingHours: {
      ...SETTINGS.workingHours,
      wednesday: { open: '08:00', close: '12:00', isOpen: true } 
    }
  },
  { 
    id: 'p3', 
    name: 'Nurse Jackie', 
    role: 'NURSE', 
    active: true, 
    status: 'AVAILABLE',
    utilization: 12,
    licenseExpiry: '2026-01-01',
    assignedSpecialtyIds: ['spec1'],
    avatar: getAvatar('Jackie'), 
    overrideClinicHours: false 
  }
];

let SERVICES: Service[] = [
  { id: 's1', name: 'Primary Consultation', durationMinutes: 30, price: 80, specialtyId: 'spec1', providerIds: ['p1', 'p2'], isClass: false },
  { id: 's2', name: 'Flu Vaccination', durationMinutes: 15, price: 30, specialtyId: 'spec1', providerIds: ['p1', 'p3'], isClass: false },
  { id: 's3', name: 'Pediatric Checkup', durationMinutes: 45, price: 100, specialtyId: 'spec2', providerIds: ['p2'], isClass: false }
];

let APPOINTMENTS: Appointment[] = [
  { 
    id: 'a1', clientId: 'c1', clientName: 'Ana Martínez', serviceId: 's1', serviceName: 'Primary Consultation', 
    providerId: 'p1', providerName: 'Dr. Sarah Smith', 
    startTime: new Date().toISOString().split('T')[0] + 'T10:00:00', 
    endTime: new Date().toISOString().split('T')[0] + 'T10:30:00', 
    status: AppointmentStatus.BOOKED,
    source: 'AI',
    threadId: 'conv1',
    auditTrail: [{ type: 'created', at: new Date().toISOString(), by: 'WhatsApp Bot' }]
  }
];

let CLIENTS: Client[] = [
  { id: 'c1', name: 'Ana Martínez', phone: '+15550101', avatar: getAvatar('Ana'), firstSeen: '2023-10-01', lastSeen: '2024-01-01', totalAppointments: 4, email: 'ana@example.com', notes: 'Patient has mild asthma.' }
];

let CONVERSATIONS: Conversation[] = [
  { 
    id: 'conv1', clientId: 'c1', clientName: 'Ana Martínez', clientPhone: '+15550101', 
    lastMessageText: 'Can I reschedule my appointment?', lastMessageTime: new Date().toISOString(), 
    unreadCount: 1, status: 'OPEN', assignedTo: 'NONE', tags: ['Scheduling'], 
    internalNotes: [], linkedAppointmentIds: ['a1']
  }
];

let MESSAGES: Message[] = [
  { id: 'm1', conversationId: 'conv1', text: 'Hi, I need to reschedule.', sender: MessageSender.CLIENT, timestamp: new Date().toISOString(), isRead: false }
];

let SPECIALTIES: Specialty[] = [
  { id: 'spec1', name: 'General Practice', description: 'Primary care and family medicine.' },
  { id: 'spec2', name: 'Pediatrics', description: 'Specialized care for children.' }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- ENGINE ---

const getDayKey = (date: Date): keyof WorkingHours => {
  const days: (keyof WorkingHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

const isOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date) => {
  return start1 < end2 && start2 < end1;
};

export const mockApi = {
  getSettings: async () => SETTINGS,
  getProviders: async () => [...PROVIDERS],
  getServices: async () => [...SERVICES],
  getClients: async () => [...CLIENTS],
  getAppointments: async () => [...APPOINTMENTS],
  getConversations: async () => [...CONVERSATIONS],
  getSpecialties: async () => [...SPECIALTIES],
  getTransactions: async () => [],
  getPayouts: async () => [],
  getClassSessions: async () => [],
  
  // User Management
  getUserAccounts: async () => [...USERS],
  createUserAccount: async (user: Partial<UserAccount>): Promise<UserAccount> => {
    await delay(300);
    const newUser: UserAccount = {
      id: `u${Date.now()}`,
      name: user.name || 'New User',
      email: user.email || '',
      role: user.role || 'RECEPTIONIST',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      ...user
    };
    USERS.push(newUser);
    return newUser;
  },
  deleteUserAccount: async (id: string): Promise<void> => {
    await delay(200);
    USERS = USERS.filter(u => u.id !== id);
  },

  getMessages: async (conversationId: string) => MESSAGES.filter(m => m.conversationId === conversationId),
  getClientById: async (id: string) => CLIENTS.find(c => c.id === id),

  sendMessage: async (conversationId: string, text: string): Promise<Message> => {
    await delay(100);
    const newMsg: Message = {
      id: `m${Date.now()}`,
      conversationId,
      text,
      sender: MessageSender.BUSINESS,
      timestamp: new Date().toISOString(),
      isRead: true
    };
    MESSAGES.push(newMsg);
    return newMsg;
  },

  updateConversationMeta: async (id: string, updates: Partial<Conversation>): Promise<Conversation> => {
    await delay(100);
    const idx = CONVERSATIONS.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Conversation not found");
    CONVERSATIONS[idx] = { ...CONVERSATIONS[idx], ...updates };
    return CONVERSATIONS[idx];
  },

  ensureConversationExists: async (clientId: string): Promise<string> => {
    const existing = CONVERSATIONS.find(c => c.clientId === clientId);
    if (existing) return existing.id;
    const client = CLIENTS.find(c => c.id === clientId);
    if (!client) throw new Error("Client not found");

    const newId = `conv${Date.now()}`;
    CONVERSATIONS.push({
      id: newId, clientId: client.id, clientName: client.name, clientPhone: client.phone,
      lastMessageText: 'New thread opened', lastMessageTime: new Date().toISOString(),
      unreadCount: 0, status: 'OPEN', assignedTo: 'NONE', tags: ['Manual Link'],
      internalNotes: [], linkedAppointmentIds: []
    });
    return newId;
  },

  addInternalNote: async (conversationId: string, text: string, author: string): Promise<InternalNote> => {
    await delay(100);
    const note: InternalNote = { id: `n${Date.now()}`, text, timestamp: new Date().toISOString(), author };
    const idx = CONVERSATIONS.findIndex(c => c.id === conversationId);
    if (idx !== -1) {
      CONVERSATIONS[idx].internalNotes = [note, ...CONVERSATIONS[idx].internalNotes];
    }
    return note;
  },

  updateProvider: async (id: string, updates: Partial<Provider>): Promise<Provider> => {
    const idx = PROVIDERS.findIndex(p => p.id === id);
    PROVIDERS[idx] = { ...PROVIDERS[idx], ...updates };
    return PROVIDERS[idx];
  },

  updateProviderServices: async (providerId: string, serviceIds: string[]): Promise<void> => {
    await delay(150);
    SERVICES = SERVICES.map(svc => {
      const hasProv = svc.providerIds.includes(providerId);
      const shouldHaveProv = serviceIds.includes(svc.id);
      if (shouldHaveProv && !hasProv) return { ...svc, providerIds: [...svc.providerIds, providerId] };
      if (!shouldHaveProv && hasProv) return { ...svc, providerIds: svc.providerIds.filter(id => id !== providerId) };
      return svc;
    });
  },

  updateClient: async (client: Client): Promise<Client> => {
    await delay(100);
    const idx = CLIENTS.findIndex(c => c.id === client.id);
    if (idx !== -1) {
      CLIENTS[idx] = { ...client };
      return CLIENTS[idx];
    }
    throw new Error("Client not found");
  },

  updateSettings: async (newSettings: BusinessSettings): Promise<BusinessSettings> => {
    await delay(100);
    SETTINGS = { ...newSettings };
    return SETTINGS;
  },

  updateAppointmentStatus: async (id: string, status: AppointmentStatus, notes?: string): Promise<Appointment> => {
    await delay(100);
    const idx = APPOINTMENTS.findIndex(a => a.id === id);
    if (idx === -1) throw new Error("Appointment not found");
    const audit: AuditLog = { type: 'status_change', at: new Date().toISOString(), by: 'Staff', notes: `Status set to ${status}. ${notes || ''}` };
    APPOINTMENTS[idx] = { ...APPOINTMENTS[idx], status, auditTrail: [...(APPOINTMENTS[idx].auditTrail || []), audit] };
    return APPOINTMENTS[idx];
  },

  cancelAppointment: async (id: string, reason: string): Promise<Appointment> => {
    await delay(100);
    const idx = APPOINTMENTS.findIndex(a => a.id === id);
    if (idx === -1) throw new Error("Appointment not found");
    const audit: AuditLog = { type: 'cancelled', at: new Date().toISOString(), by: 'Staff', notes: `Reason: ${reason}` };
    APPOINTMENTS[idx] = { ...APPOINTMENTS[idx], status: AppointmentStatus.CANCELLED, cancelReason: reason, auditTrail: [...(APPOINTMENTS[idx].auditTrail || []), audit] };
    return APPOINTMENTS[idx];
  },

  rescheduleAppointment: async (id: string, startTime: string, endTime: string, providerId?: string, providerName?: string, reason?: string): Promise<Appointment> => {
    await delay(100);
    const idx = APPOINTMENTS.findIndex(a => a.id === id);
    if (idx === -1) throw new Error("Appointment not found");
    const audit: AuditLog = { type: 'rescheduled', at: new Date().toISOString(), by: 'Staff', notes: `New time: ${new Date(startTime).toLocaleString()}. Reason: ${reason || 'N/A'}` };
    APPOINTMENTS[idx] = { ...APPOINTMENTS[idx], startTime, endTime, providerId: providerId || APPOINTMENTS[idx].providerId, providerName: providerName || APPOINTMENTS[idx].providerName, status: AppointmentStatus.RESCHEDULED, auditTrail: [...(APPOINTMENTS[idx].auditTrail || []), audit] };
    return APPOINTMENTS[idx];
  },

  createAppointment: async (appt: Partial<Appointment>): Promise<Appointment> => {
    const id = `a${Date.now()}`;
    const newAppt = { 
      id, status: AppointmentStatus.BOOKED, source: 'MANUAL',
      auditTrail: [{ type: 'created', at: new Date().toISOString(), by: 'Staff' }],
      ...appt 
    } as Appointment;
    const thread = CONVERSATIONS.find(c => c.clientId === newAppt.clientId);
    if (thread) {
      newAppt.threadId = thread.id;
      thread.linkedAppointmentIds.push(id);
    }
    APPOINTMENTS.push(newAppt);
    return newAppt;
  },

  createProvider: async (prov: Partial<Provider>): Promise<Provider> => {
    await delay(100);
    const newProv: Provider = {
      id: `p${Date.now()}`, active: true, role: 'DOCTOR', status: 'AVAILABLE', utilization: 0,
      licenseExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      assignedSpecialtyIds: [], overrideClinicHours: false, avatar: getAvatar(prov.name || 'New'),
      ...prov
    } as Provider;
    PROVIDERS.push(newProv);
    return newProv;
  },

  createClient: async (client: Partial<Client>): Promise<Client> => {
    const newClient = { id: `c${Date.now()}`, name: 'New Patient', totalAppointments: 0, avatar: getAvatar('new'), ...client } as Client;
    CLIENTS.push(newClient);
    return newClient;
  },

  requestPasswordReset: async ({ identifier }: { identifier: string; deliveryMethod: 'email' | 'phone' }): Promise<{ requestId: string }> => {
    await delay(500);
    return { requestId: 'req_' + Math.random().toString(36).substr(2, 9) };
  },

  verifyResetCode: async ({ code }: { requestId: string; code: string; identifier: string }): Promise<{ resetToken: string }> => {
    await delay(500);
    if (code === '123456' || code.length === 6) return { resetToken: 'tok_' + Math.random().toString(36).substr(2, 9) };
    throw new Error("Invalid verification code");
  },

  updatePassword: async ({ resetToken }: { resetToken: string; newPassword: string }): Promise<void> => {
    await delay(500);
    if (!resetToken) throw new Error("Missing reset token");
    return;
  },

  // Availability Engine (Service-First Logic)
  getAvailabilityForDate: async (serviceId: string, dateStr: string): Promise<{
    providerStats: ProviderAvailability[],
    slots: TimeSlot[]
  }> => {
    await delay(400); // Hospitals handle more complex data intersection
    const date = new Date(dateStr);
    const dayKey = getDayKey(date);
    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) return { providerStats: [], slots: [] };

    // 1. Filter Providers Authorized for this specific Service
    const authorizedProviders = PROVIDERS.filter(p => service.providerIds.includes(p.id) && p.active);
    const allSlotsMap: Record<string, string[]> = {}; 

    const providerStats: ProviderAvailability[] = authorizedProviders.map(p => {
      const schedule = p.overrideClinicHours && p.workingHours ? p.workingHours[dayKey] : SETTINGS.workingHours[dayKey];
      if (!schedule.isOpen) return { providerId: p.id, slotsCount: 0, status: 'OFF' };

      let count = 0;
      const [startH, startM] = schedule.open.split(':').map(Number);
      const [endH, endM] = schedule.close.split(':').map(Number);
      
      const dayStart = new Date(dateStr); dayStart.setHours(startH, startM, 0, 0);
      const dayEnd = new Date(dateStr); dayEnd.setHours(endH, endM, 0, 0);

      let current = new Date(dayStart);
      while (current.getTime() + service.durationMinutes * 60000 <= dayEnd.getTime()) {
        const slotEnd = new Date(current.getTime() + service.durationMinutes * 60000);
        
        // 2. Prevent Conflicts (Hard Lock Check)
        const hasConflict = APPOINTMENTS.some(a => 
          a.providerId === p.id && 
          a.status !== AppointmentStatus.CANCELLED &&
          isOverlapping(current, slotEnd, new Date(a.startTime), new Date(a.endTime))
        );

        if (!hasConflict) {
          count++;
          const timeKey = current.toTimeString().slice(0, 5);
          if (!allSlotsMap[timeKey]) allSlotsMap[timeKey] = [];
          allSlotsMap[timeKey].push(p.id);
        }
        current = new Date(current.getTime() + SLOT_INTERVAL * 60000);
      }

      return {
        providerId: p.id,
        slotsCount: count,
        status: count > 5 ? 'AVAILABLE' : count > 0 ? 'LIMITED' : 'OFF'
      };
    });

    const slots: TimeSlot[] = Object.keys(allSlotsMap).sort().map(time => ({
      time,
      available: true,
      providers: allSlotsMap[time]
    }));

    return { providerStats, slots };
  }
};
