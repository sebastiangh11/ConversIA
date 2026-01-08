
import React, { useEffect, useState, useMemo } from 'react';
import { mockApi } from '../services/mockApi';
import { Specialty, Service, Provider } from '../types';
import { 
  Plus, Stethoscope, Users, Clock, 
  ChevronRight, X, UserPlus, ShieldCheck, 
  Building2, Trash2, Edit3, Check, AlertCircle, Search,
  Activity, Briefcase, Settings2, ShieldAlert, FileText,
  DollarSign, MessageSquare, Shield, Zap, TrendingUp, Filter,
  MoreHorizontal, UserCheck, Smartphone, CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import ProviderProfileDrawer from '../components/ProviderProfileDrawer';

type ViewTab = 'DEPARTMENTS' | 'ROSTER';

const Specialties: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewTab>('DEPARTMENTS');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection & Management
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);
  const [profileProviderId, setProfileProviderId] = useState<string | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'DOCTOR' | 'NURSE'>('DOCTOR');
  const [managedSpecialty, setManagedSpecialty] = useState<Specialty | null>(null);
  const [isAddingSpecialty, setIsAddingSpecialty] = useState(false);
  const [specialtyFormData, setSpecialtyFormData] = useState({ name: '', description: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [specData, svcData, provData] = await Promise.all([
      mockApi.getSpecialties(),
      mockApi.getServices(),
      mockApi.getProviders()
    ]);
    setSpecialties(specData);
    setServices(svcData);
    setProviders(provData);
    setIsLoading(false);
  };

  const handleCreateStaff = async () => {
    if (!newStaffName.trim()) return;
    const newProv = await mockApi.createProvider({ name: newStaffName, role: newStaffRole });
    setProviders(prev => [...prev, newProv]);
    setNewStaffName('');
    setIsAddingStaff(false);
  };

  const handleCreateSpecialty = async () => {
    if (!specialtyFormData.name.trim()) return;
    const newSpec = { id: `spec${Date.now()}`, name: specialtyFormData.name, description: specialtyFormData.description };
    setSpecialties(prev => [...prev, newSpec]);
    setIsAddingSpecialty(false);
  };

  const toggleProviderSelection = (id: string) => {
    setSelectedProviderIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const getOperationalStats = (specId: string) => {
      const specSvcs = services.filter(s => s.specialtyId === specId);
      const uniqueProvIds = new Set(specSvcs.flatMap(s => s.providerIds));
      const specProvs = providers.filter(p => uniqueProvIds.has(p.id));
      const activeProvs = specProvs.filter(p => p.status !== 'OFF_DUTY').length;
      const avgUtil = specProvs.length > 0 ? Math.round(specProvs.reduce((acc, p) => acc + p.utilization, 0) / specProvs.length) : 0;
      
      return { 
        serviceCount: specSvcs.length, 
        staffCount: uniqueProvIds.size,
        activeStaff: activeProvs,
        utilization: avgUtil
      };
  };

  const getUtilizationColor = (val: number) => {
      if (val > 90) return 'bg-rose-500';
      if (val > 70) return 'bg-amber-500';
      return 'bg-emerald-500';
  };

  const getStatusBadge = (status: Provider['status']) => {
      switch(status) {
          case 'AVAILABLE': return <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-emerald-100"><Zap size={10} /> Live</span>;
          case 'IN_CONSULT': return <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-blue-100"><Activity size={10} /> In Session</span>;
          case 'ON_BREAK': return <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-amber-100"><Clock size={10} /> Break</span>;
          default: return <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-gray-100">Off-duty</span>;
      }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full gap-3 text-gray-400">
        <Activity className="animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest">Syncing Resource Governance...</span>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50/30 custom-scrollbar relative">
      
      {/* Governance Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
             <ShieldCheck size={12} /> Resource Governance
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Clinical Workforce</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Monitor staff utilization, operational readiness, and specialty coverage.</p>
        </div>
        
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
            <button onClick={() => setActiveTab('DEPARTMENTS')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'DEPARTMENTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-indigo-600'}`}
            >
                <Building2 size={16} /> Specialties
            </button>
            <button onClick={() => setActiveTab('ROSTER')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ROSTER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-indigo-600'}`}
            >
                <Users size={16} /> Roster Control
            </button>
        </div>
      </div>

      {activeTab === 'DEPARTMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {specialties.map(spec => {
                const stats = getOperationalStats(spec.id);
                return (
                    <div key={spec.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Stethoscope size={28} />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${stats.activeStaff > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {stats.activeStaff === 0 ? 'Coverage Gap' : `${stats.activeStaff} On-duty`}
                                </span>
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-gray-900 mb-2">{spec.name}</h3>
                        
                        <div className="space-y-4 pt-6 mt-6 border-t border-gray-50">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregate Load</span>
                                <span className={`text-[10px] font-black uppercase ${stats.utilization > 80 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {stats.utilization}% Utilization
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${getUtilizationColor(stats.utilization)}`}
                                    style={{ width: `${stats.utilization}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="p-3 bg-gray-50 rounded-2xl">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Catalog</p>
                                <p className="text-sm font-black text-gray-800">{stats.serviceCount} items</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigned</p>
                                <p className="text-sm font-black text-gray-800">{stats.staffCount} providers</p>
                            </div>
                        </div>

                        <button 
                          onClick={() => setManagedSpecialty(spec)}
                          className="w-full mt-8 py-3 bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-indigo-100"
                        >
                           Configure Department <ChevronRight size={14} />
                        </button>
                    </div>
                );
            })}
            <button onClick={() => setIsAddingSpecialty(true)} className="border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 p-8 text-gray-400 hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600 transition-all group">
                <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={24} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">New Specialty Unit</span>
            </button>
        </div>
      )}

      {activeTab === 'ROSTER' && (
          <div className="animate-in fade-in duration-300 space-y-8">
              {/* Roster Control Panel */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className="relative group flex-1 md:w-80">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="text" 
                            placeholder="Search roster by name, role or skill..." 
                            className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all shadow-inner"
                          />
                      </div>
                      <div className="h-8 w-px bg-gray-100 hidden md:block" />
                      <div className="flex gap-2">
                          <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                              <Filter size={20} />
                          </button>
                      </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                      {selectedProviderIds.length > 0 && (
                          <div className="flex items-center gap-3 mr-4 animate-in slide-in-from-right-2">
                             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                                {selectedProviderIds.length} Selected
                             </span>
                             <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                <Zap size={14} /> Bulk Handover
                             </button>
                          </div>
                      )}
                      <button onClick={() => setIsAddingStaff(true)} className="flex items-center gap-3 px-8 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95">
                        <UserPlus size={18} /> Register Personnel
                      </button>
                  </div>
              </div>

              {/* Personnel Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {providers.map(prov => {
                      const isNearExpiry = new Date(prov.licenseExpiry) < new Date(new Date().setMonth(new Date().getMonth() + 3));
                      const isOverloaded = prov.utilization > 80;
                      const isSelected = selectedProviderIds.includes(prov.id);

                      return (
                          <div 
                            key={prov.id} 
                            onClick={() => toggleProviderSelection(prov.id)}
                            className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'border-indigo-600 shadow-2xl ring-4 ring-indigo-50' : 'border-transparent hover:border-gray-200 shadow-sm'}`}
                          >
                              <div className="flex justify-between items-start mb-6">
                                  <div className="relative">
                                    <img src={prov.avatar} className="w-20 h-20 rounded-[2rem] border-4 border-white shadow-2xl bg-white group-hover:scale-105 transition-transform" />
                                    <div className="absolute -bottom-1 -right-1">
                                        {getStatusBadge(prov.status)}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 items-end">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setProfileProviderId(prov.id); }}
                                        className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                      >
                                          <Settings2 size={18} />
                                      </button>
                                      {isNearExpiry && (
                                          <div title="Credential Expiry Risk" className="p-2 bg-rose-50 text-rose-600 rounded-xl animate-pulse">
                                              <ShieldAlert size={18} />
                                          </div>
                                      )}
                                      {isOverloaded && (
                                          <div title="Burnout Risk: High Load" className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                              <AlertTriangle size={18} />
                                          </div>
                                      )}
                                  </div>
                              </div>

                              <div className="space-y-1 mb-6">
                                  <h4 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{prov.name}</h4>
                                  <div className="flex items-center gap-2">
                                      <span className={`text-[9px] font-black uppercase tracking-widest ${prov.role === 'DOCTOR' ? 'text-indigo-600' : 'text-emerald-600'}`}>{prov.role}</span>
                                      <span className="text-gray-200">•</span>
                                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">ID: {prov.id.toUpperCase()}</span>
                                  </div>
                              </div>

                              <div className="space-y-3 pt-6 border-t border-gray-50">
                                  <div className="flex justify-between items-center px-1">
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Activity size={12}/> Live Load</span>
                                      <span className={`text-[10px] font-black ${isOverloaded ? 'text-rose-600' : 'text-gray-900'}`}>{prov.utilization}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-700 rounded-full ${getUtilizationColor(prov.utilization)}`}
                                        style={{ width: `${prov.utilization}%` }}
                                      />
                                  </div>
                              </div>

                              <div className="mt-6 flex flex-wrap gap-1.5">
                                  {prov.assignedSpecialtyIds.map(sId => {
                                      const spec = specialties.find(s => s.id === sId);
                                      return (
                                          <span key={sId} className="px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-gray-100">
                                              {spec?.name}
                                          </span>
                                      );
                                  })}
                              </div>
                              
                              {isSelected && (
                                  <div className="absolute top-4 left-4 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                      <Check size={14} />
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* SPECIALTY MANAGEMENT DRAWER */}
      {managedSpecialty && (
        <div className="fixed inset-0 z-[110] flex justify-end">
            <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-sm" onClick={() => setManagedSpecialty(null)} />
            <div className="relative z-[111] w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-8 border-b border-indigo-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Configure {managedSpecialty.name}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department Governance</p>
                        </div>
                    </div>
                    <button onClick={() => setManagedSpecialty(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                    <section className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <DollarSign size={14} className="text-indigo-400" /> Active Service Catalog
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {services.filter(s => s.specialtyId === managedSpecialty.id).map(svc => (
                                <div key={svc.id} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{svc.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{svc.durationMinutes}m duration • ${svc.price} base</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                                        <Settings2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                            <Users size={14} className="text-emerald-400" /> Authorized Workforce
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {providers.filter(p => p.assignedSpecialtyIds.includes(managedSpecialty.id)).map(p => (
                                <div key={p.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <img src={p.avatar} className="w-10 h-10 rounded-xl border border-gray-100" />
                                        <div>
                                            <p className="text-sm font-black text-gray-800 tracking-tight">{p.name}</p>
                                            <div className="flex gap-2">
                                                {getStatusBadge(p.status)}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-[9px] font-black text-gray-300 hover:text-rose-600 uppercase tracking-widest transition-colors">
                                        Deauthorize
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="p-8 border-t border-indigo-50 bg-white">
                    <button onClick={() => setManagedSpecialty(null)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all">
                        Commit Configurations
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* NEW STAFF REGISTRATION MODAL */}
      {isAddingStaff && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-md" onClick={() => setIsAddingStaff(false)} />
              <div className="relative z-50 w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Onboard Personnel</h3>
                    <button onClick={() => setIsAddingStaff(false)} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Legal Full Name</label>
                          <div className="relative group">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input type="text" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold transition-all"
                                placeholder="Dr. John Doe"
                            />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinical Role</label>
                          <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value as any)}
                              className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold appearance-none cursor-pointer"
                          >
                              <option value="DOCTOR">Attending Physician (Doctor)</option>
                              <option value="NURSE">Nursing Staff (Nurse)</option>
                          </select>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                          <ShieldAlert className="text-amber-600 shrink-0" size={18} />
                          <p className="text-[10px] text-amber-800 font-medium leading-relaxed uppercase">Manual credential verification is required after onboarding to ensure legal compliance.</p>
                      </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-10">
                      <button onClick={handleCreateStaff} className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-[0.98] hover:bg-indigo-700 transition-all">Confirm Registration</button>
                  </div>
              </div>
          </div>
      )}

      {/* Profile Drawer */}
      {profileProviderId && (
          <ProviderProfileDrawer 
            isOpen={!!profileProviderId}
            onClose={() => setProfileProviderId(null)}
            providerId={profileProviderId}
            onUpdate={loadData}
          />
      )}
    </div>
  );
};

export default Specialties;
