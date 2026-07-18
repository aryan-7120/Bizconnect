import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { appointmentAPI, businessAPI, serviceAPI } from '../../api';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StarRating from '../../components/ui/StarRating';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import {
  Calendar, TrendingUp, Users, DollarSign, Star, Plus, Edit3,
  Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#22c55e', '#3b82f6', '#ef4444'];

export default function BusinessDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [analytics, setAnalytics] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', duration: '' });
  const [editingService, setEditingService] = useState(null);
  const [savingService, setSavingService] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, bizRes, apptsRes] = await Promise.all([
        businessAPI.getAnalytics(),
        businessAPI.getMy(),
        appointmentAPI.getAll({ limit: 20 }),
      ]);
      setAnalytics(analyticsRes.data.data);
      setBusiness(bizRes.data.data);
      setAppointments(apptsRes.data.data || []);
      if (bizRes.data.data?._id) {
        const svcRes = await serviceAPI.getAll({ businessId: bizRes.data.data._id });
        setServices(svcRes.data.data || []);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setBusiness(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateApptStatus = async (id, status) => {
    try {
      await appointmentAPI.updateStatus(id, { status });
      toast.success(`Appointment ${status}`);
      fetchData();
    } catch { toast.error('Failed to update status'); }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setSavingService(true);
    try {
      if (editingService) {
        await serviceAPI.update(editingService._id, serviceForm);
        toast.success('Service updated!');
      } else {
        await serviceAPI.create(serviceForm);
        toast.success('Service created!');
      }
      setServiceForm({ name: '', description: '', price: '', duration: '' });
      setEditingService(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save service');
    } finally {
      setSavingService(false); }
  };

  const deleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await serviceAPI.delete(id);
      toast.success('Service deleted.');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const todayAppts = appointments.filter(
    (a) => new Date(a.date).toDateString() === new Date().toDateString()
  );

  const TABS = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'services', label: 'Services', icon: Package },
  ];

  const QUICK_LINKS = [
    { label: 'View Reviews', icon: Star, to: '/dashboard/business/reviews' },
    { label: 'Edit Profile', icon: Edit3, to: '/dashboard/business/profile' },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="xl" /></div>;

  if (!business) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-4xl mx-auto mb-6">🏢</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Set Up Your Business</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Create your business profile to start accepting appointments.</p>
        <Link to="/dashboard/business/setup" className="btn-primary">Create Business Profile</Link>
      </div>
    </div>
  );

  // Chart data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendData = (analytics?.monthlyTrend || []).map((m) => ({
    month: monthNames[m._id.month - 1],
    bookings: m.count,
    revenue: m.revenue || 0,
  }));

  const statusData = (analytics?.statusBreakdown || []).map((s) => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 overflow-hidden">
                {business.images?.logo ? (
                  <img src={business.images.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">{business.category?.icon || '🏢'}</div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{business.name}</h1>
                <div className="flex items-center gap-2 text-indigo-200 text-sm">
                  <StarRating rating={business.avgRating} size="xs" />
                  <span>({business.totalReviews} reviews)</span>
                  {!business.isApproved && (
                    <span className="px-2 py-0.5 bg-yellow-500 text-yellow-900 rounded-full text-xs font-semibold">Pending Approval</span>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {QUICK_LINKS.map(({ label, icon: Icon, to }) => (
                <Link key={to} to={to} className="btn-secondary text-sm flex items-center gap-1.5">
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
              <Link to={`/businesses/${business._id}`} className="btn-secondary text-sm">
                View Profile
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Today's Bookings", value: todayAppts.length, icon: Calendar, color: 'text-indigo-300' },
              { label: 'Total Bookings', value: analytics?.totalAppointments || 0, icon: TrendingUp, color: 'text-purple-300' },
              { label: 'Avg Rating', value: `${business.avgRating || 0} ★`, icon: Star, color: 'text-amber-300' },
              { label: 'Services', value: services.length, icon: Package, color: 'text-cyan-300' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-indigo-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center',
                tab === id ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly trend chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Monthly Bookings</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status breakdown pie chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Booking Status</h3>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-gray-400 py-8">No data yet</p>}
              </div>
            </div>

            {/* Popular services */}
            {analytics?.popularServices?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Popular Services</h3>
                <div className="space-y-3">
                  {analytics.popularServices.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{s.service?.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="h-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden w-32">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${(s.count / (analytics.popularServices[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 w-6">{s.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {tab === 'appointments' && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No appointments yet</h3>
              </div>
            ) : (
              appointments.map((appt) => (
                <div key={appt._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-card border border-gray-100 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {appt.customer?.avatar ? (
                          <img src={appt.customer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600">
                            {appt.customer?.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{appt.customer?.name}</p>
                          <p className="text-sm text-indigo-500">{appt.service?.name}</p>
                        </div>
                        <span className={clsx('ml-auto', {
                          'badge-pending': appt.status === 'pending',
                          'badge-confirmed': appt.status === 'confirmed',
                          'badge-completed': appt.status === 'completed',
                          'badge-cancelled': appt.status === 'cancelled',
                        })}>
                          {appt.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(appt.date), 'MMM d, yyyy')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{appt.timeSlot?.start}</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">${appt.totalAmount}</span>
                      </div>
                      {appt.notes && <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">"{appt.notes}"</p>}
                    </div>
                    {appt.status === 'pending' && (
                      <div className="flex sm:flex-col gap-2 sm:ml-4">
                        <button onClick={() => updateApptStatus(appt._id, 'confirmed')}
                          className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl hover:bg-green-100 transition-colors">
                          <CheckCircle className="w-4 h-4" /> Confirm
                        </button>
                        <button onClick={() => updateApptStatus(appt._id, 'cancelled')}
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                    {appt.status === 'confirmed' && (
                      <button onClick={() => updateApptStatus(appt._id, 'completed')}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors sm:ml-4">
                        <CheckCircle className="w-4 h-4" /> Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Services Tab */}
        {tab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service form */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <form onSubmit={handleSaveService} className="space-y-4" id="service-form">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Service Name</label>
                  <input type="text" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="e.g. Haircut" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <input type="text" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    placeholder="Brief description..." className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price ($)</label>
                    <input type="number" min="0" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      placeholder="25" className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (min)</label>
                    <input type="number" min="5" value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                      placeholder="60" className="input-field" required />
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingService && (
                    <button type="button" onClick={() => { setEditingService(null); setServiceForm({ name: '', description: '', price: '', duration: '' }); }}
                      className="btn-secondary flex-1">Cancel</button>
                  )}
                  <button type="submit" disabled={savingService} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {savingService ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}
                    {editingService ? 'Update' : 'Add Service'}
                  </button>
                </div>
              </form>
            </div>

            {/* Services list */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white">Your Services ({services.length})</h3>
              {services.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No services yet. Add your first service!</p>
                </div>
              ) : (
                services.map((svc) => (
                  <div key={svc._id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{svc.name}</p>
                      <p className="text-sm text-gray-400">{svc.duration} min</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-indigo-600 dark:text-indigo-400">${svc.price}</p>
                      <button onClick={() => { setEditingService(svc); setServiceForm({ name: svc.name, description: svc.description, price: svc.price, duration: svc.duration }); setTab('services'); }}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteService(svc._id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
