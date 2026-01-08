
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mockApi } from '../services/mockApi';
import { Conversation, Message, Appointment, AppointmentStatus, MessageSender, Client, ConvStatus, StaffRole, InternalNote } from '../types';
import Badge from '../components/Badge';
import { 
  Search, Send, MoreVertical, Calendar, Clock, User, 
  CheckCircle, AlertCircle, MessageSquare, MapPin, 
  Plus, FileText, Phone, Tag as TagIcon, Save, 
  History, ChevronRight, PanelRight, X, Sparkles, Filter, 
  UserCheck, Activity, PlusCircle, Mail, Timer, Bot, 
  UserPlus, Check, ChevronDown, ListFilter, ClipboardList, Zap, Quote,
  CalendarDays, ExternalLink
} from 'lucide-react';
import NewBookingFlow from '../components/NewBookingFlow';

const SLA_WARNING_THRESHOLD = 10;
const SLA_BREACH_THRESHOLD = 20;

const QUICK_REPLIES = [
  "We've shared your results with the doctor and will follow up shortly.",
  "Please arrive 10 minutes early for your check-in.",
  "Your appointment has been successfully rescheduled.",
  "We accept most major insurance plans including Blue Shield.",
  "The doctor is currently in surgery but will review this tonight."
];

const Inbox: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<(Conversation & { avatar?: string })[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [now, setNow] = useState(Date.now());
  
  // Clinical States
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [isCrmOpen, setIsCrmOpen] = useState(true);
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Simulated Global Tags Registry
  const [globalTags, setGlobalTags] = useState<string[]>(['Chronic Care', 'Follow-up', 'Urgent', 'Maternity', 'Insurance', 'Scheduling']);

  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'ACTIVE'>('ACTIVE');
  const [messageInput, setMessageInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    // Handle deep-link from Appointments
    const clientIdParam = searchParams.get('clientId');
    if (clientIdParam && conversations.length > 0) {
      const conv = conversations.find(c => c.clientId === clientIdParam);
      if (conv) setSelectedConvId(conv.id);
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
      const conv = conversations.find(c => c.id === selectedConvId);
      if (conv) { 
        loadClientContext(conv.clientId); 
      }
    }
  }, [selectedConvId]);

  const loadConversations = async () => {
    const data = await mockApi.getConversations();
    const clients = await mockApi.getClients();
    const dataWithAvatars = data.map(c => ({ ...c, avatar: clients.find(cl => cl.id === c.clientId)?.avatar }));
    setConversations(dataWithAvatars);
    if (data.length > 0 && !selectedConvId && !searchParams.get('clientId')) { 
      setSelectedConvId(data[0].id); 
    }
  };

  const loadMessages = async (id: string) => {
    const data = await mockApi.getMessages(id);
    setMessages(data);
    setTimeout(scrollToBottom, 100);
  };

  const loadClientContext = async (clientId: string) => {
      const [client, appts] = await Promise.all([
        mockApi.getClientById(clientId),
        mockApi.getAppointments()
      ]);
      if (client) {
          setCurrentClient(client);
          setNoteDraft(client.notes || '');
          setClientAppointments(appts.filter(a => a.clientId === clientId).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      }
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;
    const text = messageInput;
    setMessageInput('');
    const newMsg = await mockApi.sendMessage(selectedConvId, text);
    setMessages(prev => [...prev, newMsg]);
    
    setConversations(prev => prev.map(c => 
      c.id === selectedConvId 
        ? { ...c, lastMessageText: text, lastMessageTime: newMsg.timestamp, unreadCount: 0, status: c.status === 'OPEN' ? 'IN_PROGRESS' : c.status } 
        : c
    ));
    setTimeout(scrollToBottom, 100);
  };

  const updateMeta = async (updates: Partial<Conversation>) => {
    if (!selectedConvId) return;
    const updated = await mockApi.updateConversationMeta(selectedConvId, updates);
    setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, ...updated } : c));
  };

  const addInternalNote = async () => {
    if (!internalNoteInput.trim() || !selectedConvId) return;
    const note = await mockApi.addInternalNote(selectedConvId, internalNoteInput, "Staff Member");
    setConversations(prev => prev.map(c => 
        c.id === selectedConvId ? { ...c, internalNotes: [note, ...c.internalNotes] } : c
    ));
    setInternalNoteInput('');
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !selectedConvId) return;
    addTag(newTagName.trim());
    setNewTagName('');
    setIsAddingTag(false);
  };

  const addTag = (tagName: string) => {
    const conv = conversations.find(c => c.id === selectedConvId);
    if (!conv || conv.tags.includes(tagName)) return;
    updateMeta({ tags: [...conv.tags, tagName] });
    if (!globalTags.includes(tagName)) setGlobalTags(prev => [...prev, tagName]);
  };

  const removeTag = (tagName: string) => {
    const conv = conversations.find(c => c.id === selectedConvId);
    if (!conv) return;
    updateMeta({ tags: conv.tags.filter(t => t !== tagName) });
  };

  const nextAppt = useMemo(() => {
    return clientAppointments.find(a => new Date(a.startTime) > new Date() && a.status !== AppointmentStatus.CANCELLED);
  }, [clientAppointments]);

  // --- Filtering & Sorting ---
  const filteredConversations = useMemo(() => {
    return conversations
      .filter(c => {
        if (filter === 'NEW') return c.unreadCount > 0;
        if (filter === 'ACTIVE') return c.status !== 'RESOLVED';
        return true;
      })
      .filter(c => {
        if (activeTagFilters.length === 0) return true;
        return activeTagFilters.some(tag => c.tags.includes(tag));
      })
      .filter(c => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
          c.clientName.toLowerCase().includes(lower) ||
          c.lastMessageText.toLowerCase().includes(lower)
        );
      })
      .sort((a, b) => {
        const weight = { 'ESCALATED': 4, 'OPEN': 3, 'IN_PROGRESS': 2, 'RESOLVED': 1 };
        return weight[b.status] - weight[a.status] || new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
  }, [conversations, filter, activeTagFilters, searchTerm]);

  const selectedConversation = conversations.find(c => c.id === selectedConvId);

  const getSlaMetrics = (conv: Conversation | undefined) => {
    if (!conv || conv.unreadCount === 0) return { status: 'REPLIED', elapsedMins: 0 };
    const elapsedMins = Math.floor((now - new Date(conv.lastMessageTime).getTime()) / 60000);
    if (elapsedMins >= SLA_BREACH_THRESHOLD) return { status: 'BREACHED', elapsedMins };
    if (elapsedMins >= SLA_WARNING_THRESHOLD) return { status: 'WARNING', elapsedMins };
    return { status: 'HEALTHY', elapsedMins };
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      
      {/* 1. Queue Sidebar */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-white z-20 flex-shrink-0">
        <div className="p-5 border-b border-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Triage Queue</h2>
            <div className="relative">
                <button 
                    onClick={() => setIsTagFilterOpen(!isTagFilterOpen)}
                    className={`p-1.5 rounded-lg transition-colors ${activeTagFilters.length > 0 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                >
                    <ListFilter size={16} />
                </button>
                {isTagFilterOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-2xl rounded-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2 px-2">Filter by Tags</p>
                        {globalTags.map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => setActiveTagFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 rounded-lg text-xs font-bold"
                            >
                                {tag} {activeTagFilters.includes(tag) && <Check size={14} className="text-indigo-600"/>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name or message..." 
              className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {['ACTIVE', 'NEW', 'ALL'].map((f) => (
              <button 
                key={f} onClick={() => setFilter(f as any)} 
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-indigo-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.map((conv) => {
            const isSelected = selectedConvId === conv.id;
            return (
                <div 
                    key={conv.id} 
                    onClick={() => setSelectedConvId(conv.id)} 
                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-all flex gap-3 relative group ${isSelected ? 'bg-indigo-50/20' : ''}`}
                >
                <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-200">
                      <User size={24} />
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-[10px] font-black text-white flex items-center justify-center rounded-full border-2 border-white shadow-md">
                        {conv.unreadCount}
                      </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className={`font-black text-[13px] truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>{conv.clientName}</h3>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${
                          conv.status === 'OPEN' ? 'bg-indigo-50 text-indigo-600' : 
                          conv.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 
                          conv.status === 'ESCALATED' ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'
                        }`}>{conv.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-[12px] truncate text-gray-500 font-medium mt-0.5">{conv.lastMessageText}</p>
                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex gap-1 overflow-hidden">
                            {conv.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[8px] font-black uppercase bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded tracking-tighter">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* 2. Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-white">
          <div className="flex-1 flex flex-col h-full relative bg-white z-10 overflow-hidden border-r border-gray-100">
            {/* Chat Header */}
            <div className="p-4 px-6 border-b border-gray-50 flex justify-between items-center bg-white h-20">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-200">
                  <User size={20} />
                </div>
                <div className="truncate">
                    <h3 className="font-black text-gray-900 text-base truncate tracking-tight">{selectedConversation.clientName}</h3>
                    <div className="flex items-center gap-2">
                        <select 
                            value={selectedConversation.status} 
                            onChange={(e) => updateMeta({ status: e.target.value as ConvStatus })}
                            className={`text-[10px] font-black uppercase tracking-widest border-none p-0 bg-transparent cursor-pointer outline-none transition-colors ${selectedConversation.status === 'ESCALATED' ? 'text-rose-600' : 'text-indigo-600'}`}
                        >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="ESCALATED">Escalated</option>
                            <option value="RESOLVED">Resolved</option>
                        </select>
                        <span className="text-gray-200">•</span>
                        <select 
                             value={selectedConversation.assignedTo} 
                             onChange={(e) => updateMeta({ assignedTo: e.target.value as StaffRole })}
                             className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-none p-0 bg-transparent cursor-pointer outline-none"
                        >
                            <option value="NONE">Unassigned</option>
                            <option value="DOCTOR">Dr. Smith</option>
                            <option value="NURSE">Nurse Jackie</option>
                            <option value="FRONT_DESK">Reception</option>
                        </select>
                    </div>
                </div>
              </div>
              <button 
                onClick={() => setIsCrmOpen(!isCrmOpen)} 
                className={`p-2.5 rounded-xl transition-all ${isCrmOpen ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <PanelRight size={20} />
              </button>
            </div>
            
            {/* Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/30 custom-scrollbar">
              {messages.map((msg) => {
                const isPatient = msg.sender === MessageSender.CLIENT;
                return (
                    <div key={msg.id} className={`flex flex-col ${isPatient ? 'items-start' : 'items-end'} animate-in slide-in-from-bottom-2`}>
                      <div className={`flex items-center gap-1.5 mb-1.5 ${isPatient ? 'flex-row' : 'flex-row-reverse'}`}>
                          {!isPatient && msg.isBot && <Bot size={12} className="text-indigo-500" />}
                          {!isPatient && !msg.isBot && <User size={12} className="text-emerald-500" />}
                          {isPatient && <User size={12} className="text-gray-400" />}
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {isPatient ? selectedConversation.clientName : msg.isBot ? 'AI BOT' : 'STAFF'}
                          </span>
                      </div>
                      
                      <div className="flex flex-col group relative">
                        <div className={`px-5 py-3 rounded-2xl text-[14px] font-medium leading-relaxed max-w-lg ${
                          isPatient 
                            ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm' 
                            : 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100'
                        }`}>
                          <p>{msg.text}</p>
                        </div>
                        <span className={`text-[10px] font-bold text-gray-300 uppercase mt-1.5 flex items-center gap-1 ${isPatient ? 'justify-start' : 'justify-end'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-6 bg-white border-t border-gray-50 space-y-4">
                <div className="flex gap-2">
                    <button 
                      onClick={() => setIsQuickReplyOpen(!isQuickReplyOpen)} 
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-100 shadow-sm"
                    >
                        <Quote size={14} /> QUICK REPLIES
                    </button>
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                    <input 
                        type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} 
                        placeholder="Clinical message..." 
                        className="flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-medium focus:bg-white focus:border-indigo-600 outline-none transition-all" 
                    />
                    <button type="submit" disabled={!messageInput.trim()} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                      <Send size={20} />
                    </button>
                </form>
            </div>
          </div>

          {/* 3. Clinical Context Panel */}
          {currentClient && isCrmOpen && (
             <div className="w-full md:w-80 lg:w-96 bg-white flex flex-col h-full overflow-hidden border-l border-gray-100 animate-in slide-in-from-right duration-300">
                <div className="p-8 pb-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-200 mx-auto mb-4 border-4 border-white shadow-lg">
                      <User size={40} />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">{currentClient.name}</h2>
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                        {selectedConversation.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg text-[9px] font-black uppercase tracking-tighter">{tag}</span>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    
                    {/* Clinical Schedule Section (Unification) */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-400" /> Clinical Schedule
                            </h4>
                            <button 
                              onClick={() => navigate(`/appointments?clientId=${currentClient.id}`)}
                              className="text-[9px] font-black text-indigo-600 uppercase hover:underline flex items-center gap-1"
                            >
                                View All <ExternalLink size={10} />
                            </button>
                        </div>
                        
                        {nextAppt ? (
                            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full group-hover:scale-110 transition-transform"></div>
                                <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Upcoming Visit</p>
                                <h5 className="font-black text-sm mb-4">{nextAppt.serviceName}</h5>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold">
                                        <CalendarDays size={14} className="opacity-60" />
                                        {new Date(nextAppt.startTime).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold">
                                        <Clock size={14} className="opacity-60" />
                                        {new Date(nextAppt.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold">
                                        <UserCheck size={14} className="opacity-60" />
                                        {nextAppt.providerName}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-100 p-6 rounded-[2rem] text-center space-y-3">
                                <p className="text-[11px] font-bold text-gray-400">No upcoming encounters.</p>
                                <button 
                                    onClick={() => setIsBookingModalOpen(true)}
                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all"
                                >
                                    Schedule Now
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Internal Notes */}
                    <section className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ClipboardList size={14} className="text-amber-500" /> Internal Notes
                        </h4>
                        <div className="bg-amber-50/30 border border-amber-100 rounded-[2rem] p-5 space-y-4">
                            <div className="relative group">
                                <input 
                                    type="text" value={internalNoteInput} onChange={(e) => setInternalNoteInput(e.target.value)}
                                    placeholder="Private clinical note..."
                                    className="w-full text-[11px] font-bold bg-white border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600 transition-all shadow-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && addInternalNote()}
                                />
                            </div>
                            <div className="space-y-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {selectedConversation.internalNotes.map(note => (
                                    <div key={note.id} className="bg-white p-3 rounded-xl border border-gray-50 shadow-sm animate-in fade-in">
                                        <p className="text-[11px] font-bold text-gray-800 italic">"{note.text}"</p>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50 text-[9px] text-gray-400 font-bold uppercase">
                                            <span>{note.author}</span>
                                            <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                <div className="p-8 border-t border-gray-50">
                    <button 
                        onClick={() => setIsBookingModalOpen(true)}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                    >
                        <PlusCircle size={18} /> Book Encounter
                    </button>
                </div>
             </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white flex-col gap-4">
            <MessageSquare size={64} className="text-gray-100" />
            <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em]">Select a thread to begin triage</p>
        </div>
      )}

      {currentClient && (
        <NewBookingFlow 
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={() => {
              setIsBookingModalOpen(false);
              loadClientContext(currentClient.id);
          }}
          preselectedClient={currentClient}
        />
      )}
    </div>
  );
};

export default Inbox;
