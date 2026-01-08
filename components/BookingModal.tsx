
import React, { useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { Service, ClassSession, Client } from '../types';
import { X, Calendar, Clock, MapPin, Users } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSuccess: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, client, onSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [selectedClassSession, setSelectedClassSession] = useState<ClassSession | null>(null);
  
  // Standard Appointment Fields
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      mockApi.getServices().then(setServices);
      setStep(1);
      setSelectedService(null);
      setSelectedClassSession(null);
      setAppointmentDate('');
      setAppointmentTime('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedService?.isClass) {
      mockApi.getClassSessions().then(sessions => {
        // Filter by service and future dates
        const relevant = sessions.filter(s => 
          s.serviceId === selectedService.id && 
          new Date(s.startTime) > new Date()
        );
        setUpcomingClasses(relevant);
      });
    }
  }, [selectedService]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!selectedService) return;

    setIsSubmitting(true);
    try {
      if (selectedService.isClass && selectedClassSession) {
        // Book Class Slot
        const startTime = new Date(selectedClassSession.startTime);
        const endTime = new Date(startTime.getTime() + selectedClassSession.durationMinutes * 60000);
        
        // Removed maxCapacity from appointment object as it's not defined in types.ts for Appointment
        await mockApi.createAppointment({
          clientId: client.id,
          clientName: client.name,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          classSessionId: selectedClassSession.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          providerName: selectedClassSession.providerName,
          room: selectedClassSession.room
        });

        // Send confirmation message automatically
        await mockApi.sendMessage(
          // Assuming we find the conversation context outside, but for now we just create appt.
          // In a real app we'd pass conversationId.
          'temp-conv-id', 
          `Booked ${selectedService.name} on ${new Date(startTime).toLocaleDateString()} at ${new Date(startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Room: ${selectedClassSession.room}`
        );

      } else {
        // Book Standard Appointment
        if (!appointmentDate || !appointmentTime) return;
        
        const start = new Date(`${appointmentDate}T${appointmentTime}`);
        const end = new Date(start.getTime() + selectedService.durationMinutes * 60000);

        await mockApi.createAppointment({
            clientId: client.id,
            clientName: client.name,
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            providerName: 'Staff Member', // Default for now
            room: 'Treatment Room 1'
        });
      }
      
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">
            {step === 1 ? 'Select Service' : `Book ${selectedService?.name}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="grid grid-cols-1 gap-3">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                >
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-indigo-700">{service.name}</p>
                    <p className="text-xs text-gray-500">{service.durationMinutes} mins • ${service.price}</p>
                  </div>
                  {service.isClass && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">Class</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 2 && selectedService && (
            <div className="space-y-6">
              {selectedService.isClass ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users size={16} /> Select an Available Slot
                  </h4>
                  {upcomingClasses.length === 0 ? (
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">No upcoming sessions found for this class.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingClasses.map(session => (
                        <div 
                          key={session.id}
                          onClick={() => setSelectedClassSession(session)}
                          className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center ${
                            selectedClassSession?.id === session.id 
                              ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                              <MapPin size={12}/> {session.room} • {session.providerName}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                               session.currentAttendees >= session.maxCapacity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {session.currentAttendees}/{session.maxCapacity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input 
                      type="time" 
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between bg-gray-50">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-900 text-sm font-medium px-2">
              Back
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || (selectedService?.isClass && !selectedClassSession)}
              className="ml-auto bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
