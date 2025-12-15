

import React, { useState, useEffect, useRef } from 'react';
import { mockApi } from '../services/mockApi';
import { Conversation, Message, Appointment, AppointmentStatus, MessageSender, Client } from '../types';
import Badge from '../components/Badge';
import BookingModal from '../components/BookingModal';
import RescheduleModal from '../components/RescheduleModal';
import { Search, Send, MoreVertical, Calendar, Clock, User, XCircle, CheckCircle, AlertCircle, MessageSquare, MapPin, RefreshCw, Plus, FileText, Phone, Mail, Tag, Save, History, ChevronRight, PanelRight } from 'lucide-react';

const Inbox: React.FC = () => {
  const [conversations, setConversations] = useState<(Conversation & { avatar?: string })[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // CRM State
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [crmTab, setCrmTab] = useState<'INFO' | 'BOOKINGS'>('INFO');
  const [noteDraft, setNoteDraft] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isCrmOpen, setIsCrmOpen] = useState(true);

  // Modals
  const [activeAppointmentForAction, setActiveAppointmentForAction] = useState<Appointment | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  
  const [messageInput, setMessageInput] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'ACTIVE'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
      const conv = conversations.find(c => c.id === selectedConvId);
      
      if (conv) {
         loadClientContext(conv.clientId);
      }
    }
  }, [selectedConvId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    const data = await mockApi.getConversations();
    const clients = await mockApi.getClients();
    const dataWithAvatars = data.map(c => {
        const client = clients.find(cl => cl.id === c.clientId);
        return { ...c, avatar: client?.avatar };
    });
    setConversations(dataWithAvatars);

    if (data.length > 0 && !selectedConvId) {
      setSelectedConvId(data[0].id);
    }
  };

  const loadMessages = async (id: string) => {
    setIsLoading(true);
    const data = await mockApi.getMessages(id);
    setMessages(data);
    setIsLoading(false);
  };

  const loadClientContext = async (clientId: string) => {
      // 1. Get Client Details
      const client = await mockApi.getClientById(clientId);
      if (client) {
          setCurrentClient(client);
          setNoteDraft(client.notes || '');
      }

      // 2. Get All Appointments for this client
      const allAppts = await mockApi.getAppointments();
      const clientAppts = allAppts
        .filter(a => a.clientId === clientId)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      setClientAppointments(clientAppts);

      // Default to Bookings tab if there is an active upcoming appointment, else Info
      const hasUpcoming = clientAppts.some(a => new Date(a.startTime) > new Date() && a.status === AppointmentStatus.BOOKED);
      setCrmTab(hasUpcoming ? 'BOOKINGS' : 'INFO');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;

    const newMsg = await mockApi.sendMessage(selectedConvId, messageInput);
    setMessages([...messages, newMsg]);
    setMessageInput('');
    loadConversations();
  };

  const updateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus) => {
    await mockApi.updateAppointmentStatus(appointmentId, status);
    if (currentClient) loadClientContext(currentClient.id);
  };

  const saveClientNote = async () => {
      if (!currentClient) return;
      setIsSavingNote(true);
      await mockApi.updateClient({ ...currentClient, notes: noteDraft });
      setIsSavingNote(false);
      // Optional: Show toast
  };

  const handleBookingSuccess = () => {
    if (currentClient) {
        loadClientContext(currentClient.id);
        if (selectedConvId) loadMessages(selectedConvId);
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  const selectedConversation = conversations.find(c => c.id === selectedConvId);

  // Split appointments
  const upcomingAppointments = clientAppointments.filter(a => new Date(a.startTime) > new Date() && a.status !== AppointmentStatus.CANCELLED);
  const pastAppointments = clientAppointments.filter(a => new Date(a.startTime) <= new Date() || a.status === AppointmentStatus.CANCELLED).reverse();

  // Tag Color Helper
  const getTagColor = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes('vip')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (t.includes('new')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (t.includes('refer') || t.includes('high')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (t.includes('late')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Left Panel: Conversation List */}
      <div className="w-full md:w-80 lg:w-80 border-r border-gray-100 flex flex-col bg-white z-10 shadow-sm flex-shrink-0">
        <div className="p-4 border-b border-gray-50 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['ALL', 'NEW', 'ACTIVE'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${
                  filter === f 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConvId(conv.id)}
              className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${
                selectedConvId === conv.id ? 'bg-indigo-50/50 hover:bg-indigo-50/50' : ''
              }`}
            >
              <div className="relative">
                <img 
                    src={conv.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${conv.clientId}`} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-full bg-gray-100 border border-white shadow-sm object-cover"
                />
                {conv.status === 'NEW' && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className={`font-bold text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {conv.clientName || conv.clientPhone}
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate max-w-[160px] ${conv.unreadCount > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                    {conv.lastMessageText}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle & Right Panel Wrapper */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-gray-50">
          
          {/* Middle: Chat Area */}
          <div className="flex-1 flex flex-col h-full relative bg-white md:rounded-l-2xl shadow-xl z-0 overflow-hidden border-r border-gray-200">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10 h-16">
              <div className="flex items-center gap-3">
                <img 
                    src={selectedConversation.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedConversation.clientId}`} 
                    alt="Avatar" 
                    className="w-9 h-9 rounded-full border border-gray-100"
                />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{selectedConversation.clientName}</h3>
                  <p className="text-[10px] text-indigo-500 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    WhatsApp Active
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsCrmOpen(!isCrmOpen)}
                  className={`p-2 rounded-full transition-colors ${isCrmOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                  title={isCrmOpen ? "Hide Details" : "Show Details"}
                >
                  <PanelRight size={20} />
                </button>
                <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8fafc]"> 
              {isLoading ? (
                <div className="flex justify-center p-4"><span className="text-gray-400 text-sm">Loading chat...</span></div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === MessageSender.CLIENT ? 'justify-start' : (msg.sender === MessageSender.SYSTEM ? 'justify-center' : 'justify-end')}`}>
                    {msg.sender === MessageSender.SYSTEM ? (
                      <div className="bg-gray-100 border border-gray-200 text-gray-500 text-[10px] px-3 py-1 rounded-full my-2 font-medium uppercase tracking-wide">
                        {msg.text}
                      </div>
                    ) : (
                      <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm relative group ${
                        msg.sender === MessageSender.BUSINESS 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}>
                        <p className="leading-relaxed">{msg.text}</p>
                        <span className={`text-[9px] block text-right mt-1.5 opacity-70 ${msg.sender === MessageSender.BUSINESS ? 'text-indigo-100' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender === MessageSender.BUSINESS && ' • ✓✓'}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
              <button type="button" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                 <Plus size={20} />
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm"
              />
              <button 
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200"
              >
                <Send size={18} />
              </button>
            </form>
          </div>

          {/* Right: CRM Context Panel */}
          {currentClient && isCrmOpen && (
             <div className="w-full md:w-80 lg:w-96 bg-white flex flex-col h-full border-l border-gray-200 overflow-hidden animate-in slide-in-from-right duration-300">
                {/* CRM Header */}
                <div className="p-6 pb-4 border-b border-gray-100 text-center bg-gray-50/30 relative">
                    <button 
                      onClick={() => setIsCrmOpen(false)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 md:hidden"
                    >
                      <XCircle size={20} />
                    </button>
                    <div className="relative inline-block">
                        <img 
                            src={currentClient.avatar} 
                            alt={currentClient.name} 
                            className="w-20 h-20 rounded-full border-4 border-white shadow-md mx-auto mb-3"
                        />
                         <span className="absolute bottom-1 right-0 bg-green-500 w-5 h-5 border-4 border-white rounded-full"></span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">{currentClient.name}</h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium flex items-center justify-center gap-1">
                        Joined {new Date(currentClient.firstSeen).toLocaleDateString()}
                    </p>
                    
                    <div className="flex justify-center gap-2 mt-4">
                        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                            <Phone size={14} />
                        </button>
                         <button className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                            <Mail size={14} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button 
                        onClick={() => setCrmTab('INFO')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${crmTab === 'INFO' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                        Overview
                    </button>
                    <button 
                         onClick={() => setCrmTab('BOOKINGS')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${crmTab === 'BOOKINGS' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                        Bookings ({clientAppointments.length})
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-0 bg-gray-50/30">
                    
                    {/* INFO TAB */}
                    {crmTab === 'INFO' && (
                        <div className="p-6 space-y-6">
                            {/* Tags Section */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Tag size={12} /> Tags
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentClient.tags && currentClient.tags.length > 0 ? (
                                        currentClient.tags.map(tag => (
                                            <span key={tag} className={`px-2 py-1 rounded-md text-xs font-bold border ${getTagColor(tag)}`}>
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                         <span className="text-xs text-gray-400 italic">No tags</span>
                                    )}
                                    <button className="px-2 py-1 bg-white border border-dashed border-gray-300 text-gray-400 rounded-md text-xs hover:border-indigo-300 hover:text-indigo-500 flex items-center gap-1 transition-colors">
                                        <Plus size={10} /> Add
                                    </button>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
                                <div className="flex items-start gap-3">
                                    <Phone size={14} className="text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">Phone</p>
                                        <p className="text-sm text-gray-900">{currentClient.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail size={14} className="text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">Email</p>
                                        <p className="text-sm text-gray-900">{currentClient.email || 'No email provided'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Editable Notes */}
                            <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 shadow-sm relative group">
                                <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <FileText size={12} /> Private Notes
                                </h4>
                                <textarea 
                                    value={noteDraft}
                                    onChange={(e) => setNoteDraft(e.target.value)}
                                    onBlur={saveClientNote}
                                    rows={6}
                                    placeholder="Add notes about preferences, allergies, etc."
                                    className="w-full bg-transparent border-none p-0 text-sm text-gray-800 placeholder-yellow-400/50 focus:ring-0 resize-none leading-relaxed"
                                />
                                {isSavingNote && (
                                    <span className="absolute bottom-2 right-2 text-[10px] text-yellow-600 italic">Saving...</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* BOOKINGS TAB */}
                    {crmTab === 'BOOKINGS' && (
                        <div className="p-4 space-y-6">
                            <button 
                                onClick={() => setIsBookingModalOpen(true)}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Calendar size={16} /> New Booking
                            </button>

                            {/* Upcoming Section */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pl-2">Upcoming</h4>
                                {upcomingAppointments.length === 0 ? (
                                    <div className="text-center p-6 bg-white border border-dashed border-gray-200 rounded-xl">
                                        <p className="text-xs text-gray-400 font-medium">No upcoming bookings</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingAppointments.map(appt => (
                                            <div key={appt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative overflow-hidden group hover:border-indigo-300 transition-all">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                                <div className="flex justify-between items-start mb-2 pl-2">
                                                    <h5 className="font-bold text-gray-900 text-sm">{appt.serviceName}</h5>
                                                    <Badge status={appt.status} />
                                                </div>
                                                <div className="space-y-1.5 pl-2 mb-3">
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <Calendar size={12} className="text-indigo-400" />
                                                        {new Date(appt.startTime).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <Clock size={12} className="text-indigo-400" />
                                                        {new Date(appt.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <User size={12} className="text-indigo-400" />
                                                        {appt.providerName}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pl-2 pt-2 border-t border-gray-50">
                                                    <button 
                                                        onClick={() => { setActiveAppointmentForAction(appt); setIsRescheduleModalOpen(true); }}
                                                        className="flex-1 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <RefreshCw size={10} /> Reschedule
                                                    </button>
                                                    <button 
                                                        onClick={() => updateAppointmentStatus(appt.id, AppointmentStatus.CANCELLED)}
                                                        className="flex-1 py-1.5 bg-gray-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <XCircle size={10} /> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* History Section */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pl-2 flex items-center gap-2">
                                    <History size={12} /> Recent History
                                </h4>
                                <div className="space-y-2">
                                    {pastAppointments.slice(0, 5).map(appt => (
                                        <div key={appt.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg opacity-80 hover:opacity-100 transition-opacity">
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">{appt.serviceName}</p>
                                                <p className="text-[10px] text-gray-500">{new Date(appt.startTime).toLocaleDateString()}</p>
                                            </div>
                                            <Badge status={appt.status} className="scale-90 origin-right" />
                                        </div>
                                    ))}
                                    {pastAppointments.length === 0 && (
                                        <p className="text-center text-xs text-gray-300 italic py-2">No past history</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
             </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 flex-col gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-100 mb-2">
            <MessageSquare size={40} className="text-indigo-200" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to Inbox</h3>
            <p className="text-gray-400 max-w-xs mx-auto">Select a conversation from the left to start chatting or managing appointments.</p>
          </div>
        </div>
      )}

      {currentClient && (
        <BookingModal 
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          client={currentClient}
          onSuccess={handleBookingSuccess}
        />
      )}

      {(activeAppointmentForAction) && (
        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          appointment={activeAppointmentForAction}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default Inbox;
