import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/authSlice';
import { Eye, EyeOff, Sparkles, LogIn } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated, user } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated && user) {
      const dash = user.role === 'admin' ? '/dashboard/admin' :
                   user.role === 'business_owner' ? '/dashboard/business' : '/dashboard/customer';
      navigate(dash, { replace: true });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    dispatch(login(form));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 hero-pattern opacity-20" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative text-center text-white max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-lg text-indigo-200 leading-relaxed">
            Sign in to manage your appointments, explore businesses, and more.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
            {['500+ Businesses', '25K+ Bookings', '10K+ Customers', '4.9★ Rating'].map((stat) => (
              <div key={stat} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 font-semibold">
                {stat}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">Biz<span className="gradient-text">Connect</span></span>
          </Link>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card p-8 border border-gray-100 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Sign in</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Create one</Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input-field"
                  id="email-input"
                  autoComplete="email"
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
                    placeholder="Enter your password"
                    className="input-field pr-12"
                    id="password-input"
                    autoComplete="current-password"
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

              {/* Demo credentials */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-400">
                <p className="font-semibold mb-1 text-indigo-700 dark:text-indigo-400">Demo Accounts:</p>
                <p>Customer: customer@demo.com / password123</p>
                <p>Business: owner@demo.com / password123</p>
                <p>Admin: admin@demo.com / password123</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                id="login-btn"
              >
                {loading ? <LoadingSpinner size="sm" /> : <LogIn className="w-5 h-5" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
