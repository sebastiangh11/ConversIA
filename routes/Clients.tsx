
import React, { useEffect, useState, useMemo } from 'react';
import { mockApi } from '../services/mockApi';
import { Client, Appointment } from '../types';
import { Search, Mail, Phone, Calendar, X, Save, Clock, History, FileText, Check, MoreHorizontal, MessageSquare, Star, Zap, TrendingUp, Filter, UserPlus } from 'lucide-react';
import Badge from '../components/Badge';

type FilterType = 'ALL' | 'ACTIVE' | 'NEWEST' | 'TOP';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientHistory, setClientHistory] = useState<Appointment[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Filter States
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      setFormData({ ...selectedClient });
      setIsDrawerOpen(true);
      // Fetch history
      mockApi.getAppointments().then(allAppts => {
        const history = allAppts.filter(a => a.clientId === selectedClient.id);
        setClientHistory(history);
      });
    } else {
      setIsDrawerOpen(false);
      setFormData({});
      setClientHistory([]);
    }
  }, [selectedClient]);

  const loadClients = async () => {
    const data = await mockApi.getClients();
    setClients(data);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedClient(null), 300); 
  };

  const handleSave = async () => {
    if (!selectedClient || !formData.id) return;
    setIsSaving(true);
    
    try {
      const updatedClient = { ...selectedClient, ...formData } as Client;
      await mockApi.updateClient(updatedClient);
      
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      setSelectedClient(updatedClient);
    } catch (error) {
      console.error("Failed to save patient record", error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(c => 
            c.name.toLowerCase().includes(lower) || 
            c.phone.includes(searchTerm) ||
            (c.email && c.email.toLowerCase().includes(lower))
        );
    }

    switch (filter) {
        case 'ACTIVE':
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            result = result.filter(c => new Date(c.lastSeen) > thirtyDaysAgo);
            break;
        case 'NEWEST':
            result.sort((a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime());
            break;
        case 'TOP':
            result.sort((a, b) => b.totalAppointments - a.totalAppointments);
            break;
        default:
            result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [clients, filter, searchTerm]);

  const totalClients = clients.length;
  const newThisMonth = clients.filter(c => {
      const d = new Date(c.firstSeen);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const activeClients = clients.filter(c => {
      const d = new Date(c.lastSeen);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return d > thirtyDaysAgo;
  }).length;

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto relative bg-gray-50/50">
      
      <div className="mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Patient Records</h1>
                <p className="text-sm text-gray-500 mt-1">Manage patient medical histories and growth.</p>
            </div>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm">
                <UserPlus size={18} /> Register Patient
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Patient Database</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{totalClients}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UserPlus size={20} />
                </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">New Registrations</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-extrabold text-gray-900">{newThisMonth}</p>
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-bold flex items-center">
                            <TrendingUp size={10} className="mr-1"/> +{Math.round((newThisMonth/totalClients)*100) || 0}%
                        </span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <Zap size={20} />
                </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active This Month</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{activeClients}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Star size={20} />
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8 items-center justify-between sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm py-2">
         <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex overflow-x-auto w-full lg:w-auto no-scrollbar">
            <button 
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filter === 'ALL' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                All Patients
            </button>
            <button 
                onClick={() => setFilter('ACTIVE')}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${filter === 'ACTIVE' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Zap size={14} className={filter === 'ACTIVE' ? 'text-indigo-500' : 'text-gray-400'}/> Recently Seen
            </button>
            <button 
                onClick={() => setFilter('NEWEST')}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${filter === 'NEWEST' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Clock size={14} className={filter === 'NEWEST' ? 'text-indigo-500' : 'text-gray-400'}/> New Files
            </button>
            <button 
                onClick={() => setFilter('TOP')}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${filter === 'TOP' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Star size={14} className={filter === 'TOP' ? 'text-indigo-500' : 'text-gray-400'}/> Frequent Visits
            </button>
         </div>

         <div className="relative group w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient or file #..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full shadow-sm transition-all"
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
        {filteredClients.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <p>No patient records found.</p>
                <button onClick={() => { setFilter('ALL'); setSearchTerm(''); }} className="mt-2 text-indigo-600 font-bold text-sm hover:underline">Clear Search</button>
            </div>
        ) : (
            filteredClients.map(client => {
                const isNew = new Date(client.firstSeen).getTime() > new Date().getTime() - (30 * 24 * 60 * 60 * 1000);
                const isTop = client.totalAppointments > 5;
                
                return (
                    <div 
                        key={client.id} 
                        onClick={() => handleClientClick(client)}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer p-0 flex flex-col group relative overflow-hidden"
                    >
                        <div className="p-6 pb-0 flex flex-col items-center text-center relative z-10">
                             <div className="absolute top-4 left-4 flex gap-1">
                                {isTop && (
                                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200 flex items-center gap-1 shadow-sm">
                                        <Star size={8} fill="currentColor" /> Priority
                                    </span>
                                )}
                                {isNew && (
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 shadow-sm">
                                        New File
                                    </span>
                                )}
                             </div>

                             <div className="relative mb-3 group-hover:scale-105 transition-transform duration-300">
                                <img 
                                    src={client.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${client.id}`} 
                                    alt={client.name}
                                    className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover bg-gray-50"
                                />
                                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
                             </div>

                             <h3 className="font-bold text-gray-900 text-lg leading-tight">{client.name}</h3>
                             <p className="text-xs text-gray-400 mt-1 mb-4 font-medium flex items-center gap-1">
                                <Clock size={10} /> Last Visit {new Date(client.lastSeen).toLocaleDateString()}
                             </p>
                        </div>

                        <div className="px-6 mb-4 w-full">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
                                    <span className="block text-xs text-gray-400 uppercase font-bold">Visits</span>
                                    <span className="block text-sm font-bold text-gray-800">{client.totalAppointments}</span>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
                                    <span className="block text-xs text-gray-400 uppercase font-bold">Contact</span>
                                    <span className="block text-sm font-bold text-gray-800 truncate">
                                        {client.preferredContactMethod === 'WHATSAPP' ? 'WhatsApp' : 'Phone'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto border-t border-gray-100 flex divide-x divide-gray-100">
                             <button className="flex-1 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1">
                                <FileText size={14} /> Medical File
                             </button>
                             <button className="flex-1 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1">
                                <MessageSquare size={14} /> Contact
                             </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeDrawer}
        />
      )}

      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedClient && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">Patient Profile</h2>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
              
              <div className="flex flex-col items-center text-center">
                 <img 
                    src={selectedClient.avatar} 
                    alt={selectedClient.name}
                    className="w-24 h-24 rounded-full border-4 border-gray-50 shadow-lg mb-4"
                  />
                  <h3 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">Standard Insurance</span>
                    <span>•</span>
                    <span>{selectedClient.phone}</span>
                  </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UserPlus size={14} /> Patient Information
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Primary Contact</label>
                    <div className="relative">
                        <select 
                        value={formData.preferredContactMethod || 'WHATSAPP'} 
                        onChange={(e) => setFormData({...formData, preferredContactMethod: e.target.value as any})}
                        className="w-full text-sm border-gray-200 bg-white rounded-lg px-3 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 outline-none appearance-none"
                        >
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="PHONE">Phone</option>
                        <option value="EMAIL">Email</option>
                        </select>
                    </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5">Email</label>
                     <input 
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white"
                     />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={14} /> Clinical Notes
                </h4>
                <div className="relative">
                    <textarea 
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={4}
                    placeholder="Allergies, chronic conditions, family history..."
                    className="w-full text-sm border border-yellow-200 rounded-xl p-4 bg-yellow-50 text-gray-800 shadow-sm"
                    />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <History size={14} /> Clinical History
                </h4>
                <div className="space-y-3">
                  {clientHistory.length > 0 ? (
                    clientHistory.map(appt => (
                      <div key={appt.id} className="bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                <Calendar size={18} />
                           </div>
                           <div>
                                <p className="font-bold text-gray-800 text-sm">{appt.serviceName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(appt.startTime).toLocaleDateString()}
                                </p>
                           </div>
                        </div>
                        <Badge status={appt.status} className="shadow-sm" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-sm text-gray-400 font-medium">No previous visits.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="p-5 border-t border-gray-100 bg-white sticky bottom-0 flex justify-end items-center gap-3">
                <button 
                    onClick={closeDrawer}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                    {isSaving ? 'Updating...' : 'Update Records'}
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
