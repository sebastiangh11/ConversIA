
import React, { useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { Appointment, AppointmentStatus, Conversation, Client } from '../types';
// Add missing ArrowRight to the import list from lucide-react
import { 
  Calendar, Users, MessageSquare, ArrowUpRight, Clock, 
  CheckCircle2, AlertCircle, TrendingUp, MoreHorizontal,
  PlusCircle, UserPlus, CreditCard, Layers, ChevronRight,
  TrendingDown, Activity, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge';

interface HomeProps {
  user: { name: string; email: string } | null;
}

const Home: React.FC<HomeProps> = ({ user }) => {
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
        console.error("Failed to load dashboard data", error);
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

  const pendingMessages = conversations.filter(c => c.status === 'NEW' || c.unreadCount > 0);
  
  const upcomingAppointments = appointments.filter(a => 
    new Date(a.startTime) > new Date() && 
    a.status === AppointmentStatus.BOOKED
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 5);

  const stats = [
    { 
      label: "Today's Volume", 
      value: todaysAppointments.length, 
      icon: <Calendar size={22} />,
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-100',
      trend: '+12%',
      isPositive: true
    },
    { 
      label: 'New Messages', 
      value: pendingMessages.length, 
      icon: <MessageSquare size={22} />,
      color: 'bg-blue-600',
      shadow: 'shadow-blue-100',
      trend: '+5',
      isPositive: true
    },
    { 
      label: 'Total Clients', 
      value: clients.length, 
      icon: <Users size={22} />,
      color: 'bg-emerald-600',
      shadow: 'shadow-emerald-100',
      trend: '+3',
      isPositive: true
    },
    { 
      label: 'Performance', 
      value: '94%', 
      icon: <Activity size={22} />,
      color: 'bg-rose-600',
      shadow: 'shadow-rose-100',
      trend: '-2%',
      isPositive: false
    }
  ];

  const quickActions = [
    { name: 'New Booking', icon: <PlusCircle size={18} />, path: '/appointments', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Add Client', icon: <UserPlus size={18} />, path: '/clients', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'New Class', icon: <Layers size={18} />, path: '/classes', color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Payouts', icon: <CreditCard size={18} />, path: '/payments', color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-sm tracking-widest uppercase">Initializing Dashboard</p>
        </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-5rem)] overflow-y-auto bg-gray-50/30 space-y-10 custom-scrollbar">
      
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
            Welcome back, {user?.name?.split(' ')[0] || 'Partner'}
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            It's {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}. Ready to scale?
          </p>
        </div>
        <div className="flex gap-4">
          <div className="hidden lg:grid grid-cols-4 gap-3">
            {quickActions.map((action, idx) => (
                <Link 
                    key={idx} 
                    to={action.path} 
                    className={`flex items-center gap-2 px-4 py-2.5 ${action.bg} ${action.color} rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all border border-transparent hover:border-current/10`}
                >
                    {action.icon} {action.name.split(' ')[1]}
                </Link>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-[0.03] rounded-bl-[4rem] group-hover:scale-110 transition-transform`}></div>
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${stat.color} text-white shadow-xl ${stat.shadow} transform group-hover:-rotate-6 transition-transform`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {stat.trend}
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-black text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
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
                    <h3 className="font-black text-gray-900 text-xl tracking-tight">Today's Schedule</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{todaysAppointments.length} Bookings Total</p>
                </div>
              </div>
              <Link to="/appointments" className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-colors">
                <MoreHorizontal size={24} />
              </Link>
            </div>
            
            <div className="p-4 space-y-3">
              {todaysAppointments.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200">
                    <Calendar size={40} />
                  </div>
                  <p className="text-gray-400 font-bold">Your schedule is clear for today.</p>
                  <button className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">Plan for tomorrow</button>
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
                                
                                <div className={`flex-1 p-5 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group-hover:scale-[1.01] ${
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
                                                <p className={`text-xs font-bold uppercase tracking-widest opacity-70 ${isLive ? 'text-indigo-100' : 'text-gray-400'}`}>{appt.serviceName}</p>
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
                <h3 className="font-black text-gray-900 text-xl tracking-tight">Upcoming This Week</h3>
                <Link to="/appointments" className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-700">See all schedule</Link>
             </div>
             <div className="overflow-x-auto p-4">
               <table className="w-full text-sm text-left">
                 <thead className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                   <tr>
                     <th className="px-6 py-4">Date & Time</th>
                     <th className="px-6 py-4">Customer</th>
                     <th className="px-6 py-4">Service</th>
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
                        <td className="px-6 py-6 font-medium text-gray-500">{appt.serviceName}</td>
                        <td className="px-6 py-6 text-right">
                           <button className="text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
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
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-bl-full group-hover:scale-110 transition-transform"></div>
              <h3 className="font-black text-xl mb-6 flex items-center gap-3 tracking-tight">
                 <AlertCircle size={22} className="text-indigo-400" /> Critical Actions
              </h3>
              <div className="space-y-4 relative">
                 {pendingMessages.length > 0 && (
                    <Link to="/inbox" className="flex items-center justify-between bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group/item">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-400/20 rounded-xl flex items-center justify-center text-indigo-400">
                            <MessageSquare size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{pendingMessages.length} Messages</p>
                            <p className="text-[10px] font-bold text-indigo-400/70 uppercase">Require Response</p>
                          </div>
                       </div>
                       <ChevronRight size={16} className="text-white/30 group-hover/item:text-white transition-colors" />
                    </Link>
                 )}
                 <div className="flex items-center justify-between bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group/item">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-400/20 rounded-xl flex items-center justify-center text-emerald-400">
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-bold">2 Bookings</p>
                            <p className="text-[10px] font-bold text-emerald-400/70 uppercase">Awaiting Review</p>
                        </div>
                     </div>
                     <ChevronRight size={16} className="text-white/30 group-hover/item:text-white transition-colors" />
                 </div>
              </div>
           </div>

           {/* Activity Snapshot */}
           <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
              <h3 className="font-black text-gray-900 text-xl mb-8 tracking-tight">Real-time Stream</h3>
              <div className="space-y-8 relative">
                 <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-50"></div>
                 {conversations.slice(0, 4).map((conv, i) => (
                    <div key={conv.id} className="relative flex gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{animationDelay: `${i * 100}ms`}}>
                       <div className={`w-8 h-8 rounded-xl border-2 border-white shadow-md shrink-0 z-10 flex items-center justify-center text-[8px] font-black ${
                           conv.status === 'NEW' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                       }`}>
                          {conv.status === 'NEW' ? 'NEW' : 'LOG'}
                       </div>
                       <div className="flex-1">
                          <p className="text-xs font-black text-gray-900 leading-tight">
                             {conv.clientName} <span className="font-bold text-gray-400 lowercase">active on whatsapp</span>
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 italic">"{conv.lastMessageText}"</p>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-2 flex items-center gap-1">
                             <Clock size={10} /> {new Date(conv.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
