import { Link } from 'react-router-dom';
import { MapPin, Clock, Shield, Heart } from 'lucide-react';
import StarRating from '../ui/StarRating';
import { favoriteAPI } from '../../api';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop';

export default function BusinessCard({ business, className }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const [isFav, setIsFav] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || user?.role !== 'customer') {
      toast.error('Please sign in as a customer to save favorites.');
      return;
    }
    setToggling(true);
    try {
      const { data } = await favoriteAPI.toggle(business._id);
      setIsFav(data.isFavorite);
      toast.success(data.message);
    } catch {
      toast.error('Failed to update favorites');
    } finally {
      setToggling(false);
    }
  };

  return (
    <Link
      to={`/businesses/${business._id}`}
      className={clsx(
        'group block bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-card card-hover border border-gray-100 dark:border-slate-700',
        className
      )}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={business.images?.cover || PLACEHOLDER_IMG}
          alt={business.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {business.category && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="text-base">{business.category.icon}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{business.category.name}</span>
          </div>
        )}

        {user?.role === 'customer' && (
          <button
            onClick={handleFavorite}
            disabled={toggling}
            className={clsx(
              'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all',
              isFav
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white/90 dark:bg-slate-900/90 text-gray-400 hover:text-red-500'
            )}
            aria-label="Toggle favorite"
          >
            <Heart className={clsx('w-4 h-4', isFav && 'fill-current')} />
          </button>
        )}

        {business.isVerified && (
          <div className="absolute bottom-3 right-3 bg-indigo-600 text-white flex items-center gap-1 px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3" />
            <span className="text-xs font-medium">Verified</span>
          </div>
        )}

        {business.images?.logo && (
          <div className="absolute -bottom-6 left-4">
            <img
              src={business.images.logo}
              alt={`${business.name} logo`}
              className="w-12 h-12 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow-md"
            />
          </div>
        )}
      </div>

      <div className={clsx('p-5', business.images?.logo && 'pt-8')}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-1 mr-2">
            {business.name}
          </h3>
          {business.priceRange && (
            <span className="flex-shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">
              {business.priceRange}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={business.avgRating || 0} size="sm" />
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            {(business.avgRating || 0).toFixed(1)}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            ({business.totalReviews || 0} {business.totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {business.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {business.description}
          </p>
        )}

        {business.address?.city && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="truncate">
              {[business.address.city, business.address.state].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Available today
          </span>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
            Book Now →
          </span>
        </div>
      </div>
    </Link>
  );
}
