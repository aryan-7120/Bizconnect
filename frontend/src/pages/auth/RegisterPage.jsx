import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/authSlice';
import { Eye, EyeOff, Sparkles, UserPlus } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, isAuthenticated, user } = useSelector((s) => s.auth);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: searchParams.get('role') || 'customer',
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const dash = user.role === 'admin' ? '/dashboard/admin' :
                   user.role === 'business_owner' ? '/dashboard/business' : '/dashboard/customer';
      navigate(dash, { replace: true });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    dispatch(register({ name: form.name, email: form.email, password: form.password, role: form.role }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-600 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 hero-pattern opacity-20" />
        <div className="relative text-center text-white max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 shadow-xl">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Join BizConnect</h1>
          <p className="text-lg text-indigo-200 leading-relaxed mb-8">
            {form.role === 'business_owner'
              ? 'List your business and start receiving bookings from thousands of customers today.'
              : 'Discover and book top local businesses in your area instantly.'}
          </p>
          <div className="space-y-3 text-left">
            {(form.role === 'business_owner'
              ? ['Create your business profile', 'Manage appointments online', 'Grow your customer base', 'Access powerful analytics']
              : ['Find verified local businesses', 'Book appointments instantly', 'Read trusted reviews', 'Get email reminders']
            ).map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">✓</span>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">Biz<span className="gradient-text">Connect</span></span>
          </Link>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card p-8 border border-gray-100 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create Account</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Sign in</Link>
            </p>

            {/* Role selector */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-6">
              {[
                { value: 'customer', label: '👤 Customer' },
                { value: 'business_owner', label: '🏢 Business Owner' },
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: role.value })}
                  className={clsx(
                    'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                    form.role === role.value
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="input-field"
                  id="name-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input-field"
                  id="email-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="input-field pr-12"
                    id="password-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Repeat password"
                  className="input-field"
                  id="confirm-password-input"
                  required
                />
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                id="register-btn"
              >
                {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-5 h-5" />}
                {loading ? 'Creating Account...' : `Create ${form.role === 'business_owner' ? 'Business' : 'Customer'} Account`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
