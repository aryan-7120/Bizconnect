import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { businessAPI, reviewAPI, favoriteAPI } from '../api';
import { ReviewCard } from '../components/business/ReviewForm';
import StarRating from '../components/ui/StarRating';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  MapPin, Star, Heart, Share2, Image as ImageIcon,
  MessageSquare, ChevronLeft, Calendar, Clock, X,
  CheckCircle, ArrowLeft, Loader2
} from 'lucide-react';
import { appointmentAPI } from '../api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format, addDays } from 'date-fns';

/* ─────────────────────────────────────────────────────────────
   Simple inline Booking Modal — asks only for date + time
────────────────────────────────────────────────────────────── */
function SimpleBookingModal({ isOpen, onClose, business }) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [step, setStep] = useState('date'); // 'date' | 'time' | 'success'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  // Pick the first active service automatically
  const service = business?.services?.find((s) => s.isActive) || business?.services?.[0];

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i + 1);
    return { value: format(d, 'yyyy-MM-dd'), display: format(d, 'EEE, MMM d') };
  });

  useEffect(() => {
    if (!isOpen) {
      setStep('date');
      setSelectedDate('');
      setSelectedSlot(null);
      setSlots([]);
    }
  }, [isOpen]);

  const fetchSlots = async (date) => {
    if (!service) { toast.error('No services available for this business.'); return; }
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const { data } = await businessAPI.getSlots(business._id, {
        date,
        serviceId: service._id,
      });
      setSlots(data.slots || []);
      if (data.message && data.slots?.length === 0) toast(data.message, { icon: '📅' });
    } catch {
      toast.error('Could not load time slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setStep('time');
    fetchSlots(date);
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book an appointment.');
      navigate('/login');
      return;
    }
    if (!selectedSlot || !selectedDate || !service) return;
    setBooking(true);
    try {
      await appointmentAPI.book({
        businessId: business._id,
        serviceId: service._id,
        date: selectedDate,
        timeSlot: { start: selectedSlot.start, end: selectedSlot.end },
      });
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            {step === 'time' && (
              <button
                onClick={() => setStep('date')}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <h2 className="font-bold text-gray-900 dark:text-white">
              {step === 'date' && 'Pick a Date'}
              {step === 'time' && 'Pick a Time'}
              {step === 'success' && 'Appointment Booked!'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">You're all set!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Appointment at <strong>{business.name}</strong>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {selectedDate} at {selectedSlot?.start}
              </p>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1">Close</button>
                <button
                  onClick={() => { onClose(); navigate('/dashboard/customer'); }}
                  className="btn-primary flex-1"
                >
                  View Appointments
                </button>
              </div>
            </div>
          )}

          {/* ── DATE PICKER ── */}
          {step === 'date' && (
            <div className="grid grid-cols-2 gap-2">
              {availableDates.map(({ value, display }) => (
                <button
                  key={value}
                  onClick={() => handleSelectDate(value)}
                  className={clsx(
                    'py-3 px-4 rounded-2xl border-2 text-sm font-medium transition-all text-left',
                    selectedDate === value
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  )}
                >
                  {display}
                </button>
              ))}
            </div>
          )}

          {/* ── TIME PICKER ── */}
          {step === 'time' && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                {selectedDate}
              </p>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No available slots</p>
                  <p className="text-sm text-gray-400 mt-1">Please pick another date</p>
                  <button
                    onClick={() => setStep('date')}
                    className="btn-secondary mt-4 text-sm"
                  >
                    Choose a different date
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {slots.map((slot) => (
                      <button
                        key={slot.start}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={clsx(
                          'py-2.5 rounded-xl text-sm font-semibold border-2 transition-all',
                          !slot.available
                            ? 'border-gray-100 dark:border-slate-700 text-gray-300 dark:text-slate-600 cursor-not-allowed bg-gray-50 dark:bg-slate-800/40'
                            : selectedSlot?.start === slot.start
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                            : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                        )}
                      >
                        {slot.start}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleBook}
                    disabled={!selectedSlot || booking}
                    className={clsx(
                      'btn-primary w-full flex items-center justify-center gap-2',
                      !selectedSlot && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {booking ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Confirm Appointment</>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Business Profile Page
────────────────────────────────────────────────────────────── */
export default function BusinessProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bizRes, reviewRes] = await Promise.all([
          businessAPI.getById(id),
          reviewAPI.getByBusiness(id),
        ]);
        setBusiness(bizRes.data.data);
        setReviews(reviewRes.data.data || []);
        if (isAuthenticated && user?.role === 'customer') {
          try {
            const favRes = await favoriteAPI.check(id);
            setIsFav(favRes.data.isFavorite);
          } catch { /* favorites check is non-critical */ }
        }
      } catch {
        toast.error('Business not found.');
        navigate('/businesses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleFavorite = async () => {
    if (!isAuthenticated || user?.role !== 'customer') {
      toast.error('Please sign in as a customer to save favorites.');
      return;
    }
    try {
      const { data } = await favoriteAPI.toggle(id);
      setIsFav(data.isFavorite);
      toast.success(data.message);
    } catch { toast.error('Failed to update favorites.'); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <LoadingSpinner size="xl" />
      </div>
    );
  }
  if (!business) return null;

  const COVER_PLACEHOLDER = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop';
  const canBook = isAuthenticated && user?.role === 'customer';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Cover Banner ── */}
      <div className="relative h-56 sm:h-72 overflow-hidden">
        <img
          src={business.images?.cover || COVER_PLACEHOLDER}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back + Actions */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm rounded-xl hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {isAuthenticated && user?.role === 'customer' && (
            <button
              onClick={handleFavorite}
              className={clsx(
                'w-9 h-9 rounded-xl backdrop-blur-sm border flex items-center justify-center transition-all',
                isFav
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
              )}
              aria-label="Save to favorites"
            >
              <Heart className={clsx('w-4 h-4', isFav && 'fill-current')} />
            </button>
          )}
        </div>

        {/* Business name over banner */}
        <div className="absolute bottom-5 left-5 right-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md leading-tight">
            {business.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {business.avgRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-white text-sm font-medium">{business.avgRating.toFixed(1)}</span>
                <span className="text-white/70 text-sm">({business.totalReviews} reviews)</span>
              </div>
            )}
            {business.address?.city && (
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                {[business.address.city, business.address.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Book Appointment Bar ── */}
      {canBook && (
        <div className="sticky top-16 z-30 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ready to book? Pick a date and time below.
            </p>
            <button
              onClick={() => setBookingOpen(true)}
              id="book-now-btn"
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" />
              Book Appointment
            </button>
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── About / Description ── */}
        {business.description && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{business.description}</p>
            {business.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {business.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Gallery ── */}
        {business.images?.gallery?.length > 0 && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              Gallery
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {business.images.gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIdx(i)}
                  className="relative aspect-square rounded-2xl overflow-hidden group"
                >
                  <img
                    src={img}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews ── */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Reviews
            {reviews.length > 0 && (
              <span className="ml-1 text-sm font-normal text-gray-400">({reviews.length})</span>
            )}
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-10">
              <Star className="w-10 h-10 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-500">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          )}
        </section>

        {/* ── Bottom CTA (if not logged in or not customer) ── */}
        {!canBook && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-center text-white">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-bold mb-2">Want to book an appointment?</h3>
            <p className="text-indigo-200 text-sm mb-4">
              {isAuthenticated
                ? 'Only customers can make bookings.'
                : 'Sign in or create a customer account to book.'}
            </p>
            {!isAuthenticated && (
              <div className="flex gap-3 justify-center">
                <Link to="/login" className="px-5 py-2 bg-white text-indigo-600 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-5 py-2 bg-white/20 border border-white/40 text-white font-semibold rounded-xl text-sm hover:bg-white/30 transition-colors">
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Simple Booking Modal ── */}
      <SimpleBookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        business={business}
      />

      {/* ── Gallery Lightbox ── */}
      {galleryIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
          onClick={() => setGalleryIdx(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setGalleryIdx(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={business.images.gallery[galleryIdx]}
            alt="Gallery"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {/* Prev / Next */}
          {business.images.gallery.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setGalleryIdx((galleryIdx - 1 + business.images.gallery.length) % business.images.gallery.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setGalleryIdx((galleryIdx + 1) % business.images.gallery.length); }}
                className="absolute right-16 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
