
import React, { useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { Appointment, ClassSession } from '../types';
import { X, Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onSuccess: () => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, appointment, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [selectedClassSession, setSelectedClassSession] = useState<ClassSession | null>(null);

  // Standard Appointment Fields
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  
  const isClass = !!appointment.classSessionId;

  useEffect(() => {
    if (isOpen) {
      setNewDate('');
      setNewTime('');
      setSelectedClassSession(null);

      if (isClass) {
        mockApi.getClassSessions().then(sessions => {
          // Find same service, future dates, excluding current session
          const relevant = sessions.filter(s => 
            s.serviceId === appointment.serviceId && 
            s.id !== appointment.classSessionId &&
            new Date(s.startTime) > new Date()
          );
          setUpcomingClasses(relevant);
        });
      }
    }
  }, [isOpen, appointment, isClass]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (isClass) {
        if (!selectedClassSession) return;
        const start = new Date(selectedClassSession.startTime).toISOString();
        const end = new Date(new Date(selectedClassSession.startTime).getTime() + selectedClassSession.durationMinutes * 60000).toISOString();
        
        await mockApi.rescheduleAppointment(appointment.id, start, end, selectedClassSession.id);
        
        // Auto-message
        await mockApi.sendMessage(
            // Logic to find conversation omitted for brevity, assuming generic success
            'temp', 
            `Appointment rescheduled to ${new Date(start).toLocaleDateString()} at ${new Date(start).toLocaleTimeString()}. Room: ${selectedClassSession.room}`
        );

      } else {
        if (!newDate || !newTime) return;
        const start = new Date(`${newDate}T${newTime}`);
        const end = new Date(start.getTime() + (new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime())); // Keep duration
        
        await mockApi.rescheduleAppointment(appointment.id, start.toISOString(), end.toISOString());
        
        // Auto-message
        await mockApi.sendMessage(
            'temp', 
            `Appointment rescheduled to ${start.toLocaleDateString()} at ${start.toLocaleTimeString()}.`
        );
      }
      
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 transition-transform">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Reschedule Appointment</h3>
            <p className="text-xs text-gray-500 mt-0.5">{appointment.serviceName} with {appointment.clientName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isClass ? (
            <div className="space-y-4">
               <p className="text-sm text-gray-600 mb-2">Select a new slot for <strong>{appointment.serviceName}</strong>:</p>
               {upcomingClasses.length === 0 ? (
                 <div className="text-center p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                    No other upcoming classes found.
                 </div>
               ) : (
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                   {upcomingClasses.map(session => (
                      <div 
                        key={session.id}
                        onClick={() => setSelectedClassSession(session)}
                        className={`p-3 border rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                          selectedClassSession?.id === session.id 
                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {new Date(session.startTime).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock size={12}/> {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                               session.currentAttendees >= session.maxCapacity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {session.currentAttendees}/{session.maxCapacity} spots
                            </span>
                        </div>
                      </div>
                   ))}
                 </div>
               )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-3 rounded-lg flex items-start gap-3 border border-yellow-100">
                <Clock className="text-yellow-600 mt-0.5" size={16} />
                <div className="text-xs text-yellow-800">
                  <p className="font-bold">Current Time:</p>
                  <p>{new Date(appointment.startTime).toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">New Date</label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">New Time</label>
                  <input 
                    type="time" 
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-shadow"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (isClass && !selectedClassSession) || (!isClass && (!newDate || !newTime))}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
          >
            {loading ? 'Updating...' : 'Confirm Change'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
