import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import { businessAPI, appointmentAPI } from '../../api';
import toast from 'react-hot-toast';
import { Calendar, Clock, CheckCircle, ChevronRight, DollarSign, Timer, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { format, addDays } from 'date-fns';
import LoadingSpinner from '../ui/LoadingSpinner';

const STEPS = ['service', 'date', 'time', 'confirm'];

export default function BookingModal({ isOpen, onClose, business }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (business?.services) setServices(business.services.filter((s) => s.isActive));
  }, [business]);

  useEffect(() => {
    if (step === 2 && selectedService && selectedDate) {
      fetchSlots();
    }
  }, [step, selectedService, selectedDate]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setSlots([]);
    try {
      const { data } = await businessAPI.getSlots(business._id, {
        date: selectedDate,
        serviceId: selectedService._id,
      });
      setSlots(data.slots || []);
    } catch {
      toast.error('Failed to load time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setSelectedService(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setNotes('');
    setSuccess(false);
    onClose();
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book an appointment.');
      navigate('/login');
      return;
    }
    setBooking(true);
    try {
      await appointmentAPI.book({
        businessId: business._id,
        serviceId: selectedService._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        notes,
      });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  // Generate next 14 available dates
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i + 1);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE, MMM d') };
  });

  const stepTitles = ['Select Service', 'Pick a Date', 'Choose Time', 'Confirm Booking'];
  const progress = ((step + 1) / STEPS.length) * 100;

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Booking Successful!" size="sm">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You're all set!</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Your appointment at <strong>{business.name}</strong> is confirmed.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            A confirmation email has been sent to your inbox.
          </p>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-left text-sm mb-6 space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium text-gray-900 dark:text-white">{selectedService?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium text-gray-900 dark:text-white">{selectedDate}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium text-gray-900 dark:text-white">{selectedSlot?.start}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-indigo-600">${selectedService?.price}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleClose} className="btn-secondary flex-1">Close</button>
            <button onClick={() => { handleClose(); navigate('/dashboard/customer'); }} className="btn-primary flex-1">
              View Appointments
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={stepTitles[step]} size="md">
      <div className="p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step 0: Select Service */}
        {step === 0 && (
          <div className="space-y-3">
            {services.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No services available.</p>
            ) : (
              services.map((svc) => (
                <button
                  key={svc._id}
                  type="button"
                  onClick={() => { setSelectedService(svc); setStep(1); }}
                  className={clsx(
                    'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                    selectedService?._id === svc._id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                  )}
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{svc.name}</p>
                    {svc.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{svc.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Timer className="w-3.5 h-3.5" /> {svc.duration} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">${svc.price}</p>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-1" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 1: Select Date */}
        {step === 1 && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableDates.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedDate(value)}
                  className={clsx(
                    'py-3 px-2 rounded-xl text-sm font-medium border-2 transition-all',
                    selectedDate === value
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'border-gray-100 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedDate}
                className={clsx('btn-primary flex-1', !selectedDate && 'opacity-50 cursor-not-allowed')}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Time Slot */}
        {step === 2 && (
          <div>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No available slots for this date.</p>
                <button onClick={() => setStep(1)} className="btn-secondary mt-4 text-sm">Pick another date</button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={clsx(
                      'py-2.5 px-2 rounded-xl text-sm font-medium border-2 transition-all',
                      !slot.available && 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-slate-700 border-gray-100 dark:border-slate-600',
                      slot.available && selectedSlot?.start === slot.start
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : slot.available && 'border-gray-100 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {slot.start}
                  </button>
                ))}
              </div>
            )}
            {slots.length > 0 && (
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedSlot}
                  className={clsx('btn-primary flex-1', !selectedSlot && 'opacity-50 cursor-not-allowed')}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Business</span>
                <span className="font-semibold text-gray-900 dark:text-white">{business.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Service</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedService?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Time</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSlot?.start} – {selectedSlot?.end}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Duration</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedService?.duration} min</span>
              </div>
              <div className="border-t border-indigo-100 dark:border-indigo-700 pt-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${selectedService?.price}</span>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or notes for the business..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleBook}
                disabled={booking}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                id="confirm-booking-btn"
              >
                {booking ? <LoadingSpinner size="sm" className="text-white" /> : <CheckCircle className="w-5 h-5" />}
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
