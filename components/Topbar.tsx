import React from 'react';
import { Bell, Search, MapPin } from 'lucide-react';
import { BusinessSettings } from '../types';

interface TopbarProps {
  settings: BusinessSettings | null;
}

const Topbar: React.FC<TopbarProps> = ({ settings }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {settings?.name || 'Loading...'}
        </h2>
        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          <MapPin size={12} />
          <span>Main Branch</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
          />
        </div>
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
