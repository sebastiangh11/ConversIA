
import React, { useEffect, useState, useMemo } from 'react';
import { mockApi } from '../services/mockApi';
import { Appointment, AppointmentStatus, Client } from '../types';
import Badge from '../components/Badge';
import { Search, Filter, Calendar, Users, Clock, MoreHorizontal, ArrowUpRight, TrendingUp, LayoutList, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<(Appointment & { avatar?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
        const appts = await mockApi.getAppointments();
        const clients = await mockApi.getClients();
        
        const merged = appts.map(a => {
            const client = clients.find(c => c.id === a.clientId);
            return { ...a, avatar: client?.avatar };
        });
        
        setAppointments(merged);
        setLoading(false);
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Total Bookings', value: appointments.length, trend: '+12%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Upcoming', value: appointments.filter(a => a.status === AppointmentStatus.BOOKED).length, trend: '+5%', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length, trend: '+20%', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'No Shows', value: appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length, trend: '-2%', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const chartData = [
    { name: 'Mon', bookings: 4 },
    { name: 'Tue', bookings: 3 },
    { name: 'Wed', bookings: 7 },
    { name: 'Thu', bookings: 5 },
    { name: 'Fri', bookings: 6 },
    { name: 'Sat', bookings: 9 },
    { name: 'Sun', bookings: 2 },
  ];

  const statusData = [
    { name: 'Booked', value: appointments.filter(a => a.status === AppointmentStatus.BOOKED).length, color: '#4f46e5' },
    { name: 'Completed', value: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length, color: '#10b981' },
    { name: 'Cancelled', value: appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length, color: '#ef4444' },
    { name: 'No Show', value: appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length, color: '#f97316' },
  ].filter(item => item.value > 0);

  // Calculate Top Services
  const topServices = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => {
        counts[a.serviceName] = (counts[a.serviceName] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
  }, [appointments]);

  const maxServiceVal = Math.max(...topServices.map(s => s.value), 0) || 1;

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0 = Sun
    
    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Padding for empty days
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`pad-${i}`} className="bg-gray-50/30 min-h-[120px] border-b border-r border-gray-100"></div>);
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        // Compare dates properly
        const dayAppts = appointments.filter(a => {
            const d = new Date(a.startTime);
            return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
        });
        
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

        days.push(
            <div key={day} className="bg-white min-h-[120px] border-b border-r border-gray-100 p-2 transition-colors hover:bg-gray-50 group flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : 'text-gray-700'
                    }`}>
                        {day}
                    </span>
                    {dayAppts.length > 0 && (
                        <span className="text-[10px] text-gray-400 font-medium group-hover:text-indigo-500 transition-colors">
                            {dayAppts.length} bookings
                        </span>
                    )}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayAppts.map(appt => (
                        <div key={appt.id} className={`text-[10px] px-1.5 py-1 rounded-md border truncate font-medium cursor-pointer transition-transform hover:scale-[1.02] ${
                            appt.status === AppointmentStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-100' :
                            appt.status === AppointmentStatus.CANCELLED ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`} title={`${new Date(appt.startTime).toLocaleTimeString()} - ${appt.serviceName}`}>
                            <span className="opacity-75 mr-1">{new Date(appt.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            {appt.clientName}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
             {/* Calendar Header */}
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <Calendar className="text-indigo-500" size={24} />
                    {monthNames[month]} {year}
                </h3>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"><ChevronLeft size={20} /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">Today</button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"><ChevronRight size={20} /></button>
                </div>
             </div>
             
             {/* Calendar Grid Header */}
             <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                ))}
             </div>
             
             {/* Calendar Body */}
             <div className="grid grid-cols-7">
                {days}
             </div>
        </div>
    )
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)] bg-gray-50/50">
      
      {/* Header & Stats */}
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{stat.label}</p>
                <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color}`}>
                    <ArrowUpRight size={16} />
                </div>
                </div>
                <div>
                <p className="text-3xl font-extrabold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium"><span className="text-green-500">{stat.trend}</span> vs last month</p>
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'calendar' ? (
          <div>
            <div className="flex justify-end mb-4">
               <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
                    <button 
                        onClick={() => setViewMode('list')} 
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                        title="List View"
                    >
                        <LayoutList size={20} />
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')} 
                        className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shadow-sm transition-colors"
                        title="Calendar View"
                    >
                        <Calendar size={20} />
                    </button>
                </div>
            </div>
            {renderCalendar()}
          </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
        {/* Main List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white">
            <div>
                <h3 className="font-bold text-gray-900 text-lg">All Appointments</h3>
                <p className="text-xs text-gray-500 mt-1">View and manage your schedule</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
                    <button 
                        onClick={() => setViewMode('list')} 
                        className="p-2 rounded-md bg-white text-indigo-600 shadow-sm"
                    >
                        <LayoutList size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('calendar')} 
                        className="p-2 rounded-md text-gray-500 hover:text-gray-700"
                    >
                        <Calendar size={18} />
                    </button>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors bg-white">
                <Filter size={16} /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors">
                <Calendar size={16} /> New Booking
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-400 font-bold uppercase bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading appointments...</td></tr>
                ) : appointments.length === 0 ? (
                   <tr><td colSpan={6} className="p-12 text-center text-gray-400">No appointments found.</td></tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} className="bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <img 
                                src={appt.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${appt.clientId}`} 
                                alt="" 
                                className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white shadow-sm"
                            />
                            <span className="font-bold text-gray-900">{appt.clientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{appt.serviceName}</span>
                          {appt.maxCapacity && (
                            <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full w-fit mt-1 font-semibold flex items-center gap-1">
                              <Users size={10} /> {appt.currentAttendees}/{appt.maxCapacity}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{new Date(appt.startTime).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">
                             {new Date(appt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                  {appt.providerName.charAt(0)}
                              </div>
                              <span>{appt.providerName}</span>
                          </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={appt.status} className="shadow-sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-all">
                            <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="flex flex-col gap-6 w-full">
           {/* Chart 1: Weekly Overview */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">Weekly Overview</h3>
                    <select className="text-xs border-none bg-gray-50 rounded-lg px-2 py-1 text-gray-500 font-medium focus:ring-0 cursor-pointer hover:bg-gray-100">
                        <option>This Week</option>
                        <option>Last Week</option>
                    </select>
                </div>
                
                <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                        <Tooltip 
                            cursor={{fill: '#f3f4f6'}} 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        />
                        <Bar dataKey="bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
           </div>
           
           {/* Chart 2: Status Distribution */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-gray-800 text-lg">Status</h3>
                 <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-medium">Last 30 days</span>
               </div>
               
               <div className="h-[200px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              startAngle={90}
                              endAngle={-270}
                          >
                              {statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                              ))}
                          </Pie>
                          <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                      </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="text-center">
                         <span className="text-3xl font-bold text-gray-800">{appointments.length}</span>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
                     </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-y-2 gap-x-1 mt-2">
                 {statusData.map((item) => (
                   <div key={item.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></span>
                      <span className="text-xs text-gray-600 font-medium">{item.name} ({item.value})</span>
                   </div>
                 ))}
               </div>
           </div>

           {/* Chart 3: Top Services (NEW) */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="font-bold text-gray-800 text-lg">Top Services</h3>
                     <TrendingUp size={16} className="text-indigo-500"/>
                </div>
                <div className="space-y-5">
                    {topServices.length > 0 ? topServices.map((service, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-medium text-gray-700 truncate max-w-[70%]">{service.name}</span>
                                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">{service.value}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div 
                                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000" 
                                    style={{ width: `${(service.value / maxServiceVal) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-gray-400 text-center py-4">No bookings data yet.</p>
                    )}
                </div>
           </div>

           {/* Peak Hours Card */}
           <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl text-white shadow-lg shadow-indigo-200 p-5">
             <div className="flex items-start gap-3">
               <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                 <Clock className="text-white" size={20} />
               </div>
               <div>
                 <p className="text-sm font-bold text-white mb-1">Peak Hours</p>
                 <p className="text-xs text-indigo-100 leading-relaxed">Saturday afternoon is your busiest time. Consider adding another staff member.</p>
               </div>
             </div>
           </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Appointments;
