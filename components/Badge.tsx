import React from 'react';
import { AppointmentStatus } from '../types';

interface BadgeProps {
  status: AppointmentStatus | string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  let colorClass = 'bg-gray-100 text-gray-800';

  switch (status) {
    case AppointmentStatus.BOOKED:
    case 'ACTIVE':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case AppointmentStatus.COMPLETED:
      colorClass = 'bg-green-100 text-green-800';
      break;
    case AppointmentStatus.CANCELLED:
    case 'NO_SHOW':
    case AppointmentStatus.NO_SHOW:
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'NEW':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default Badge;
