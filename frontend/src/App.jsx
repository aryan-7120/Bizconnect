import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchMe } from './store/authSlice';
import { setTheme } from './store/themeSlice';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { PageLoader } from './components/ui/LoadingSpinner';

const LandingPage        = lazy(() => import('./pages/LandingPage'));
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/auth/RegisterPage'));
const BusinessListPage   = lazy(() => import('./pages/BusinessListPage'));
const BusinessProfilePage = lazy(() => import('./pages/BusinessProfilePage'));
const CustomerDashboard  = lazy(() => import('./pages/customer/CustomerDashboard'));
const CustomerProfilePage = lazy(() => import('./pages/customer/ProfilePage'));
const BusinessDashboard  = lazy(() => import('./pages/business/BusinessDashboard'));
const BusinessSetupPage  = lazy(() => import('./pages/business/BusinessSetupPage'));
const BusinessReviewsPage = lazy(() => import('./pages/business/ReviewsPage'));
const BusinessOwnerProfilePage = lazy(() => import('./pages/business/ProfilePage'));

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

function GuestRoute() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}

function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    const stored =
      localStorage.getItem('bizconnect_theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    dispatch(setTheme(stored));
  }, []);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '500' },
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/businesses" element={<BusinessListPage />} />
            <Route path="/businesses/:id" element={<BusinessProfilePage />} />
          </Route>

          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<DashboardLayout />}>
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/dashboard/customer" element={<CustomerDashboard />} />
              <Route path="/dashboard/customer/profile" element={<CustomerProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['business_owner']} />}>
              <Route path="/dashboard/business" element={<BusinessDashboard />} />
              <Route path="/dashboard/business/setup" element={<BusinessSetupPage />} />
              <Route path="/dashboard/business/reviews" element={<BusinessReviewsPage />} />
              <Route path="/dashboard/business/profile" element={<BusinessOwnerProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
