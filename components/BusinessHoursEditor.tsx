
import React from 'react';
import { WorkingHours, WorkingDay } from '../types';
import { Split, Copy } from 'lucide-react';

interface BusinessHoursEditorProps {
  workingHours: WorkingHours;
  onChange: (hours: WorkingHours) => void;
  simplified?: boolean;
}

const BusinessHoursEditor: React.FC<BusinessHoursEditorProps> = ({ workingHours, onChange, simplified = false }) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  const updateWorkingDay = (day: keyof WorkingHours, field: keyof WorkingDay, value: string | boolean) => {
    const newHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day],
        [field]: value
      }
    };
    onChange(newHours);
  };

  const copyDayScheduleToAll = (sourceDayKey: keyof WorkingHours) => {
    const sourceDay = workingHours[sourceDayKey];
    const newHours = { ...workingHours };
    days.forEach(d => {
      newHours[d] = { ...sourceDay };
    });
    onChange(newHours);
  };

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

  return (
    <div className="space-y-3">
      {days.map(day => {
        const duration = getDuration(workingHours[day]);
        const isOpen = workingHours[day].isOpen;
        
        return (
          <div key={day} className={`flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-3xl border-2 transition-all duration-300 ${
            isOpen 
              ? 'bg-white border-slate-200 shadow-[0_4px_12px_rgba(15,23,42,0.04)] scale-100' 
              : 'bg-slate-50/50 border-transparent opacity-40 scale-[0.98]'
          }`}>
            <div className="flex items-center gap-4 w-36 shrink-0">
              <button 
                type="button"
                onClick={() => updateWorkingDay(day, 'isOpen', !isOpen)}
                className={`w-12 h-6.5 rounded-full transition-all relative flex-shrink-0 ${isOpen ? 'bg-indigo-600 shadow-sm shadow-indigo-100' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 left-1 bg-white w-4.5 h-4.5 rounded-full transition-transform shadow-sm ${isOpen ? 'translate-x-5.5' : 'translate-x-0'}`} />
              </button>
              <div className="flex flex-col">
                <span className={`capitalize text-sm font-black tracking-tight ${isOpen ? 'text-slate-900' : 'text-slate-400'}`}>{day.slice(0,3)}</span>
                {isOpen && (
                  <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">{duration}H TOTAL</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 justify-end">
              {isOpen ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="relative">
                      <input 
                        type="time" 
                        value={workingHours[day].open}
                        onChange={(e) => updateWorkingDay(day, 'open', e.target.value)}
                        className="border-2 border-slate-100 rounded-xl px-4 py-2 text-xs bg-slate-50 font-black text-slate-900 w-28 text-center focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-sm"
                      />
                    </div>
                    <span className="text-slate-300 font-black">—</span>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={workingHours[day].close}
                        onChange={(e) => updateWorkingDay(day, 'close', e.target.value)}
                        className="border-2 border-slate-100 rounded-xl px-4 py-2 text-xs bg-slate-50 font-black text-slate-900 w-28 text-center focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  {workingHours[day].isSplit && !simplified && (
                    <div className="flex items-center gap-2 justify-end animate-in slide-in-from-top-2 duration-300">
                      <input 
                        type="time" 
                        value={workingHours[day].open2 || "18:00"}
                        onChange={(e) => updateWorkingDay(day, 'open2', e.target.value)}
                        className="border-2 border-slate-100 rounded-xl px-4 py-2 text-xs bg-slate-50 font-black text-slate-900 w-28 text-center focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-sm"
                      />
                      <span className="text-slate-300 font-black">—</span>
                      <input 
                        type="time" 
                        value={workingHours[day].close2 || "21:00"}
                        onChange={(e) => updateWorkingDay(day, 'close2', e.target.value)}
                        className="border-2 border-slate-100 rounded-xl px-4 py-2 text-xs bg-slate-50 font-black text-slate-900 w-28 text-center focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-sm"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-black uppercase tracking-widest px-4">Closed</span>
              )}

              {isOpen && !simplified && (
                <div className="flex gap-2 ml-4">
                  <button 
                    type="button"
                    onClick={() => updateWorkingDay(day, 'isSplit', !workingHours[day].isSplit)}
                    className={`p-2.5 rounded-xl border-2 transition-all ${workingHours[day].isSplit ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white border-slate-100 text-slate-300 hover:text-slate-400 hover:border-slate-200'}`}
                    title="Split Shift"
                  >
                    <Split size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => copyDayScheduleToAll(day)}
                    className="p-2.5 rounded-xl border-2 bg-white border-slate-100 text-slate-300 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                    title="Apply to all days"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BusinessHoursEditor;
