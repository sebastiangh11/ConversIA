
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, MapPin, Plus, ChevronRight } from 'lucide-react';
import { BusinessSettings } from '../types';

interface TopbarProps {
  settings: BusinessSettings | null;
}

const Topbar: React.FC<TopbarProps> = ({ settings }) => {
  const location = useLocation();
  
  const getBreadcrumb = () => {
    const path = location.pathname.split('/').filter(x => x)[0] || 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 z-20 sticky top-0">
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
        <div className="relative hidden md:block group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search dashboard..." 
            className="pl-12 pr-6 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white w-72 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
            <button className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95 group" title="Quick Action">
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
            <button className="relative p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
    