
import { 
  Appointment, 
  AppointmentStatus, 
  Client, 
  Conversation, 
  Message, 
  MessageSender, 
  Service,
  BusinessSettings,
  ClassSession,
  Transaction,
  Payout
} from '../types';

// --- HELPERS ---
const NOW = Date.now();
const DAY_MS = 86400000;
const HOUR_MS = 3600000;

// --- SEED DATA ---

const SERVICES: Service[] = [
  { id: 's1', name: 'Men\'s Haircut', durationMinutes: 30, price: 35, isClass: false },
  { id: 's2', name: 'Beard Trim', durationMinutes: 15, price: 20, isClass: false },
  { id: 's3', name: 'Morning Yoga', durationMinutes: 60, price: 25, isClass: true, capacity: 12 },
  { id: 's4', name: 'Crossfit 101', durationMinutes: 60, price: 30, isClass: true, capacity: 15 },
  { id: 's5', name: 'Deep Tissue Massage', durationMinutes: 60, price: 90, isClass: false },
  { id: 's6', name: 'HIIT Blast', durationMinutes: 45, price: 25, isClass: true, capacity: 20 },
  { id: 's7', name: 'Nutrition Consult', durationMinutes: 45, price: 75, isClass: false },
  { id: 's8', name: 'Hot Yoga', durationMinutes: 90, price: 35, isClass: true, capacity: 10 },
];

let PROVIDERS = [
  'Instructor Sarah', 
  'Coach Mike', 
  'Barber Mike', 
  'Yoga Master Jen', 
  'Dr. Alyx', 
  'Massage Therapist Tom', 
  'Trainer Lisa'
];

// Using DiceBear for Memoji-style avatars
const getAvatar = (seed: string) => `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

let CLIENTS: Client[] = [
  { 
    id: 'c1', name: 'Alice Johnson', phone: '+15550101', email: 'alice@example.com',
    avatar: getAvatar('Alice'), firstSeen: '2023-10-01', lastSeen: '2023-10-25', 
    totalAppointments: 12, notes: 'Prefers afternoon appointments. Allergic to lavender.', preferredContactMethod: 'WHATSAPP',
    tags: ['Regular', 'Yoga Fan']
  },
  { 
    id: 'c2', name: 'Bob Smith', phone: '+15550102', avatar: getAvatar('Bob'),
    firstSeen: '2023-10-15', lastSeen: '2023-10-26', totalAppointments: 3,
    notes: 'New customer, referred by Mike.', preferredContactMethod: 'PHONE',
    tags: ['New Client', 'Referral']
  },
  { 
    id: 'c3', name: 'Charlie Brown', phone: '+15550103', avatar: getAvatar('Charlie'),
    firstSeen: '2023-09-01', lastSeen: '2023-10-20', totalAppointments: 8, preferredContactMethod: 'WHATSAPP',
    tags: ['Regular']
  },
  { 
    id: 'c4', name: 'Diana Prince', phone: '+15550104', email: 'diana@themyscira.net',
    avatar: getAvatar('Diana'), firstSeen: '2023-10-26', lastSeen: '2023-10-26', 
    totalAppointments: 1, notes: 'Interested in advanced yoga classes.', preferredContactMethod: 'EMAIL',
    tags: ['New Client', 'VIP']
  },
  { 
    id: 'c5', name: 'Evan Wright', phone: '+15550105', avatar: getAvatar('Evan'),
    firstSeen: '2023-08-10', lastSeen: '2023-11-01', totalAppointments: 15, preferredContactMethod: 'WHATSAPP',
    tags: ['VIP', 'High Value']
  },
  { 
    id: 'c6', name: 'Fiona Gallagher', phone: '+15550106', avatar: getAvatar('Fiona'),
    firstSeen: '2023-11-02', lastSeen: '2023-11-02', totalAppointments: 0, preferredContactMethod: 'WHATSAPP',
    tags: ['New Client']
  },
  { 
    id: 'c7', name: 'George Miller', phone: '+15550107', avatar: getAvatar('George'),
    firstSeen: '2023-05-12', lastSeen: '2023-10-30', totalAppointments: 5, preferredContactMethod: 'PHONE',
    tags: []
  },
  { 
    id: 'c8', name: 'Hannah Montana', phone: '+15550108', avatar: getAvatar('Hannah'),
    firstSeen: '2023-01-20', lastSeen: '2023-11-03', totalAppointments: 22, notes: 'VIP Client. Likes sparkling water.', preferredContactMethod: 'WHATSAPP',
    tags: ['VIP', 'Celebrity']
  },
  { 
    id: 'c9', name: 'Ian Somerhalder', phone: '+15550109', avatar: getAvatar('Ian'),
    firstSeen: '2023-09-15', lastSeen: '2023-10-15', totalAppointments: 2, preferredContactMethod: 'EMAIL',
    tags: []
  },
  { 
    id: 'c10', name: 'Julia Roberts', phone: '+15550110', avatar: getAvatar('Julia'),
    firstSeen: '2023-07-04', lastSeen: '2023-11-01', totalAppointments: 6, preferredContactMethod: 'WHATSAPP',
    tags: ['Regular', 'Morning']
  },
  { 
    id: 'c11', name: 'Kevin Hart', phone: '+15550111', avatar: getAvatar('Kevin'),
    firstSeen: '2023-10-01', lastSeen: '2023-10-01', totalAppointments: 1, preferredContactMethod: 'PHONE',
    tags: ['Late Payer']
  },
  { 
    id: 'c12', name: 'Luna Lovegood', phone: '+15550112', avatar: getAvatar('Luna'),
    firstSeen: '2023-11-01', lastSeen: '2023-11-04', totalAppointments: 1, notes: 'Very eccentric, loves colorful yoga mats.', preferredContactMethod: 'WHATSAPP',
    tags: ['New Client', 'Yoga Fan']
  },
];

// --- GENERATE CLASS SESSIONS (Past & Future) ---
let CLASS_SESSIONS: ClassSession[] = [];

// Helper to add session
const addSession = (id: string, serviceIdx: number, dayOffset: number, hour: number, room: string, provider: string, attendees: number) => {
  const service = SERVICES[serviceIdx];
  const startTime = new Date(NOW + (dayOffset * DAY_MS));
  startTime.setHours(hour, 0, 0, 0);
  
  CLASS_SESSIONS.push({
    id,
    serviceId: service.id,
    serviceName: service.name,
    startTime: startTime.toISOString(),
    durationMinutes: service.durationMinutes,
    providerName: provider,
    room,
    maxCapacity: service.capacity || 10,
    currentAttendees: attendees,
    description: `Standard session for ${service.name}.`
  });
};

// Past Sessions (History)
addSession('cs_past_1', 2, -5, 9, 'Room A', 'Instructor Sarah', 10); // Morning Yoga full
addSession('cs_past_2', 3, -5, 18, 'Main Hall', 'Coach Mike', 12); // Crossfit
addSession('cs_past_3', 5, -4, 17, 'Studio 2', 'Trainer Lisa', 18); // HIIT Blast
addSession('cs_past_4', 2, -3, 9, 'Room A', 'Instructor Sarah', 8);
addSession('cs_past_5', 7, -2, 19, 'Room B', 'Yoga Master Jen', 6); // Hot Yoga
addSession('cs_past_6', 3, -1, 18, 'Main Hall', 'Coach Mike', 14);

// Upcoming Sessions
addSession('cs1', 2, 1, 9, 'Room A', 'Instructor Sarah', 7); // Tomorrow Morning Yoga
addSession('cs2', 3, 1, 10, 'Main Hall', 'Coach Mike', 12); // Tomorrow Crossfit
addSession('cs3', 5, 1, 17, 'Studio 2', 'Trainer Lisa', 5); // Tomorrow HIIT
addSession('cs4', 2, 2, 9, 'Room A', 'Instructor Sarah', 2); // Day after
addSession('cs5', 7, 2, 18, 'Room B', 'Yoga Master Jen', 9);
addSession('cs6', 3, 3, 10, 'Main Hall', 'Coach Mike', 0);
addSession('cs7', 5, 3, 17, 'Studio 2', 'Trainer Lisa', 1);

// --- GENERATE APPOINTMENTS ---
let APPOINTMENTS: Appointment[] = [];

// Helper to create appointment
const createMockAppt = (id: string, clientId: string, serviceIdx: number, timeOffsetHours: number, status: AppointmentStatus, session?: ClassSession) => {
  const client = CLIENTS.find(c => c.id === clientId)!;
  const service = SERVICES[serviceIdx];
  const startTime = new Date(NOW + (timeOffsetHours * HOUR_MS));
  const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

  // If linking to a class session, override times and details
  const finalStart = session ? session.startTime : startTime.toISOString();
  const finalEnd = session ? new Date(new Date(session.startTime).getTime() + session.durationMinutes * 60000).toISOString() : endTime.toISOString();
  const provider = session ? session.providerName : (serviceIdx === 0 ? 'Barber Mike' : (serviceIdx === 4 ? 'Massage Therapist Tom' : 'Dr. Alyx'));
  const room = session ? session.room : 'Treatment Room 1';

  APPOINTMENTS.push({
    id,
    clientId,
    clientName: client.name,
    serviceId: service.id,
    serviceName: service.name,
    classSessionId: session?.id,
    startTime: finalStart,
    endTime: finalEnd,
    providerName: provider,
    room,
    status,
    currentAttendees: session?.currentAttendees,
    maxCapacity: session?.maxCapacity
  });
};

// Past Appointments
createMockAppt('a_past_1', 'c1', 2, -120, AppointmentStatus.COMPLETED, CLASS_SESSIONS[0]); // Alice in past Yoga
createMockAppt('a_past_2', 'c3', 0, -48, AppointmentStatus.COMPLETED); // Charlie Haircut
createMockAppt('a_past_3', 'c5', 4, -26, AppointmentStatus.COMPLETED); // Evan Massage
createMockAppt('a_past_4', 'c8', 6, -24, AppointmentStatus.CANCELLED); // Hannah Nutrition
createMockAppt('a_past_5', 'c2', 1, -20, AppointmentStatus.NO_SHOW); // Bob Beard Trim
createMockAppt('a_past_6', 'c7', 0, -125, AppointmentStatus.COMPLETED); // George Haircut

// Upcoming Appointments
createMockAppt('a1', 'c1', 2, 24, AppointmentStatus.BOOKED, CLASS_SESSIONS[6]); // Alice in upcoming Yoga (cs1)
createMockAppt('a2', 'c2', 1, 48, AppointmentStatus.BOOKED); // Bob Beard Trim
createMockAppt('a3', 'c4', 2, 24, AppointmentStatus.BOOKED, CLASS_SESSIONS[6]); // Diana in upcoming Yoga (cs1)
createMockAppt('a4', 'c5', 3, 25, AppointmentStatus.BOOKED, CLASS_SESSIONS[7]); // Evan in Crossfit (cs2)
createMockAppt('a5', 'c8', 4, 26, AppointmentStatus.BOOKED); // Hannah Massage
createMockAppt('a6', 'c12', 7, 50, AppointmentStatus.BOOKED, CLASS_SESSIONS[10]); // Luna Hot Yoga (cs5)
createMockAppt('a7', 'c9', 0, 3, AppointmentStatus.PENDING); // Ian Haircut pending
createMockAppt('a8', 'c10', 5, 29, AppointmentStatus.BOOKED, CLASS_SESSIONS[8]); // Julia HIIT

// --- CONVERSATIONS & MESSAGES ---
let CONVERSATIONS: Conversation[] = [];
let MESSAGES: Message[] = [];

const createConv = (id: string, clientId: string, lastMsg: string, timeOffsetMin: number, unread: number, status: 'NEW' | 'ACTIVE' | 'ARCHIVED', apptId?: string) => {
  const client = CLIENTS.find(c => c.id === clientId)!;
  const time = new Date(NOW - (timeOffsetMin * 60000)).toISOString();
  
  CONVERSATIONS.push({
    id,
    clientId,
    clientName: client.name,
    clientPhone: client.phone,
    lastMessageText: lastMsg,
    lastMessageTime: time,
    unreadCount: unread,
    status,
    relatedAppointmentId: apptId
  });

  // Basic message history for each conv
  MESSAGES.push({
    id: `m_${id}_1`, conversationId: id, text: 'Hello, I have a question.', sender: MessageSender.CLIENT, timestamp: new Date(NOW - (timeOffsetMin * 60000) - 300000).toISOString(), isRead: true
  });
  if (status !== 'NEW') {
     MESSAGES.push({
        id: `m_${id}_2`, conversationId: id, text: 'Hi! How can I help you today?', sender: MessageSender.BUSINESS, timestamp: new Date(NOW - (timeOffsetMin * 60000) - 200000).toISOString(), isRead: true
      });
  }
  MESSAGES.push({
    id: `m_${id}_3`, conversationId: id, text: lastMsg, sender: MessageSender.CLIENT, timestamp: time, isRead: unread === 0
  });
};

createConv('conv1', 'c1', 'See you at the yoga class!', 30, 0, 'ACTIVE', 'a1');
createConv('conv2', 'c6', 'Do you have any openings for a massage this weekend?', 5, 1, 'NEW');
createConv('conv3', 'c4', 'Thanks for booking me in.', 120, 0, 'ARCHIVED', 'a3');
createConv('conv4', 'c8', 'Can I reschedule my massage to 4 PM?', 10, 1, 'ACTIVE', 'a5');
createConv('conv5', 'c12', 'Is the hot yoga class suitable for beginners?', 600, 0, 'ACTIVE', 'a6');
createConv('conv6', 'c2', 'Sorry I missed my appointment yesterday.', 1440, 0, 'ARCHIVED', 'a_past_5');
createConv('conv7', 'c9', 'Confirming my haircut later today.', 15, 1, 'ACTIVE', 'a7');

// --- TRANSACTIONS ---
let TRANSACTIONS: Transaction[] = [];

const createTransaction = (id: string, clientId: string, serviceIdx: number, daysAgo: number, status: 'PAID' | 'PENDING' | 'REFUNDED') => {
  const client = CLIENTS.find(c => c.id === clientId)!;
  const service = SERVICES[serviceIdx];
  const date = new Date(NOW - (daysAgo * DAY_MS)).toISOString();
  
  TRANSACTIONS.push({
    id,
    clientId,
    clientName: client.name,
    serviceId: service.id,
    serviceName: service.name,
    amount: service.price,
    currency: 'USD',
    status,
    date,
    stripeTransactionId: `ch_${Math.random().toString(36).substr(2, 9)}`,
    paymentMethod: Math.random() > 0.3 ? 'CARD' : (Math.random() > 0.5 ? 'WALLET' : 'OTHER')
  });
};

// Generate some transactions
CLIENTS.forEach((c, idx) => {
    createTransaction(`t_${idx}_1`, c.id, Math.floor(Math.random() * SERVICES.length), Math.floor(Math.random() * 20), 'PAID');
    if (idx % 3 === 0) createTransaction(`t_${idx}_2`, c.id, 0, 2, 'PENDING');
    if (idx % 7 === 0) createTransaction(`t_${idx}_3`, c.id, 4, 15, 'REFUNDED');
});

// --- PAYOUTS ---
let PAYOUTS: Payout[] = [
    { id: 'po_1', amount: 1450.50, status: 'COMPLETED', arrivalDate: new Date(NOW - 5 * DAY_MS).toISOString(), bankName: 'Chase Bank (...4421)' },
    { id: 'po_2', amount: 890.00, status: 'COMPLETED', arrivalDate: new Date(NOW - 12 * DAY_MS).toISOString(), bankName: 'Chase Bank (...4421)' },
    { id: 'po_3', amount: 1200.00, status: 'PENDING', arrivalDate: new Date(NOW + 2 * DAY_MS).toISOString(), bankName: 'Chase Bank (...4421)' },
    { id: 'po_4', amount: 350.25, status: 'SCHEDULED', arrivalDate: new Date(NOW + 5 * DAY_MS).toISOString(), bankName: 'Chase Bank (...4421)' },
];

// --- SETTINGS ---

const DEFAULT_WORKING_DAY = { 
    open: '09:00', 
    close: '18:00', 
    isOpen: true,
    isSplit: false,
    open2: '19:00', 
    close2: '22:00'
};

let SETTINGS: BusinessSettings = {
  name: 'Downtown Cuts & Yoga',
  description: 'Premium grooming and wellness center in the heart of downtown. We offer bespoke haircuts and rejuvenating yoga sessions.',
  timezone: 'America/New_York',
  whatsappNumber: '+1 555 123 4567',
  reminder24h: true,
  reminder1h: false,
  concurrentSlots: 3,
  daysOff: [
    { date: '2023-12-25', description: 'Christmas Day' },
    { date: '2024-01-01', description: 'New Year\'s Day' }
  ],
  aiPrompt: `You are a helpful and polite receptionist for Downtown Cuts & Yoga. 
Your goal is to help customers book appointments, check availability, and answer basic questions about our services.
- Always be professional and concise.
- If a user asks for a service we don't provide, politely inform them.
- When booking, confirm the date, time, and service before finalizing.`,
  workingHours: {
    monday: { ...DEFAULT_WORKING_DAY },
    tuesday: { ...DEFAULT_WORKING_DAY },
    wednesday: { ...DEFAULT_WORKING_DAY },
    thursday: { ...DEFAULT_WORKING_DAY },
    friday: { ...DEFAULT_WORKING_DAY },
    saturday: { ...DEFAULT_WORKING_DAY, open: '10:00', close: '16:00' },
    sunday: { ...DEFAULT_WORKING_DAY, open: '00:00', close: '00:00', isOpen: false }
  }
};

// --- MOCK API FUNCTIONS ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  getConversations: async (): Promise<Conversation[]> => {
    await delay(300);
    return [...CONVERSATIONS].sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  },

  getConversationById: async (id: string): Promise<Conversation | undefined> => {
    await delay(100);
    return CONVERSATIONS.find(c => c.id === id);
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    await delay(200);
    return MESSAGES.filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  sendMessage: async (conversationId: string, text: string): Promise<Message> => {
    await delay(300);
    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId,
      text,
      sender: MessageSender.BUSINESS,
      timestamp: new Date().toISOString(),
      isRead: true
    };
    MESSAGES.push(newMessage);
    
    // Update conversation last message
    const convIndex = CONVERSATIONS.findIndex(c => c.id === conversationId);
    if (convIndex > -1) {
      CONVERSATIONS[convIndex] = {
        ...CONVERSATIONS[convIndex],
        lastMessageText: text,
        lastMessageTime: newMessage.timestamp,
        status: 'ACTIVE'
      };
    }
    return newMessage;
  },

  // --- APPOINTMENTS ---

  getAppointments: async (): Promise<Appointment[]> => {
    await delay(300);
    return [...APPOINTMENTS].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },

  getAppointmentById: async (id: string): Promise<Appointment | undefined> => {
    return APPOINTMENTS.find(a => a.id === id);
  },

  updateAppointmentStatus: async (id: string, status: AppointmentStatus): Promise<Appointment> => {
    await delay(300);
    const index = APPOINTMENTS.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Appointment not found');
    
    APPOINTMENTS[index] = { ...APPOINTMENTS[index], status };
    return APPOINTMENTS[index];
  },

  rescheduleAppointment: async (id: string, newStart: string, newEnd: string, newClassSessionId?: string): Promise<Appointment> => {
    await delay(500);
    const index = APPOINTMENTS.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Appointment not found');

    const oldAppt = APPOINTMENTS[index];

    // If switching FROM a class, decrement old class attendees
    if (oldAppt.classSessionId) {
       const oldSessionIdx = CLASS_SESSIONS.findIndex(cs => cs.id === oldAppt.classSessionId);
       if (oldSessionIdx !== -1) CLASS_SESSIONS[oldSessionIdx].currentAttendees--;
    }

    // If switching TO a class, increment new class attendees
    let room = oldAppt.room;
    let provider = oldAppt.providerName;
    let currentAttendees: number | undefined = undefined;
    let maxCapacity: number | undefined = undefined;

    if (newClassSessionId) {
        const newSessionIdx = CLASS_SESSIONS.findIndex(cs => cs.id === newClassSessionId);
        if (newSessionIdx !== -1) {
            CLASS_SESSIONS[newSessionIdx].currentAttendees++;
            room = CLASS_SESSIONS[newSessionIdx].room;
            provider = CLASS_SESSIONS[newSessionIdx].providerName;
            currentAttendees = CLASS_SESSIONS[newSessionIdx].currentAttendees;
            maxCapacity = CLASS_SESSIONS[newSessionIdx].maxCapacity;
        }
    }

    APPOINTMENTS[index] = {
        ...oldAppt,
        startTime: newStart,
        endTime: newEnd,
        classSessionId: newClassSessionId,
        room,
        providerName: provider,
        currentAttendees,
        maxCapacity,
        status: AppointmentStatus.BOOKED // Reset status to booked if it was something else
    };

    return APPOINTMENTS[index];
  },

  createAppointment: async (appt: Partial<Appointment>): Promise<Appointment> => {
    await delay(400);
    const newAppt: Appointment = {
      id: `a${Date.now()}`,
      status: AppointmentStatus.BOOKED,
      clientId: appt.clientId!,
      clientName: appt.clientName || 'Unknown',
      serviceId: appt.serviceId!,
      serviceName: appt.serviceName || 'Service',
      startTime: appt.startTime!,
      endTime: appt.endTime!,
      providerName: appt.providerName || 'Staff',
      classSessionId: appt.classSessionId,
      maxCapacity: appt.maxCapacity,
      room: appt.room
    };

    // If it's a class booking, update the class session attendees count
    if (appt.classSessionId) {
      const sessionIndex = CLASS_SESSIONS.findIndex(cs => cs.id === appt.classSessionId);
      if (sessionIndex !== -1) {
        CLASS_SESSIONS[sessionIndex].currentAttendees += 1;
        newAppt.currentAttendees = CLASS_SESSIONS[sessionIndex].currentAttendees;
        newAppt.maxCapacity = CLASS_SESSIONS[sessionIndex].maxCapacity;
        newAppt.room = CLASS_SESSIONS[sessionIndex].room;
      }
    }

    APPOINTMENTS.push(newAppt);
    return newAppt;
  },

  // --- CLIENTS ---

  getClients: async (): Promise<Client[]> => {
    await delay(300);
    return [...CLIENTS];
  },

  getClientById: async (id: string): Promise<Client | undefined> => {
    return CLIENTS.find(c => c.id === id);
  },

  updateClient: async (client: Client): Promise<Client> => {
    await delay(300);
    const index = CLIENTS.findIndex(c => c.id === client.id);
    if (index !== -1) {
      CLIENTS[index] = client;
      return client;
    }
    throw new Error("Client not found");
  },

  // --- SERVICES & CLASSES ---

  getServices: async (): Promise<Service[]> => {
    await delay(100);
    return [...SERVICES];
  },

  createService: async (service: Partial<Service>): Promise<Service> => {
    await delay(300);
    const newService: Service = {
      id: `s${Date.now()}`,
      name: service.name || 'New Service',
      durationMinutes: service.durationMinutes || 60,
      price: service.price || 0,
      isClass: true, // Defaulting to class for this context
      capacity: service.capacity || 10
    };
    SERVICES.push(newService);
    return newService;
  },

  getClassSessions: async (): Promise<ClassSession[]> => {
    await delay(300);
    return [...CLASS_SESSIONS].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  },

  getProviders: async (): Promise<string[]> => {
    await delay(100);
    return PROVIDERS;
  },

  addProvider: async (name: string): Promise<string> => {
    await delay(200);
    if (!PROVIDERS.includes(name)) {
        PROVIDERS.push(name);
    }
    return name;
  },

  createClassSession: async (session: Partial<ClassSession>): Promise<ClassSession> => {
    await delay(300);
    const newSession: ClassSession = {
      id: `cs${Date.now()}`,
      serviceId: session.serviceId!,
      serviceName: session.serviceName!,
      startTime: session.startTime!,
      durationMinutes: session.durationMinutes!,
      providerName: session.providerName!,
      room: session.room || 'Main Room',
      maxCapacity: session.maxCapacity || 10,
      currentAttendees: 0,
      description: session.description
    };
    CLASS_SESSIONS.push(newSession);
    return newSession;
  },

  // --- PAYMENTS ---

  getTransactions: async (): Promise<Transaction[]> => {
    await delay(400);
    return [...TRANSACTIONS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getPayouts: async (): Promise<Payout[]> => {
    await delay(300);
    return [...PAYOUTS].sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime());
  },

  // --- SETTINGS ---

  getSettings: async (): Promise<BusinessSettings> => {
    await delay(100);
    return { ...SETTINGS };
  },

  updateSettings: async (settings: Partial<BusinessSettings>): Promise<BusinessSettings> => {
    await delay(300);
    SETTINGS = { ...SETTINGS, ...settings };
    return SETTINGS;
  }
};
