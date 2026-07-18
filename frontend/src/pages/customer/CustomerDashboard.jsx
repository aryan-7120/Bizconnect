import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { appointmentAPI, favoriteAPI, reviewAPI } from '../../api';
import { Link } from 'react-router-dom';
import StarRating from '../../components/ui/StarRating';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Calendar, Heart, Star, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, MessageSquare, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'badge-pending',   icon: AlertCircle },
  confirmed: { label: 'Confirmed', cls: 'badge-confirmed', icon: CheckCircle },
  completed: { label: 'Completed', cls: 'badge-completed', icon: CheckCircle },
  cancelled: { label: 'Cancelled', cls: 'badge-cancelled', icon: XCircle },
};

function ReviewModal({ appointment, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    if (!comment.trim()) { toast.error('Please write a review'); return; }
    setSubmitting(true);
    try {
      await reviewAPI.create({
        businessId: appointment.business._id,
        appointmentId: appointment._id,
        rating,
        comment,
      });
      toast.success('Review submitted!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Leave a Review</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Reviewing <span className="font-semibold text-gray-800 dark:text-gray-200">{appointment.business?.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
            <StarRating rating={rating} size="lg" interactive onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              className="input-field resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/1000</p>
          </div>
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [tab, setTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'upcoming') {
        const { data } = await appointmentAPI.getAll({ status: 'pending,confirmed' });
        setAppointments(data.data || []);
      } else if (tab === 'history') {
        const { data } = await appointmentAPI.getAll({ status: 'completed,cancelled' });
        setAppointments(data.data || []);
      } else if (tab === 'favorites') {
        const { data } = await favoriteAPI.getAll();
        setFavorites(data.data || []);
      } else if (tab === 'reviews') {
        const { data } = await reviewAPI.getMy();
        setReviews(data.data || []);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const cancelAppointment = async (id) => {
    setCancelling(id);
    setConfirmCancel(null);
    try {
      await appointmentAPI.updateStatus(id, { status: 'cancelled', cancellationReason: 'Cancelled by customer' });
      toast.success('Appointment cancelled.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(null);
    }
  };

  const TABS = [
    { id: 'upcoming', label: 'Upcoming',  icon: Calendar },
    { id: 'history',  label: 'History',   icon: Clock },
    { id: 'favorites',label: 'Favorites', icon: Heart },
    { id: 'reviews',  label: 'My Reviews',icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                <p className="text-indigo-200 text-sm">Manage your appointments and favorites</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/businesses" className="btn-secondary text-sm">Browse Businesses</Link>
              <Link to="/dashboard/customer/profile" className="btn-secondary text-sm">My Profile</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-1 p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 mb-8 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center',
                tab === id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="xl" /></div>
        ) : (
          <>
            {(tab === 'upcoming' || tab === 'history') && (
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700">
                    <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      No {tab === 'upcoming' ? 'upcoming' : 'past'} appointments
                    </h3>
                    <Link to="/businesses" className="btn-primary mt-4 inline-block">Browse Businesses</Link>
                  </div>
                ) : (
                  appointments.map((appt) => (
                    <div key={appt._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-card border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
                      <div className="sm:w-16 sm:h-16 flex-shrink-0">
                        {appt.business?.images?.logo ? (
                          <img src={appt.business.images.logo} alt="" className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl">🏢</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{appt.business?.name}</h3>
                            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{appt.service?.name}</p>
                          </div>
                          <span className={STATUS_CONFIG[appt.status]?.cls}>
                            {STATUS_CONFIG[appt.status]?.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(appt.date), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {appt.timeSlot?.start}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          {(appt.status === 'pending' || appt.status === 'confirmed') && (
                            confirmCancel === appt._id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Cancel this appointment?</span>
                                <button
                                  onClick={() => cancelAppointment(appt._id)}
                                  disabled={cancelling === appt._id}
                                  className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1"
                                >
                                  {cancelling === appt._id
                                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Cancelling...</>
                                    : 'Yes, cancel'}
                                </button>
                                <button
                                  onClick={() => setConfirmCancel(null)}
                                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmCancel(appt._id)}
                                className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Cancel Appointment
                              </button>
                            )
                          )}
                          {appt.status === 'completed' && (
                            <button
                              onClick={() => setReviewTarget(appt)}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Leave a Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'favorites' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favorites.length === 0 ? (
                  <div className="col-span-2 text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700">
                    <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No favorites yet</h3>
                    <Link to="/businesses" className="btn-primary mt-4 inline-block">Explore Businesses</Link>
                  </div>
                ) : (
                  favorites.map((fav) => (
                    <Link key={fav._id} to={`/businesses/${fav.business?._id}`}
                      className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-gray-100 dark:border-slate-700 card-hover">
                      <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {fav.business?.images?.logo ? (
                          <img src={fav.business.images.logo} alt="" className="w-full h-full object-cover" />
                        ) : <span className="text-2xl">{fav.business?.category?.icon || '🏢'}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{fav.business?.name}</p>
                        <StarRating rating={fav.business?.avgRating || 0} size="xs" showCount count={fav.business?.totalReviews} />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </Link>
                  ))
                )}
              </div>
            )}

            {tab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700">
                    <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No reviews written yet</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Complete an appointment to leave a review</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-card border border-gray-100 dark:border-slate-700">
                      <Link to={`/businesses/${review.business?._id}`} className="flex items-center gap-3 mb-3 group">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden">
                          {review.business?.images?.logo ? (
                            <img src={review.business.images.logo} alt="" className="w-full h-full object-cover" />
                          ) : <span>🏢</span>}
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {review.business?.name}
                        </p>
                      </Link>
                      <StarRating rating={review.rating} size="sm" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          appointment={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
