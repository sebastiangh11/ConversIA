
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Calendar, Users, Settings, Layers, LogOut, Home, CreditCard, Sparkles } from 'lucide-react';

interface SidebarProps {
  onLogout?: () => void;
  user?: { name: string; email: string } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, user }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={18} /> },
    { name: 'Inbox', path: '/inbox', icon: <MessageSquare size={18} /> },
    { name: 'Appointments', path: '/appointments', icon: <Calendar size={18} /> },
    { name: 'Classes', path: '/classes', icon: <Layers size={18} /> },
    { name: 'Clients', path: '/clients', icon: <Users size={18} /> },
    { name: 'Payments', path: '/payments', icon: <CreditCard size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex-shrink-0 hidden md:flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30">
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 transform -rotate-3">
            <Sparkles size={20} />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            ConversIA
          </h1>
        </div>
        <div className="h-1 w-12 bg-indigo-600 rounded-full ml-12 opacity-20"></div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4">Main Menu</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const isExactActive = item.path === '/' ? location.pathname === '/' : isActive;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 group ${
                isExactActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
              }`}
            >
              <span className={`transition-transform duration-300 ${isExactActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              {item.name}
              {isExactActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-indigo-50 rounded-2xl p-4 mb-4 border border-indigo-100 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform">
             <Sparkles size={80} className="text-indigo-600" />
          </div>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1">Pro Plan</p>
          <p className="text-xs text-indigo-900 font-bold mb-3 leading-tight">Your business is growing fast!</p>
          <button className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
            Manage Subscription
          </button>
        </div>

        <div 
          onClick={onLogout}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-all cursor-pointer group border border-transparent hover:border-red-100"
        >
          <img 
            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.name || 'Owner'}&backgroundColor=b6e3f4`} 
            alt="User" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-md grayscale group-hover:grayscale-0 transition-all"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate leading-none mb-1">{user?.name?.split(' ')[0] || 'Owner'}</p>
            <p className="text-[10px] text-gray-400 truncate font-medium">Log out</p>
          </div>
          <LogOut size={16} className="text-gray-400 group-hover:text-red-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
    