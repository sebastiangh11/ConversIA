
import React, { useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { Appointment, AppointmentStatus, Conversation, Client } from '../types';
import { 
  Calendar, Users, MessageSquare, ArrowUpRight, Clock, 
  CheckCircle2, AlertCircle, TrendingUp, MoreHorizontal,
  PlusCircle, UserPlus, CreditCard, Layers, ChevronRight,
  TrendingDown, Activity, ArrowRight, DollarSign, UserCheck, Coffee
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';

interface HomeProps {
  user: { name: string; email: string } | null;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [apptsData, convsData, clientsData] = await Promise.all([
          mockApi.getAppointments(),
          mockApi.getConversations(),
          mockApi.getClients()
        ]);
        setAppointments(apptsData);
        setConversations(convsData);
        setClients(clientsData);
      } catch (error) {
        console.error("Failed to load medical hub data", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const today = new Date();
  const todayString = today.toLocaleDateString();

  const todaysAppointments = appointments.filter(a => 
    new Date(a.startTime).toLocaleDateString() === todayString && 
    a.status !== AppointmentStatus.CANCELLED
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Fix: Comparison with 'NEW' was invalid because ConvStatus uses 'OPEN' for new inquiries.
  const pendingMessages = conversations.filter(c => c.status === 'OPEN' || c.unreadCount > 0);
  
  const upcomingAppointments = appointments.filter(a => 
    new Date(a.startTime) > new Date() && 
    a.status === AppointmentStatus.BOOKED
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 5);

  const stats = [
    { 
      label: "Today's Patients", 
      value: todaysAppointments.length, 
      icon: <Calendar size={20} />,
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-100',
      trend: '+12%',
      isPositive: true,
      path: '/appointments',
      hint: 'Clinical Schedule'
    },
    { 
      label: 'Patient Inquiries', 
      value: pendingMessages.length, 
      icon: <MessageSquare size={20} />,
      color: 'bg-blue-600',
      shadow: 'shadow-blue-100',
      trend: '+5',
      isPositive: true,
      path: '/inbox',
      hint: 'Patient Portal'
    },
    { 
      label: 'Total Patients', 
      value: clients.length, 
      icon: <Users size={20} />,
      color: 'bg-emerald-600',
      shadow: 'shadow-emerald-100',
      trend: '+3',
      isPositive: true,
      path: '/clients',
      hint: 'Patient Records'
    },
    { 
      label: 'On-time Rate', 
      value: '94%', 
      icon: <Activity size={20} />,
      color: 'bg-rose-600',
      shadow: 'shadow-rose-100',
      trend: '-2%',
      isPositive: false,
      path: '/payments',
      hint: 'Clinic Stats'
    }
  ];

  const quickActions = [
    { name: 'New Appointment', icon: <PlusCircle size={16} />, path: '/appointments', color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
    { name: 'Register Patient', icon: <UserPlus size={16} />, path: '/clients', color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
    { name: 'Add Specialty', icon: <Layers size={16} />, path: '/classes', color: 'text-blue-600', bg: 'bg-blue-50/50' },
    { name: 'Invoice Patient', icon: <CreditCard size={16} />, path: '/payments', color: 'text-rose-600', bg: 'bg-rose-50/50' },
  ];

  const hubEvents = [
    { id: 1, type: 'PAYMENT', title: '$50.00 Copay Received', subtitle: 'Ana Martínez • General Consult', time: '2m ago', icon: <DollarSign size={14}/>, color: 'bg-emerald-100 text-emerald-600', path: '/payments' },
    { id: 2, type: 'MESSAGE', title: 'New Patient Message', subtitle: 'Carlos Hernández: "Reschedule my lab review"', time: '15m ago', icon: <MessageSquare size={14}/>, color: 'bg-blue-100 text-blue-600', path: '/inbox' },
    { id: 3, type: 'BOOKING', title: 'New Appointment', subtitle: 'Diana Prince • Antenatal', time: '1h ago', icon: <Calendar size={14}/>, color: 'bg-indigo-100 text-indigo-600', path: '/appointments' },
    { id: 4, type: 'CLIENT', title: 'Patient Registered', subtitle: 'New file created via WhatsApp', time: '3h ago', icon: <UserCheck size={14}/>, color: 'bg-amber-100 text-amber-600', path: '/clients' },
  ];

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-sm tracking-widest uppercase">Initializing Medical Hub</p>
        </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-5rem)] overflow-y-auto bg-gray-50/30 space-y-10 custom-scrollbar">
      
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
            {user?.name?.split(' ')[0] || 'Doctor'}, welcome back.
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} — The clinic is ready.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="hidden lg:grid grid-cols-4 gap-3">
            {quickActions.map((action, idx) => {
                const labelParts = action.name.split(' ');
                const labelText = labelParts.length > 1 ? labelParts[1] : action.name;
                
                return (
                    <Link 
                        key={idx} 
                        to={action.path} 
                        className={`flex items-center gap-2 px-4 py-2.5 ${action.bg} ${action.color} rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] shadow-sm hover:bg-white hover:scale-105 active:scale-95 transition-all border border-transparent hover:border-current/10`}
                    >
                        {action.icon} {labelText}
                    </Link>
                );
            })}
          </div>
        </div>
      </div>

      {/* KPI Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(stat.path)}
            className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden cursor-pointer active:scale-95"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-[0.03] rounded-bl-[4rem] group-hover:scale-110 transition-transform`}></div>
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3.5 rounded-2xl ${stat.color} text-white shadow-xl ${stat.shadow} transform group-hover:-rotate-6 transition-transform`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {stat.trend}
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-black text-gray-900 mb-1">{stat.value}</h3>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <span className="text-[9px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {stat.hint} <ChevronRight size={10} className="inline mb-0.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Main Schedule Feed */}
        <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <Clock size={20} />
                </div>
                <div>
                    <h3 className="font-black text-gray-900 text-xl tracking-tight">Today's Triage</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {todaysAppointments.length === 0 ? 'Quiet morning' : `${todaysAppointments.length} patient visits`}
                    </p>
                </div>
              </div>
              <Link to="/appointments" className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-colors">
                <MoreHorizontal size={24} />
              </Link>
            </div>
            
            <div className="p-4 space-y-3">
              {todaysAppointments.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mb-2">
                    <Coffee size={40} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-900 font-black text-lg">No immediate appointments.</p>
                    <p className="text-gray-400 text-sm font-medium">Verify patient insurance or catch up on lab results.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/appointments')}
                    className="mt-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 px-6 py-3 rounded-xl transition-all border border-indigo-100"
                  >
                    Medical Schedule
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                    {todaysAppointments.map((appt, i) => {
                        const isLive = new Date(appt.startTime) <= new Date() && new Date(appt.endTime) >= new Date();
                        return (
                            <div key={appt.id} className="relative flex items-center group">
                                <div className="w-20 shrink-0 text-center">
                                    <p className={`text-[10px] font-black ${isLive ? 'text-indigo-600' : 'text-gray-400'} uppercase tracking-tighter`}>
                                        {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <div className={`w-0.5 h-12 mx-auto mt-2 rounded-full ${isLive ? 'bg-indigo-600' : 'bg-gray-100'} group-last:hidden opacity-30`}></div>
                                </div>
                                
                                <div 
                                    onClick={() => navigate('/appointments')}
                                    className={`flex-1 p-5 rounded-[2rem] border cursor-pointer transition-all duration-300 flex items-center justify-between group-hover:scale-[1.01] ${
                                    isLive 
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 border-indigo-500' 
                                        : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'
                                }`}>
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <img 
                                                src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${appt.clientName}&backgroundColor=b6e3f4`}
                                                className={`w-14 h-14 rounded-2xl object-cover shadow-lg border-2 ${isLive ? 'border-indigo-400' : 'border-white'}`}
                                                alt=""
                                            />
                                            {isLive && <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></span>}
                                        </div>
                                        <div>
                                            <h4 className={`font-black text-lg tracking-tight ${isLive ? 'text-white' : 'text-gray-900'}`}>{appt.clientName}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className={`text-[10px] font-black uppercase tracking-widest opacity-70 ${isLive ? 'text-indigo-100' : 'text-gray-400'}`}>{appt.serviceName}</p>
                                                <span className={`w-1 h-1 rounded-full ${isLive ? 'bg-white/40' : 'bg-gray-200'}`}></span>
                                                <p className={`text-xs font-bold ${isLive ? 'text-indigo-100' : 'text-gray-500'}`}>{appt.providerName}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge status={appt.status} className={isLive ? 'bg-white/20 text-white border-none' : ''} />
                                        <button className={`p-2 rounded-xl transition-colors ${isLive ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-300 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-gray-900 text-xl tracking-tight">Clinical Roadmap</h3>
                <Link to="/appointments" className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-700">Full Schedule <ArrowRight size={10} className="inline ml-1 mb-0.5" /></Link>
             </div>
             <div className="overflow-x-auto p-4">
               <table className="w-full text-sm text-left">
                 <thead className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                   <tr>
                     <th className="px-6 py-4">Date & Time</th>
                     <th className="px-6 py-4">Patient</th>
                     <th className="px-6 py-4 text-right">Details</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {upcomingAppointments.map(appt => (
                      <tr key={appt.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-6 font-bold text-gray-900">
                           {new Date(appt.startTime).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                           <span className="block text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-1">
                             {new Date(appt.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                           </span>
                        </td>
                        <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">{appt.clientName.charAt(0)}</div>
                                <span className="font-bold text-gray-800">{appt.clientName}</span>
                            </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                           <button onClick={() => navigate('/appointments')} className="text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                                <ArrowUpRight size={18} />
                           </button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        {/* Right Info Column */}
        <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
           
           {/* Priority Alerts */}
           <div className="bg-indigo-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full group-hover:scale-110 transition-transform"></div>
              <h3 className="font-black text-xl mb-6 flex items-center gap-3 tracking-tight">
                 <AlertCircle size={22} className="text-indigo-400" /> Clinical Action Required
              </h3>
              
              <div className="space-y-4 relative">
                 {pendingMessages.length === 0 && (
                    <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-3xl text-center space-y-3">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <p className="text-sm font-bold">Chart review complete!</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">No critical patient tasks</p>
                    </div>
                 )}

                 {pendingMessages.length > 0 && (
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer group/item">
                       <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-indigo-400/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                            <MessageSquare size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{pendingMessages.length} Patient Inquiries</p>
                            <p className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest">Needs Response</p>
                          </div>
                       </div>
                       <button 
                        onClick={() => navigate('/inbox')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase rounded-xl transition-all shadow-lg active:scale-95"
                       >
                        Respond Now
                       </button>
                    </div>
                 )}
                 {todaysAppointments.length > 0 && (
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-all cursor-pointer group/item">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-emerald-400/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Triage Queue</p>
                                <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest">Verify Bookings</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/appointments')}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase rounded-xl transition-all"
                        >
                            Review
                        </button>
                    </div>
                 )}
              </div>
           </div>

           {/* Activity Snapshot (HUB) */}
           <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
              <h3 className="font-black text-gray-900 text-xl mb-8 tracking-tight">Real-time Clinical Feed</h3>
              <div className="space-y-8 relative">
                 <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-50"></div>
                 {hubEvents.map((event, i) => (
                    <div 
                      key={event.id} 
                      onClick={() => navigate(event.path)}
                      className="relative flex gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500 group cursor-pointer" 
                      style={{animationDelay: `${i * 100}ms`}}
                    >
                       <div className={`w-8 h-8 rounded-xl border-2 border-white shadow-md shrink-0 z-10 flex items-center justify-center ${event.color} group-hover:scale-110 transition-transform`}>
                          {event.icon}
                       </div>
                       <div className="flex-1">
                          <p className="text-xs font-black text-gray-900 leading-tight">
                             {event.title} <span className="font-bold text-gray-300 lowercase ml-1">{event.time}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">"{event.subtitle}"</p>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                             Details <ChevronRight size={10} />
                          </p>
                       </div>
                    </div>
                 ))}
              </div>
              <Link to="/inbox" className="w-full mt-10 py-4 bg-gray-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors">
                 Open Activity Hub <ArrowRight size={14} />
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
