import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { businessAPI, categoryAPI } from '../api';
import BusinessCard from '../components/business/BusinessCard';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import { Search, Filter, SlidersHorizontal, X, ChevronDown, Building2 } from 'lucide-react';
import clsx from 'clsx';
import { useDebounce } from '../hooks/useDebounce';

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];
const SORT_OPTIONS = [
  { value: '', label: 'Most Recent' },
  { value: 'rating', label: 'Top Rated' },
];

export default function BusinessListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minRating: '',
    priceRange: '',
    city: '',
    sortBy: '',
    page: 1,
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => { categoryAPI.getAll().then(({ data }) => setCategories(data.data || [])); }, []);

  useEffect(() => {
    fetchBusinesses();
    // Update URL params
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, filters.category, filters.minRating, filters.priceRange, filters.city, filters.sortBy, filters.page]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = { ...filters, search: debouncedSearch, limit: 12 };
      const { data } = await businessAPI.getAll(params);
      setBusinesses(data.data || []);
      setPagination(data.pagination || {});
    } catch {}
    finally { setLoading(false); }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', minRating: '', priceRange: '', city: '', sortBy: '', page: 1 });
    setSearchParams({});
  };

  const hasActiveFilters = filters.category || filters.minRating || filters.priceRange || filters.city;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold mb-4">Discover Businesses</h1>
          {/* Search */}
          <div className="flex gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search businesses, services, or locations..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/40"
                id="business-search"
              />
              {filters.search && (
                <button onClick={() => updateFilter('search', '')} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-200 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 rounded-xl border font-medium transition-all',
                hasActiveFilters
                  ? 'bg-white text-indigo-600 border-white'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              )}
              id="filter-btn"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:block">Filters</span>
              {hasActiveFilters && <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">!</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters panel */}
        {filtersOpen && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 mb-6 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="input-field"
                  id="category-filter"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City</label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => updateFilter('city', e.target.value)}
                  placeholder="Enter city..."
                  className="input-field"
                  id="city-filter"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => updateFilter('minRating', e.target.value)}
                  className="input-field"
                  id="rating-filter"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price Range</label>
                <div className="flex gap-1">
                  {PRICE_RANGES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateFilter('priceRange', filters.priceRange === p ? '' : p)}
                      className={clsx(
                        'flex-1 py-2 text-xs font-bold rounded-lg border transition-all',
                        filters.priceRange === p
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                <X className="w-4 h-4" /> Clear All
              </button>
              <button onClick={() => setFiltersOpen(false)} className="btn-primary text-sm">Apply Filters</button>
            </div>
          </div>
        )}

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
          <button
            onClick={() => updateFilter('category', '')}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all flex-shrink-0',
              !filters.category
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => updateFilter('category', cat._id)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all flex-shrink-0 flex items-center gap-1.5',
                filters.category === cat._id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300'
              )}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Sort + Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Loading...' : `${pagination.total || 0} businesses found`}
          </p>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="text-sm border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            id="sort-select"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Business Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No businesses found</h3>
            <p className="text-gray-400 dark:text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
            <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {businesses.map((biz) => <BusinessCard key={biz._id} business={biz} />)}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                    className={clsx(
                      'w-10 h-10 rounded-xl font-medium text-sm transition-all',
                      filters.page === p
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
