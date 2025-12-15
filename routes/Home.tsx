
import React, { useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { Appointment, AppointmentStatus, Conversation, Client } from '../types';
import { 
  Calendar, Users, MessageSquare, ArrowUpRight, Clock, 
  CheckCircle2, AlertCircle, TrendingUp, MoreHorizontal 
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

  // --- Calculations ---
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
      label: "Today's Bookings", 
      value: todaysAppointments.length, 
      icon: <Calendar size={20} />,
      color: 'bg-indigo-50 text-indigo-600',
      subtext: 'appointments scheduled'
    },
    { 
      label: 'Pending Messages', 
      value: pendingMessages.length, 
      icon: <MessageSquare size={20} />,
      color: 'bg-orange-50 text-orange-600',
      subtext: 'require attention'
    },
    { 
      label: 'Total Clients', 
      value: clients.length, 
      icon: <Users size={20} />,
      color: 'bg-blue-50 text-blue-600',
      subtext: '+3 this week' 
    },
    { 
      label: 'Completion Rate', 
      value: '94%', 
      icon: <CheckCircle2 size={20} />,
      color: 'bg-green-50 text-green-600',
      subtext: 'last 30 days'
    }
  ];

  if (loading) {
    return <div className="p-8 text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50/50">
      
      {/* Welcome Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Good Morning, {user?.name?.split(' ')[0] || 'Owner'}</h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening at your business today, {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/appointments" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-sm shadow-sm transition-all">
            View Calendar
          </Link>
          <Link to="/appointments" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 text-sm shadow-md shadow-indigo-200 transition-all">
            + Quick Booking
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="flex items-center text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp size={12} className="mr-1" /> +12%
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Today's Schedule */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Clock className="text-indigo-500" size={20} /> Today's Schedule
              </h3>
              <Link to="/appointments" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All <ArrowUpRight size={14} />
              </Link>
            </div>
            
            <div className="p-0">
              {todaysAppointments.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar size={20} />
                  </div>
                  No appointments scheduled for today.
                </div>
              ) : (
                todaysAppointments.map((appt, i) => (
                  <div key={appt.id} className="flex items-center p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                    <div className="w-16 text-center mr-4">
                      <p className="text-xs font-bold text-gray-400 mb-1">
                        {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="h-full w-0.5 bg-gray-100 mx-auto group-last:hidden"></div>
                    </div>
                    
                    <div className="flex-1 bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex justify-between items-center group-hover:border-indigo-200 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                             appt.status === 'COMPLETED' ? 'bg-green-500' : 'bg-indigo-500'
                         }`}>
                            {appt.clientName.charAt(0)}
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900 text-sm">{appt.clientName}</h4>
                            <p className="text-xs text-gray-500">{appt.serviceName} with {appt.providerName}</p>
                         </div>
                      </div>
                      <Badge status={appt.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">Upcoming Next</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-gray-600">
                 <thead className="text-xs text-gray-400 font-bold uppercase bg-gray-50/50">
                   <tr>
                     <th className="px-6 py-3">Date</th>
                     <th className="px-6 py-3">Client</th>
                     <th className="px-6 py-3">Service</th>
                     <th className="px-6 py-3">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                    {upcomingAppointments.map(appt => (
                      <tr key={appt.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                           {new Date(appt.startTime).toLocaleDateString()}
                           <span className="block text-xs text-gray-400 font-normal">
                             {new Date(appt.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                           </span>
                        </td>
                        <td className="px-6 py-4">{appt.clientName}</td>
                        <td className="px-6 py-4">{appt.serviceName}</td>
                        <td className="px-6 py-4">
                           <button className="text-indigo-600 font-bold text-xs hover:underline">Details</button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        {/* Right Column: Alerts & Activity */}
        <div className="space-y-6">
           {/* Alerts Card */}
           <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                 <AlertCircle size={20} className="text-indigo-300" /> Attention Needed
              </h3>
              <div className="space-y-4">
                 {pendingMessages.length > 0 && (
                    <Link to="/inbox" className="flex items-center justify-between bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm cursor-pointer">
                       <div className="flex items-center gap-3">
                          <MessageSquare size={16} className="text-indigo-200" />
                          <span className="text-sm font-medium">{pendingMessages.length} unread messages</span>
                       </div>
                       <ArrowUpRight size={14} className="text-indigo-200" />
                    </Link>
                 )}
                 <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm cursor-pointer">
                     <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-indigo-200" />
                        <span className="text-sm font-medium">2 Pending bookings</span>
                     </div>
                     <ArrowUpRight size={14} className="text-indigo-200" />
                 </div>
              </div>
           </div>

           {/* Recent Activity */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Recent Activity</h3>
              <div className="space-y-6 relative">
                 <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                 {conversations.slice(0, 4).map((conv, i) => (
                    <div key={conv.id} className="relative flex gap-4">
                       <div className={`w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0 z-10 flex items-center justify-center text-[10px] font-bold ${
                           i === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                       }`}>
                          {conv.status === 'NEW' ? 'NEW' : 'MSG'}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-800">
                             {conv.clientName} <span className="font-normal text-gray-500 text-xs">sent a message</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1 truncate w-48">"{conv.lastMessageText}"</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                             {new Date(conv.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                       </div>
                    </div>
                 ))}
              </div>
              <Link to="/inbox" className="block text-center mt-6 text-sm font-bold text-indigo-600 hover:text-indigo-700">
                 View All Activity
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
