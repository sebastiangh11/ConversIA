
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mockApi } from '../services/mockApi';
import { Appointment, AppointmentStatus, Provider, Service } from '../types';
import Badge from '../components/Badge';
import { 
  Search, Calendar, Clock, MoreHorizontal, ArrowUpRight, TrendingUp, 
  LayoutList, ChevronLeft, ChevronRight, X, CalendarDays, Edit3, Trash2,
  Loader2, UserCheck, Filter, CheckCircle2, BellRing, Smartphone, Bot, MousePointer2,
  MessageSquareShare, User, History, Check, AlertCircle, Plus, Activity
} from 'lucide-react';
import NewBookingFlow from '../components/NewBookingFlow';
import AppointmentManagementModal from '../components/AppointmentManagementModal';
import ProviderProfileDrawer from '../components/ProviderProfileDrawer';

const Appointments: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<(Appointment & { avatar?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filtering
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('ALL');
  const [filterService, setFilterService] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');

  // Modals
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [selectedApptForEdit, setSelectedApptForEdit] = useState<Appointment | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [profileProviderId, setProfileProviderId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    loadMeta();
  }, []);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const loadMeta = async () => {
      const [p, s] = await Promise.all([mockApi.getProviders(), mockApi.getServices()]);
      setProviders(p);
      setServices(s);
  }

  const fetchData = async () => {
      setLoading(true);
      const appts = await mockApi.getAppointments();
      const clients = await mockApi.getClients();
      
      const merged = appts.map(a => {
          const client = clients.find(c => c.id === a.clientId);
          return { ...a, avatar: client?.avatar };
      });
      
      setAppointments(merged);
      setLoading(false);
  };

  const filteredAppointments = useMemo(() => {
      const urlClientId = searchParams.get('clientId');
      return appointments.filter(a => {
          const matchesUrlClient = !urlClientId || a.clientId === urlClientId;
          const matchesSearch = a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || a.id.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesProvider = filterProvider === 'ALL' || a.providerId === filterProvider;
          const matchesService = filterService === 'ALL' || a.serviceId === filterService;
          const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
          const matchesSource = filterSource === 'ALL' || a.source === filterSource;
          return matchesUrlClient && matchesSearch && matchesProvider && matchesService && matchesStatus && matchesSource;
      });
  }, [appointments, searchQuery, filterProvider, filterService, filterStatus, filterSource, searchParams]);

  // TEMPORAL GROUPING LOGIC
  const groupedAppointments = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const now = new Date().getTime();

    return {
      today: filteredAppointments.filter(a => new Date(a.startTime).toLocaleDateString() === today),
      upcoming: filteredAppointments.filter(a => {
        const start = new Date(a.startTime);
        return start.toLocaleDateString() !== today && start.getTime() > now;
      }),
      past: filteredAppointments.filter(a => {
        const start = new Date(a.startTime);
        return start.toLocaleDateString() !== today && start.getTime() < now;
      })
    };
  }, [filteredAppointments]);

  const handleOpenChat = async (clientId: string) => {
    await mockApi.ensureConversationExists(clientId);
    navigate(`/inbox?clientId=${clientId}`);
  };

  const handleQuickStatusUpdate = async (id: string, status: AppointmentStatus) => {
    await mockApi.updateAppointmentStatus(id, status);
    fetchData();
  };

  const stats = [
    // Added Activity icon to imports above to fix Error in line 109
    { label: 'Active Queue', value: appointments.filter(a => a.status === AppointmentStatus.BOOKED || a.status === AppointmentStatus.CONFIRMED).length, icon: <Activity size={18} />, color: 'bg-indigo-600' },
    { label: 'Today Remaining', value: groupedAppointments.today.filter(a => a.status !== AppointmentStatus.COMPLETED).length, icon: <Clock size={18} />, color: 'bg-blue-600' },
    { label: 'Avg Waiting', value: '12m', icon: <History size={18} />, color: 'bg-emerald-600' },
    { label: 'No Shows', value: appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length, icon: <AlertCircle size={18} />, color: 'bg-rose-600' },
  ];

  const getStatusRowClass = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.NO_SHOW: return 'bg-rose-50/40 hover:bg-rose-50/60';
      case AppointmentStatus.PENDING: return 'bg-amber-50/40 hover:bg-amber-50/60';
      case AppointmentStatus.CONFIRMED: return 'bg-emerald-50/30 hover:bg-emerald-50/50';
      default: return 'hover:bg-indigo-50/30';
    }
  };

  // Updated data type to (Appointment & { avatar?: string })[] to fix Property 'avatar' does not exist error
  const renderTableSection = (title: string, data: (Appointment & { avatar?: string })[]) => {
    if (data.length === 0) return null;
    return (
      <>
        <tr className="bg-gray-50/50">
          <td colSpan={6} className="px-8 py-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-y border-gray-100">
            {title} — {data.length} Patients
          </td>
        </tr>
        {data.map((appt) => (
          <tr 
            key={appt.id} 
            className={`group transition-all cursor-pointer border-b border-gray-50 ${getStatusRowClass(appt.status)}`}
            onClick={() => setSelectedApptForEdit(appt)}
          >
            <td className="px-8 py-5">
              <div className="flex items-center gap-4">
                  <div className="relative group/avatar">
                    <img src={appt.avatar} className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm bg-white" />
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenChat(appt.clientId); }}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-all hover:scale-110 z-10"
                        title="Open Chat with Patient"
                    >
                        <MessageSquareShare size={12} />
                    </button>
                  </div>
                  <div>
                    <span className="font-black text-gray-900 tracking-tight block">{appt.clientName}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {appt.id.slice(-6)}</span>
                  </div>
              </div>
            </td>
            <td className="px-8 py-5">
              <div className="flex flex-col">
                <span className="font-bold text-gray-800">{appt.serviceName}</span>
                <button 
                    onClick={(e) => { e.stopPropagation(); setProfileProviderId(appt.providerId); }}
                    className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5 hover:text-indigo-600 flex items-center gap-1 transition-colors group/prov"
                >
                    <UserCheck size={10} className="group-hover/prov:scale-110" /> {appt.providerName}
                </button>
              </div>
            </td>
            <td className="px-8 py-5">
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-700">{new Date(appt.startTime).toLocaleDateString()}</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase mt-0.5">{new Date(appt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </td>
            <td className="px-8 py-5">
               <div 
                title={appt.source === 'AI' ? "Automated booking via WhatsApp Bot" : "Front-desk manual entry"}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm border ${appt.source === 'AI' ? 'text-blue-600 bg-white border-blue-50' : 'text-orange-600 bg-white border-orange-50'}`}>
                   {appt.source === 'AI' ? <Bot size={12} /> : <MousePointer2 size={12} />}
                   {appt.source === 'AI' ? 'AI' : 'Manual'}
               </div>
            </td>
            <td className="px-8 py-5">
              <Badge status={appt.status} />
            </td>
            <td className="px-8 py-5 text-right">
              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {appt.status === AppointmentStatus.BOOKED && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(appt.id, AppointmentStatus.CONFIRMED); }}
                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                    title="Confirm Arrival"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
                {appt.status !== AppointmentStatus.NO_SHOW && appt.status !== AppointmentStatus.COMPLETED && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(appt.id, AppointmentStatus.NO_SHOW); }}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                    title="Mark No-Show"
                  >
                    <AlertCircle size={16} />
                  </button>
                )}
                <button 
                  className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
                  title="Edit Appointment"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)] bg-gray-50/30 relative custom-scrollbar">
      
      {/* Visual Triage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
          {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`p-4 rounded-2xl ${stat.color} text-white shadow-lg transform group-hover:rotate-6 transition-transform`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              </div>
          </div>
          ))}
      </div>

      {/* Triage Control Deck */}
      <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 ml-2">
                <div className="bg-gray-50 p-1.5 rounded-2xl flex gap-1">
                    <button onClick={() => setViewMode('list')} 
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutList size={20} />
                    </button>
                    <button onClick={() => setViewMode('calendar')} 
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Calendar size={20} />
                    </button>
                </div>
                <div className="h-8 w-px bg-gray-100" />
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500" size={16} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search queue..." 
                        className="pl-12 pr-6 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none w-64 transition-all"
                    />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isFilterPanelOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                >
                    <Filter size={16} /> Advanced Filters
                </button>
                <button onClick={() => setIsBookingFlowOpen(true)}
                    className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus size={18} /> New Booking
                </button>
              </div>
          </div>

          {/* QUICK CHIP FILTERS */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar ml-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick:</span>
              <button 
                onClick={() => {setFilterStatus(filterStatus === AppointmentStatus.PENDING ? 'ALL' : AppointmentStatus.PENDING)}}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all ${filterStatus === AppointmentStatus.PENDING ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'}`}
              >
                Needs Action
              </button>
              <button 
                onClick={() => {setFilterStatus(filterStatus === AppointmentStatus.NO_SHOW ? 'ALL' : AppointmentStatus.NO_SHOW)}}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all ${filterStatus === AppointmentStatus.NO_SHOW ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'}`}
              >
                Failed Triage
              </button>
              <button 
                onClick={() => {setFilterSource(filterSource === 'AI' ? 'ALL' : 'AI')}}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all ${filterSource === 'AI' ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'}`}
              >
                AI Booked
              </button>
          </div>

          {isFilterPanelOpen && (
              <div className="bg-white p-6 rounded-[2rem] border border-indigo-50 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinician</label>
                      <select 
                        value={filterProvider} 
                        onChange={(e) => setFilterProvider(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-100"
                      >
                          <option value="ALL">All Providers</option>
                          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Service</label>
                      <select 
                        value={filterService} 
                        onChange={(e) => setFilterService(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-100"
                      >
                          <option value="ALL">All Services</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                      <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-100"
                      >
                          <option value="ALL">All Statuses</option>
                          {Object.values(AppointmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Source</label>
                      <select 
                        value={filterSource} 
                        onChange={(e) => setFilterSource(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-100"
                      >
                          <option value="ALL">All Sources</option>
                          <option value="AI">WhatsApp AI</option>
                          <option value="MANUAL">Front Desk</option>
                      </select>
                  </div>
              </div>
          )}
      </div>

      {viewMode === 'calendar' ? null : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-6">Patient Entity</th>
                    <th className="px-8 py-6">Encounter Type</th>
                    <th className="px-8 py-6">Admission</th>
                    <th className="px-8 py-6">Journey</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && appointments.length === 0 ? (
                    <tr><td colSpan={6} className="p-20 text-center"><Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-6 bg-gray-50 rounded-[2.5rem] text-gray-200">
                            <Calendar size={64} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-400 font-black uppercase tracking-widest">No patient records found</p>
                            <p className="text-sm text-gray-400">Clear filters or invite a patient via WhatsApp.</p>
                          </div>
                          <button 
                            onClick={() => {setFilterStatus('ALL'); setFilterSource('ALL'); setFilterProvider('ALL'); setSearchQuery('');}}
                            className="mt-2 text-indigo-600 font-black text-xs uppercase border border-indigo-100 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {renderTableSection("Active Queue (Today)", groupedAppointments.today)}
                      {renderTableSection("Clinical Roadmap (Upcoming)", groupedAppointments.upcoming)}
                      {renderTableSection("Historical Records (Past)", groupedAppointments.past)}
                    </>
                  )}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {/* Modals */}
      <NewBookingFlow 
        isOpen={isBookingFlowOpen} 
        onClose={() => setIsBookingFlowOpen(false)}
        onSuccess={fetchData}
      />

      {selectedApptForEdit && (
        <AppointmentManagementModal 
          isOpen={!!selectedApptForEdit}
          onClose={() => setSelectedApptForEdit(null)}
          appointment={selectedApptForEdit}
          onSuccess={fetchData}
          onOpenChat={() => handleOpenChat(selectedApptForEdit.clientId)}
        />
      )}

      {profileProviderId && (
        <ProviderProfileDrawer 
            isOpen={!!profileProviderId}
            onClose={() => setProfileProviderId(null)}
            providerId={profileProviderId}
            onUpdate={fetchData}
        />
      )}
    </div>
  );
};

export default Appointments;
