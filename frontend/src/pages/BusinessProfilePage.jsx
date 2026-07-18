import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { businessAPI, reviewAPI, favoriteAPI } from '../api';
import BookingModal from '../components/booking/BookingModal';
import { ReviewCard } from '../components/business/ReviewForm';
import StarRating from '../components/ui/StarRating';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  MapPin, Phone, Mail, Globe, Clock, Shield, Heart,
  Share2, ChevronRight, Timer, MessageSquare, Image
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const DAY_LABELS = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

export default function BusinessProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
          const favRes = await favoriteAPI.check(id);
          setIsFav(favRes.data.isFavorite);
        }
      } catch {
        toast.error('Business not found');
        navigate('/businesses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleFavorite = async () => {
    if (!isAuthenticated || user?.role !== 'customer') {
      toast.error('Please sign in as a customer to save favorites'); return;
    }
    try {
      const { data } = await favoriteAPI.toggle(id);
      setIsFav(data.isFavorite);
      toast.success(data.message);
    } catch { toast.error('Failed to update favorites'); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const getCurrentDayStatus = () => {
    if (!business?.workingHours) return null;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = dayNames[new Date().getDay()];
    const todayHours = business.workingHours.find((h) => h.day === today);
    if (!todayHours || !todayHours.isOpen) return { open: false, label: 'Closed today' };
    const now = new Date();
    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);
    const isOpen = (now.getHours() * 60 + now.getMinutes()) >= (openH * 60 + openM) &&
                   (now.getHours() * 60 + now.getMinutes()) < (closeH * 60 + closeM);
    return { open: isOpen, label: isOpen ? `Open · Closes at ${todayHours.close}` : `Closed · Opens at ${todayHours.open}` };
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="xl" />
    </div>
  );
  if (!business) return null;

  const dayStatus = getCurrentDayStatus();
  const PLACEHOLDER = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop';

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: `Services (${business.services?.length || 0})` },
    { id: 'gallery', label: `Gallery (${business.images?.gallery?.length || 0})` },
    { id: 'reviews', label: `Reviews (${business.totalReviews || 0})` },
    { id: 'hours', label: 'Hours' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={business.images?.cover || PLACEHOLDER}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Actions overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleFavorite}
            className={clsx(
              'w-10 h-10 rounded-xl backdrop-blur-sm border flex items-center justify-center transition-all',
              isFav ? 'bg-red-500 border-red-500 text-white' : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
            )}
            aria-label="Favorite"
          >
            <Heart className={clsx('w-5 h-5', isFav && 'fill-current')} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Business Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card p-6 mb-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="flex-shrink-0">
                  {business.images?.logo ? (
                    <img src={business.images.logo} alt={`${business.name} logo`}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-slate-700 shadow-lg" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl shadow-lg">
                      {business.category?.icon || '🏢'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {business.name}
                        {business.isVerified && (
                          <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0" title="Verified business" />
                        )}
                      </h1>
                      {business.tagline && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{business.tagline}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      {business.priceRange}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <StarRating rating={business.avgRating} size="sm" showCount count={business.totalReviews} />
                    {business.category && (
                      <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{business.category.icon}</span> {business.category.name}
                      </span>
                    )}
                    {dayStatus && (
                      <span className={clsx(
                        'flex items-center gap-1 text-sm font-medium',
                        dayStatus.open ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                      )}>
                        <Clock className="w-4 h-4" /> {dayStatus.label}
                      </span>
                    )}
                  </div>

                  {business.address?.city && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      {[business.address.street, business.address.city, business.address.state, business.address.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Book Now button (mobile) */}
              {user?.role === 'customer' && (
                <button
                  onClick={() => setBookingOpen(true)}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3 lg:hidden"
                  id="book-now-mobile"
                >
                  Book an Appointment
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="flex overflow-x-auto border-b border-gray-100 dark:border-slate-800 scrollbar-thin">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px',
                      activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {business.description && (
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">About</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{business.description}</p>
                      </div>
                    )}
                    {business.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {business.tags.map((tag) => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Services tab */}
                {activeTab === 'services' && (
                  <div className="space-y-3">
                    {!business.services || business.services.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No services listed yet.</p>
                    ) : (
                      business.services.map((svc) => (
                        <div key={svc._id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{svc.name}</p>
                            {svc.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{svc.description}</p>}
                            <span className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Timer className="w-3.5 h-3.5" /> {svc.duration} min
                            </span>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">${svc.price}</p>
                            {user?.role === 'customer' && (
                              <button onClick={() => setBookingOpen(true)} className="text-xs text-indigo-500 hover:underline mt-1">
                                Book →
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Gallery tab */}
                {activeTab === 'gallery' && (
                  <div>
                    {!business.images?.gallery || business.images.gallery.length === 0 ? (
                      <div className="text-center py-12">
                        <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No gallery photos yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {business.images.gallery.map((img, i) => (
                          <button key={i} onClick={() => setGalleryIdx(i)} className="relative aspect-square rounded-xl overflow-hidden group">
                            <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No reviews yet. Be the first!</p>
                      </div>
                    ) : (
                      reviews.map((review) => <ReviewCard key={review._id} review={review} />)
                    )}
                  </div>
                )}

                {/* Hours tab */}
                {activeTab === 'hours' && (
                  <div className="space-y-2">
                    {business.workingHours?.length > 0 ? (
                      business.workingHours.map((wh) => {
                        const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
                        return (
                          <div key={wh.day} className={clsx(
                            'flex items-center justify-between py-3 px-4 rounded-xl',
                            wh.day === today ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700' : ''
                          )}>
                            <span className={clsx('font-medium text-sm', wh.day === today ? 'text-indigo-700 dark:text-indigo-300 font-bold' : 'text-gray-700 dark:text-gray-300')}>
                              {DAY_LABELS[wh.day]} {wh.day === today && '(Today)'}
                            </span>
                            <span className={clsx('text-sm', wh.isOpen ? 'text-gray-600 dark:text-gray-400' : 'text-red-500')}>
                              {wh.isOpen ? `${wh.open} – ${wh.close}` : 'Closed'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-8">Hours not available.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Book Now Card */}
            {user?.role === 'customer' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card p-6 border border-gray-100 dark:border-slate-700 sticky top-20">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    ${business.services?.[0]?.price ?? '—'}
                  </p>
                </div>
                <button
                  onClick={() => setBookingOpen(true)}
                  className="btn-primary w-full py-4 text-base"
                  id="book-now-btn"
                >
                  Book Appointment
                </button>
                <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
                  Free cancellation · Instant confirmation
                </p>
              </div>
            )}

            {/* Contact Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card p-6 border border-gray-100 dark:border-slate-700 space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Contact Info</h3>
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-indigo-500" />
                  </div>
                  {business.phone}
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-indigo-500" />
                  </div>
                  {business.email}
                </a>
              )}
              {business.website && (
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-indigo-500" />
                  </div>
                  Visit Website
                </a>
              )}

              {/* Social Links */}
              {business.socialLinks && Object.entries(business.socialLinks).some(([, v]) => v) && (
                <div className="flex gap-2 pt-2">
                  {business.socialLinks.facebook && (
                    <a href={business.socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center hover:bg-blue-100 transition-colors">
                      <Facebook className="w-4 h-4 text-blue-600" />
                    </a>
                  )}
                  {business.socialLinks.instagram && (
                    <a href={business.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center hover:bg-pink-100 transition-colors">
                      <Instagram className="w-4 h-4 text-pink-600" />
                    </a>
                  )}
                  {business.socialLinks.twitter && (
                    <a href={business.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center hover:bg-sky-100 transition-colors">
                      <Twitter className="w-4 h-4 text-sky-500" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        business={business}
      />

      {/* Gallery lightbox */}
      {galleryIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setGalleryIdx(null)}>
          <img
            src={business.images.gallery[galleryIdx]}
            alt="Gallery"
            className="max-w-full max-h-full rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
