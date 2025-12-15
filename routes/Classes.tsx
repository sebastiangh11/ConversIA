
import React, { useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { ClassSession, Service, Appointment, BusinessSettings } from '../types';
import { 
  Calendar, Clock, MapPin, Users, Plus, X, Search, MoreVertical, 
  Scissors, Dumbbell, Sun, HeartPulse, Zap, LayoutDashboard, CalendarPlus, 
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, UserPlus, Layers, ArrowRight 
} from 'lucide-react';

const Classes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'create'>('status');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  
  // Drawer state for viewing attendees
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [attendees, setAttendees] = useState<(Appointment & {avatar?: string})[]>([]);

  // Create Form State
  // Initialize with Today's date
  const [newSessionService, setNewSessionService] = useState('');
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSessionTime, setNewSessionTime] = useState('');
  const [newSessionEndTime, setNewSessionEndTime] = useState('');
  const [newSessionRoom, setNewSessionRoom] = useState('Room A');
  const [newSessionProvider, setNewSessionProvider] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar Widget State
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  // New Entity Creation State
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState(60);
  const [newServiceCapacity, setNewServiceCapacity] = useState(10);

  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [newProviderNameInput, setNewProviderNameInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Helper to add minutes to a time string "HH:MM"
  const addMinutesToTime = (time: string, minutes: number): string => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 5);
  };

  // Helper to calculate difference in minutes between two time strings
  const getDurationFromTimes = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const d1 = new Date(); d1.setHours(h1, m1, 0, 0);
    const d2 = new Date(); d2.setHours(h2, m2, 0, 0);
    
    let diffMs = d2.getTime() - d1.getTime();
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle overnight edge case simply
    return Math.floor(diffMs / 60000);
  };

  // Auto-update End Time when Service or Start Time changes
  useEffect(() => {
    if (newSessionTime) {
        let duration = 60;
        if (isCreatingService) {
            duration = newServiceDuration || 60;
        } else if (newSessionService) {
            const s = services.find(x => x.id === newSessionService);
            if (s) duration = s.durationMinutes;
        }
        
        // Only auto-update if end time is empty or we just switched services/time
        setNewSessionEndTime(addMinutesToTime(newSessionTime, duration));
    }
  }, [newSessionTime, newSessionService, isCreatingService, services, newServiceDuration]);


  const loadData = async () => {
    const s = await mockApi.getClassSessions();
    const sv = await mockApi.getServices();
    const p = await mockApi.getProviders();
    const sett = await mockApi.getSettings();
    setSessions(s);
    setServices(sv.filter(service => service.isClass));
    setProviders(p);
    setSettings(sett);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!settings) {
        alert("Business settings are not loaded yet. Please try again.");
        setIsSubmitting(false);
        return;
    }

    // --- VALIDATION: Working Hours & Holidays ---
    // 1. Check for Holidays/Days Off
    const holiday = settings.daysOff?.find(d => d.date === newSessionDate);
    if (holiday) {
        alert(`Cannot schedule: Business is closed on ${new Date(newSessionDate).toLocaleDateString()} for "${holiday.description}".`);
        setIsSubmitting(false);
        return;
    }

    // 2. Check Working Hours
    const [y, m, d] = newSessionDate.split('-').map(Number);
    // Create date object in local time
    const dateObj = new Date(y, m - 1, d);
    
    // Robust day name map (0=Sunday to 6=Saturday)
    const daysMap: (keyof BusinessSettings['workingHours'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = daysMap[dateObj.getDay()];
    const dayConfig = settings.workingHours[dayName];

    if (!dayConfig.isOpen) {
        const dayStr = String(dayName);
        alert(`Cannot schedule: Business is closed on ${dayStr.charAt(0).toUpperCase() + dayStr.slice(1)}s.`);
        setIsSubmitting(false);
        return;
    }

    // Check against first shift
    const isWithinFirstShift = newSessionTime >= dayConfig.open && newSessionEndTime <= dayConfig.close;
    
    // Check against second shift (if enabled)
    let isWithinSecondShift = false;
    if (dayConfig.isSplit && dayConfig.open2 && dayConfig.close2) {
        isWithinSecondShift = newSessionTime >= dayConfig.open2 && newSessionEndTime <= dayConfig.close2;
    }

    if (!isWithinFirstShift && !isWithinSecondShift) {
            let msg = `Cannot schedule: Session time (${newSessionTime} - ${newSessionEndTime}) must be within business hours.`;
            msg += `\nHours: ${dayConfig.open} - ${dayConfig.close}`;
            if (dayConfig.isSplit && dayConfig.open2 && dayConfig.close2) {
                msg += ` or ${dayConfig.open2} - ${dayConfig.close2}`;
            }
            alert(msg);
            setIsSubmitting(false);
            return;
    }
    // ---------------------------------------------

    let serviceIdToUse = newSessionService;
    let serviceNameToUse = '';
    // Calculate duration based on the manually entered start/end times
    let durationToUse = getDurationFromTimes(newSessionTime, newSessionEndTime);
    let capacityToUse = 10;
    let providerToUse = newSessionProvider;

    // 1. Handle New Service Creation
    if (isCreatingService) {
        if (!newServiceName) {
            alert('Please enter a service name');
            setIsSubmitting(false);
            return;
        }
        const createdService = await mockApi.createService({
            name: newServiceName,
            durationMinutes: durationToUse || newServiceDuration, // Fallback
            capacity: newServiceCapacity,
            isClass: true,
            price: 20 // Default price
        });
        serviceIdToUse = createdService.id;
        serviceNameToUse = createdService.name;
        capacityToUse = createdService.capacity || 10;
    } else {
        const service = services.find(s => s.id === newSessionService);
        if (!service) {
            setIsSubmitting(false);
            return;
        }
        serviceNameToUse = service.name;
        capacityToUse = service.capacity || 10;
    }

    // 2. Handle New Provider Creation
    if (isCreatingProvider) {
        if (!newProviderNameInput) {
            alert('Please enter a provider name');
            setIsSubmitting(false);
            return;
        }
        providerToUse = await mockApi.addProvider(newProviderNameInput);
    }

    // 3. Create the Session
    const startDateTime = new Date(`${newSessionDate}T${newSessionTime}`);
    
    await mockApi.createClassSession({
      serviceId: serviceIdToUse,
      serviceName: serviceNameToUse,
      startTime: startDateTime.toISOString(),
      durationMinutes: durationToUse,
      providerName: providerToUse,
      room: newSessionRoom,
      maxCapacity: capacityToUse,
      description: newSessionDescription
    });

    setIsSubmitting(false);
    
    // Reset Everything
    setNewSessionDescription('');
    setNewSessionDate(new Date().toISOString().split('T')[0]);
    setNewSessionTime('');
    setNewSessionEndTime('');
    
    // Reset New Entity States
    setIsCreatingService(false);
    setNewServiceName('');
    setIsCreatingProvider(false);
    setNewProviderNameInput('');
    setNewSessionProvider('');
    setNewSessionService('');

    setActiveTab('status'); // Switch back to dashboard
    loadData(); // Refresh list
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === '__NEW__') {
          setIsCreatingProvider(true);
          setNewSessionProvider('');
      } else {
          setIsCreatingProvider(false);
          setNewSessionProvider(val);
      }
  };

  const handleSessionClick = async (session: ClassSession) => {
    setSelectedSession(session);
    // Fetch appointments for this session
    const allAppts = await mockApi.getAppointments();
    const clients = await mockApi.getClients();
    
    const sessionAttendees = allAppts
        .filter(a => a.classSessionId === session.id)
        .map(a => ({
            ...a,
            avatar: clients.find(c => c.id === a.clientId)?.avatar
        }));

    setAttendees(sessionAttendees);
  };

  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('hair') || n.includes('cut') || n.includes('trim')) return <Scissors size={20} />;
    if (n.includes('yoga') || n.includes('meditation')) return <Sun size={20} />;
    if (n.includes('crossfit') || n.includes('gym') || n.includes('fit')) return <Dumbbell size={20} />;
    if (n.includes('medical') || n.includes('consult')) return <HeartPulse size={20} />;
    if (n.includes('spin') || n.includes('cycle')) return <Zap size={20} />;
    return <Calendar size={20} />;
  };

  const getServiceColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('yoga')) return 'bg-orange-100 text-orange-600';
    if (n.includes('crossfit')) return 'bg-zinc-100 text-zinc-700';
    if (n.includes('hair')) return 'bg-blue-100 text-blue-600';
    return 'bg-indigo-100 text-indigo-600';
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const handlePrevMonth = () => {
      setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
      setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
  };
  const handleDateSelect = (day: number) => {
      const year = calendarViewDate.getFullYear();
      const month = String(calendarViewDate.getMonth() + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      setNewSessionDate(`${year}-${month}-${d}`);
  };

  const renderCalendar = () => {
      const daysInMonth = getDaysInMonth(calendarViewDate);
      const firstDay = getFirstDayOfMonth(calendarViewDate);
      const days = [];
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      // Empty slots for prev month
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
      }

      // Days
      for (let i = 1; i <= daysInMonth; i++) {
          const currentString = `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const isSelected = newSessionDate === currentString;
          const isToday = new Date().toISOString().split('T')[0] === currentString;
          
          // Check for holidays to style date
          const isHoliday = settings?.daysOff?.some(d => d.date === currentString);

          days.push(
              <button
                  key={i}
                  type="button"
                  onClick={() => handleDateSelect(i)}
                  className={`h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : isHoliday
                            ? 'bg-red-50 text-red-300 line-through cursor-not-allowed'
                            : isToday 
                                ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-200'
                                : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                  {i}
              </button>
          );
      }

      return (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><ChevronLeft size={16}/></button>
                  <span className="text-sm font-bold text-gray-800">{monthNames[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}</span>
                  <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><ChevronRight size={16}/></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <span key={d} className="text-[10px] font-bold text-gray-400 uppercase">{d}</span>
                  ))}
              </div>
              <div className="grid grid-cols-7 gap-1 place-items-center">
                  {days}
              </div>
          </div>
      );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto relative bg-gray-50/50">
      
      {/* Header & Tabs */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Class Sessions</h1>
            <p className="text-sm text-gray-500 mt-1">Manage yoga classes, workshops, and multi-client slots.</p>
            </div>
            
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
                <button 
                    onClick={() => setActiveTab('status')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <LayoutDashboard size={18} /> Class Dashboard
                </button>
                <button 
                    onClick={() => setActiveTab('create')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <CalendarPlus size={18} /> Schedule Creator
                </button>
            </div>
        </div>
      </div>

      {/* SECTION ONE: CURRENT STATUS */}
      {activeTab === 'status' && (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI Row (Mock) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Active Sessions</p>
                        <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Calendar size={20} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                     <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Total Attendees</p>
                        <p className="text-2xl font-bold text-gray-900">{sessions.reduce((acc, s) => acc + s.currentAttendees, 0)}</p>
                    </div>
                     <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users size={20} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                     <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Avg. Occupancy</p>
                        <p className="text-2xl font-bold text-gray-900">72%</p>
                    </div>
                     <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map(session => {
                const occupancy = session.currentAttendees / session.maxCapacity;
                let barColor = 'bg-green-500';
                if (occupancy > 0.6) barColor = 'bg-yellow-500';
                if (occupancy >= 0.9) barColor = 'bg-red-500';

                return (
                    <div 
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group"
                    >
                    <div className="flex justify-between items-start mb-6 relative">
                        <div className="flex gap-4">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getServiceColor(session.serviceName)} shadow-sm`}>
                                {getServiceIcon(session.serviceName)}
                             </div>
                             <div>
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{session.serviceName}</h3>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(session.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </p>
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                {session.providerName.charAt(0)}
                            </div>
                            <span>{session.providerName}</span>
                        </div>
                        <span className="w-px h-4 bg-gray-200"></span>
                        <div className="flex items-center gap-1.5">
                             <MapPin size={14} className="text-gray-400"/> {session.room}
                        </div>
                    </div>

                    <div className="space-y-2 relative">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
                        <span className="text-gray-400">Capacity</span>
                        <span className={`${occupancy === 1 ? 'text-red-500' : 'text-gray-600'}`}>
                            {session.currentAttendees} / {session.maxCapacity} Booked
                        </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${barColor} transition-all duration-500`} 
                            style={{width: `${occupancy * 100}%`}}
                        ></div>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
        </div>
      )}

      {/* SECTION TWO: SCHEDULE CREATOR */}
      {activeTab === 'create' && (
        <div className="flex flex-col lg:flex-row gap-8 animate-in slide-in-from-right-4 duration-300">
            
            {/* Form Section */}
            <div className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
                <div className="mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-gray-900">Configure New Session</h2>
                    <p className="text-sm text-gray-500 mt-1">Set up time, instructor, and capacity details.</p>
                </div>

                <form onSubmit={handleCreateSession} className="space-y-6">
                    {/* Service Selection */}
                    <div>
                         <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">1. Select Service</label>
                         
                         {/* Toggle for Creation */}
                         {isCreatingService ? (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 relative animate-in fade-in zoom-in-95">
                                <button type="button" onClick={() => setIsCreatingService(false)} className="absolute top-3 right-3 text-indigo-400 hover:text-indigo-600">
                                    <X size={18} />
                                </button>
                                <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2"><Layers size={16}/> Create New Service Class</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-indigo-700 mb-1 block">Service Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Advanced Pilates"
                                            value={newServiceName}
                                            onChange={(e) => setNewServiceName(e.target.value)}
                                            className="w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-indigo-700 mb-1 block">Duration (min)</label>
                                        <input 
                                            type="number" 
                                            value={newServiceDuration}
                                            onChange={(e) => setNewServiceDuration(parseInt(e.target.value))}
                                            className="w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-indigo-700 mb-1 block">Max Capacity</label>
                                        <input 
                                            type="number" 
                                            value={newServiceCapacity}
                                            onChange={(e) => setNewServiceCapacity(parseInt(e.target.value))}
                                            className="w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900"
                                        />
                                    </div>
                                </div>
                            </div>
                         ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {services.map(service => (
                                    <div 
                                        key={service.id}
                                        onClick={() => setNewSessionService(service.id)}
                                        className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-3 transition-all text-center ${
                                            newSessionService === service.id 
                                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg ${getServiceColor(service.name)}`}>
                                            {getServiceIcon(service.name)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{service.name}</p>
                                            <p className="text-xs text-gray-500">{service.durationMinutes} min</p>
                                        </div>
                                    </div>
                                ))}
                                {/* Create New Card */}
                                <div 
                                    onClick={() => {
                                        setIsCreatingService(true);
                                        setNewSessionService('');
                                    }}
                                    className="cursor-pointer rounded-xl border border-dashed border-gray-300 p-4 flex flex-col items-center justify-center gap-3 transition-all text-center hover:bg-gray-50 hover:border-gray-400 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                        <Plus size={20} />
                                    </div>
                                    <p className="font-bold text-sm text-gray-500 group-hover:text-gray-700">Add New Service</p>
                                </div>
                            </div>
                         )}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">2. Date & Time</label>
                             <div className="space-y-4">
                                {/* Visual Calendar Widget */}
                                {renderCalendar()}
                                
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">From</label>
                                        <input 
                                            type="time" 
                                            value={newSessionTime}
                                            onChange={(e) => setNewSessionTime(e.target.value)}
                                            required
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium shadow-sm"
                                        />
                                    </div>
                                    <div className="pt-5 text-gray-300">
                                        <ArrowRight size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">To</label>
                                        <input 
                                            type="time" 
                                            value={newSessionEndTime}
                                            onChange={(e) => setNewSessionEndTime(e.target.value)}
                                            required
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium shadow-sm"
                                        />
                                    </div>
                                </div>
                             </div>
                        </div>
                        
                        {/* Provider & Room */}
                        <div>
                             <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">3. Details</label>
                             <div className="space-y-3">
                                {isCreatingProvider ? (
                                    <div className="relative">
                                         <input 
                                            type="text" 
                                            value={newProviderNameInput}
                                            onChange={(e) => setNewProviderNameInput(e.target.value)}
                                            placeholder="Enter Instructor Name"
                                            className="w-full border border-indigo-200 bg-indigo-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900"
                                            autoFocus
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => { setIsCreatingProvider(false); setNewProviderNameInput(''); }} 
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={16}/>
                                        </button>
                                    </div>
                                ) : (
                                    <select 
                                        value={newSessionProvider}
                                        onChange={handleProviderChange}
                                        required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    >
                                        <option value="">Select Instructor...</option>
                                        {providers.map(p => <option key={p} value={p}>{p}</option>)}
                                        <option value="__NEW__" className="font-bold text-indigo-600">+ Add New Instructor...</option>
                                    </select>
                                )}
                                
                                <input 
                                    type="text" 
                                    value={newSessionRoom}
                                    onChange={(e) => setNewSessionRoom(e.target.value)}
                                    placeholder="Room / Location"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                             </div>

                             <div className="mt-6">
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">4. Description (Optional)</label>
                                <textarea 
                                    value={newSessionDescription}
                                    onChange={(e) => setNewSessionDescription(e.target.value)}
                                    rows={4}
                                    placeholder="Add specific notes for this session..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                                />
                             </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Preview Panel */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-indigo-200"/> Preview
                    </h3>
                    <p className="text-indigo-100 text-sm mb-6">This is how the session will appear on your dashboard.</p>
                    
                    <div className="bg-white text-gray-900 rounded-xl p-4 shadow-lg transform rotate-2">
                        <div className="flex items-center gap-3 mb-3">
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                 isCreatingService ? 'bg-indigo-100 text-indigo-600' : (
                                    newSessionService ? getServiceColor(services.find(s=>s.id===newSessionService)?.name || '') : 'bg-gray-100 text-gray-400'
                                 )
                             }`}>
                                {isCreatingService ? <Plus size={20}/> : (
                                    newSessionService ? getServiceIcon(services.find(s=>s.id===newSessionService)?.name || '') : <Calendar size={20}/>
                                )}
                             </div>
                             <div>
                                <p className="font-bold text-sm">
                                    {isCreatingService 
                                        ? (newServiceName || 'New Service') 
                                        : (newSessionService ? services.find(s=>s.id===newSessionService)?.name : 'Select Service')
                                    }
                                </p>
                                <p className="text-xs text-gray-500">
                                    {newSessionDate || 'Date'} • {newSessionTime || 'Start'} {newSessionEndTime ? `- ${newSessionEndTime}` : ''}
                                </p>
                             </div>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mb-3">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                                {isCreatingProvider ? (newProviderNameInput || 'New Instructor') : (newSessionProvider || 'Provider')}
                            </span>
                            <span>•</span>
                            <span>{newSessionRoom || 'Room'}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="w-1/3 bg-green-500 h-full rounded-full"></div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleCreateSession}
                    disabled={isSubmitting || (!isCreatingService && !newSessionService) || !newSessionDate || !newSessionTime || !newSessionEndTime || (!isCreatingProvider && !newSessionProvider)}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Creating...' : (
                        <>
                        <CheckCircle2 size={20} /> Publish Session
                        </>
                    )}
                </button>
            </div>
        </div>
      )}

      {/* Attendees Drawer (Shared) */}
      {selectedSession && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedSession(null)}></div>
          <div className="relative z-50 w-full max-w-md bg-white shadow-2xl h-full flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getServiceColor(selectedSession.serviceName)}`}>
                    {getServiceIcon(selectedSession.serviceName)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedSession.serviceName}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(selectedSession.startTime).toLocaleDateString()} • {selectedSession.room}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedSession(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-500"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
               {selectedSession.description && (
                  <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600 shadow-sm">
                    <h4 className="font-bold mb-1 flex items-center gap-2 text-gray-800"><Clock size={14}/> Session Details</h4>
                    <p className="leading-relaxed">{selectedSession.description}</p>
                  </div>
               )}

               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Users size={14}/> Registered Attendees ({attendees.length}/{selectedSession.maxCapacity})
               </h3>
               
               {attendees.length === 0 ? (
                 <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                   <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users size={20} className="text-gray-300"/>
                   </div>
                   <p className="text-gray-400 text-sm font-medium">No bookings yet.</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {attendees.map(appt => (
                     <div key={appt.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                           <img 
                                src={appt.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${appt.clientId}`} 
                                alt="" 
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-gray-100"
                           />
                           <div>
                               <span className="font-bold text-gray-900 text-sm block">{appt.clientName}</span>
                               <span className="text-xs text-gray-400">Booked {new Date(appt.startTime).toLocaleDateString()}</span>
                           </div>
                        </div>
                        <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-full font-bold uppercase tracking-wide">Confirmed</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Classes;
