
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Calendar, Users, Settings, Layers, LogOut, Home } from 'lucide-react';

interface SidebarProps {
  onLogout?: () => void;
  user?: { name: string; email: string } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, user }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Inbox', path: '/inbox', icon: <MessageSquare size={20} /> },
    { name: 'Appointments', path: '/appointments', icon: <Calendar size={20} /> },
    { name: 'Classes', path: '/classes', icon: <Layers size={20} /> },
    { name: 'Clients', path: '/clients', icon: <Users size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex-shrink-0 hidden md:flex flex-col h-full shadow-sm z-20">
      <div className="p-6 border-b border-gray-50 flex flex-col gap-1">
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <span className="font-bold text-lg">C</span>
          </div>
          ConversIA
        </h1>
        <p className="text-xs text-gray-400 pl-10 font-medium">Business Dashboard</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          // Special handling for root path to strictly match
          const isExactActive = item.path === '/' ? location.pathname === '/' : isActive;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isExactActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={isExactActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50 bg-gray-50/50">
        <div 
          onClick={onLogout}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer group"
          title="Sign Out"
        >
          <img 
            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.name || 'Owner'}&backgroundColor=b6e3f4`} 
            alt="User" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'Business Owner'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@conversia.com'}</p>
          </div>
          <LogOut size={16} className="text-gray-400 group-hover:text-red-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
