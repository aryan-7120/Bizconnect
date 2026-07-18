import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { toggleTheme } from '../../store/themeSlice';
import {
  Sun, Moon, Bell, User, ChevronDown, LogOut,
  LayoutDashboard, Menu, X, Sparkles
} from 'lucide-react';
import SearchBar from '../ui/SearchBar';
import clsx from 'clsx';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { mode } = useSelector((s) => s.theme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setUserMenuOpen(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'business_owner') return '/dashboard/business';
    return '/dashboard/customer';
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">
              Biz<span className="gradient-text">Connect</span>
            </span>
          </Link>

          {/* Search (desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-6">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
              id="theme-toggle"
            >
              {mode === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-500" />
              )}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link
                  to={getDashboardPath()}
                  className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    id="user-menu-btn"
                    aria-label="User menu"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">{user?.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown className={clsx('w-4 h-4 text-gray-400 transition-transform', userMenuOpen && 'rotate-180')} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-slide-up">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{user?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                          <span className={clsx(
                            'inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                            user?.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            user?.role === 'business_owner' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          )}>
                            {user?.role?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="p-2">
                          <Link
                            to={getDashboardPath()}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                            Dashboard
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium text-red-600 dark:text-red-400 transition-colors"
                            id="logout-btn"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm hidden sm:flex">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Mobile menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-3 animate-slide-up">
            <SearchBar className="w-full" />
            {!isAuthenticated && (
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-sm flex-1 text-center">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-sm flex-1 text-center">Get Started</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
