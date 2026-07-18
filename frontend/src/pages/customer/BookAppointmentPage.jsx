import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { businessAPI, serviceAPI } from '../../api';
import { appointmentAPI } from '../../api';
import { Calendar, Clock, DollarSign, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StarRating from '../../components/ui/StarRating';
import toast from 'react-hot-toast';
import { format, addDays, isBefore, startOfToday } from 'date-fns';

export default function BookAppointmentPage() {
  const { id: businessId } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1); // 1=service, 2=date, 3=slot, 4=confirm
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const { data } = await businessAPI.getById(businessId);
        setBusiness(data.data);
        const svcRes = await serviceAPI.getAll({ businessId });
        setServices(svcRes.data.data || []);
      } catch {
        toast.error('Business not found.');
        navigate('/businesses');
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [businessId]);

  // Fetch slots when date + service are selected
  useEffect(() => {
    if (!selectedDate || !selectedService) { setSlots([]); return; }
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const { data } = await businessAPI.getSlots(businessId, {
          date: selectedDate,
          serviceId: selectedService._id,
        });
        setSlots(data.slots || []);
        if (data.message) toast(data.message, { icon: '📅' });
      } catch {
        toast.error('Could not load time slots.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedService]);

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) {
      return toast.error('Please complete all steps before booking.');
    }
    setBooking(true);
    try {
      await appointmentAPI.book({
        businessId,
        serviceId: selectedService._id,
        date: selectedDate,
        timeSlot: { start: selectedSlot.start, end: selectedSlot.end },
        notes,
      });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  // Generate next 30 valid dates (no past dates)
  const today = startOfToday();
  const dateOptions = Array.from({ length: 30 }, (_, i) => addDays(today, i + 1));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Appointment Booked!</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Your appointment at <strong>{business?.name}</strong> for{' '}
            <strong>{selectedService?.name}</strong> on{' '}
            <strong>{format(new Date(selectedDate), 'MMMM d, yyyy')}</strong> at{' '}
            <strong>{selectedSlot?.start}</strong> is confirmed.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">A confirmation email has been sent to you.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard/customer" className="btn-primary">View My Appointments</Link>
            <Link to="/businesses" className="btn-secondary">Browse More Businesses</Link>
          </div>
        </div>
      </div>
    );
  }

  const STEPS = [
    { num: 1, label: 'Service' },
    { num: 2, label: 'Date' },
    { num: 3, label: 'Time' },
    { num: 4, label: 'Confirm' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Business Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link to={`/businesses/${businessId}`} className="flex items-center gap-1 text-indigo-200 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to {business?.name}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center text-2xl">
              {business?.images?.logo ? (
                <img src={business.images.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                business?.category?.icon || '🏢'
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">Book at {business?.name}</h1>
              <StarRating rating={business?.avgRating || 0} size="xs" showCount count={business?.totalReviews} className="text-indigo-200" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all ${
                step > s.num
                  ? 'bg-green-500 text-white'
                  : step === s.num
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
              }`}>
                {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:block ${
                step === s.num ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
              }`}>{s.label}</span>
              {i < STEPS.length - 1 && (
                <div className={`mx-3 h-0.5 w-8 sm:w-16 transition-all ${
                  step > s.num ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Step 1: Choose Service */}
          {step === 1 && (
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" /> Choose a Service
              </h2>
              {services.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p>No services available for this business.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((svc) => (
                    <button
                      key={svc._id}
                      onClick={() => { setSelectedService(svc); setStep(2); }}
                      className={`w-full text-left flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${
                        selectedService?._id === svc._id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-slate-600'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{svc.name}</p>
                        {svc.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{svc.description}</p>
                        )}
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {svc.duration} minutes
                        </p>
                      </div>
                      <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 ml-4">${svc.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Choose Date */}
          {step === 2 && (
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Choose a Date
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Service: <strong className="text-gray-900 dark:text-white">{selectedService?.name}</strong> &bull; ${selectedService?.price} &bull; {selectedService?.duration} min
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {dateOptions.map((d) => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => { setSelectedDate(dateStr); setStep(3); }}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all hover:border-indigo-400 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                      }`}
                    >
                      <span className="text-xs font-medium opacity-80">{format(d, 'EEE')}</span>
                      <span className="text-lg font-bold">{format(d, 'd')}</span>
                      <span className="text-xs opacity-70">{format(d, 'MMM')}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setStep(1)} className="mt-6 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back to services
              </button>
            </div>
          )}

          {/* Step 3: Choose Time Slot */}
          {step === 3 && (
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" /> Choose a Time
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
              </p>

              {loadingSlots ? (
                <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
              ) : slots.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No available slots on this day.</p>
                  <p className="text-sm mt-1">Please select a different date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      disabled={!slot.available}
                      onClick={() => { setSelectedSlot(slot); setStep(4); }}
                      className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        !slot.available
                          ? 'border-gray-100 dark:border-slate-700 text-gray-300 dark:text-slate-600 cursor-not-allowed bg-gray-50 dark:bg-slate-800/50'
                          : selectedSlot?.start === slot.start
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                      }`}
                    >
                      {slot.start}
                      {!slot.available && <span className="block text-xs font-normal opacity-70">Booked</span>}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setStep(2)} className="mt-6 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back to dates
              </button>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" /> Confirm Booking
              </h2>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-5 mb-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Business</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{business?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Service</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Date</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{format(new Date(selectedDate), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Time</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedSlot?.start} – {selectedSlot?.end}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-indigo-200 dark:border-indigo-800 pt-3">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">${selectedService?.price}</span>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes for the business (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Any special requests or information..."
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="btn-secondary flex-1">
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button
                  onClick={handleBook}
                  disabled={booking}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {booking ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
