
import React, { useState, useEffect } from 'react';
import { 
  X, Clock, Stethoscope, Calendar, Check, 
  ChevronRight, Building2, UserCheck, AlertCircle,
  Loader2, ShieldCheck, Mail, Phone, Briefcase,
  Settings2, Activity
} from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { Provider, Service, WorkingHours, Appointment, Specialty } from '../types';
import BusinessHoursEditor from './BusinessHoursEditor';
import Badge from './Badge';

interface ProviderProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  onUpdate: () => void;
}

const ProviderProfileDrawer: React.FC<ProviderProfileDrawerProps> = ({ isOpen, onClose, providerId, onUpdate }) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && providerId) {
      loadProviderData();
    }
  }, [isOpen, providerId]);

  const loadProviderData = async () => {
    setIsLoading(true);
    try {
      const [allProvs, allSvcs, allSpecs, allAppts] = await Promise.all([
        mockApi.getProviders(),
        mockApi.getServices(),
        mockApi.getSpecialties(),
        mockApi.getAppointments()
      ]);
      
      const found = allProvs.find(p => p.id === providerId);
      if (found) {
        setProvider(found);
        setServices(allSvcs);
        setSpecialties(allSpecs);
        setUpcomingAppts(
          allAppts
            .filter(a => a.providerId === providerId && new Date(a.startTime) > new Date())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 5)
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = async (serviceId: string) => {
    if (!provider) return;
    setIsSaving(true);
    const assignedIds = services
      .filter(s => s.providerIds.includes(provider.id))
      .map(s => s.id);
    
    const newAssignedIds = assignedIds.includes(serviceId)
      ? assignedIds.filter(id => id !== serviceId)
      : [...assignedIds, serviceId];

    await mockApi.updateProviderServices(provider.id, newAssignedIds);
    const allSvcs = await mockApi.getServices();
    setServices(allSvcs);
    setIsSaving(false);
  };

  const handleUpdateHours = async (hours: WorkingHours) => {
    if (!provider) return;
    setIsSaving(true);
    const updated = await mockApi.updateProvider(provider.id, { workingHours: hours, overrideClinicHours: true });
    setProvider(updated);
    setIsSaving(false);
    onUpdate();
  };

  const toggleOverride = async () => {
    if (!provider) return;
    setIsSaving(true);
    const updated = await mockApi.updateProvider(provider.id, { overrideClinicHours: !provider.overrideClinicHours });
    setProvider(updated);
    setIsSaving(false);
    onUpdate();
  };

  const toggleActive = async () => {
    if (!provider) return;
    setIsSaving(true);
    const updated = await mockApi.updateProvider(provider.id, { active: !provider.active });
    setProvider(updated);
    setIsSaving(false);
    onUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative z-[111] w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Profile Header */}
        <div className="p-8 border-b border-indigo-50 bg-white">
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <img src={provider?.avatar} className="w-24 h-24 rounded-[2.5rem] border-4 border-white shadow-2xl bg-indigo-50" />
                <span className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-white shadow-md ${provider?.active ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">{provider?.name}</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${provider?.role === 'DOCTOR' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {provider?.role}
                  </span>
                  <span className="text-gray-200 font-bold">•</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Credentialed</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={toggleActive}
              className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${provider?.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
            >
              {provider?.active ? <Check size={14} /> : <Clock size={14} />}
              {provider?.active ? 'Active Duty' : 'Away / Off'}
            </button>
            <button className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 bg-gray-50 border border-gray-100 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
              <Settings2 size={14} /> Governance
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/30 space-y-12">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Validating Credentials...</p>
            </div>
          ) : (
            <>
              {/* Authorized Service Catalog */}
              <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <Stethoscope size={16} className="text-indigo-400" /> Authorized Services
                    </h4>
                    <span className="text-[9px] font-black text-indigo-500 uppercase">Operational Scoping</span>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-50 shadow-sm space-y-8">
                  {specialties.map(spec => {
                    const specSvcs = services.filter(s => s.specialtyId === spec.id);
                    return (
                      <div key={spec.id} className="space-y-4">
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-60 flex items-center gap-2">
                            <Building2 size={12}/> {spec.name} Department
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {specSvcs.map(svc => {
                            const isAssigned = svc.providerIds.includes(provider?.id || '');
                            return (
                              <button key={svc.id} onClick={() => toggleService(svc.id)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${isAssigned ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-gray-100 text-gray-700 hover:border-indigo-200'}`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`p-2.5 rounded-xl transition-colors ${isAssigned ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                    <Check size={16} className={isAssigned ? 'text-white' : 'opacity-0 group-hover:opacity-100'} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black tracking-tight">{svc.name}</p>
                                    <p className={`text-[10px] font-bold ${isAssigned ? 'text-indigo-200' : 'text-gray-400'}`}>{svc.durationMinutes}m • ${svc.price}</p>
                                  </div>
                                </div>
                                {isSaving && <Loader2 size={14} className="animate-spin" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Shifts & Availability */}
              <section className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-400" /> Availability & Shifts
                </h4>
                <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"><Clock size={24} /></div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Governance Baseline</p>
                                <p className="text-lg font-black">{provider?.overrideClinicHours ? 'Custom Provider Shift' : 'Clinic Master Schedule'}</p>
                            </div>
                        </div>
                        <button onClick={toggleOverride}
                        className={`w-14 h-8 rounded-full relative transition-all border-2 ${!provider?.overrideClinicHours ? 'bg-white border-white' : 'bg-indigo-800 border-indigo-700'}`}
                        >
                            <div className={`absolute top-0.5 w-6 h-6 rounded-full shadow-lg transition-all ${!provider?.overrideClinicHours ? 'right-0.5 bg-indigo-600' : 'left-0.5 bg-white'}`} />
                        </button>
                    </div>
                </div>

                {provider?.overrideClinicHours && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                    <BusinessHoursEditor 
                      workingHours={provider.workingHours || ({} as any)} 
                      onChange={handleUpdateHours}
                      simplified
                    />
                  </div>
                )}
              </section>

              {/* Professional Workload Snapshot */}
              <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-400" /> Active Admissions
                  </h4>
                  <span className="text-[9px] font-black text-indigo-600 uppercase">Live Queue</span>
                </div>
                <div className="space-y-3">
                  {upcomingAppts.length === 0 ? (
                    <div className="p-16 bg-white rounded-[2.5rem] border border-gray-100 text-center space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto"><Briefcase size={28} className="text-gray-200" /></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No assigned patient admissions</p>
                    </div>
                  ) : (
                    upcomingAppts.map(appt => (
                      <div key={appt.id} className="bg-white p-6 rounded-[2.2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 hover:shadow-xl transition-all">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-xs font-black shadow-inner">{appt.clientName.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-black text-gray-900 tracking-tight">{appt.clientName}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{appt.serviceName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-indigo-600 leading-none">{new Date(appt.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          <p className="text-[9px] font-bold text-gray-300 uppercase mt-1">{new Date(appt.startTime).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-8 border-t border-indigo-50 bg-white">
          <button 
            onClick={onClose}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Acknowledge Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfileDrawer;
