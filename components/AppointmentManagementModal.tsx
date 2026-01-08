
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Calendar, Clock, User, Trash2, CheckCircle2, 
  AlertCircle, History, ArrowRight, Loader2, Stethoscope, 
  Check, UserCheck, ChevronDown, CalendarDays, MoreHorizontal,
  Bot, MousePointer2, BellRing, Smartphone, MessageSquareShare,
  Activity, Timer, ChevronRight, CheckCircle
} from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { Appointment, AppointmentStatus, Provider, TimeSlot, ProviderAvailability, Service, Conversation } from '../types';
import Badge from './Badge';

// Fix: Updated appointment type to include optional avatar property to avoid property 'avatar' does not exist error.
interface AppointmentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment & { avatar?: string };
  onSuccess: () => void;
  onOpenChat?: () => void;
}

const CANCEL_REASONS = [
  'Patient cancelled (via WhatsApp)',
  'Clinic rescheduling',
  'Provider unavailable',
  'Scheduling error',
  'No-show follow-up',
  'Other'
];

const AppointmentManagementModal: React.FC<AppointmentManagementModalProps> = ({ isOpen, onClose, appointment, onSuccess, onOpenChat }) => {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'RESCHEDULE' | 'AUDIT'>('DETAILS');
  const [isLoading, setIsLoading] = useState(false);
  const [linkedConv, setLinkedConv] = useState<Conversation | null>(null);
  
  // Reschedule State
  const [rescheduleDate, setRescheduleDate] = useState<string>(new Date(appointment.startTime).toISOString().split('T')[0]);
  const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);
  const [rescheduleProviderId, setRescheduleProviderId] = useState<string>(appointment.providerId);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [service, setService] = useState<Service | null>(null);

  // Cancellation State
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);

  useEffect(() => {
    if (isOpen) {
      loadContext();
      setActiveTab('DETAILS');
      setRescheduleDate(new Date(appointment.startTime).toISOString().split('T')[0]);
      setRescheduleTime(null);
      setRescheduleProviderId(appointment.providerId);
      setIsConfirmingCancel(false);
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (activeTab === 'RESCHEDULE') {
      fetchAvailability();
    }
  }, [activeTab, rescheduleDate, rescheduleProviderId]);

  const loadContext = async () => {
    const [p, s, conversations] = await Promise.all([
      mockApi.getProviders(),
      mockApi.getServices(),
      mockApi.getConversations()
    ]);
    setProviders(p);
    setService(s.find(x => x.id === appointment.serviceId) || null);
    const conv = conversations.find(c => c.clientId === appointment.clientId);
    if (conv) setLinkedConv(conv);
  };

  const fetchAvailability = async () => {
    setIsAvailabilityLoading(true);
    try {
      const data = await mockApi.getAvailabilityForDate(appointment.serviceId, rescheduleDate);
      setAvailableSlots(data.slots);
    } finally {
      setIsAvailabilityLoading(false);
    }
  };

  const displaySlots = useMemo(() => {
    if (rescheduleProviderId === 'ANY') return availableSlots;
    return availableSlots.filter(s => s.providers.includes(rescheduleProviderId));
  }, [availableSlots, rescheduleProviderId]);

  const handleUpdateStatus = async (status: AppointmentStatus) => {
    setIsLoading(true);
    try {
      await mockApi.updateAppointmentStatus(appointment.id, status);
      onSuccess();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await mockApi.cancelAppointment(appointment.id, cancelReason);
      onSuccess();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleTime || !service) return;
    setIsLoading(true);
    try {
      const start = new Date(`${rescheduleDate}T${rescheduleTime}`);
      const end = new Date(start.getTime() + service.durationMinutes * 60000);
      
      const slot = availableSlots.find(s => s.time === rescheduleTime);
      const finalProvId = rescheduleProviderId === 'ANY' ? slot!.providers[0] : rescheduleProviderId;
      const finalProvName = providers.find(p => p.id === finalProvId)?.name || appointment.providerName;

      await mockApi.rescheduleAppointment(appointment.id, start.toISOString(), end.toISOString(), finalProvId, finalProvName);
      onSuccess();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative z-[101] w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-indigo-50 flex justify-between items-center bg-white">
          <div className="flex flex-col">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Clinical Encounter File</h3>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">ID: {appointment.id.toUpperCase()}</span>
                <span className="text-gray-300">•</span>
                <div className={`flex items-center gap-1 text-[9px] font-black uppercase ${appointment.source === 'AI' ? 'text-blue-500' : 'text-orange-500'}`}>
                    {appointment.source === 'AI' ? <Bot size={10} /> : <MousePointer2 size={10} />}
                    {appointment.source === 'AI' ? 'AI JOURNEY' : 'MANUAL TRIAGE'}
                </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={onOpenChat}
                className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm group"
                title="View Patient Chat History"
            >
                <MessageSquareShare size={20} className="group-active:scale-90 transition-transform" />
            </button>
            <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all">
                <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/30 space-y-8">
          
          {activeTab === 'DETAILS' && (
            <>
              {/* Patient Overview Card */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-50 shadow-sm space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-200 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm shrink-0 overflow-hidden">
                        <img src={appointment.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-lg font-black text-gray-900 tracking-tight truncate">{appointment.clientName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge status={appointment.status} className="scale-90 origin-left" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">• PRIORITY PATIENT</span>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Appointment Type</p>
                        <p className="text-xs font-black text-gray-800 flex items-center gap-2">
                           <Stethoscope size={14} className="text-indigo-400" /> {appointment.serviceName}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Clinician</p>
                        <p className="text-xs font-black text-gray-800 flex items-center gap-2">
                           <UserCheck size={14} className="text-emerald-400" /> {appointment.providerName}
                        </p>
                      </div>
                  </div>
              </div>

              {/* Clinical Lifecycle */}
              <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                    <Activity size={14} className="text-indigo-400" /> ENCOUNTER LIFECYCLE
                  </h4>
                  <div className="bg-white rounded-[2.5rem] border border-indigo-50 p-6 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <History size={16} className="text-indigo-600" />
                        </div>
                        <div className="space-y-4 flex-1">
                            {(appointment.auditTrail || []).slice().reverse().map((log, i) => (
                                <div key={i} className="flex gap-4 relative">
                                    {i < (appointment.auditTrail?.length || 0) - 1 && (
                                        <div className="absolute left-[7px] top-4 w-px h-8 bg-gray-100" />
                                    )}
                                    <div className="w-4 h-4 rounded-full bg-white border-2 border-indigo-600 shrink-0 z-10" />
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black text-gray-700 capitalize">{log.type.replace('_', ' ')}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(log.at).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
              </section>

              {/* WhatsApp Context Preview */}
              {linkedConv && (
                  <section className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Smartphone size={14} className="text-blue-400" /> WHATSAPP CONTEXT
                        </h4>
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">LIVE THREAD</span>
                      </div>
                      <div 
                        onClick={onOpenChat}
                        className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2.5rem] cursor-pointer hover:bg-blue-50 transition-colors group relative overflow-hidden shadow-sm"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 opacity-20 rounded-bl-[2rem]"></div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">LAST PATIENT MESSAGE</p>
                        <p className="text-sm font-bold text-blue-900 italic line-clamp-2 leading-relaxed">
                            "{linkedConv.lastMessageText}"
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                            VIEW CONVERSATION <ChevronRight size={12} />
                        </div>
                  </div>
                  </section>
              )}

              {/* Dynamic Actions Grid */}
              <section className="space-y-4 pt-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">QUICK ACTIONS</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => handleUpdateStatus(AppointmentStatus.COMPLETED)}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-indigo-50 text-indigo-600 rounded-[2rem] border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all group"
                    >
                        <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">MARK COMPLETED</span>
                    </button>
                    <button 
                        onClick={() => handleUpdateStatus(AppointmentStatus.NO_SHOW)}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-rose-50 text-rose-600 rounded-[2rem] border border-rose-100 hover:bg-rose-600 hover:text-white transition-all group"
                    >
                        <AlertCircle size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">RECORD NO-SHOW</span>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setActiveTab('RESCHEDULE')}
                    className="w-full flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 text-gray-500 rounded-[2rem] border border-gray-200 hover:border-indigo-600 hover:text-indigo-600 transition-all group"
                  >
                      <Calendar size={20} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">RESCHEDULE</span>
                  </button>
                </div>
              </section>

              {/* Dangerous Actions */}
              <div className="pt-6 border-t border-gray-100">
                {isConfirmingCancel ? (
                  <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 space-y-4">
                    <p className="text-xs font-bold text-rose-900">Are you sure you want to cancel this visit?</p>
                    <select 
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-4 py-2 text-xs font-bold bg-white border border-rose-100 rounded-xl"
                    >
                      {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleCancel} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Yes, Cancel</button>
                      <button onClick={() => setIsConfirmingCancel(false)} className="flex-1 py-3 bg-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Back</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsConfirmingCancel(true)}
                    className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={14} /> Cancel Appointment
                  </button>
                )}
              </div>
            </>
          )}

          {activeTab === 'RESCHEDULE' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-50 shadow-sm space-y-6">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Consultation Date</label>
                       <div className="relative">
                          <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" size={18} />
                          <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-indigo-50/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-sm font-black transition-all"
                          />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select New Slot</label>
                          {isAvailabilityLoading && <Loader2 size={14} className="animate-spin text-indigo-600" />}
                       </div>

                       {displaySlots.length === 0 ? (
                          <div className="p-10 text-center bg-rose-50 rounded-[2rem] border border-rose-100">
                             <AlertCircle size={24} className="text-rose-500 mx-auto mb-3" />
                             <p className="text-[11px] font-black text-rose-900 uppercase">No availability</p>
                          </div>
                       ) : (
                          <div className="grid grid-cols-4 gap-2">
                             {displaySlots.map(slot => (
                                <button key={slot.time} onClick={() => setRescheduleTime(slot.time)}
                                   className={`py-3 rounded-2xl text-[11px] font-black transition-all border-2 ${rescheduleTime === slot.time ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' : 'border-indigo-50 bg-white text-indigo-900 hover:border-indigo-300'}`}
                                >
                                   {slot.time}
                                </button>
                             ))}
                          </div>
                       )}
                    </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleConfirmReschedule}
                    disabled={!rescheduleTime || isLoading}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
                  >
                    {isLoading ? 'Authorizing...' : 'Authorize Reschedule'}
                  </button>
                  <button 
                    onClick={() => setActiveTab('DETAILS')}
                    className="px-6 py-4 bg-gray-100 text-gray-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
             </div>
          )}

          {activeTab === 'AUDIT' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="relative pl-8 space-y-8">
                   <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-indigo-50" />
                   {(appointment.auditTrail || []).slice().reverse().map((log, i) => (
                      <div key={i} className="relative group">
                         <div className="absolute -left-[27px] top-1 w-4 h-4 bg-white border-4 border-indigo-600 rounded-full group-first:scale-125 z-10" />
                         <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{log.type.replace('_', ' ')}</p>
                               <p className="text-[9px] font-bold text-gray-300">{new Date(log.at).toLocaleString()}</p>
                            </div>
                            <p className="text-xs font-bold text-gray-700 leading-relaxed">{log.notes || 'No clinical notes recorded.'}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-indigo-50 bg-white">
           <button 
            onClick={onClose}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] border border-white/20"
           >
            CLOSE FILE
           </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentManagementModal;
