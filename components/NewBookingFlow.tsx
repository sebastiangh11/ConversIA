
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, User, Search, UserPlus, Calendar, 
  Clock, Check, ArrowRight, ArrowLeft, Loader2,
  Stethoscope, UserCheck, Info, AlertCircle, CheckCircle2,
  CalendarDays, ChevronRight
} from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { Client, Service, AppointmentStatus, Provider, TimeSlot, ProviderAvailability } from '../types';
import ProviderProfileDrawer from './ProviderProfileDrawer';

interface NewBookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedClient?: Client | null; // Unification: support pre-filled patient
}

type Step = 'PATIENT' | 'SERVICE' | 'SCHEDULE' | 'CONFIRM' | 'SUCCESS';

const NewBookingFlow: React.FC<NewBookingFlowProps> = ({ isOpen, onClose, onSuccess, preselectedClient }) => {
  const [step, setStep] = useState<Step>('PATIENT');
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  
  // Data State
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  
  // Availability State
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [providerStats, setProviderStats] = useState<ProviderAvailability[]>([]);

  // Selection State
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('ANY');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile View
  const [profileProviderId, setProfileProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (preselectedClient) {
        setSelectedClient(preselectedClient);
        setStep('SERVICE'); // Skip Step 1
      } else {
        resetState();
      }
    }
  }, [isOpen, preselectedClient]);

  // Load availability when date, service or step changes
  useEffect(() => {
    if (selectedService && (step === 'SERVICE' || step === 'SCHEDULE')) {
      fetchAvailability();
    }
  }, [selectedService, selectedDate, step]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [c, s, p] = await Promise.all([
        mockApi.getClients(),
        mockApi.getServices(),
        mockApi.getProviders()
      ]);
      setAllClients(c);
      setServices(s);
      setProviders(p);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedService) return;
    setIsAvailabilityLoading(true);
    try {
      const data = await mockApi.getAvailabilityForDate(selectedService.id, selectedDate);
      setProviderStats(data.providerStats);
      setAvailableSlots(data.slots);
    } finally {
      setIsAvailabilityLoading(false);
    }
  };

  const resetState = () => {
    setStep('PATIENT');
    setSelectedClient(null);
    setIsCreatingClient(false);
    setNewClientName('');
    setNewClientPhone('');
    setSelectedService(null);
    setSelectedProviderId('ANY');
    setSelectedTime(null);
    setSearchQuery('');
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery) return [];
    return allClients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery)
    ).slice(0, 5);
  }, [allClients, searchQuery]);

  const displaySlots = useMemo(() => {
    if (selectedProviderId === 'ANY') return availableSlots;
    return availableSlots.filter(s => s.providers.includes(selectedProviderId));
  }, [availableSlots, selectedProviderId]);

  const handleNextStep = () => {
    if (step === 'PATIENT') setStep('SERVICE');
    else if (step === 'SERVICE') setStep('SCHEDULE');
    else if (step === 'SCHEDULE') setStep('CONFIRM');
  };

  const handleCreateBooking = async () => {
    setIsLoading(true);
    try {
      let client = selectedClient;
      if (isCreatingClient) {
        client = await mockApi.createClient({ name: newClientName, phone: newClientPhone });
      }
      if (!client || !selectedService || !selectedTime) return;

      const slot = availableSlots.find(s => s.time === selectedTime);
      const finalProviderId = selectedProviderId === 'ANY' ? slot!.providers[0] : selectedProviderId;
      const finalProvider = providers.find(p => p.id === finalProviderId)!;

      const startTime = new Date(`${selectedDate}T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + selectedService.durationMinutes * 60000);

      await mockApi.createAppointment({
        clientId: client.id,
        clientName: client.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        providerId: finalProvider.id,
        providerName: finalProvider.name,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: AppointmentStatus.BOOKED
      });

      setStep('SUCCESS');
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative z-[101] w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-indigo-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-indigo-50 flex justify-between items-center">
          <div className="flex flex-col">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Manual Booking</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'PATIENT' ? 'text-indigo-600' : 'text-gray-300'}`}>Patient</span>
              <div className="w-1 h-1 bg-gray-200 rounded-full" />
              <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'SERVICE' ? 'text-indigo-600' : 'text-gray-300'}`}>Service</span>
              <div className="w-1 h-1 bg-gray-200 rounded-full" />
              <span className={`text-[10px] font-black uppercase tracking-widest ${step === 'SCHEDULE' ? 'text-indigo-600' : 'text-gray-300'}`}>Schedule</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 max-h-[70vh]">
          
          {step === 'PATIENT' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Find Patient</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input 
                    type="text" value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setIsCreatingClient(false); setSelectedClient(null); }}
                    placeholder="Search by name or phone..."
                    className="w-full pl-12 pr-4 py-4 bg-indigo-50/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:outline-none text-sm font-bold transition-all"
                  />
                </div>
              </div>

              {filteredClients.length > 0 && !selectedClient && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  {filteredClients.map(client => (
                    <button key={client.id} onClick={() => { setSelectedClient(client); setSearchQuery(client.name); }}
                      className="w-full flex items-center justify-between p-4 bg-white border border-indigo-50 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left shadow-sm group"
                    >
                      <div className="flex items-center gap-4">
                        <img src={client.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                        <div>
                          <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600">{client.name}</p>
                          <p className="text-xs text-gray-400 font-bold">{client.phone}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'SERVICE' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              {preselectedClient && (
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm">
                    {preselectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Booking For</p>
                    <p className="text-sm font-black text-indigo-900">{preselectedClient.name}</p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Select Service</label>
                <div className="grid grid-cols-1 gap-3">
                  {services.map(svc => (
                    <button key={svc.id} onClick={() => setSelectedService(svc)}
                      className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all text-left ${selectedService?.id === svc.id ? 'border-indigo-600 bg-indigo-50' : 'border-indigo-50 bg-white hover:border-indigo-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${selectedService?.id === svc.id ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}><Stethoscope size={20} /></div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{svc.name}</p>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">{svc.durationMinutes}m • ${svc.price}</p>
                        </div>
                      </div>
                      {selectedService?.id === svc.id && <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center"><Check size={14}/></div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'SCHEDULE' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col gap-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Consultation Date</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" size={18} />
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-indigo-50/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-sm font-black transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Available Slots</label>
                  {isAvailabilityLoading && <Loader2 size={14} className="animate-spin text-indigo-600" />}
                </div>

                {displaySlots.length === 0 ? (
                  <div className="p-8 text-center bg-rose-50 rounded-[2rem] border border-rose-100">
                    <AlertCircle size={24} className="text-rose-500 mx-auto mb-3" />
                    <p className="text-sm font-black text-rose-900">No availability for this day.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {displaySlots.map(slot => (
                      <button key={slot.time} onClick={() => setSelectedTime(slot.time)}
                        className={`py-3 rounded-2xl text-[11px] font-black transition-all border-2 ${selectedTime === slot.time ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' : 'border-indigo-50 bg-white text-indigo-900 hover:border-indigo-300'}`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'CONFIRM' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-indigo-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                 <div className="space-y-6 relative">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-white/10 rounded-[1.25rem] flex items-center justify-center backdrop-blur-sm border border-white/20">
                          <UserCheck size={28} className="text-indigo-200" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Patient</p>
                          <h4 className="text-xl font-black">{selectedClient?.name || newClientName}</h4>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="py-12 text-center space-y-8 animate-in zoom-in duration-500">
               <div className="flex justify-center">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-emerald-100 animate-bounce"><CheckCircle2 size={48} /></div>
               </div>
               <h3 className="text-3xl font-black text-gray-900 tracking-tight">Booking Confirmed!</h3>
               <button onClick={onClose} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all">Done</button>
            </div>
          )}
        </div>

        {step !== 'SUCCESS' && (
          <div className="px-8 py-6 border-t border-indigo-50 bg-gray-50/50 flex justify-between items-center">
            {step !== 'PATIENT' && step !== 'SERVICE' || (step === 'SERVICE' && !preselectedClient) ? (
              <button onClick={() => { if (step === 'SERVICE') setStep('PATIENT'); else if (step === 'SCHEDULE') setStep('SERVICE'); else setStep('SCHEDULE'); }}
                className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            <button 
              disabled={isLoading || (step === 'PATIENT' && !selectedClient && !isCreatingClient) || (step === 'SERVICE' && !selectedService) || (step === 'SCHEDULE' && !selectedTime)}
              onClick={step === 'CONFIRM' ? handleCreateBooking : handleNextStep}
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3 transform active:scale-[0.98]"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : step === 'CONFIRM' ? 'Finalize Booking' : 'Continue'}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>

    {profileProviderId && (
        <ProviderProfileDrawer 
            isOpen={!!profileProviderId}
            onClose={() => setProfileProviderId(null)}
            providerId={profileProviderId}
            onUpdate={loadInitialData}
        />
    )}
    </>
  );
};

export default NewBookingFlow;
