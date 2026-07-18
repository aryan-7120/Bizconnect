import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchMe } from './store/authSlice';
import { setTheme } from './store/themeSlice';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { PageLoader } from './components/ui/LoadingSpinner';

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const BusinessListPage = lazy(() => import('./pages/BusinessListPage'));
const BusinessProfilePage = lazy(() => import('./pages/BusinessProfilePage'));
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const BusinessDashboard = lazy(() => import('./pages/business/BusinessDashboard'));
const BusinessSetupPage = lazy(() => import('./pages/business/BusinessSetupPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Protected route wrapper
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

// Layout with Navbar + Footer
function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Layout without Footer (for dashboards)
function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  // Initialize theme
  useEffect(() => {
    const stored = localStorage.getItem('bizconnect_theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    dispatch(setTheme(stored));
  }, []);

  // Refresh user from token on mount
  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes with Navbar + Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/businesses" element={<BusinessListPage />} />
            <Route path="/businesses/:id" element={<BusinessProfilePage />} />
          </Route>

          {/* Auth routes (no nav) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected dashboard routes */}
          <Route element={<DashboardLayout />}>
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/dashboard/customer" element={<CustomerDashboard />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['business_owner']} />}>
              <Route path="/dashboard/business" element={<BusinessDashboard />} />
              <Route path="/dashboard/business/setup" element={<BusinessSetupPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
