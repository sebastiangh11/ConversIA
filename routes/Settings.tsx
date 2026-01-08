
import React, { useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { BusinessSettings, WorkingHours, UserAccount, UserRole } from '../types';
import { 
  Save, Store, Clock, Smartphone, Zap, 
  CalendarOff, Trash2, Plus, ShieldCheck, 
  Activity, Info, AlertTriangle, Building2,
  Scale, FileText, SmartphoneIcon, Settings2,
  Lock, History, Users, Mail, ShieldAlert,
  ChevronRight, X, UserPlus, Key
} from 'lucide-react';
import BusinessHoursEditor from '../components/BusinessHoursEditor';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newDayOffDate, setNewDayOffDate] = useState('');
  const [newDayOffDesc, setNewDayOffDesc] = useState('');
  
  // User Management State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserFormData, setNewUserFormData] = useState({ name: '', email: '', role: 'RECEPTIONIST' as UserRole });

  useEffect(() => {
    mockApi.getSettings().then(setSettings);
    mockApi.getUserAccounts().then(setUsers);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    await mockApi.updateSettings(settings);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleHoursChange = (hours: WorkingHours) => {
    if (!settings) return;
    setSettings({ ...settings, workingHours: hours });
  };

  const applyPreset = (preset: '9-5' | '10-7' | '8-4') => {
    if (!settings) return;
    const newHours = { ...settings.workingHours };
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
    let open = '09:00', close = '17:00';
    if (preset === '10-7') { open = '10:00'; close = '19:00'; }
    if (preset === '8-4') { open = '08:00'; close = '16:00'; }
    weekdays.forEach(d => {
      newHours[d] = { ...newHours[d], isOpen: true, isSplit: false, open, close };
    });
    setSettings({ ...settings, workingHours: newHours });
  };

  const handleCreateUser = async () => {
    if (!newUserFormData.name || !newUserFormData.email) return;
    const newUser = await mockApi.createUserAccount(newUserFormData);
    setUsers(prev => [...prev, newUser]);
    setIsAddingUser(false);
    setNewUserFormData({ name: '', email: '', role: 'RECEPTIONIST' });
  };

  const handleDeleteUser = async (id: string) => {
    if (id === 'u1') return; // Protect main admin
    await mockApi.deleteUserAccount(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  if (!settings) return (
    <div className="flex items-center justify-center h-full gap-3 text-gray-400">
        <History className="animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest">Loading Governance Data...</span>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50/30 custom-scrollbar space-y-12">
      
      {/* Governance Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
         <div>
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                <ShieldCheck size={12} /> System Administrator
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Global Governance</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Configure institutional policies, clinical boundaries, and system access.</p>
         </div>
         <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-black text-xs uppercase tracking-widest disabled:opacity-50"
         >
            {isSaving ? <Activity size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Synchronizing...' : 'Commit Policies'}
         </button>
      </div>
      
      <div className="space-y-10">
        
        {/* SECTION 1: INSTITUTIONAL IDENTITY */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-[2.5rem] overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                    <Building2 size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Institutional Profile</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Public & Legal Identity</p>
                </div>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Entity Name</label>
                <input 
                    type="text" value={settings.name} 
                    onChange={(e) => setSettings({...settings, name: e.target.value})} 
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold transition-all shadow-inner" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Public WhatsApp Channel</label>
                <div className="relative group">
                  <SmartphoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18}/>
                  <input 
                    type="text" value={settings.whatsappNumber} 
                    onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})} 
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold transition-all shadow-inner" 
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institutional Description</label>
              <textarea 
                value={settings.description} 
                onChange={(e) => setSettings({...settings, description: e.target.value})} 
                rows={3} 
                placeholder="Hospital mission statement for patient-facing communications..."
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold transition-all shadow-inner resize-none" 
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CLINICAL OPERATING BASELINE */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-[2.5rem] overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-inner">
                    <Clock size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Operating Baseline</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Master Schedule</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => applyPreset('9-5')} className="text-[9px] font-black uppercase bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 transition-all">Shift: 09-17</button>
              <button onClick={() => applyPreset('8-4')} className="text-[9px] font-black uppercase bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 transition-all">Shift: 08-16</button>
              <button onClick={() => applyPreset('10-7')} className="text-[9px] font-black uppercase bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 transition-all">Shift: 10-19</button>
            </div>
          </div>
          <div className="p-8 space-y-8">
            <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
                <Info className="text-amber-600 shrink-0" size={20} />
                <p className="text-[11px] text-amber-800 font-bold leading-relaxed uppercase">
                    These hours define the Institutional window. Clinicians in the <span className="underline">Roster</span> can only be available within these bounds unless an override is authorized at the provider level.
                </p>
            </div>
            <BusinessHoursEditor workingHours={settings.workingHours} onChange={handleHoursChange} />
          </div>
        </div>

        {/* SECTION 3: THROUGHPUT & CONCURRENCY */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-[2.5rem] overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                    <Scale size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Throughput Governance</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Concurrency & Safety Caps</p>
                </div>
            </div>
          </div>
          <div className="p-8">
            <div className="flex items-center justify-between bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100">
              <div className="max-w-md">
                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-1">Global Encounter Limit</h4>
                <p className="text-xs text-indigo-700 font-medium leading-relaxed uppercase opacity-70">
                    The maximum number of concurrent admissions across all clinical departments. This acts as a physical safety cap for facility resources.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-2xl border-2 border-indigo-100 p-2 shadow-sm">
                <button 
                    className="w-10 h-10 flex items-center justify-center bg-gray-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-black text-lg" 
                    onClick={() => setSettings({...settings, concurrentSlots: Math.max(1, settings.concurrentSlots - 1)})}
                >
                    -
                </button>
                <span className="font-black text-xl w-8 text-center text-gray-900">{settings.concurrentSlots}</span>
                <button 
                    className="w-10 h-10 flex items-center justify-center bg-gray-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-black text-lg" 
                    onClick={() => setSettings({...settings, concurrentSlots: Math.min(100, settings.concurrentSlots + 1)})}
                >
                    +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: SYSTEM ACCESS & USER MANAGEMENT */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-[2.5rem] overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-950 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                    <Key size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">System Access Control</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">User Management & Permissions</p>
                </div>
            </div>
            <button 
                onClick={() => setIsAddingUser(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
                <UserPlus size={16} /> Invite User
            </button>
          </div>
          <div className="p-8">
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex gap-4 mb-8">
                <ShieldCheck className="text-indigo-600 shrink-0" size={24} />
                <div className="space-y-1">
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Administrative Override</h4>
                    <p className="text-[11px] text-indigo-700 font-medium leading-relaxed uppercase">
                        The "Main Branch" account can provision and revoke access for specialized dashboards. Roles determine visibility across Inbox, Roster, and Billing modules.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-indigo-100 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <Users size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-900">{user.name}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                          user.role === 'ADMIN' ? 'bg-indigo-950 text-white' : 
                          user.role === 'CLINICIAN' ? 'bg-emerald-50 text-emerald-600' : 
                          'bg-blue-50 text-blue-600'
                        }`}>{user.role}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{user.email} • Created {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.lastLogin && (
                        <span className="text-[9px] font-black text-gray-300 uppercase hidden md:block">Last seen: {new Date(user.lastLogin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    )}
                    {user.id !== 'u1' && (
                        <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="pb-10 pt-4 flex items-center justify-center gap-4 text-gray-300">
          <Settings2 size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">End of Governance Framework</span>
      </div>

      {/* CREATE USER MODAL */}
      {isAddingUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-md" onClick={() => setIsAddingUser(false)} />
              <div className="relative z-50 w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Provision System User</h3>
                    <button onClick={() => setIsAddingUser(false)} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                          <div className="relative group">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input 
                                type="text" value={newUserFormData.name} 
                                onChange={(e) => setNewUserFormData({...newUserFormData, name: e.target.value})} 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold transition-all"
                                placeholder="e.g. John Smith"
                            />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                            <input 
                                type="email" value={newUserFormData.email} 
                                onChange={(e) => setNewUserFormData({...newUserFormData, email: e.target.value})} 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold transition-all"
                                placeholder="john@conversia.io"
                            />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Access Level</label>
                          <select 
                              value={newUserFormData.role} 
                              onChange={(e) => setNewUserFormData({...newUserFormData, role: e.target.value as UserRole})}
                              className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none text-sm font-bold appearance-none cursor-pointer"
                          >
                              <option value="RECEPTIONIST">Front Desk / Receptionist</option>
                              <option value="CLINICIAN">Clinician / Physician</option>
                              <option value="ADMIN">System Administrator</option>
                          </select>
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                          <ShieldAlert className="text-amber-600 shrink-0" size={18} />
                          <p className="text-[10px] text-amber-800 font-medium leading-relaxed uppercase">Temporary login credentials will be dispatched to the provided email address upon confirmation.</p>
                      </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-10">
                      <button onClick={handleCreateUser} className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-[0.98] hover:bg-indigo-700 transition-all">Authorize User Account</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );

  function handleAddDayOff() {
    if (!settings || !newDayOffDate) return;
    const updatedDaysOff = [
      ...(settings.daysOff || []),
      { date: newDayOffDate, description: newDayOffDesc || 'Institutional Closure' }
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setSettings({ ...settings, daysOff: updatedDaysOff });
    setNewDayOffDate('');
    setNewDayOffDesc('');
  }

  function handleRemoveDayOff(indexToRemove: number) {
    if (!settings || !settings.daysOff) return;
    const updatedDaysOff = settings.daysOff.filter((_, idx) => idx !== indexToRemove);
    setSettings({ ...settings, daysOff: updatedDaysOff });
  }
};

export default Settings;
