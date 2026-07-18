import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categoryAPI, businessAPI } from '../api';
import BusinessCard from '../components/business/BusinessCard';
import SearchBar from '../components/ui/SearchBar';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import {
  Sparkles, ArrowRight, Shield, Clock, Star,
  Users, Building2, CalendarCheck, ChevronRight
} from 'lucide-react';

const STATS = [
  { icon: Building2, label: 'Businesses', value: '500+', color: 'text-indigo-500' },
  { icon: Users, label: 'Customers', value: '10K+', color: 'text-purple-500' },
  { icon: CalendarCheck, label: 'Bookings', value: '25K+', color: 'text-cyan-500' },
  { icon: Star, label: 'Reviews', value: '4.9★', color: 'text-amber-500' },
];

const FEATURES = [
  {
    icon: '🔍',
    title: 'Discover Businesses',
    desc: 'Find the best local businesses with detailed profiles, photos, and verified reviews.',
  },
  {
    icon: '📅',
    title: 'Book Instantly',
    desc: 'Choose your service, pick a time slot, and confirm your appointment in seconds.',
  },
  {
    icon: '⭐',
    title: 'Trusted Reviews',
    desc: 'Read authentic reviews from real customers who\'ve experienced the service firsthand.',
  },
  {
    icon: '🔔',
    title: 'Smart Reminders',
    desc: 'Never miss an appointment with automated email confirmations and reminders.',
  },
  {
    icon: '🛡️',
    title: 'Verified Businesses',
    desc: 'Every business is reviewed and verified for quality assurance and trust.',
  },
  {
    icon: '📊',
    title: 'Business Analytics',
    desc: 'Business owners get powerful insights on bookings, revenue, and customer trends.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => {
      setCategories(data.data || []);
    }).catch(() => {}).finally(() => setLoadingCategories(false));

    businessAPI.getAll({ limit: 6, sortBy: 'rating' }).then(({ data }) => {
      setFeatured(data.data || []);
    }).catch(() => {}).finally(() => setLoadingFeatured(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
        <div className="absolute inset-0 hero-pattern opacity-30" />
        {/* Animated blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow animation-delay-200" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium text-indigo-300 mb-6 animate-fadeInUp">
              <Sparkles className="w-4 h-4" />
              Now with AI-powered search
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6 animate-fadeInUp">
              Find & Book{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Local Businesses
              </span>{' '}
              Instantly
            </h1>
            <p className="text-lg sm:text-xl text-indigo-200 mb-10 max-w-2xl mx-auto leading-relaxed animate-fadeInUp animation-delay-100">
              Discover salons, gyms, doctors, restaurants, and more — then book appointments online in seconds. No waiting, no phone calls.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6 animate-fadeInUp animation-delay-200">
              <SearchBar
                className="w-full"
                placeholder="Search salons, gyms, dentists, restaurants..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-indigo-300 animate-fadeInUp animation-delay-300">
              <span>Popular:</span>
              {['Salon', 'Gym', 'Dentist', 'Restaurant', 'Spa'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate(`/businesses?search=${cat}`)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fadeInUp animation-delay-300">
            {STATS.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center hover:bg-white/15 transition-colors">
                <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-indigo-300">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full text-gray-50 dark:text-gray-950 fill-current">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">Find exactly what you're looking for</p>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl animate-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/businesses?category=${cat._id}`}
                  className="group flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 card-hover text-center"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="section-title">Top Rated Businesses</h2>
              <p className="section-subtitle">Handpicked for exceptional service</p>
            </div>
            <Link to="/businesses" className="btn-secondary hidden sm:flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((business) => (
                <BusinessCard key={business._id} business={business} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/businesses" className="btn-primary inline-flex items-center gap-2">
              Explore All Businesses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950 mesh-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle">Powerful features for customers and businesses alike</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card card-hover border border-gray-100 dark:border-slate-700">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 hero-pattern opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-indigo-200 mb-8">
            Join thousands of customers and businesses already using BizConnect.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-8 py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
            <Link
              to="/register?role=business_owner"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-xl transition-all"
            >
              List Your Business
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-indigo-200">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Set up in 5 minutes</span>
          </div>
        </div>
      </section>
    </div>
  );
}
