import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { appointmentAPI, businessAPI, serviceAPI, categoryAPI } from '../../api';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StarRating from '../../components/ui/StarRating';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Calendar, TrendingUp, Users, Star, Plus, Edit3,
  Clock, CheckCircle, XCircle, Package,
  Camera, Upload, Building2, MapPin, Phone, Globe, Tag, Link2, Save,
  Image as ImageIcon, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#22c55e', '#3b82f6', '#ef4444'];
const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];
const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourbiz' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourbiz' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourbiz' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourbiz' },
];

function ImageUploadZone({ label, currentSrc, onFileSelect, isCover = true }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB.'); return; }
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  };

  const displaySrc = preview || currentSrc;

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-600',
          'hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group block',
          isCover ? 'w-full h-36' : 'w-28 h-28'
        )}
      >
        {displaySrc ? (
          <>
            <img src={displaySrc} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex flex-col items-center gap-1 text-white">
                <Camera className="w-6 h-6" />
                <span className="text-xs font-medium">Change Photo</span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:text-indigo-500 transition-colors">
            <Upload className="w-6 h-6" />
            <span className="text-xs font-medium">Click to upload</span>
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}

export default function BusinessDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [analytics, setAnalytics] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [business, setBusiness] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  // Service form
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', duration: '' });
  const [editingService, setEditingService] = useState(null);
  const [savingService, setSavingService] = useState(false);

  // Business edit form
  const [editForm, setEditForm] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [savingBusiness, setSavingBusiness] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, bizRes, apptsRes, catsRes] = await Promise.all([
        businessAPI.getAnalytics(),
        businessAPI.getMy(),
        appointmentAPI.getAll({ limit: 20 }),
        categoryAPI.getAll(),
      ]);
      setAnalytics(analyticsRes.data.data);
      const biz = bizRes.data.data;
      setBusiness(biz);
      setCategories(catsRes.data.data || []);
      setAppointments(apptsRes.data.data || []);
      setEditForm({
        name: biz.name || '',
        category: biz.category?._id || '',
        description: biz.description || '',
        tagline: biz.tagline || '',
        priceRange: biz.priceRange || '$$',
        phone: biz.phone || '',
        email: biz.email || '',
        website: biz.website || '',
        tags: (biz.tags || []).join(', '),
        address: {
          street: biz.address?.street || '',
          city: biz.address?.city || '',
          state: biz.address?.state || '',
          country: biz.address?.country || '',
          zipCode: biz.address?.zipCode || '',
        },
        socialLinks: {
          facebook: biz.socialLinks?.facebook || '',
          instagram: biz.socialLinks?.instagram || '',
          twitter: biz.socialLinks?.twitter || '',
          linkedin: biz.socialLinks?.linkedin || '',
        },
        workingHours: biz.workingHours?.length
          ? biz.workingHours
          : [
              { day: 'Mon', isOpen: true, open: '09:00', close: '18:00' },
              { day: 'Tue', isOpen: true, open: '09:00', close: '18:00' },
              { day: 'Wed', isOpen: true, open: '09:00', close: '18:00' },
              { day: 'Thu', isOpen: true, open: '09:00', close: '18:00' },
              { day: 'Fri', isOpen: true, open: '09:00', close: '18:00' },
              { day: 'Sat', isOpen: true, open: '10:00', close: '16:00' },
              { day: 'Sun', isOpen: false, open: '10:00', close: '14:00' },
            ],
      });
      if (biz._id) {
        const svcRes = await serviceAPI.getAll({ businessId: biz._id });
        setServices(svcRes.data.data || []);
      }
    } catch (err) {
      if (err.response?.status === 404) setBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  const updateApptStatus = async (id, status) => {
    try {
      await appointmentAPI.updateStatus(id, { status });
      toast.success(`Appointment ${status}`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
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
      setSavingService(false);
    }
  };

  const deleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await serviceAPI.delete(id);
      toast.success('Service deleted.');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return toast.error('Business name is required.');
    if (!editForm.address.city.trim()) return toast.error('City is required.');
    setSavingBusiness(true);
    try {
      const fd = new FormData();
      fd.append('name', editForm.name);
      fd.append('category', editForm.category);
      fd.append('description', editForm.description);
      fd.append('tagline', editForm.tagline);
      fd.append('priceRange', editForm.priceRange);
      fd.append('phone', editForm.phone);
      fd.append('email', editForm.email);
      fd.append('website', editForm.website);

      // Tags
      const tags = editForm.tags ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      tags.forEach((t) => fd.append('tags[]', t));

      // Address
      Object.entries(editForm.address).forEach(([k, v]) => fd.append('address[' + k + ']', v));

      // Social links
      Object.entries(editForm.socialLinks).forEach(([k, v]) => fd.append('socialLinks[' + k + ']', v));

      // Working hours
      editForm.workingHours.forEach((wh, i) => {
        fd.append('workingHours[' + i + '][day]', wh.day);
        fd.append('workingHours[' + i + '][isOpen]', wh.isOpen);
        fd.append('workingHours[' + i + '][open]', wh.open);
        fd.append('workingHours[' + i + '][close]', wh.close);
      });

      // Images
      if (logoFile) fd.append('logo', logoFile);
      if (coverFile) fd.append('cover', coverFile);

      await businessAPI.updateWithFormData(business._id, fd);
      toast.success('Business updated successfully!');
      setLogoFile(null);
      setCoverFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSavingBusiness(false);
    }
  };

  const setAddr = (field, value) =>
    setEditForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
  const setSocial = (field, value) =>
    setEditForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [field]: value } }));
  const setHour = (index, field, value) =>
    setEditForm((prev) => {
      const wh = [...prev.workingHours];
      wh[index] = { ...wh[index], [field]: value };
      return { ...prev, workingHours: wh };
    });

  const todayAppts = appointments.filter(
    (a) => new Date(a.date).toDateString() === new Date().toDateString()
  );

  const TABS = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'services', label: 'Services', icon: Package },
    { id: 'edit', label: 'Edit Business', icon: Edit3 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-4xl mx-auto mb-6">
            🏢
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Set Up Your Business</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your business profile to start accepting appointments.
          </p>
          <Link to="/dashboard/business/setup" className="btn-primary">
            Create Business Profile
          </Link>
        </div>
      </div>
    );
  }

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

  const avgRating = (business.avgRating || 0).toFixed(1);
  const totalReviews = business.totalReviews || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 overflow-hidden flex-shrink-0">
                {business.images?.logo ? (
                  <img src={business.images.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {business.category?.icon || '🏢'}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{business.name}</h1>
                <div className="flex items-center gap-2 text-indigo-200 text-sm mt-1 flex-wrap">
                  <StarRating rating={business.avgRating || 0} size="xs" />
                  <span className="font-bold text-amber-300">{avgRating}</span>
                  <span>({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                  {!business.isApproved && (
                    <span className="px-2 py-0.5 bg-yellow-500 text-yellow-900 rounded-full text-xs font-semibold">
                      Pending Approval
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/dashboard/business/reviews" className="btn-secondary text-sm flex items-center gap-1.5">
                <Star className="w-4 h-4" /> Reviews
              </Link>
              <Link to="/dashboard/business/profile" className="btn-secondary text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4" /> My Profile
              </Link>
              <Link to={'/businesses/' + business._id} className="btn-secondary text-sm">
                View Public Profile
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Today's Bookings", value: todayAppts.length, icon: Calendar, color: 'text-indigo-300' },
              { label: 'Total Bookings', value: analytics?.totalAppointments || 0, icon: TrendingUp, color: 'text-purple-300' },
              { label: 'Avg Rating', value: avgRating + ' \u2605', icon: Star, color: 'text-amber-300' },
              { label: 'Services', value: services.length, icon: Package, color: 'text-cyan-300' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <Icon className={'w-5 h-5 ' + color + ' mb-2'} />
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-indigo-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 mb-8 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center whitespace-nowrap',
                tab === id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                ) : (
                  <p className="text-center text-gray-400 py-8">No data yet</p>
                )}
              </div>
            </div>
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
                            style={{ width: ((s.count / (analytics.popularServices[0]?.count || 1)) * 100) + '%' }}
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

        {/* ── Appointments ── */}
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
                        <span className={clsx('ml-auto text-xs font-semibold px-2.5 py-1 rounded-full', {
                          'bg-yellow-100 text-yellow-700': appt.status === 'pending',
                          'bg-blue-100 text-blue-700': appt.status === 'confirmed',
                          'bg-green-100 text-green-700': appt.status === 'completed',
                          'bg-red-100 text-red-700': appt.status === 'cancelled',
                        })}>
                          {appt.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(appt.date), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {appt.timeSlot?.start}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">${appt.totalAmount}</span>
                      </div>
                      {appt.notes && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">"{appt.notes}"</p>
                      )}
                    </div>
                    {appt.status === 'pending' && (
                      <div className="flex sm:flex-col gap-2 sm:ml-4">
                        <button
                          onClick={() => updateApptStatus(appt._id, 'confirmed')}
                          className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Confirm
                        </button>
                        <button
                          onClick={() => updateApptStatus(appt._id, 'cancelled')}
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                    {appt.status === 'confirmed' && (
                      <button
                        onClick={() => updateApptStatus(appt._id, 'completed')}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors sm:ml-4"
                      >
                        <CheckCircle className="w-4 h-4" /> Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Services ── */}
        {tab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <form onSubmit={handleSaveService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Service Name</label>
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="e.g. Haircut"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    placeholder="Brief description..."
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      placeholder="25"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (min)</label>
                    <input
                      type="number"
                      min="5"
                      value={serviceForm.duration}
                      onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                      placeholder="60"
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingService && (
                    <button
                      type="button"
                      onClick={() => { setEditingService(null); setServiceForm({ name: '', description: '', price: '', duration: '' }); }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" disabled={savingService} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {savingService ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}
                    {editingService ? 'Update' : 'Add Service'}
                  </button>
                </div>
              </form>
            </div>

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
                      <button
                        onClick={() => {
                          setEditingService(svc);
                          setServiceForm({ name: svc.name, description: svc.description, price: svc.price, duration: svc.duration });
                          setTab('services');
                        }}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteService(svc._id)}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Edit Business ── */}
        {tab === 'edit' && editForm && (
          <form onSubmit={handleSaveBusiness} className="space-y-6">

            {/* Images */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-500" /> Business Images
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Update your cover photo and logo. Max 5 MB each.
              </p>
              <div className="space-y-5">
                <ImageUploadZone
                  label="Cover Photo (background shown on your business listing)"
                  currentSrc={business.images?.cover}
                  onFileSelect={setCoverFile}
                  isCover={true}
                />
                <ImageUploadZone
                  label="Business Logo"
                  currentSrc={business.images?.logo}
                  onFileSelect={setLogoFile}
                  isCover={false}
                />
              </div>
              {(logoFile || coverFile) && (
                <div className="mt-4 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3 text-sm text-indigo-600 dark:text-indigo-400">
                  <Camera className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {[logoFile && ('Logo: ' + logoFile.name), coverFile && ('Cover: ' + coverFile.name)].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" /> Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Business Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Bella Hair Studio"
                    maxLength={150}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select a category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tagline</label>
                  <input
                    type="text"
                    value={editForm.tagline}
                    onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                    className="input-field"
                    placeholder="A short catchy phrase..."
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="input-field resize-none"
                    placeholder="Describe your services..."
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{editForm.description.length}/2000</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tags <span className="font-normal text-gray-400">(comma-separated)</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={editForm.tags}
                      onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                      className="input-field pl-10"
                      placeholder="haircut, styling, coloring"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price Range</label>
                  <div className="flex gap-2">
                    {PRICE_RANGES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, priceRange: p })}
                        className={clsx(
                          'flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                          editForm.priceRange === p
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">$ Budget · $$ Moderate · $$$ Premium · $$$$ Luxury</p>
                </div>
              </div>
            </div>

            {/* Location & Contact */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" /> Location & Contact
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={editForm.address.street}
                    onChange={(e) => setAddr('street', e.target.value)}
                    className="input-field"
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City *</label>
                    <input
                      type="text"
                      value={editForm.address.city}
                      onChange={(e) => setAddr('city', e.target.value)}
                      className="input-field"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State</label>
                    <input
                      type="text"
                      value={editForm.address.state}
                      onChange={(e) => setAddr('state', e.target.value)}
                      className="input-field"
                      placeholder="NY"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Country</label>
                    <input
                      type="text"
                      value={editForm.address.country}
                      onChange={(e) => setAddr('country', e.target.value)}
                      className="input-field"
                      placeholder="United States"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ZIP Code</label>
                    <input
                      type="text"
                      value={editForm.address.zipCode}
                      onChange={(e) => setAddr('zipCode', e.target.value)}
                      className="input-field"
                      placeholder="10001"
                    />
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Contact Details
                  </h4>
                  <div className="space-y-3">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="input-field pl-10"
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="relative">
                      <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="input-field pl-10"
                        placeholder="Business email"
                      />
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="input-field pl-10"
                        placeholder="https://www.yourbusiness.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" /> Working Hours
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Toggle each day on/off and set your open and close times.
              </p>
              <div className="space-y-3">
                {editForm.workingHours.map((wh, i) => (
                  <div
                    key={wh.day}
                    className={clsx(
                      'flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200',
                      wh.isOpen
                        ? 'bg-indigo-50/60 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800'
                        : 'bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-700 opacity-60'
                    )}
                  >
                    <span className="w-10 text-sm font-bold text-gray-700 dark:text-gray-300">{wh.day}</span>
                    <button
                      type="button"
                      onClick={() => setHour(i, 'isOpen', !wh.isOpen)}
                      className={clsx(
                        'relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0',
                        wh.isOpen ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'
                      )}
                    >
                      <span
                        className={clsx(
                          'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300',
                          wh.isOpen ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                    {wh.isOpen ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={wh.open}
                          onChange={(e) => setHour(i, 'open', e.target.value)}
                          className="input-field text-sm py-1.5 px-3 flex-1"
                        />
                        <span className="text-gray-400 text-sm font-medium">to</span>
                        <input
                          type="time"
                          value={wh.close}
                          onChange={(e) => setHour(i, 'close', e.target.value)}
                          className="input-field text-sm py-1.5 px-3 flex-1"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic flex-1">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-500" /> Social Links
                <span className="font-normal text-sm text-gray-400">(optional)</span>
              </h3>
              <div className="space-y-3">
                {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key} className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={editForm.socialLinks[key]}
                      onChange={(e) => setSocial(key, e.target.value)}
                      className="input-field pl-10"
                      placeholder={label + ': ' + placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pb-4">
              <button
                type="submit"
                disabled={savingBusiness}
                className="btn-primary flex items-center gap-2 px-8 py-3 text-base"
              >
                {savingBusiness ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
                {savingBusiness ? 'Saving Changes...' : 'Save All Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
