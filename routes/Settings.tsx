
import React, { useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { BusinessSettings, WorkingDay } from '../types';
import { Save, Store, Clock, Bot, MessageSquare, Smartphone, Zap, CalendarOff, Trash2, Plus, Split, Copy, Sun, Moon, Briefcase, CheckCircle2 } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for new holiday input
  const [newDayOffDate, setNewDayOffDate] = useState('');
  const [newDayOffDesc, setNewDayOffDesc] = useState('');

  useEffect(() => {
    mockApi.getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    await mockApi.updateSettings(settings);
    setTimeout(() => setIsSaving(false), 500);
  };

  const updateWorkingDay = (day: keyof BusinessSettings['workingHours'], field: keyof WorkingDay, value: string | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      workingHours: {
        ...settings.workingHours,
        [day]: {
          ...settings.workingHours[day],
          [field]: value
        }
      }
    });
  };

  const copyDayScheduleToAll = (sourceDayKey: keyof BusinessSettings['workingHours']) => {
    if (!settings) return;
    const sourceDay = settings.workingHours[sourceDayKey];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    
    const newHours = { ...settings.workingHours };
    
    days.forEach(d => {
        if (d !== sourceDayKey) {
            newHours[d] = { ...sourceDay };
        }
    });

    setSettings({ ...settings, workingHours: newHours });
  };

  const applyPreset = (preset: '9-5' | '10-7' | '8-4') => {
     if (!settings) return;
     const newHours = { ...settings.workingHours };
     const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
     
     let open = '09:00', close = '17:00';
     if (preset === '10-7') { open = '10:00'; close = '19:00'; }
     if (preset === '8-4') { open = '08:00'; close = '16:00'; }

     weekdays.forEach(d => {
         newHours[d] = {
             ...newHours[d],
             isOpen: true,
             isSplit: false,
             open,
             close
         };
     });
     setSettings({ ...settings, workingHours: newHours });
  };

  const handleAddDayOff = () => {
    if (!settings || !newDayOffDate) return;
    const updatedDaysOff = [
      ...(settings.daysOff || []),
      { date: newDayOffDate, description: newDayOffDesc || 'Closed' }
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setSettings({ ...settings, daysOff: updatedDaysOff });
    setNewDayOffDate('');
    setNewDayOffDesc('');
  };

  const handleRemoveDayOff = (indexToRemove: number) => {
    if (!settings || !settings.daysOff) return;
    const updatedDaysOff = settings.daysOff.filter((_, idx) => idx !== indexToRemove);
    setSettings({ ...settings, daysOff: updatedDaysOff });
  };

  // Helper: Calculate Duration in Hours
  const getDuration = (day: WorkingDay): number => {
    if (!day.isOpen) return 0;
    const toMinutes = (s: string) => {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m;
    };
    let mins = toMinutes(day.close) - toMinutes(day.open);
    if (day.isSplit && day.open2 && day.close2) {
        mins += toMinutes(day.close2) - toMinutes(day.open2);
    }
    return Math.max(0, Math.round((mins / 60) * 10) / 10);
  };

  // Helper to render the visual timeline bar
  const renderTimeBar = (dayConfig: WorkingDay) => {
    const getPercent = (timeStr: string) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return ((h * 60 + m) / 1440) * 100;
    };

    if (!dayConfig.isOpen) {
        return (
            <div className="h-3 w-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] bg-gray-100 rounded-full opacity-50 border border-gray-200" title="Closed"></div>
        );
    }

    const start1 = getPercent(dayConfig.open);
    const end1 = getPercent(dayConfig.close);
    const width1 = Math.max(0, end1 - start1);

    let start2 = 0; 
    let width2 = 0;
    
    if (dayConfig.isSplit && dayConfig.open2 && dayConfig.close2) {
        start2 = getPercent(dayConfig.open2);
        width2 = Math.max(0, getPercent(dayConfig.close2) - start2);
    }

    return (
        <div className="h-3 w-full bg-gray-100 rounded-full relative overflow-hidden border border-gray-200">
            {/* Markers for 6am, 12pm, 6pm */}
            <div className="absolute top-0 bottom-0 left-[25%] w-px bg-gray-300/30 z-10"></div>
            <div className="absolute top-0 bottom-0 left-[50%] w-px bg-gray-300/30 z-10"></div>
            <div className="absolute top-0 bottom-0 left-[75%] w-px bg-gray-300/30 z-10"></div>

            <div 
                className="absolute top-0 bottom-0 bg-indigo-500 rounded-full opacity-90 hover:opacity-100 transition-opacity" 
                style={{ left: `${start1}%`, width: `${width1}%` }}
                title={`Open: ${dayConfig.open} - ${dayConfig.close}`}
            ></div>
            
            {dayConfig.isSplit && (
                 <div 
                 className="absolute top-0 bottom-0 bg-indigo-400 rounded-full opacity-90 hover:opacity-100 transition-opacity" 
                 style={{ left: `${start2}%`, width: `${width2}%` }}
                 title={`Open: ${dayConfig.open2} - ${dayConfig.close2}`}
             ></div>
            )}
        </div>
    );
  };

  if (!settings) return <div className="p-6">Loading settings...</div>;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  return (
    <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50/50">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Business Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure your profile, operations, and AI assistant.</p>
         </div>
         <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-70 transition-all shadow-lg shadow-indigo-200 font-bold"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
      </div>
      
      <div className="space-y-8">
        
        {/* Business Profile Card */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Store size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Business Profile</h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Business Name</label>
                    <input 
                    type="text" 
                    value={settings.name}
                    onChange={(e) => setSettings({...settings, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-gray-900 transition-shadow"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">WhatsApp Number</label>
                    <div className="relative">
                        <input 
                        type="text" 
                        value={settings.whatsappNumber}
                        onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-gray-900 transition-shadow"
                        />
                        <Smartphone className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Business Description</label>
                <textarea 
                    value={settings.description}
                    onChange={(e) => setSettings({...settings, description: e.target.value})}
                    rows={3}
                    placeholder="Describe your business for the AI..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-gray-900 resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">This description helps the AI understand your services and value proposition.</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Timezone</label>
                <select 
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-gray-900"
                >
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                </select>
            </div>
          </div>
        </div>

        {/* Operations Card */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <Clock size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Working Hours</h2>
             </div>
             
             {/* Quick Sets */}
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase mr-2 hidden sm:inline">Quick Sets (M-F):</span>
                <button onClick={() => applyPreset('9-5')} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 text-gray-600 font-medium">9-5</button>
                <button onClick={() => applyPreset('8-4')} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 text-gray-600 font-medium">8-4</button>
                <button onClick={() => applyPreset('10-7')} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 text-gray-600 font-medium">10-7</button>
             </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-8 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                 <div>
                    <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Simultaneous Bookings</label>
                    <p className="text-xs text-indigo-700">How many appointments can happen at once?</p>
                 </div>
                 <div className="flex items-center gap-2 bg-white rounded-lg border border-indigo-200 px-2">
                    <button 
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md font-bold"
                        onClick={() => setSettings({...settings, concurrentSlots: Math.max(1, settings.concurrentSlots - 1)})}
                    >-</button>
                    <span className="font-bold w-6 text-center text-indigo-900">{settings.concurrentSlots}</span>
                    <button 
                         className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md font-bold"
                         onClick={() => setSettings({...settings, concurrentSlots: Math.min(20, settings.concurrentSlots + 1)})}
                    >+</button>
                 </div>
            </div>

            {/* Timeline Header Ruler */}
            <div className="hidden lg:flex items-center gap-4 px-4 pb-2 border-b border-gray-100 mb-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <div className="w-28 shrink-0">Day</div>
                <div className="flex-1 relative h-4">
                    <span className="absolute left-0 transform -translate-x-1/2">00:00</span>
                    <span className="absolute left-[25%] transform -translate-x-1/2">06:00</span>
                    <span className="absolute left-[50%] transform -translate-x-1/2">12:00</span>
                    <span className="absolute left-[75%] transform -translate-x-1/2">18:00</span>
                    <span className="absolute right-0 transform translate-x-1/2">24:00</span>
                </div>
                <div className="w-[300px] shrink-0 text-center">Schedule</div>
            </div>

            <div className="space-y-3">
              {days.map(day => {
                const duration = getDuration(settings.workingHours[day]);
                return (
                <div key={day} className="group">
                  <div className={`flex flex-col lg:flex-row lg:items-center gap-4 p-3 rounded-xl border transition-all ${
                      settings.workingHours[day].isOpen 
                      ? 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm' 
                      : 'bg-gray-50 border-transparent'
                  }`}>
                    
                    {/* Day Toggle & Name */}
                    <div className="flex items-center gap-3 w-28 shrink-0">
                        <button 
                            onClick={() => updateWorkingDay(day, 'isOpen', !settings.workingHours[day].isOpen)}
                            className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${settings.workingHours[day].isOpen ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${settings.workingHours[day].isOpen ? 'translate-x-4' : ''}`} />
                        </button>
                        <div className="flex flex-col">
                            <span className="capitalize text-sm font-bold text-gray-800">{day.slice(0,3)}</span>
                            {settings.workingHours[day].isOpen && (
                                <span className="text-[10px] text-gray-400 font-medium">{duration}h</span>
                            )}
                        </div>
                    </div>

                    {/* Visual Bar (Desktop) */}
                    <div className="hidden lg:block flex-1 mx-2">
                        {renderTimeBar(settings.workingHours[day])}
                    </div>

                    {/* Inputs */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-[300px] justify-end">
                        {settings.workingHours[day].isOpen ? (
                             <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center gap-2 justify-end">
                                    <input 
                                        type="time" 
                                        value={settings.workingHours[day].open}
                                        onChange={(e) => updateWorkingDay(day, 'open', e.target.value)}
                                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium w-20 text-center"
                                    />
                                    <span className="text-gray-300 text-[10px] font-bold">-</span>
                                    <input 
                                        type="time" 
                                        value={settings.workingHours[day].close}
                                        onChange={(e) => updateWorkingDay(day, 'close', e.target.value)}
                                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium w-20 text-center"
                                    />
                                </div>
                                
                                {settings.workingHours[day].isSplit && (
                                     <div className="flex items-center gap-2 justify-end animate-in slide-in-from-top-1">
                                        <input 
                                            type="time" 
                                            value={settings.workingHours[day].open2 || "18:00"}
                                            onChange={(e) => updateWorkingDay(day, 'open2', e.target.value)}
                                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium w-20 text-center"
                                        />
                                        <span className="text-gray-300 text-[10px] font-bold">-</span>
                                        <input 
                                            type="time" 
                                            value={settings.workingHours[day].close2 || "21:00"}
                                            onChange={(e) => updateWorkingDay(day, 'close2', e.target.value)}
                                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium w-20 text-center"
                                        />
                                     </div>
                                )}
                             </div>
                        ) : (
                            <span className="text-xs text-gray-400 font-medium italic px-4 w-full text-center">Closed</span>
                        )}

                        {/* Actions */}
                         {settings.workingHours[day].isOpen && (
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => updateWorkingDay(day, 'isSplit', !settings.workingHours[day].isSplit)}
                                    className={`p-1.5 rounded-lg transition-colors ${settings.workingHours[day].isSplit ? 'bg-indigo-100 text-indigo-600' : 'text-gray-300 hover:bg-gray-100 hover:text-gray-600'}`}
                                    title={settings.workingHours[day].isSplit ? "Remove Split Shift" : "Add Split Shift"}
                                >
                                    <Split size={14} className={settings.workingHours[day].isSplit ? "" : "rotate-90"} />
                                </button>
                                <button 
                                    onClick={() => copyDayScheduleToAll(day)}
                                    className="p-1.5 rounded-lg text-gray-300 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                                    title={`Copy ${day}'s schedule to all other days`}
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                         )}
                    </div>

                  </div>
                </div>
              );
              })}
            </div>
            
            <div className="mt-6 flex justify-end">
                <p className="text-xs text-gray-400 italic">
                    * Total Weekly Hours: {days.reduce((acc, d) => acc + getDuration(settings.workingHours[d]), 0)}h
                </p>
            </div>
          </div>
        </div>

        {/* Holidays & Time Off Card */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
             <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <CalendarOff size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-900">Holidays & Time Off</h2>
                <p className="text-xs text-red-500 font-medium">Business will be marked as closed on these dates</p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Date</label>
                    <input 
                        type="date" 
                        value={newDayOffDate}
                        onChange={(e) => setNewDayOffDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="flex-[2] w-full">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Reason (Optional)</label>
                    <input 
                        type="text" 
                        value={newDayOffDesc}
                        onChange={(e) => setNewDayOffDesc(e.target.value)}
                        placeholder="e.g. Christmas, Family Vacation"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <button 
                    onClick={handleAddDayOff}
                    disabled={!newDayOffDate}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 h-[38px]"
                >
                    <Plus size={16} /> Add
                </button>
            </div>

            <div className="space-y-2">
                {(!settings.daysOff || settings.daysOff.length === 0) ? (
                    <p className="text-center text-sm text-gray-400 py-4 italic">No days off configured.</p>
                ) : (
                    settings.daysOff.map((day, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                             <div className="flex items-center gap-4">
                                <div className="bg-red-50 text-red-500 font-bold px-3 py-1 rounded-lg text-xs">
                                    {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{day.description}</span>
                             </div>
                             <button 
                                onClick={() => handleRemoveDayOff(idx)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={16} />
                             </button>
                        </div>
                    ))
                )}
            </div>
          </div>
        </div>

        {/* AI Configuration Card */}
        <div className="bg-white shadow-sm border border-indigo-100 rounded-2xl overflow-hidden ring-1 ring-indigo-50">
          <div className="px-6 py-4 border-b border-indigo-50 bg-indigo-50/30 flex items-center gap-3">
             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Bot size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-900">ConversIA Agent</h2>
                <p className="text-xs text-indigo-500 font-medium">Configure how the AI interacts with your customers</p>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
             <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Zap size={14} className="text-yellow-500"/> System Prompt (Instructions)
                </label>
                <div className="relative">
                    <textarea 
                        value={settings.aiPrompt}
                        onChange={(e) => setSettings({...settings, aiPrompt: e.target.value})}
                        rows={8}
                        className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50 text-gray-800 font-mono text-sm leading-relaxed"
                    />
                    <div className="absolute top-2 right-2 p-1 bg-white rounded-lg border border-gray-100 shadow-sm opacity-50 hover:opacity-100 cursor-pointer" title="Reset to default">
                        <MessageSquare size={16} className="text-gray-500"/>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    These instructions tell the AI how to behave, what tone to use, and specific rules to follow when chatting with customers on WhatsApp.
                </p>
             </div>

             <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">Notifications & Reminders</h3>
                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-800 text-sm">24-hour Reminder</p>
                            <p className="text-xs text-gray-500">Send WhatsApp reminder 1 day before.</p>
                        </div>
                        <button 
                        onClick={() => setSettings({...settings, reminder24h: !settings.reminder24h})}
                        className={`w-11 h-6 rounded-full transition-colors relative ${settings.reminder24h ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.reminder24h ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-800 text-sm">1-hour Reminder</p>
                            <p className="text-xs text-gray-500">Send urgent reminder 1 hour before.</p>
                        </div>
                        <button 
                        onClick={() => setSettings({...settings, reminder1h: !settings.reminder1h})}
                        className={`w-11 h-6 rounded-full transition-colors relative ${settings.reminder1h ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.reminder1h ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
