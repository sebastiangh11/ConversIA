
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, MapPin, Plus, ChevronRight, MessageSquare, Calendar, Users, CreditCard, Sparkles, Command } from 'lucide-react';
import { BusinessSettings } from '../types';

interface TopbarProps {
  settings: BusinessSettings | null;
}

const Topbar: React.FC<TopbarProps> = ({ settings }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);
  
  const getBreadcrumb = () => {
    const path = location.pathname.split('/').filter(x => x)[0] || 'Home';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsCommandOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const commands = [
    { label: 'New Booking', icon: <Calendar size={14} />, path: '/appointments', color: 'text-indigo-600', shortcut: 'B' },
    { label: 'Open Inbox', icon: <MessageSquare size={14} />, path: '/inbox', color: 'text-blue-600', shortcut: 'I' },
    { label: 'Add Client', icon: <Users size={14} />, path: '/clients', color: 'text-emerald-600', shortcut: 'C' },
    { label: 'Manage Payments', icon: <CreditCard size={14} />, path: '/payments', color: 'text-rose-600', shortcut: 'P' },
    { label: 'Business Settings', icon: <Sparkles size={14} />, path: '/settings', color: 'text-amber-600', shortcut: 'S' },
  ];

  const handleCommandClick = (path: string) => {
    setIsCommandOpen(false);
    navigate(path);
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 z-50 sticky top-0">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Business</span>
                <ChevronRight size={10} />
                <span className="text-indigo-600">{getBreadcrumb()}</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight mt-1">
            {settings?.name || 'Loading...'}
            </h2>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
          <MapPin size={12} className="text-indigo-400" />
          <span>Main Branch</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block" ref={commandRef}>
          <div className="relative group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isCommandOpen ? 'text-indigo-500' : 'text-gray-400'}`} size={16} />
            <input 
              type="text" 
              placeholder="Type '/' or 'K' for commands..." 
              onFocus={() => setIsCommandOpen(true)}
              className="pl-12 pr-14 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white w-80 transition-all font-medium"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-sm opacity-50 group-focus-within:opacity-100 transition-opacity">
                <Command size={10} className="text-gray-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase">K</span>
            </div>
          </div>

          {/* Command Dropdown */}
          {isCommandOpen && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Commands</p>
                <div className="space-y-1">
                    {commands.map((cmd) => (
                        <button
                            key={cmd.label}
                            onClick={() => handleCommandClick(cmd.path)}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-white border border-gray-100 shadow-sm group-hover:shadow-md ${cmd.color} transition-all`}>
                                    {cmd.icon}
                                </div>
                                <span className="text-sm font-bold text-gray-700">{cmd.label}</span>
                            </div>
                            <span className="text-[9px] font-black text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 group-hover:text-indigo-400 transition-colors">{cmd.shortcut}</span>
                        </button>
                    ))}
                </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
            <button 
              onClick={() => navigate('/appointments')}
              className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95 group" 
              title="Quick Booking"
            >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
            <button 
              onClick={() => navigate('/inbox')}
              className="relative p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100"
              title="Notifications"
            >
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
