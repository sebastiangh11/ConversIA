
import React from 'react';
import { AppointmentStatus } from '../types';

interface BadgeProps {
  status: AppointmentStatus | string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';

  switch (status) {
    case AppointmentStatus.BOOKED:
    case 'ACTIVE':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-100';
      break;
    case AppointmentStatus.COMPLETED:
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
      break;
    case AppointmentStatus.CANCELLED:
    case 'NO_SHOW':
    case AppointmentStatus.NO_SHOW:
      colorClass = 'bg-rose-50 text-rose-700 border-rose-100';
      break;
    case 'NEW':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-100';
      break;
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colorClass} ${className} transition-all`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default Badge;
    